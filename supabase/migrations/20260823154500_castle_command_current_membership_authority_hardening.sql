begin;

-- CASTLE-COMMAND-001F release hardening.
-- Historical Castle assignments/deputy rows must never outlive current-alliance
-- authorization. Event managers retain their existing server-owned authority;
-- participant/deputy authority additionally requires current membership in the
-- session alliance.

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
        or (
          public.current_user_is_alliance_member(session.alliance_id)
          and exists (
            select 1
            from public.castle_command_session_deputies deputy
            join public.player_accounts account
              on account.id = deputy.player_account_id
            where deputy.session_id = session.id
              and account.user_id = auth.uid()
          )
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
  select exists (
    select 1
    from public.castle_command_sessions session
    where session.id = target_session_id
      and (
        public.can_manage_castle_command_session(session.id)
        or (
          public.current_user_is_alliance_member(session.alliance_id)
          and exists (
            select 1
            from public.castle_command_session_assignments assignment
            join public.player_accounts account
              on account.id = assignment.player_account_id
            where assignment.session_id = session.id
              and account.user_id = auth.uid()
          )
        )
      )
  );
$$;

revoke all on function public.can_participate_castle_command_session(uuid) from public;
grant execute on function public.can_participate_castle_command_session(uuid) to authenticated;

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

  if not public.current_user_is_alliance_member(target_alliance_id) then
    return 'denied';
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

revoke all on function public.get_castle_command_session_authority(uuid) from public;
grant execute on function public.get_castle_command_session_authority(uuid) to authenticated;

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

  if not public.current_user_is_alliance_member(command_session.alliance_id) then
    raise exception 'Castle Command participant is no longer a current alliance member' using errcode = '42501';
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

revoke all on function public.set_castle_command_acknowledgement(uuid, uuid, text) from public;
grant execute on function public.set_castle_command_acknowledgement(uuid, uuid, text) to authenticated;

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
  if target_enabled is null then
    raise exception 'Castle Command deputy state is required' using errcode = '22023';
  end if;

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

  if target_enabled and not exists (
    select 1
    from public.player_accounts account
    join public.alliance_memberships membership
      on membership.user_id = account.user_id
     and membership.alliance_id = command_session.alliance_id
     and membership.status = 'current'::public.alliance_membership_status
    where account.id = target_player_account_id
  ) then
    raise exception 'Castle Command deputy must be a current alliance member' using errcode = '22023';
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

revoke all on function public.set_castle_command_session_deputy(uuid, uuid, boolean) from public;
grant execute on function public.set_castle_command_session_deputy(uuid, uuid, boolean) to authenticated;

comment on function public.can_manage_castle_command_session(uuid) is
  'Session authority for event managers or current-alliance assigned deputies only.';
comment on function public.can_participate_castle_command_session(uuid) is
  'Live/shared-plan access for event managers or current-alliance assigned participants/deputies only.';

commit;
