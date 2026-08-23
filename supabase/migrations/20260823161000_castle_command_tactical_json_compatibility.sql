begin;

-- CASTLE-COMMAND-001F production-compatibility correction.
-- The connected Postgres does not provide jsonb_object_length(jsonb). Replace
-- the final tactical-save RPC with supported jsonb_object_keys() validation.

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

comment on function public.save_castle_command_tactical_plan(uuid, bigint, text, integer, timestamptz, integer, jsonb) is
  'Final Castle tactical save RPC: optimistic, current-membership aware, immutable-versioned and compatible with production Postgres JSONB functions.';

commit;
