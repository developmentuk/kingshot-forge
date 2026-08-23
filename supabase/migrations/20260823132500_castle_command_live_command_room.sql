begin;

-- CASTLE-COMMAND-001C — Live Command Room
-- Review-gated migration. Do not apply until owner-approved and Realtime
-- private-channel settings have been verified in the Supabase dashboard.

create table public.castle_command_session_acknowledgements (
  session_id uuid not null,
  player_account_id uuid not null,
  status text not null default 'waiting' check (status in ('waiting', 'ready', 'sent')),
  ready_at timestamptz,
  sent_at timestamptz,
  last_changed_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (session_id, player_account_id),
  foreign key (session_id, player_account_id)
    references public.castle_command_session_assignments(session_id, player_account_id)
    on delete cascade,
  check (
    (status = 'waiting' and ready_at is null and sent_at is null)
    or (status = 'ready' and ready_at is not null and sent_at is null)
    or (status = 'sent' and ready_at is not null and sent_at is not null)
  )
);

create index castle_command_acknowledgements_session_status_idx
  on public.castle_command_session_acknowledgements(session_id, status);

create trigger castle_command_acknowledgements_set_updated_at
before update on public.castle_command_session_acknowledgements
for each row execute function public.set_updated_at();

alter table public.castle_command_session_acknowledgements enable row level security;

grant select on public.castle_command_session_acknowledgements to authenticated;

create or replace function public.can_participate_castle_command_session(target_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1
      from public.castle_command_sessions session
      where session.id = target_session_id
        and public.can_manage_castle_command(session.alliance_id)
    )
    or exists (
      select 1
      from public.castle_command_session_assignments assignment
      join public.player_accounts account
        on account.id = assignment.player_account_id
      where assignment.session_id = target_session_id
        and account.user_id = auth.uid()
    );
$$;

revoke all on function public.can_participate_castle_command_session(uuid) from public;
grant execute on function public.can_participate_castle_command_session(uuid) to authenticated;

create policy "Castle Command participants can view acknowledgements"
on public.castle_command_session_acknowledgements
for select
to authenticated
using (public.can_participate_castle_command_session(session_id));

create or replace function public.set_castle_command_acknowledgement(
  target_session_id uuid,
  target_player_account_id uuid,
  target_status text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  command_session public.castle_command_sessions%rowtype;
  existing_status text;
  ready_timestamp timestamptz;
begin
  if target_status not in ('ready', 'sent') then
    raise exception 'Invalid Castle Command acknowledgement' using errcode = '22023';
  end if;

  select * into command_session
  from public.castle_command_sessions
  where id = target_session_id;

  if command_session.id is null then
    raise exception 'Castle Command session not found' using errcode = 'P0002';
  end if;

  if command_session.status = 'closed' then
    raise exception 'Castle Command session is closed' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.castle_command_session_assignments assignment
    join public.player_accounts account
      on account.id = assignment.player_account_id
    where assignment.session_id = target_session_id
      and assignment.player_account_id = target_player_account_id
      and account.user_id = auth.uid()
  ) then
    raise exception 'Castle Command participant access denied' using errcode = '42501';
  end if;

  select acknowledgement.status, acknowledgement.ready_at
    into existing_status, ready_timestamp
  from public.castle_command_session_acknowledgements acknowledgement
  where acknowledgement.session_id = target_session_id
    and acknowledgement.player_account_id = target_player_account_id;

  if target_status = 'ready' then
    if existing_status = 'sent' then
      raise exception 'Sent acknowledgement cannot be moved backwards' using errcode = '22023';
    end if;

    insert into public.castle_command_session_acknowledgements (
      session_id,
      player_account_id,
      status,
      ready_at,
      sent_at,
      last_changed_by
    ) values (
      target_session_id,
      target_player_account_id,
      'ready',
      coalesce(ready_timestamp, now()),
      null,
      auth.uid()
    )
    on conflict (session_id, player_account_id) do update set
      status = 'ready',
      ready_at = coalesce(public.castle_command_session_acknowledgements.ready_at, excluded.ready_at),
      sent_at = null,
      last_changed_by = excluded.last_changed_by,
      updated_at = now();
  else
    if command_session.status <> 'active' then
      raise exception 'Castle Command session must be active before marking sent' using errcode = '22023';
    end if;

    if existing_status <> 'ready' then
      raise exception 'Player must be ready before marking sent' using errcode = '22023';
    end if;

    update public.castle_command_session_acknowledgements
    set
      status = 'sent',
      sent_at = now(),
      last_changed_by = auth.uid(),
      updated_at = now()
    where session_id = target_session_id
      and player_account_id = target_player_account_id;
  end if;

  return target_status;
end;
$$;

create or replace function public.reset_castle_command_acknowledgement(
  target_session_id uuid,
  target_player_account_id uuid
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  target_alliance_id uuid;
begin
  select session.alliance_id into target_alliance_id
  from public.castle_command_sessions session
  where session.id = target_session_id;

  if target_alliance_id is null then
    raise exception 'Castle Command session not found' using errcode = 'P0002';
  end if;

  if not public.can_manage_castle_command(target_alliance_id) then
    raise exception 'Castle Command management access denied' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.castle_command_session_assignments assignment
    where assignment.session_id = target_session_id
      and assignment.player_account_id = target_player_account_id
  ) then
    raise exception 'Castle Command assignment not found' using errcode = 'P0002';
  end if;

  insert into public.castle_command_session_acknowledgements (
    session_id,
    player_account_id,
    status,
    ready_at,
    sent_at,
    last_changed_by
  ) values (
    target_session_id,
    target_player_account_id,
    'waiting',
    null,
    null,
    auth.uid()
  )
  on conflict (session_id, player_account_id) do update set
    status = 'waiting',
    ready_at = null,
    sent_at = null,
    last_changed_by = excluded.last_changed_by,
    updated_at = now();

  return 'waiting';
end;
$$;

create or replace function public.set_castle_command_session_status(
  target_session_id uuid,
  target_status text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  command_session public.castle_command_sessions%rowtype;
begin
  if target_status not in ('planning', 'active', 'closed') then
    raise exception 'Invalid Castle Command session status' using errcode = '22023';
  end if;

  select * into command_session
  from public.castle_command_sessions
  where id = target_session_id
  for update;

  if command_session.id is null then
    raise exception 'Castle Command session not found' using errcode = 'P0002';
  end if;

  if not public.can_manage_castle_command(command_session.alliance_id) then
    raise exception 'Castle Command management access denied' using errcode = '42501';
  end if;

  if command_session.status = target_status then
    return target_status;
  end if;

  if command_session.status = 'closed' then
    raise exception 'Closed Castle Command session cannot be reopened' using errcode = '22023';
  end if;

  if command_session.status = 'planning' and target_status not in ('active', 'closed') then
    raise exception 'Invalid Castle Command session transition' using errcode = '22023';
  end if;

  if command_session.status = 'active' and target_status <> 'closed' then
    raise exception 'Invalid Castle Command session transition' using errcode = '22023';
  end if;

  update public.castle_command_sessions
  set
    status = target_status,
    closed_at = case when target_status = 'closed' then now() else null end,
    updated_at = now()
  where id = target_session_id;

  return target_status;
end;
$$;

create or replace function public.get_castle_command_server_time(target_session_id uuid)
returns timestamptz
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.can_participate_castle_command_session(target_session_id) then
    raise exception 'Castle Command live-room access denied' using errcode = '42501';
  end if;

  return clock_timestamp();
end;
$$;

revoke all on function public.set_castle_command_acknowledgement(uuid, uuid, text) from public;
revoke all on function public.reset_castle_command_acknowledgement(uuid, uuid) from public;
revoke all on function public.set_castle_command_session_status(uuid, text) from public;
revoke all on function public.get_castle_command_server_time(uuid) from public;
grant execute on function public.set_castle_command_acknowledgement(uuid, uuid, text) to authenticated;
grant execute on function public.reset_castle_command_acknowledgement(uuid, uuid) to authenticated;
grant execute on function public.set_castle_command_session_status(uuid, text) to authenticated;
grant execute on function public.get_castle_command_server_time(uuid) to authenticated;

create or replace function public.can_access_castle_command_realtime_topic(target_topic text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  session_id uuid;
begin
  if target_topic is null
    or target_topic !~ '^castle-command:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$' then
    return false;
  end if;

  begin
    session_id := split_part(target_topic, ':', 2)::uuid;
  exception when invalid_text_representation then
    return false;
  end;

  return public.can_participate_castle_command_session(session_id);
end;
$$;

revoke all on function public.can_access_castle_command_realtime_topic(text) from public;
grant execute on function public.can_access_castle_command_realtime_topic(text) to authenticated;

create policy "Castle Command private channel receive"
on realtime.messages
for select
to authenticated
using (
  realtime.messages.extension in ('broadcast', 'presence')
  and public.can_access_castle_command_realtime_topic((select realtime.topic()))
);

create policy "Castle Command private channel presence"
on realtime.messages
for insert
to authenticated
with check (
  realtime.messages.extension = 'presence'
  and public.can_access_castle_command_realtime_topic((select realtime.topic()))
);

create or replace function public.broadcast_castle_command_state_change()
returns trigger
language plpgsql
security definer
set search_path = public, realtime
as $$
declare
  command_session_id uuid;
begin
  if tg_table_name = 'castle_command_sessions' then
    command_session_id := case when tg_op = 'DELETE' then old.id else new.id end;
  else
    command_session_id := case when tg_op = 'DELETE' then old.session_id else new.session_id end;
  end if;

  if command_session_id is not null then
    perform realtime.send(
      jsonb_build_object(
        'entity', tg_table_name,
        'operation', tg_op,
        'sessionId', command_session_id,
        'changedAt', clock_timestamp()
      ),
      'state_changed',
      'castle-command:' || command_session_id::text,
      true
    );
  end if;

  return null;
end;
$$;

create trigger castle_command_sessions_broadcast_change
after insert or update or delete on public.castle_command_sessions
for each row execute function public.broadcast_castle_command_state_change();

create trigger castle_command_assignments_broadcast_change
after insert or update or delete on public.castle_command_session_assignments
for each row execute function public.broadcast_castle_command_state_change();

create trigger castle_command_acknowledgements_broadcast_change
after insert or update or delete on public.castle_command_session_acknowledgements
for each row execute function public.broadcast_castle_command_state_change();

comment on table public.castle_command_session_acknowledgements is
  'Durable READY/SENT state for Castle Command assignments. Absence or waiting means not ready.';
comment on function public.can_access_castle_command_realtime_topic(text) is
  'Authorizes private Castle Command Broadcast/Presence topics for assigned participants and event managers.';
comment on function public.broadcast_castle_command_state_change() is
  'Emits metadata-only private Realtime notifications; clients must re-fetch canonical RLS-protected state.';

commit;
