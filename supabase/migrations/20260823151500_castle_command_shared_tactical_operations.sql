begin;

-- CASTLE-COMMAND-001E — Shared Tactical Operations.
-- Review-gated migration. Do not apply until 001B/001C/001D are owner-approved and active.

create table public.castle_command_tactical_plan_versions (
  session_id uuid not null references public.castle_command_sessions(id) on delete cascade,
  version bigint not null check (version > 0),
  mode text not null check (mode in ('simultaneous', 'staggered', 'counter')),
  stagger_seconds integer not null check (stagger_seconds between 0 and 30),
  counter_anchor_at timestamptz,
  counter_offset_seconds integer not null check (counter_offset_seconds between 0 and 60),
  waves jsonb not null check (jsonb_typeof(waves) = 'array'),
  assignment_snapshot jsonb not null check (jsonb_typeof(assignment_snapshot) = 'array'),
  saved_by uuid not null references auth.users(id) on delete restrict,
  saved_at timestamptz not null default now(),
  primary key (session_id, version),
  check (
    (mode = 'counter' and counter_anchor_at is not null)
    or (mode <> 'counter' and counter_anchor_at is null)
  )
);

create table public.castle_command_tactical_plans (
  session_id uuid primary key references public.castle_command_sessions(id) on delete cascade,
  current_version bigint not null check (current_version > 0),
  updated_by uuid not null references auth.users(id) on delete restrict,
  updated_at timestamptz not null default now(),
  foreign key (session_id, current_version)
    references public.castle_command_tactical_plan_versions(session_id, version)
    on delete restrict
);

create index castle_command_tactical_versions_session_saved_idx
  on public.castle_command_tactical_plan_versions(session_id, saved_at desc);

alter table public.castle_command_tactical_plan_versions enable row level security;
alter table public.castle_command_tactical_plans enable row level security;

-- No direct authenticated table grants are provided. All reads/writes flow through
-- projection or mutation RPCs so saved_by/updated_by stay server-internal.

create or replace function public.build_castle_command_assignment_snapshot(target_session_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', assignment.id,
        'playerAccountId', assignment.player_account_id,
        'playerId', assignment.player_id_snapshot,
        'playerName', assignment.player_name_snapshot,
        'target', assignment.target,
        'useHowler', assignment.use_howler,
        'howlerSkillLevel', assignment.howler_skill_level_snapshot,
        'marchSeconds', assignment.march_seconds,
        'timingSource', assignment.timing_source,
        'needsHowlerCalibration', assignment.needs_howler_calibration,
        'profileUpdatedAt', assignment.profile_updated_at_snapshot
      ) order by lower(assignment.player_name_snapshot), assignment.id
    ),
    '[]'::jsonb
  )
  from public.castle_command_session_assignments assignment
  where assignment.session_id = target_session_id;
$$;

revoke all on function public.build_castle_command_assignment_snapshot(uuid) from public;

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
    if jsonb_typeof(wave) <> 'object'
      or jsonb_object_length(wave) <> 3
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

create or replace function public.get_castle_command_shared_tactical_plan(target_session_id uuid)
returns table (
  version bigint,
  mode text,
  stagger_seconds integer,
  counter_anchor_at timestamptz,
  counter_offset_seconds integer,
  waves jsonb,
  assignment_snapshot jsonb,
  assignment_snapshot_current boolean,
  saved_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.can_participate_castle_command_session(target_session_id) then
    raise exception 'Castle Command tactical plan access denied' using errcode = '42501';
  end if;

  return query
  select
    version_row.version,
    version_row.mode,
    version_row.stagger_seconds,
    version_row.counter_anchor_at,
    version_row.counter_offset_seconds,
    version_row.waves,
    version_row.assignment_snapshot,
    version_row.assignment_snapshot = public.build_castle_command_assignment_snapshot(target_session_id),
    version_row.saved_at
  from public.castle_command_tactical_plans plan
  join public.castle_command_tactical_plan_versions version_row
    on version_row.session_id = plan.session_id
   and version_row.version = plan.current_version
  where plan.session_id = target_session_id;
end;
$$;

create or replace function public.list_castle_command_tactical_plan_history(
  target_session_id uuid,
  target_limit integer default 20
)
returns table (
  version bigint,
  mode text,
  stagger_seconds integer,
  counter_anchor_at timestamptz,
  counter_offset_seconds integer,
  waves jsonb,
  assignment_snapshot jsonb,
  saved_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  resolved_limit integer := greatest(1, least(coalesce(target_limit, 20), 50));
begin
  if not public.can_participate_castle_command_session(target_session_id) then
    raise exception 'Castle Command tactical history access denied' using errcode = '42501';
  end if;

  return query
  select
    version_row.version,
    version_row.mode,
    version_row.stagger_seconds,
    version_row.counter_anchor_at,
    version_row.counter_offset_seconds,
    version_row.waves,
    version_row.assignment_snapshot,
    version_row.saved_at
  from public.castle_command_tactical_plan_versions version_row
  where version_row.session_id = target_session_id
  order by version_row.version desc
  limit resolved_limit;
end;
$$;

create or replace function public.get_castle_command_battle_summary(target_session_id uuid)
returns table (
  session_status text,
  assignment_count integer,
  ready_count integer,
  sent_count integer,
  waiting_count integer,
  howler_assignment_count integer,
  plan_version_count integer,
  latest_plan_version bigint,
  latest_plan_saved_at timestamptz,
  latest_plan_matches_assignments boolean,
  closed_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.can_participate_castle_command_session(target_session_id) then
    raise exception 'Castle Command battle summary access denied' using errcode = '42501';
  end if;

  return query
  with assignment_totals as (
    select
      count(*)::integer as assignment_count,
      count(*) filter (where assignment.use_howler)::integer as howler_assignment_count
    from public.castle_command_session_assignments assignment
    where assignment.session_id = target_session_id
  ),
  acknowledgement_totals as (
    select
      count(*) filter (where acknowledgement.status = 'ready')::integer as ready_count,
      count(*) filter (where acknowledgement.status = 'sent')::integer as sent_count
    from public.castle_command_session_acknowledgements acknowledgement
    where acknowledgement.session_id = target_session_id
  ),
  plan_totals as (
    select count(*)::integer as plan_version_count
    from public.castle_command_tactical_plan_versions version_row
    where version_row.session_id = target_session_id
  ),
  latest_plan as (
    select
      version_row.version,
      version_row.saved_at,
      version_row.assignment_snapshot = public.build_castle_command_assignment_snapshot(target_session_id) as matches_assignments
    from public.castle_command_tactical_plans plan
    join public.castle_command_tactical_plan_versions version_row
      on version_row.session_id = plan.session_id
     and version_row.version = plan.current_version
    where plan.session_id = target_session_id
  )
  select
    session.status,
    assignment_totals.assignment_count,
    acknowledgement_totals.ready_count,
    acknowledgement_totals.sent_count,
    greatest(
      0,
      assignment_totals.assignment_count - acknowledgement_totals.ready_count - acknowledgement_totals.sent_count
    )::integer,
    assignment_totals.howler_assignment_count,
    plan_totals.plan_version_count,
    latest_plan.version,
    latest_plan.saved_at,
    latest_plan.matches_assignments,
    session.closed_at
  from public.castle_command_sessions session
  cross join assignment_totals
  cross join acknowledgement_totals
  cross join plan_totals
  left join latest_plan on true
  where session.id = target_session_id;
end;
$$;

revoke all on function public.save_castle_command_tactical_plan(uuid, bigint, text, integer, timestamptz, integer, jsonb) from public;
revoke all on function public.get_castle_command_shared_tactical_plan(uuid) from public;
revoke all on function public.list_castle_command_tactical_plan_history(uuid, integer) from public;
revoke all on function public.get_castle_command_battle_summary(uuid) from public;

grant execute on function public.save_castle_command_tactical_plan(uuid, bigint, text, integer, timestamptz, integer, jsonb) to authenticated;
grant execute on function public.get_castle_command_shared_tactical_plan(uuid) to authenticated;
grant execute on function public.list_castle_command_tactical_plan_history(uuid, integer) to authenticated;
grant execute on function public.get_castle_command_battle_summary(uuid) to authenticated;

create trigger castle_command_tactical_plans_broadcast_change
after insert or update or delete on public.castle_command_tactical_plans
for each row execute function public.broadcast_castle_command_state_change();

comment on table public.castle_command_tactical_plan_versions is
  'Immutable Castle Command tactical plan revisions with assignment snapshots. No direct client access.';
comment on table public.castle_command_tactical_plans is
  'Current Castle Command tactical plan pointer. Mutated only through optimistic server RPC.';
comment on function public.save_castle_command_tactical_plan(uuid, bigint, text, integer, timestamptz, integer, jsonb) is
  'Atomically saves a new immutable tactical version when the caller expected the current version.';
comment on function public.get_castle_command_battle_summary(uuid) is
  'Coordination summary only; does not claim combat outcome, ownership, damage or rally landing telemetry.';

commit;
