begin;

-- CASTLE-COMMAND-001E hardening — freeze the session timing context used by
-- every immutable tactical version so history never depends on later session state.

alter table public.castle_command_tactical_plan_versions
  add column session_impact_at_snapshot timestamptz,
  add column rally_preparation_seconds_snapshot integer
    check (rally_preparation_seconds_snapshot in (60, 180, 300));

update public.castle_command_tactical_plan_versions version_row
set
  session_impact_at_snapshot = session.impact_at,
  rally_preparation_seconds_snapshot = session.rally_preparation_seconds
from public.castle_command_sessions session
where session.id = version_row.session_id
  and (
    version_row.session_impact_at_snapshot is null
    or version_row.rally_preparation_seconds_snapshot is null
  );

alter table public.castle_command_tactical_plan_versions
  alter column session_impact_at_snapshot set not null,
  alter column rally_preparation_seconds_snapshot set not null;

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

drop function public.get_castle_command_shared_tactical_plan(uuid);

create function public.get_castle_command_shared_tactical_plan(target_session_id uuid)
returns table (
  version bigint,
  mode text,
  stagger_seconds integer,
  counter_anchor_at timestamptz,
  counter_offset_seconds integer,
  waves jsonb,
  assignment_snapshot jsonb,
  session_impact_at_snapshot timestamptz,
  rally_preparation_seconds_snapshot integer,
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
    version_row.session_impact_at_snapshot,
    version_row.rally_preparation_seconds_snapshot,
    version_row.assignment_snapshot = public.build_castle_command_assignment_snapshot(target_session_id),
    version_row.saved_at
  from public.castle_command_tactical_plans plan
  join public.castle_command_tactical_plan_versions version_row
    on version_row.session_id = plan.session_id
   and version_row.version = plan.current_version
  where plan.session_id = target_session_id;
end;
$$;

drop function public.list_castle_command_tactical_plan_history(uuid, integer);

create function public.list_castle_command_tactical_plan_history(
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
  session_impact_at_snapshot timestamptz,
  rally_preparation_seconds_snapshot integer,
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
    version_row.session_impact_at_snapshot,
    version_row.rally_preparation_seconds_snapshot,
    version_row.saved_at
  from public.castle_command_tactical_plan_versions version_row
  where version_row.session_id = target_session_id
  order by version_row.version desc
  limit resolved_limit;
end;
$$;

revoke all on function public.get_castle_command_shared_tactical_plan(uuid) from public;
revoke all on function public.list_castle_command_tactical_plan_history(uuid, integer) from public;
grant execute on function public.get_castle_command_shared_tactical_plan(uuid) to authenticated;
grant execute on function public.list_castle_command_tactical_plan_history(uuid, integer) to authenticated;

comment on column public.castle_command_tactical_plan_versions.session_impact_at_snapshot is
  'Impact timestamp frozen at tactical-version save time.';
comment on column public.castle_command_tactical_plan_versions.rally_preparation_seconds_snapshot is
  'Rally preparation duration frozen at tactical-version save time.';

commit;
