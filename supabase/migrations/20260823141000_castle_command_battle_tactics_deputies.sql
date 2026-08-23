begin;

-- CASTLE-COMMAND-001D — Battle Tactics deputy authority.
-- Review-gated migration. Do not apply until 001B/001C are approved and active.

create table public.castle_command_session_deputies (
  session_id uuid not null,
  player_account_id uuid not null,
  granted_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (session_id, player_account_id),
  foreign key (session_id, player_account_id)
    references public.castle_command_session_assignments(session_id, player_account_id)
    on delete cascade
);

create index castle_command_session_deputies_player_idx
  on public.castle_command_session_deputies(player_account_id, session_id);

alter table public.castle_command_session_deputies enable row level security;

create or replace function public.can_manage_castle_command_session(target_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.castle_command_sessions session
    where session.id = target_session_id
      and (
        public.can_manage_castle_command(session.alliance_id)
        or exists (
          select 1
          from public.castle_command_session_deputies deputy
          join public.player_accounts account
            on account.id = deputy.player_account_id
          where deputy.session_id = session.id
            and account.user_id = auth.uid()
        )
      )
  );
$$;

revoke all on function public.can_manage_castle_command_session(uuid) from public;
grant execute on function public.can_manage_castle_command_session(uuid) to authenticated;

create or replace function public.can_participate_castle_command_session(target_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.can_manage_castle_command_session(target_session_id)
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

create or replace function public.list_castle_command_session_deputies(target_session_id uuid)
returns table (player_account_id uuid)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.can_participate_castle_command_session(target_session_id) then
    raise exception 'Castle Command live-session access denied' using errcode = '42501';
  end if;

  return query
  select deputy.player_account_id
  from public.castle_command_session_deputies deputy
  where deputy.session_id = target_session_id
  order by deputy.player_account_id;
end;
$$;

revoke all on function public.list_castle_command_session_deputies(uuid) from public;
grant execute on function public.list_castle_command_session_deputies(uuid) to authenticated;

create or replace function public.get_castle_command_session_authority(target_session_id uuid)
returns text
language plpgsql
stable
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
    return 'denied';
  end if;

  if public.can_manage_castle_command(target_alliance_id) then
    return 'manager';
  end if;

  if exists (
    select 1
    from public.castle_command_session_deputies deputy
    join public.player_accounts account on account.id = deputy.player_account_id
    where deputy.session_id = target_session_id
      and account.user_id = auth.uid()
  ) then
    return 'deputy';
  end if;

  if exists (
    select 1
    from public.castle_command_session_assignments assignment
    join public.player_accounts account on account.id = assignment.player_account_id
    where assignment.session_id = target_session_id
      and account.user_id = auth.uid()
  ) then
    return 'participant';
  end if;

  return 'denied';
end;
$$;

create or replace function public.set_castle_command_session_deputy(
  target_session_id uuid,
  target_player_account_id uuid,
  target_enabled boolean
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  command_session public.castle_command_sessions%rowtype;
begin
  select * into command_session
  from public.castle_command_sessions
  where id = target_session_id
  for update;

  if command_session.id is null then
    raise exception 'Castle Command session not found' using errcode = 'P0002';
  end if;

  if command_session.status = 'closed' then
    raise exception 'Castle Command session is closed' using errcode = '22023';
  end if;

  -- Only the existing alliance event-management authority can appoint deputies.
  -- Deputies cannot appoint other deputies.
  if not public.can_manage_castle_command(command_session.alliance_id) then
    raise exception 'Castle Command deputy management access denied' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.castle_command_session_assignments assignment
    where assignment.session_id = target_session_id
      and assignment.player_account_id = target_player_account_id
  ) then
    raise exception 'Castle Command deputy must be an assigned participant' using errcode = '22023';
  end if;

  if target_enabled then
    insert into public.castle_command_session_deputies (
      session_id,
      player_account_id,
      granted_by
    ) values (
      target_session_id,
      target_player_account_id,
      auth.uid()
    ) on conflict (session_id, player_account_id) do nothing;
  else
    delete from public.castle_command_session_deputies deputy
    where deputy.session_id = target_session_id
      and deputy.player_account_id = target_player_account_id;
  end if;

  return target_enabled;
end;
$$;

revoke all on function public.get_castle_command_session_authority(uuid) from public;
revoke all on function public.set_castle_command_session_deputy(uuid, uuid, boolean) from public;
grant execute on function public.get_castle_command_session_authority(uuid) to authenticated;
grant execute on function public.set_castle_command_session_deputy(uuid, uuid, boolean) to authenticated;

-- Extend live lifecycle authority to session deputies without widening roster authority.
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

  if not public.can_manage_castle_command_session(command_session.id) then
    raise exception 'Castle Command live-session access denied' using errcode = '42501';
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

create or replace function public.reset_castle_command_acknowledgement(
  target_session_id uuid,
  target_player_account_id uuid
)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.can_manage_castle_command_session(target_session_id) then
    raise exception 'Castle Command live-session access denied' using errcode = '42501';
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

revoke all on function public.set_castle_command_session_status(uuid, text) from public;
revoke all on function public.reset_castle_command_acknowledgement(uuid, uuid) from public;
grant execute on function public.set_castle_command_session_status(uuid, text) to authenticated;
grant execute on function public.reset_castle_command_acknowledgement(uuid, uuid) to authenticated;

create trigger castle_command_deputies_broadcast_change
after insert or delete on public.castle_command_session_deputies
for each row execute function public.broadcast_castle_command_state_change();

comment on table public.castle_command_session_deputies is
  'Private session-scoped live-command delegates. Clients consume only the limited deputy projection RPC.';
comment on function public.can_manage_castle_command_session(uuid) is
  'Session-scoped live authority: alliance event managers plus explicitly appointed assigned deputies.';

commit;
