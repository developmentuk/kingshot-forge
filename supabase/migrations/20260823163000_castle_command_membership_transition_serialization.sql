begin;

-- CASTLE-COMMAND-001F release hardening.
-- Serialize every durable Castle mutation that relies on current alliance
-- membership with the relevant alliance_memberships row(s). All affected
-- session mutations acquire locks in the same order: session -> membership,
-- with assignment additionally taking profile after membership.

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

  -- Lock the target player's qualifying current membership before profile or
  -- timing reads. A concurrent status change/delete must now complete either
  -- before this validation (and be rejected) or after this assignment commits.
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

  -- Profile saves own/update this row before changing the five timing rows.
  -- Membership is deliberately locked first, establishing session ->
  -- membership -> profile as the assignment lock order.
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
    and user_id = assigned_user_id;

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
  current_member_user_id uuid;
  existing_status text;
  ready_timestamp timestamptz;
begin
  if target_status not in ('ready', 'sent') then
    raise exception 'Invalid Castle Command acknowledgement' using errcode = '22023';
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

  -- Lock the caller's current membership so a concurrent removal cannot commit
  -- between current-member authorization and READY/SENT persistence.
  select membership.user_id into current_member_user_id
  from public.alliance_memberships membership
  where membership.alliance_id = command_session.alliance_id
    and membership.user_id = auth.uid()
    and membership.status = 'current'::public.alliance_membership_status
  for update of membership;

  if current_member_user_id is null then
    raise exception 'Castle Command participant is no longer a current alliance member' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.castle_command_session_assignments assignment
    join public.player_accounts account
      on account.id = assignment.player_account_id
    where assignment.session_id = target_session_id
      and assignment.player_account_id = target_player_account_id
      and account.user_id = current_member_user_id
  ) then
    raise exception 'Castle Command participant access denied' using errcode = '42501';
  end if;

  select acknowledgement.status, acknowledgement.ready_at
    into existing_status, ready_timestamp
  from public.castle_command_session_acknowledgements acknowledgement
  where acknowledgement.session_id = target_session_id
    and acknowledgement.player_account_id = target_player_account_id
  for update;

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
  target_member_user_id uuid;
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

  if target_enabled then
    select membership.user_id into target_member_user_id
    from public.alliance_memberships membership
    join public.player_accounts account
      on account.user_id = membership.user_id
     and account.id = target_player_account_id
    where membership.alliance_id = command_session.alliance_id
      and membership.status = 'current'::public.alliance_membership_status
    for update of membership;

    if target_member_user_id is null then
      raise exception 'Castle Command deputy must be a current alliance member' using errcode = '22023';
    end if;

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

create or replace function public.save_castle_command_tactical_plan(
  target_session_id uuid,
  target_expected_version bigint,
  target_mode text,
  target_stagger_seconds integer,
  target_counter_anchor_at timestamptz,
  target_counter_offset_seconds integer,
  target_waves jsonb
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  command_session public.castle_command_sessions%rowtype;
  current_version_value bigint := 0;
  next_version bigint;
  resolved_counter_anchor timestamptz;
  assignment_snapshot_value jsonb;
  wave jsonb;
  wave_id text;
  wave_label text;
  wave_offset numeric;
  wave_key_count integer;
  seen_wave_ids text[] := array[]::text[];
begin
  if target_expected_version is null or target_expected_version < 0 then
    raise exception 'Invalid Castle Command tactical plan version' using errcode = '22023';
  end if;

  select * into command_session
  from public.castle_command_sessions
  where id = target_session_id
  for update;

  if command_session.id is null then
    raise exception 'Castle Command session not found' using errcode = 'P0002';
  end if;

  if command_session.status = 'closed' then
    raise exception 'Closed Castle Command session tactical plan is immutable' using errcode = '22023';
  end if;

  if not public.can_manage_castle_command_session(target_session_id) then
    raise exception 'Castle Command tactical management access denied' using errcode = '42501';
  end if;

  -- Lock all qualifying current membership rows in a deterministic order before
  -- the eligibility re-check and assignment snapshot. A concurrent departure
  -- must therefore commit before this save (and fail validation) or wait until
  -- this tactical version is durably committed.
  perform membership.user_id
  from public.castle_command_session_assignments assignment
  join public.player_accounts account
    on account.id = assignment.player_account_id
  join public.alliance_memberships membership
    on membership.user_id = account.user_id
   and membership.alliance_id = command_session.alliance_id
   and membership.status = 'current'::public.alliance_membership_status
  where assignment.session_id = target_session_id
  order by membership.user_id
  for update of membership;

  if exists (
    select 1
    from public.castle_command_session_assignments assignment
    join public.player_accounts account
      on account.id = assignment.player_account_id
    where assignment.session_id = target_session_id
      and not exists (
        select 1
        from public.alliance_memberships membership
        where membership.user_id = account.user_id
          and membership.alliance_id = command_session.alliance_id
          and membership.status = 'current'::public.alliance_membership_status
      )
  ) then
    raise exception 'Castle Command tactical plan contains a player who is no longer a current alliance member' using errcode = '22023';
  end if;

  if target_mode not in ('simultaneous', 'staggered', 'counter') then
    raise exception 'Invalid Castle Command tactical mode' using errcode = '22023';
  end if;

  if target_stagger_seconds is null or target_stagger_seconds < 0 or target_stagger_seconds > 30 then
    raise exception 'Invalid Castle Command tactical stagger' using errcode = '22023';
  end if;

  if target_counter_offset_seconds is null or target_counter_offset_seconds < 0 or target_counter_offset_seconds > 60 then
    raise exception 'Invalid Castle Command counter offset' using errcode = '22023';
  end if;

  if target_mode = 'counter' then
    if target_counter_anchor_at is null then
      raise exception 'Counter mode requires an operator-observed capture anchor' using errcode = '22023';
    end if;
    resolved_counter_anchor := target_counter_anchor_at;
  else
    resolved_counter_anchor := null;
  end if;

  if target_waves is null
    or jsonb_typeof(target_waves) <> 'array'
    or jsonb_array_length(target_waves) < 1
    or jsonb_array_length(target_waves) > 5 then
    raise exception 'Castle Command tactical waves must contain between one and five entries' using errcode = '22023';
  end if;

  for wave in select value from jsonb_array_elements(target_waves)
  loop
    if jsonb_typeof(wave) <> 'object' then
      raise exception 'Invalid Castle Command tactical wave shape' using errcode = '22023';
    end if;

    select count(*)::integer into wave_key_count
    from jsonb_object_keys(wave);

    if wave_key_count <> 3
      or not (wave ? 'id')
      or not (wave ? 'label')
      or not (wave ? 'offsetSeconds')
      or jsonb_typeof(wave->'id') <> 'string'
      or jsonb_typeof(wave->'label') <> 'string'
      or jsonb_typeof(wave->'offsetSeconds') <> 'number' then
      raise exception 'Invalid Castle Command tactical wave shape' using errcode = '22023';
    end if;

    wave_id := wave->>'id';
    wave_label := btrim(wave->>'label');
    wave_offset := (wave->>'offsetSeconds')::numeric;

    if char_length(wave_id) < 1 or char_length(wave_id) > 80 then
      raise exception 'Invalid Castle Command tactical wave id' using errcode = '22023';
    end if;

    if wave_id = any(seen_wave_ids) then
      raise exception 'Castle Command tactical wave ids must be unique' using errcode = '22023';
    end if;
    seen_wave_ids := array_append(seen_wave_ids, wave_id);

    if char_length(wave_label) < 1 or char_length(wave_label) > 40 then
      raise exception 'Invalid Castle Command tactical wave label' using errcode = '22023';
    end if;

    if wave_offset <> trunc(wave_offset) or wave_offset < 0 or wave_offset > 300 then
      raise exception 'Invalid Castle Command tactical wave offset' using errcode = '22023';
    end if;
  end loop;

  assignment_snapshot_value := public.build_castle_command_assignment_snapshot(target_session_id);
  if jsonb_array_length(assignment_snapshot_value) < 1 then
    raise exception 'Castle Command tactical plan requires at least one assigned participant' using errcode = '22023';
  end if;

  select plan.current_version into current_version_value
  from public.castle_command_tactical_plans plan
  where plan.session_id = target_session_id
  for update;

  if not found then
    current_version_value := 0;
  end if;

  if current_version_value <> target_expected_version then
    raise exception 'Castle Command tactical plan version conflict' using errcode = '40001';
  end if;

  next_version := current_version_value + 1;

  insert into public.castle_command_tactical_plan_versions (
    session_id,
    version,
    mode,
    stagger_seconds,
    counter_anchor_at,
    counter_offset_seconds,
    waves,
    assignment_snapshot,
    session_impact_at_snapshot,
    rally_preparation_seconds_snapshot,
    saved_by
  ) values (
    target_session_id,
    next_version,
    target_mode,
    target_stagger_seconds,
    resolved_counter_anchor,
    target_counter_offset_seconds,
    target_waves,
    assignment_snapshot_value,
    command_session.impact_at,
    command_session.rally_preparation_seconds,
    auth.uid()
  );

  insert into public.castle_command_tactical_plans (
    session_id,
    current_version,
    updated_by,
    updated_at
  ) values (
    target_session_id,
    next_version,
    auth.uid(),
    now()
  )
  on conflict (session_id) do update set
    current_version = excluded.current_version,
    updated_by = excluded.updated_by,
    updated_at = excluded.updated_at;

  return next_version;
end;
$$;

revoke all on function public.save_castle_command_tactical_plan(uuid, bigint, text, integer, timestamptz, integer, jsonb) from public;
grant execute on function public.save_castle_command_tactical_plan(uuid, bigint, text, integer, timestamptz, integer, jsonb) to authenticated;

comment on function public.set_castle_command_session_assignment(uuid, uuid, text, boolean) is
  'Creates or updates an assignment only while the target current-membership, sharing consent and timing snapshot are transactionally serialized.';
comment on function public.set_castle_command_acknowledgement(uuid, uuid, text) is
  'Serializes READY/SENT with session lifecycle, acknowledgement state and the participant current-membership row.';
comment on function public.set_castle_command_session_deputy(uuid, uuid, boolean) is
  'Serializes deputy appointment with the target participant current-membership row.';
comment on function public.save_castle_command_tactical_plan(uuid, bigint, text, integer, timestamptz, integer, jsonb) is
  'Serializes tactical publication with all assigned participants current-membership rows before snapshotting.';

commit;
