begin;

-- CASTLE-COMMAND-001F release hardening.
-- F13 closes authority-record races left after F12. Membership is necessary but
-- not sufficient authority: the actual deputy grant / participant assignment
-- row must also survive until the durable mutation commits.
--
-- Keep the established one-way lock discipline for authenticated mutations:
-- - deputy authority: session -> membership -> deputy grant;
-- - participant authority: session -> membership -> assignment;
-- - tactical publication: session -> assigned memberships -> assignments.
--
-- Null-auth service/migration child-row writes deliberately keep the F12 bypass
-- and do not acquire the session row. Authenticated readers lock the authority
-- row they depend on, so a concurrent service delete/cascade can finish first
-- and fail revalidation, or wait until the already-authorised mutation commits,
-- without creating a child-row -> session reverse-lock cycle.

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
  for update of membership, deputy;

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
  for update of membership, assignment;

  return participant_user_id is not null;
end;
$$;

revoke all on function public.lock_castle_command_participant_authority(uuid, uuid, uuid) from public;

create or replace function public.enforce_castle_command_tactical_assignment_snapshot()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_snapshot jsonb;
begin
  -- The tactical-save RPC already holds the session row and the assigned
  -- membership rows. Lock the concrete assignment rows next in deterministic
  -- order so a null-auth assignment delete/update cannot cross snapshot
  -- construction and tactical-version persistence.
  perform assignment.id
  from public.castle_command_session_assignments assignment
  where assignment.session_id = new.session_id
  order by assignment.id
  for update of assignment;

  current_snapshot := public.build_castle_command_assignment_snapshot(new.session_id);

  if current_snapshot is distinct from new.assignment_snapshot then
    raise exception 'Castle Command tactical assignments changed during publication'
      using errcode = '40001';
  end if;

  return new;
end;
$$;

create trigger castle_command_tactical_versions_assignment_snapshot_guard
before insert on public.castle_command_tactical_plan_versions
for each row execute function public.enforce_castle_command_tactical_assignment_snapshot();

revoke all on function public.enforce_castle_command_tactical_assignment_snapshot() from public;

comment on function public.lock_castle_command_deputy_authority(uuid, uuid) is
  'Internal mutation guard: locks current membership and the exact deputy grant so grant revocation/cascade serializes with durable deputy-authorised writes.';
comment on function public.lock_castle_command_participant_authority(uuid, uuid, uuid) is
  'Internal mutation guard: locks current membership and the exact assignment so assignment removal serializes with participant READY/SENT writes.';
comment on function public.enforce_castle_command_tactical_assignment_snapshot() is
  'Serializes tactical-version persistence with concrete assignment rows and rejects a snapshot changed by concurrent service assignment mutation.';

commit;
