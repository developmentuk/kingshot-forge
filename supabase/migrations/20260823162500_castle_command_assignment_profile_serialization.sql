begin;

-- CASTLE-COMMAND-001F release hardening.
-- Assignment snapshots must serialize with profile sharing/timing saves so a
-- concurrent opt-out or timing edit cannot commit before a stale assignment.

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
  resolved_seconds integer;
  resolved_source text;
  calibration_required boolean := false;
  assignment_id uuid;
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

  -- Lock the qualifying profile before reading any timing rows. Profile saves
  -- upsert this row before updating the five target rows and hold that row lock
  -- until transaction end, so this wait boundary guarantees the consent scope,
  -- profile metadata and subsequent timing read belong to one committed save.
  select profile.* into command_profile
  from public.castle_command_profiles profile
  join public.alliance_memberships membership
    on membership.user_id = profile.user_id
   and membership.alliance_id = command_session.alliance_id
   and membership.status = 'current'::public.alliance_membership_status
  where profile.player_account_id = target_player_account_id
    and profile.share_with_alliance = true
    and profile.shared_alliance_id = command_session.alliance_id
  for update of profile;

  if command_profile.id is null then
    raise exception 'Player has no explicitly shared Castle Command profile in this alliance' using errcode = 'P0002';
  end if;

  select * into timing
  from public.castle_command_profile_targets
  where profile_id = command_profile.id
    and target = target_target;

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

  select * into account
  from public.player_accounts
  where id = target_player_account_id
    and user_id = command_profile.user_id;

  if account.id is null then
    raise exception 'Castle Command player account mismatch' using errcode = 'P0002';
  end if;

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
    command_profile.updated_at,
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
  'Creates or updates an assignment from one serialized, currently shared Castle profile/timing snapshot.';

commit;
