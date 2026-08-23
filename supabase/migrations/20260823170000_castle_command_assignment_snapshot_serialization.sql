begin;

-- CASTLE-COMMAND-001F release hardening.
-- F16 serializes assignment snapshot creation with every mutable source row
-- that contributes durable identity/timing data. Final order:
-- session -> target membership -> player account -> shared profile -> timing.
-- This preserves account->profile cascade order and profile->timing save order.

create or replace function public.set_castle_command_session_assignment(
  target_session_id uuid,
  target_player_account_id uuid,
  target_target text,
  target_use_howler boolean
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  command_session public.castle_command_sessions%rowtype;
  command_profile public.castle_command_profiles%rowtype;
  timing public.castle_command_profile_targets%rowtype;
  account public.player_accounts%rowtype;
  assigned_user_id uuid;
  resolved_seconds integer;
  resolved_source text;
  calibration_required boolean := false;
  assignment_id uuid;
  snapshot_updated_at timestamptz;
begin
  if target_target not in ('castle', 'north', 'east', 'south', 'west') then
    raise exception 'Invalid Castle Command target' using errcode = '22023';
  end if;

  if target_use_howler is null then
    raise exception 'Castle Command Howler choice is required' using errcode = '22023';
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
    raise exception 'Castle Command management access denied' using errcode = '42501';
  end if;

  select membership.user_id into assigned_user_id
  from public.alliance_memberships membership
  join public.player_accounts member_account
    on member_account.user_id = membership.user_id
   and member_account.id = target_player_account_id
  where membership.alliance_id = command_session.alliance_id
    and membership.status = 'current'::public.alliance_membership_status
  for update of membership;

  if assigned_user_id is null then
    raise exception 'Castle Command player is no longer a current alliance member' using errcode = '22023';
  end if;

  -- Identity snapshots are mutable source data too. Lock the account before the
  -- profile because account deletion cascades to the profile in that direction.
  select account_row.* into account
  from public.player_accounts account_row
  where account_row.id = target_player_account_id
    and account_row.user_id = assigned_user_id
  for update of account_row;

  if account.id is null then
    raise exception 'Castle Command player account mismatch' using errcode = 'P0002';
  end if;

  select profile.* into command_profile
  from public.castle_command_profiles profile
  where profile.player_account_id = target_player_account_id
    and profile.user_id = assigned_user_id
    and profile.share_with_alliance = true
    and profile.shared_alliance_id = command_session.alliance_id
  for update of profile;

  if command_profile.id is null then
    raise exception 'Player has no explicitly shared Castle Command profile in this alliance' using errcode = 'P0002';
  end if;

  -- Direct service/migration updates can mutate a timing child without first
  -- taking the parent profile lock. Lock the exact selected timing row before
  -- deriving march_seconds or the persisted source snapshot timestamp.
  select timing_row.* into timing
  from public.castle_command_profile_targets timing_row
  where timing_row.profile_id = command_profile.id
    and timing_row.target = target_target
  for update of timing_row;

  if timing.profile_id is null then
    raise exception 'Player has no timing for this target' using errcode = 'P0002';
  end if;

  if target_use_howler and timing.howler_seconds is not null then
    resolved_seconds := timing.howler_seconds;
    resolved_source := 'howler-observed';
  elsif target_use_howler and timing.normal_seconds is not null then
    resolved_seconds := timing.normal_seconds;
    resolved_source := 'normal-fallback';
    calibration_required := true;
  elsif not target_use_howler and timing.normal_seconds is not null then
    resolved_seconds := timing.normal_seconds;
    resolved_source := 'normal';
  else
    raise exception 'Player has no usable observed timing for this target' using errcode = 'P0002';
  end if;

  snapshot_updated_at := greatest(command_profile.updated_at, timing.updated_at);

  insert into public.castle_command_session_assignments (
    session_id,
    player_account_id,
    profile_id,
    player_id_snapshot,
    player_name_snapshot,
    target,
    use_howler,
    howler_skill_level_snapshot,
    march_seconds,
    timing_source,
    needs_howler_calibration,
    profile_updated_at_snapshot,
    added_by
  ) values (
    command_session.id,
    account.id,
    command_profile.id,
    account.player_id,
    account.player_name,
    target_target,
    target_use_howler,
    command_profile.howler_skill_level,
    resolved_seconds,
    resolved_source,
    calibration_required,
    snapshot_updated_at,
    auth.uid()
  )
  on conflict (session_id, player_account_id) do update set
    profile_id = excluded.profile_id,
    player_id_snapshot = excluded.player_id_snapshot,
    player_name_snapshot = excluded.player_name_snapshot,
    target = excluded.target,
    use_howler = excluded.use_howler,
    howler_skill_level_snapshot = excluded.howler_skill_level_snapshot,
    march_seconds = excluded.march_seconds,
    timing_source = excluded.timing_source,
    needs_howler_calibration = excluded.needs_howler_calibration,
    profile_updated_at_snapshot = excluded.profile_updated_at_snapshot,
    added_by = excluded.added_by,
    updated_at = now()
  returning id into assignment_id;

  return assignment_id;
end;
$$;

revoke all on function public.set_castle_command_session_assignment(uuid, uuid, text, boolean) from public;
grant execute on function public.set_castle_command_session_assignment(uuid, uuid, text, boolean) to authenticated;

comment on function public.set_castle_command_session_assignment(uuid, uuid, text, boolean) is
  'Creates/updates a Castle assignment from a fully locked current-member identity/profile/timing snapshot; lock order is session -> membership -> account -> profile -> timing.';

commit;
