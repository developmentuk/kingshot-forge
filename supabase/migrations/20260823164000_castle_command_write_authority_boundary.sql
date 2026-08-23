begin;

-- CASTLE-COMMAND-001F release hardening.
-- F12 closes two final write-boundary gaps:
-- 1) authenticated session UPDATE/DELETE must not bypass named lifecycle/history rules;
-- 2) every durable manager/deputy/participant write must serialize with the
--    authority row it relies on, including Forge role/event-manager revocation.
--
-- Read helpers remain non-locking. These lock helpers are internal mutation
-- primitives and are intentionally not executable by authenticated clients.

create or replace function public.lock_castle_command_event_manager(target_alliance_id uuid)
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  caller_role public.user_role;
  administrator_id uuid;
begin
  if auth.uid() is null then
    return false;
  end if;

  -- Global Forge admin/owner authority is itself mutable. Lock the caller's
  -- profile row so a role downgrade cannot commit between authorization and
  -- the Castle mutation.
  select profile.role into caller_role
  from public.profiles profile
  where profile.id = auth.uid()
  for update of profile;

  if caller_role in ('admin', 'owner') then
    return true;
  end if;

  -- Alliance event authority may be revoked or have can_manage_events removed.
  -- Lock and re-check the exact qualifying grant before durable Castle writes.
  select administrator.id into administrator_id
  from public.alliance_admins administrator
  where administrator.alliance_id = target_alliance_id
    and administrator.user_id = auth.uid()
    and administrator.is_active = true
    and administrator.revoked_at is null
    and administrator.can_manage_events = true
  for update of administrator;

  return administrator_id is not null;
end;
$$;

revoke all on function public.lock_castle_command_event_manager(uuid) from public;

create or replace function public.lock_castle_command_deputy_authority(
  target_session_id uuid,
  target_alliance_id uuid
)
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  deputy_user_id uuid;
begin
  if auth.uid() is null then
    return false;
  end if;

  select membership.user_id into deputy_user_id
  from public.alliance_memberships membership
  join public.player_accounts account
    on account.user_id = membership.user_id
  join public.castle_command_session_deputies deputy
    on deputy.player_account_id = account.id
   and deputy.session_id = target_session_id
  where membership.alliance_id = target_alliance_id
    and membership.user_id = auth.uid()
    and membership.status = 'current'::public.alliance_membership_status
  for update of membership;

  return deputy_user_id is not null;
end;
$$;

revoke all on function public.lock_castle_command_deputy_authority(uuid, uuid) from public;

create or replace function public.lock_castle_command_participant_authority(
  target_session_id uuid,
  target_player_account_id uuid,
  target_alliance_id uuid
)
returns boolean
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  participant_user_id uuid;
begin
  if auth.uid() is null then
    return false;
  end if;

  select membership.user_id into participant_user_id
  from public.alliance_memberships membership
  join public.player_accounts account
    on account.user_id = membership.user_id
   and account.id = target_player_account_id
  join public.castle_command_session_assignments assignment
    on assignment.player_account_id = account.id
   and assignment.session_id = target_session_id
  where membership.alliance_id = target_alliance_id
    and membership.user_id = auth.uid()
    and membership.status = 'current'::public.alliance_membership_status
  for update of membership;

  return participant_user_id is not null;
end;
$$;

revoke all on function public.lock_castle_command_participant_authority(uuid, uuid, uuid) from public;

-- Sessions retain direct authenticated INSERT because the existing creation
-- trigger forces planning state, creator identity, ID and timestamps. Lifecycle
-- UPDATE and destructive DELETE are now RPC-only / unavailable respectively.
revoke update, delete on public.castle_command_sessions from authenticated;

drop policy if exists "Castle Command managers can update sessions"
  on public.castle_command_sessions;
drop policy if exists "Castle Command managers can delete sessions"
  on public.castle_command_sessions;

create or replace function public.enforce_castle_command_session_write_authority()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Migration/service operations do not carry an end-user auth.uid(). Keep the
  -- release trigger focused on authenticated Castle mutations.
  if auth.uid() is null then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  if tg_op = 'INSERT' then
    if not public.lock_castle_command_event_manager(new.alliance_id) then
      raise exception 'Castle Command management access denied' using errcode = '42501';
    end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    raise exception 'Castle Command session deletion is not permitted' using errcode = '42501';
  end if;

  -- UPDATE already owns the target session row. Re-lock the authority used by
  -- the durable lifecycle write; a revoked event manager may continue only if
  -- they independently still hold current deputy authority for this session.
  if not public.lock_castle_command_event_manager(old.alliance_id)
    and not public.lock_castle_command_deputy_authority(old.id, old.alliance_id) then
    raise exception 'Castle Command live-session access denied' using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger castle_command_sessions_authorize_write
before insert or update or delete on public.castle_command_sessions
for each row execute function public.enforce_castle_command_session_write_authority();

create or replace function public.enforce_castle_command_manager_write_authority()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_session_id uuid;
  command_session public.castle_command_sessions%rowtype;
begin
  if auth.uid() is null then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    target_session_id := old.session_id;
  else
    target_session_id := new.session_id;
  end if;

  select * into command_session
  from public.castle_command_sessions session
  where session.id = target_session_id
  for update;

  if command_session.id is null then
    raise exception 'Castle Command session not found' using errcode = 'P0002';
  end if;

  if command_session.status = 'closed' then
    raise exception 'Closed Castle Command session history is immutable' using errcode = '22023';
  end if;

  if not public.lock_castle_command_event_manager(command_session.alliance_id) then
    raise exception 'Castle Command management access denied' using errcode = '42501';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger castle_command_assignments_authorize_write
before insert or update or delete on public.castle_command_session_assignments
for each row execute function public.enforce_castle_command_manager_write_authority();

create trigger castle_command_deputies_authorize_write
before insert or update or delete on public.castle_command_session_deputies
for each row execute function public.enforce_castle_command_manager_write_authority();

create or replace function public.enforce_castle_command_command_write_authority()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_session_id uuid;
  command_session public.castle_command_sessions%rowtype;
begin
  if auth.uid() is null then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    target_session_id := old.session_id;
  else
    target_session_id := new.session_id;
  end if;

  select * into command_session
  from public.castle_command_sessions session
  where session.id = target_session_id
  for update;

  if command_session.id is null then
    raise exception 'Castle Command session not found' using errcode = 'P0002';
  end if;

  if command_session.status = 'closed' then
    raise exception 'Closed Castle Command tactical history is immutable' using errcode = '22023';
  end if;

  if not public.lock_castle_command_event_manager(command_session.alliance_id)
    and not public.lock_castle_command_deputy_authority(command_session.id, command_session.alliance_id) then
    raise exception 'Castle Command tactical management access denied' using errcode = '42501';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger castle_command_tactical_versions_authorize_write
before insert or update or delete on public.castle_command_tactical_plan_versions
for each row execute function public.enforce_castle_command_command_write_authority();

create trigger castle_command_tactical_plans_authorize_write
before insert or update or delete on public.castle_command_tactical_plans
for each row execute function public.enforce_castle_command_command_write_authority();

create or replace function public.enforce_castle_command_acknowledgement_write_authority()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_session_id uuid;
  target_player_account_id uuid;
  target_status text;
  command_session public.castle_command_sessions%rowtype;
begin
  if auth.uid() is null then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    target_session_id := old.session_id;
    target_player_account_id := old.player_account_id;
    target_status := old.status;
  else
    target_session_id := new.session_id;
    target_player_account_id := new.player_account_id;
    target_status := new.status;
  end if;

  select * into command_session
  from public.castle_command_sessions session
  where session.id = target_session_id
  for update;

  if command_session.id is null then
    raise exception 'Castle Command session not found' using errcode = 'P0002';
  end if;

  if command_session.status = 'closed' then
    raise exception 'Closed Castle Command acknowledgements are immutable' using errcode = '22023';
  end if;

  if tg_op = 'DELETE' or target_status = 'waiting' then
    if not public.lock_castle_command_event_manager(command_session.alliance_id)
      and not public.lock_castle_command_deputy_authority(command_session.id, command_session.alliance_id) then
      raise exception 'Castle Command acknowledgement reset access denied' using errcode = '42501';
    end if;
  else
    -- READY/SENT are participant-owned writes. Lock the exact caller membership
    -- tied to the target assignment so role revocation cannot be substituted for
    -- participant identity and a stale manager check cannot authorize the write.
    if not public.lock_castle_command_participant_authority(
      command_session.id,
      target_player_account_id,
      command_session.alliance_id
    ) then
      raise exception 'Castle Command participant access denied' using errcode = '42501';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger castle_command_acknowledgements_authorize_write
before insert or update or delete on public.castle_command_session_acknowledgements
for each row execute function public.enforce_castle_command_acknowledgement_write_authority();

revoke all on function public.enforce_castle_command_session_write_authority() from public;
revoke all on function public.enforce_castle_command_manager_write_authority() from public;
revoke all on function public.enforce_castle_command_command_write_authority() from public;
revoke all on function public.enforce_castle_command_acknowledgement_write_authority() from public;

comment on function public.lock_castle_command_event_manager(uuid) is
  'Internal mutation guard: locks/revalidates Forge global role or exact alliance event-manager grant before durable Castle writes.';
comment on function public.enforce_castle_command_session_write_authority() is
  'Final session write boundary. Creation requires locked event authority; lifecycle updates require locked manager or deputy authority; authenticated deletion is forbidden.';
comment on function public.enforce_castle_command_manager_write_authority() is
  'Final manager-only write boundary for Castle assignments and deputy grants.';
comment on function public.enforce_castle_command_command_write_authority() is
  'Final manager/deputy write boundary for tactical plan persistence.';
comment on function public.enforce_castle_command_acknowledgement_write_authority() is
  'Final READY/SENT/reset write boundary with locked participant or command authority.';

commit;
