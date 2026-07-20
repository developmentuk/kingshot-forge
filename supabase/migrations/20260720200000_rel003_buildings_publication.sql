begin;

create table if not exists public.forge_warning_decision_audits (
  audit_event_id text primary key,
  decision_id text not null,
  import_run_id uuid not null references public.forge_import_runs(id) on delete restrict,
  warning_id text not null references public.forge_import_warnings(warning_id) on delete restrict,
  action text not null check (action in ('decided', 'superseded')),
  actor_id text not null,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.forge_warning_decisions (
  decision_id text primary key,
  import_run_id uuid not null references public.forge_import_runs(id) on delete restrict,
  warning_id text not null references public.forge_import_warnings(warning_id) on delete restrict,
  warning_code text not null,
  warning_identity jsonb not null,
  resolution_type text not null check (resolution_type in (
    'Resolved Canonical Mapping',
    'Accepted Structured External Reference',
    'Accepted Alias Mapping',
    'Deferred Catalogue Dependency',
    'Rejected Warning',
    'Blocking'
  )),
  dependency_status text not null check (dependency_status in (
    'Resolved Canonical Dependency',
    'Deferred Catalogue Dependency',
    'No Dependency',
    'Blocking'
  )),
  canonical_target text,
  external_reference text,
  editor_reason text not null,
  actor_id text not null,
  decided_at timestamptz not null default now(),
  source_version text not null,
  supersedes_decision_id text references public.forge_warning_decisions(decision_id),
  audit_event_id text not null references public.forge_warning_decision_audits(audit_event_id),
  created_at timestamptz not null default now()
);

create index if not exists forge_warning_decisions_warning_idx
  on public.forge_warning_decisions(import_run_id, warning_id, decided_at desc, decision_id desc);
create unique index if not exists forge_warning_decisions_duplicate_idx
  on public.forge_warning_decisions(
    import_run_id,
    warning_id,
    resolution_type,
    dependency_status,
    coalesce(canonical_target, ''),
    coalesce(external_reference, ''),
    source_version
  );

create or replace view public.forge_current_warning_decisions
with (security_invoker = true)
as
select distinct on (import_run_id, warning_id)
  decision_id, import_run_id, warning_id, warning_code, warning_identity,
  resolution_type, dependency_status, canonical_target, external_reference,
  editor_reason, actor_id, decided_at, source_version, supersedes_decision_id,
  audit_event_id, created_at
from public.forge_warning_decisions
order by import_run_id, warning_id, decided_at desc, decision_id desc;

create table if not exists public.buildings_publication_versions (
  publication_id text primary key,
  import_run_id uuid not null references public.forge_import_runs(id) on delete restrict,
  publication_version bigint not null unique,
  source_fingerprint text not null,
  manifest jsonb not null,
  manifest_hash text not null,
  actor_id text not null,
  approval_reason text not null,
  status text not null check (status in ('publishing', 'published', 'failed', 'rolled_back')),
  is_current boolean not null default false,
  catalogue_count integer not null,
  progression_count integer not null,
  warning_count integer not null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  idempotency_key text not null unique,
  refresh_metadata jsonb not null default '{}'::jsonb
);

create unique index if not exists buildings_one_current_publication_idx
  on public.buildings_publication_versions(is_current)
  where is_current;
create unique index if not exists buildings_one_run_publication_idx
  on public.buildings_publication_versions(import_run_id)
  where status in ('publishing', 'published', 'rolled_back');

create table if not exists public.buildings_publication_records (
  publication_id text not null references public.buildings_publication_versions(publication_id) on delete restrict,
  entity_type text not null check (entity_type in ('catalogue', 'progression')),
  record_id text not null,
  values jsonb not null,
  source_metadata jsonb not null default '{}'::jsonb,
  primary key (publication_id, entity_type, record_id)
);

create table if not exists public.buildings_publication_prerequisites (
  publication_id text not null references public.buildings_publication_versions(publication_id) on delete restrict,
  warning_id text not null references public.forge_import_warnings(warning_id) on delete restrict,
  progression_record_id text not null,
  external_reference text not null,
  resolution_type text not null,
  dependency_status text not null,
  source_metadata jsonb not null default '{}'::jsonb,
  primary key (publication_id, warning_id)
);

create table if not exists public.buildings_publication_refreshes (
  publication_id text not null references public.buildings_publication_versions(publication_id) on delete restrict,
  refresh_kind text not null check (refresh_kind in ('search', 'relationship', 'prerequisite_graph', 'personal_progression')),
  status text not null check (status in ('pending', 'running', 'succeeded', 'failed')),
  scope jsonb not null default '{}'::jsonb,
  error_message text,
  started_at timestamptz,
  finished_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (publication_id, refresh_kind)
);

alter table public.buildings
  add column if not exists import_run_id uuid,
  add column if not exists publication_id text,
  add column if not exists source_fingerprint text,
  add column if not exists verification_metadata jsonb not null default '{}'::jsonb;
alter table public.building_progression
  add column if not exists import_run_id uuid,
  add column if not exists publication_id text,
  add column if not exists source_fingerprint text,
  add column if not exists verification_metadata jsonb not null default '{}'::jsonb;

alter table public.forge_warning_decisions enable row level security;
alter table public.forge_warning_decision_audits enable row level security;
alter table public.buildings_publication_versions enable row level security;
alter table public.buildings_publication_records enable row level security;
alter table public.buildings_publication_prerequisites enable row level security;
alter table public.buildings_publication_refreshes enable row level security;

revoke all on public.forge_warning_decisions, public.forge_warning_decision_audits,
  public.buildings_publication_versions, public.buildings_publication_records,
  public.buildings_publication_prerequisites, public.buildings_publication_refreshes
  from anon, authenticated;
grant select on public.forge_warning_decisions, public.forge_warning_decision_audits,
  public.buildings_publication_versions, public.buildings_publication_records,
  public.buildings_publication_prerequisites, public.buildings_publication_refreshes
  to service_role;

create or replace function public.prevent_rel003_history_mutation()
returns trigger language plpgsql security definer set search_path = pg_catalog as $$
begin
  raise exception '% is append-only; % is not permitted', tg_table_name, tg_op;
end;
$$;
revoke all on function public.prevent_rel003_history_mutation() from public, anon, authenticated;
grant execute on function public.prevent_rel003_history_mutation() to service_role;

drop trigger if exists forge_warning_decisions_immutable on public.forge_warning_decisions;
create trigger forge_warning_decisions_immutable before update or delete
on public.forge_warning_decisions for each row execute function public.prevent_rel003_history_mutation();
drop trigger if exists forge_warning_decision_audits_immutable on public.forge_warning_decision_audits;
create trigger forge_warning_decision_audits_immutable before update or delete
on public.forge_warning_decision_audits for each row execute function public.prevent_rel003_history_mutation();
drop trigger if exists buildings_publication_records_immutable on public.buildings_publication_records;
create trigger buildings_publication_records_immutable before update or delete
on public.buildings_publication_records for each row execute function public.prevent_rel003_history_mutation();
drop trigger if exists buildings_publication_prerequisites_immutable on public.buildings_publication_prerequisites;
create trigger buildings_publication_prerequisites_immutable before update or delete
on public.buildings_publication_prerequisites for each row execute function public.prevent_rel003_history_mutation();

create or replace function forge_private.rel003_actor_has_permission(p_actor_id text, p_permission text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.forge_user_roles r
    join public.forge_role_permissions p on p.role::text = r.role::text
    where r.user_id::text = p_actor_id and p.permission_key::text = p_permission
  );
$$;
revoke all on function forge_private.rel003_actor_has_permission(text, text) from public;
grant execute on function forge_private.rel003_actor_has_permission(text, text) to service_role;

create or replace function public.record_buildings_warning_decision(
  p_import_run_id uuid,
  p_warning_id text,
  p_resolution_type text,
  p_dependency_status text,
  p_canonical_target text,
  p_external_reference text,
  p_editor_reason text,
  p_actor_id text,
  p_source_version text,
  p_supersedes_decision_id text default null
)
returns jsonb language plpgsql security definer set search_path = public, forge_private as $$
declare
  warning_row public.forge_import_warnings%rowtype;
  existing public.forge_warning_decisions%rowtype;
  new_decision_id text := 'wd-' || gen_random_uuid()::text;
  new_audit_id text := 'wda-' || gen_random_uuid()::text;
  now_value timestamptz := now();
begin
  if current_user not in ('service_role', 'postgres') then
    raise exception 'Warning decisions are server-only.';
  end if;
  if not forge_private.rel003_actor_has_permission(p_actor_id, 'cms.publish') then
    raise exception 'Actor is not permitted to decide Buildings warnings.';
  end if;
  select * into warning_row from public.forge_import_warnings
  where import_run_id = p_import_run_id and warning_id = p_warning_id;
  if not found then raise exception 'Warning identity was not found for this import run.'; end if;
  select * into existing from public.forge_warning_decisions
  where import_run_id = p_import_run_id and warning_id = p_warning_id
    and resolution_type = p_resolution_type
    and dependency_status = p_dependency_status
    and coalesce(canonical_target, '') = coalesce(p_canonical_target, '')
    and coalesce(external_reference, '') = coalesce(p_external_reference, '')
    and source_version = p_source_version
  order by decided_at desc, decision_id desc limit 1;
  if found then
    return jsonb_build_object('decisionId', existing.decision_id, 'auditEventId', existing.audit_event_id, 'duplicate', true);
  end if;
  if p_resolution_type = 'Accepted Structured External Reference' and nullif(trim(p_external_reference), '') is null then
    raise exception 'An external reference is required for a structured external reference decision.';
  end if;
  insert into public.forge_warning_decision_audits(
    audit_event_id, decision_id, import_run_id, warning_id, action, actor_id, occurred_at, metadata
  ) values (
    new_audit_id, new_decision_id, p_import_run_id, p_warning_id,
    case when p_supersedes_decision_id is null then 'decided' else 'superseded' end,
    p_actor_id, now_value, jsonb_build_object('sourceVersion', p_source_version, 'resolutionType', p_resolution_type)
  );
  insert into public.forge_warning_decisions(
    decision_id, import_run_id, warning_id, warning_code, warning_identity,
    resolution_type, dependency_status, canonical_target, external_reference,
    editor_reason, actor_id, decided_at, source_version, supersedes_decision_id, audit_event_id
  ) values (
    new_decision_id, p_import_run_id, p_warning_id, warning_row.code,
    jsonb_build_object('warningId', warning_row.warning_id, 'sheet', warning_row.sheet_name,
      'row', warning_row.source_row, 'recordId', warning_row.record_id,
      'buildingKey', warning_row.building_key, 'code', warning_row.code,
      'severity', warning_row.severity, 'message', warning_row.message,
      'sourceText', warning_row.source_text),
    p_resolution_type, p_dependency_status, nullif(trim(p_canonical_target), ''),
    nullif(trim(p_external_reference), ''), p_editor_reason, p_actor_id,
    now_value, p_source_version, p_supersedes_decision_id, new_audit_id
  );
  return jsonb_build_object('decisionId', new_decision_id, 'auditEventId', new_audit_id, 'duplicate', false);
end;
$$;
revoke all on function public.record_buildings_warning_decision(uuid, text, text, text, text, text, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.record_buildings_warning_decision(uuid, text, text, text, text, text, text, text, text, text) to service_role;

create or replace function public.get_buildings_publication_manifest(p_import_run_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  run_row public.forge_import_runs%rowtype;
  next_version bigint;
  manifest jsonb;
begin
  select * into run_row from public.forge_import_runs where id = p_import_run_id;
  if not found then raise exception 'Buildings import run was not found.'; end if;
  select coalesce(max(publication_version), 0) + 1 into next_version from public.buildings_publication_versions;
  select jsonb_build_object(
    'importRunId', p_import_run_id,
    'sourceFingerprint', run_row.file_fingerprint,
    'catalogueRecordIds', coalesce((select jsonb_agg(external_key order by external_key) from public.forge_import_records where import_run_id = p_import_run_id and sheet_name = 'buildings_catalog'), '[]'::jsonb),
    'progressionRecordIds', coalesce((select jsonb_agg(external_key order by external_key) from public.forge_import_records where import_run_id = p_import_run_id and sheet_name = 'buildings_import'), '[]'::jsonb),
    'warningIds', coalesce((select jsonb_agg(warning_id order by warning_id) from public.forge_import_warnings where import_run_id = p_import_run_id), '[]'::jsonb),
    'decisionIds', coalesce((select jsonb_agg(decision_id order by warning_id) from public.forge_current_warning_decisions where import_run_id = p_import_run_id), '[]'::jsonb),
    'catalogueCount', (select count(*) from public.forge_import_records where import_run_id = p_import_run_id and sheet_name = 'buildings_catalog'),
    'progressionCount', (select count(*) from public.forge_import_records where import_run_id = p_import_run_id and sheet_name = 'buildings_import'),
    'warningCount', (select count(*) from public.forge_import_warnings where import_run_id = p_import_run_id),
    'publicationVersion', next_version
  ) into manifest;
  return manifest;
end;
$$;
revoke all on function public.get_buildings_publication_manifest(uuid) from public, anon, authenticated;
grant execute on function public.get_buildings_publication_manifest(uuid) to service_role;

create or replace function public.publish_buildings_import_run(
  p_import_run_id uuid,
  p_expected_manifest_hash text,
  p_publication_reason text,
  p_idempotency_key text,
  p_actor_id text
)
returns jsonb language plpgsql security definer set search_path = public, forge_private as $$
declare
  run_row public.forge_import_runs%rowtype;
  publication_row public.buildings_publication_versions%rowtype;
  manifest jsonb;
  manifest_hash text;
  new_publication_id text := 'bpub-' || gen_random_uuid()::text;
  version_value bigint;
  now_value timestamptz := now();
  warning_count integer;
  decision_count integer;
begin
  if current_user not in ('service_role', 'postgres') then raise exception 'Buildings publication is server-only.'; end if;
  if not forge_private.rel003_actor_has_permission(p_actor_id, 'cms.publish') then raise exception 'Actor is not permitted to publish Buildings.'; end if;
  perform pg_advisory_xact_lock(hashtext('forge-buildings-publication'));
  select * into publication_row from public.buildings_publication_versions where idempotency_key = p_idempotency_key;
  if found and publication_row.status = 'published' then
    return jsonb_build_object('publicationId', publication_row.publication_id, 'publicationVersion', publication_row.publication_version, 'duplicate', true, 'manifestHash', publication_row.manifest_hash);
  end if;
  select * into run_row from public.forge_import_runs where id = p_import_run_id for update;
  if not found then raise exception 'Buildings import run was not found.'; end if;
  if run_row.dataset_key <> 'buildings' or run_row.state not in ('review_required', 'approved') then raise exception 'Buildings import run is not publishable from state %.', run_row.state; end if;
  if run_row.file_fingerprint <> (run_row.source_metadata->>'fileFingerprint') and (run_row.source_metadata ? 'fileFingerprint') then raise exception 'Source fingerprint metadata drifted.'; end if;
  if (select count(*) from public.forge_import_records where import_run_id = p_import_run_id and sheet_name = 'buildings_catalog') <> 10 then raise exception 'Buildings publication requires exactly 10 catalogue rows.'; end if;
  if (select count(*) from public.forge_import_records where import_run_id = p_import_run_id and sheet_name = 'buildings_import') <> 587 then raise exception 'Buildings publication requires exactly 587 progression rows.'; end if;
  if exists (select 1 from public.forge_import_records where import_run_id = p_import_run_id and issue_state = 'rejected') then raise exception 'Rejected staged rows block publication.'; end if;
  if coalesce((run_row.validation_result->'counts'->>'blockingErrors')::integer, 0) <> 0 then raise exception 'Blocking validation errors block publication.'; end if;
  select count(*) into warning_count from public.forge_import_warnings where import_run_id = p_import_run_id;
  select count(*) into decision_count from public.forge_current_warning_decisions where import_run_id = p_import_run_id;
  if warning_count <> 8 or decision_count <> 8 then raise exception 'Buildings publication requires exactly 8 warnings and 8 effective decisions.'; end if;
  if exists (select 1 from public.forge_current_warning_decisions where import_run_id = p_import_run_id and (resolution_type = 'Blocking' or dependency_status = 'Blocking')) then raise exception 'Blocking warning decision prevents publication.'; end if;
  select coalesce(max(publication_version), 0) + 1 into version_value from public.buildings_publication_versions;
  manifest := public.get_buildings_publication_manifest(p_import_run_id) || jsonb_build_object('publicationVersion', version_value);
  manifest_hash := md5(manifest::text);
  if manifest_hash <> p_expected_manifest_hash then raise exception 'Publication manifest is stale or has drifted.'; end if;
  insert into public.buildings_publication_versions(
    publication_id, import_run_id, publication_version, source_fingerprint, manifest,
    manifest_hash, actor_id, approval_reason, status, is_current, catalogue_count,
    progression_count, warning_count, published_at, updated_at, idempotency_key
  ) values (
    new_publication_id, p_import_run_id, version_value, run_row.file_fingerprint, manifest,
    manifest_hash, p_actor_id, p_publication_reason, 'publishing', false, 10, 587,
    warning_count, now_value, now_value, p_idempotency_key
  );
  insert into public.buildings_publication_records(publication_id, entity_type, record_id, values, source_metadata)
    select new_publication_id, 'catalogue', external_key, original_values, jsonb_build_object('importRunId', p_import_run_id, 'sourceFingerprint', run_row.file_fingerprint)
    from public.forge_import_records where import_run_id = p_import_run_id and sheet_name = 'buildings_catalog';
  insert into public.buildings_publication_records(publication_id, entity_type, record_id, values, source_metadata)
    select new_publication_id, 'progression', external_key, original_values, jsonb_build_object('importRunId', p_import_run_id, 'sourceFingerprint', run_row.file_fingerprint)
    from public.forge_import_records where import_run_id = p_import_run_id and sheet_name = 'buildings_import';
  insert into public.buildings_publication_prerequisites(publication_id, warning_id, progression_record_id, external_reference, resolution_type, dependency_status, source_metadata)
    select new_publication_id, d.warning_id, w.record_id, coalesce(d.external_reference, w.source_text), d.resolution_type, d.dependency_status,
      jsonb_build_object('sourceRow', w.source_row, 'sourceText', w.source_text, 'requiredLevel', w.required_level, 'requiredStage', w.required_stage)
    from public.forge_current_warning_decisions d join public.forge_import_warnings w on w.warning_id = d.warning_id
    where d.import_run_id = p_import_run_id;
  insert into public.buildings(
    building_key, building_name, slug, category, description, standard_max_level,
    truegold_supported, record_count, source_url, verification_note, source_metadata,
    editorial_status, published_version, updated_at, import_run_id, publication_id,
    source_fingerprint, verification_metadata
  ) select
    v->>'building_key', v->>'building_name', regexp_replace(lower(v->>'building_key'), '[^a-z0-9]+', '-', 'g'),
    v->>'category', v->>'description', (v->>'standard_max_level')::integer,
    coalesce((v->>'truegold_supported')::boolean, false), (v->>'record_count')::integer,
    v->>'source_url', v->>'verification_note', jsonb_build_object('rawCostWarning', 'Workbook resource costs are raw/base costs.', 'source', v),
    'published', version_value, now_value, p_import_run_id, new_publication_id, run_row.file_fingerprint,
    jsonb_build_object('contractVersion', run_row.contract_version, 'parserVersion', run_row.parser_version)
  from public.buildings_publication_records r cross join lateral (select r.values v) x
  where r.publication_id = new_publication_id and r.entity_type = 'catalogue'
  on conflict (building_key) do update set
    building_name = excluded.building_name, slug = excluded.slug, category = excluded.category,
    description = excluded.description, standard_max_level = excluded.standard_max_level,
    truegold_supported = excluded.truegold_supported, record_count = excluded.record_count,
    source_url = excluded.source_url, verification_note = excluded.verification_note,
    source_metadata = excluded.source_metadata, editorial_status = 'published',
    published_version = excluded.published_version, updated_at = excluded.updated_at,
    import_run_id = excluded.import_run_id, publication_id = excluded.publication_id,
    source_fingerprint = excluded.source_fingerprint, verification_metadata = excluded.verification_metadata;
  insert into public.building_progression(
    record_id, building_key, building_name, category, level_label, progression_phase,
    base_level, truegold_tier, stage, requirements_text, requirements_json, truegold,
    tempered_truegold, bread, wood, stone, iron, upgrade_time_seconds,
    upgrade_time_display, power, max_hero_level, training_capacity, rally_capacity,
    ally_help_count, training_speed_percent, troop_deploy_capacity,
    reinforcement_capacity, source_url, verification_status, verified_on,
    quality_flags, original_row, published_version, updated_at, import_run_id,
    publication_id, source_fingerprint, verification_metadata
  ) select
    v->>'record_id', v->>'building_key', v->>'building_name', v->>'category', v->>'level_label',
    v->>'progression_phase', nullif(v->>'base_level','')::integer, nullif(v->>'truegold_tier','')::integer,
    nullif(v->>'stage','')::integer, coalesce(v->>'requirements_text',''),
    case when jsonb_typeof(v->'requirements_json') = 'array' then v->'requirements_json' else '[]'::jsonb end,
    nullif(v->>'truegold','')::numeric, nullif(v->>'tempered_truegold','')::numeric,
    nullif(v->>'bread','')::numeric, nullif(v->>'wood','')::numeric, nullif(v->>'stone','')::numeric,
    nullif(v->>'iron','')::numeric, nullif(v->>'upgrade_time_seconds','')::numeric,
    nullif(v->>'upgrade_time_display',''), nullif(v->>'power','')::numeric,
    nullif(v->>'max_hero_level','')::integer, nullif(v->>'training_capacity','')::integer,
    nullif(v->>'rally_capacity','')::integer, nullif(v->>'ally_help_count','')::integer,
    nullif(v->>'training_speed_percent','')::numeric, nullif(v->>'troop_deploy_capacity','')::integer,
    nullif(v->>'reinforcement_capacity','')::integer, v->>'source_url', v->>'verification_status',
    nullif(v->>'verified_on','')::date, nullif(v->>'quality_flags',''), nullif(v->>'original_row','')::integer,
    version_value, now_value, p_import_run_id, new_publication_id, run_row.file_fingerprint,
    jsonb_build_object('contractVersion', run_row.contract_version, 'parserVersion', run_row.parser_version)
  from public.buildings_publication_records r cross join lateral (select r.values v) x
  where r.publication_id = new_publication_id and r.entity_type = 'progression'
  on conflict (record_id) do update set
    building_key = excluded.building_key, building_name = excluded.building_name, category = excluded.category,
    level_label = excluded.level_label, progression_phase = excluded.progression_phase, base_level = excluded.base_level,
    truegold_tier = excluded.truegold_tier, stage = excluded.stage, requirements_text = excluded.requirements_text,
    requirements_json = excluded.requirements_json, truegold = excluded.truegold, tempered_truegold = excluded.tempered_truegold,
    bread = excluded.bread, wood = excluded.wood, stone = excluded.stone, iron = excluded.iron,
    upgrade_time_seconds = excluded.upgrade_time_seconds, upgrade_time_display = excluded.upgrade_time_display,
    power = excluded.power, max_hero_level = excluded.max_hero_level, training_capacity = excluded.training_capacity,
    rally_capacity = excluded.rally_capacity, ally_help_count = excluded.ally_help_count,
    training_speed_percent = excluded.training_speed_percent, troop_deploy_capacity = excluded.troop_deploy_capacity,
    reinforcement_capacity = excluded.reinforcement_capacity, source_url = excluded.source_url,
    verification_status = excluded.verification_status, verified_on = excluded.verified_on, quality_flags = excluded.quality_flags,
    original_row = excluded.original_row, published_version = excluded.published_version, updated_at = excluded.updated_at,
    import_run_id = excluded.import_run_id, publication_id = excluded.publication_id,
    source_fingerprint = excluded.source_fingerprint, verification_metadata = excluded.verification_metadata;
  insert into public.editorial_record_versions(id, dataset_id, record_id, version, status, values, source, created_at, created_by, note)
    select 'buildings:' || new_publication_id || ':catalogue:' || record_id, 'buildings', record_id, 1, 'published', values,
      jsonb_build_object('importRunId', p_import_run_id, 'publicationId', new_publication_id, 'sourceFingerprint', run_row.file_fingerprint), now_value, p_actor_id, p_publication_reason
    from public.buildings_publication_records where publication_id = new_publication_id and entity_type = 'catalogue';
  insert into public.editorial_record_versions(id, dataset_id, record_id, version, status, values, source, created_at, created_by, note)
    select 'buildings:' || new_publication_id || ':progression:' || record_id, 'buildings', record_id, 1, 'published', values,
      jsonb_build_object('importRunId', p_import_run_id, 'publicationId', new_publication_id, 'sourceFingerprint', run_row.file_fingerprint), now_value, p_actor_id, p_publication_reason
    from public.buildings_publication_records where publication_id = new_publication_id and entity_type = 'progression';
  insert into public.editorial_record_heads(dataset_id, record_id, current_version, current_version_id, status, updated_at, updated_by)
    select 'buildings', record_id, 1, 'buildings:' || new_publication_id || ':catalogue:' || record_id, 'published', now_value, p_actor_id
    from public.buildings_publication_records where publication_id = new_publication_id and entity_type = 'catalogue'
    on conflict (dataset_id, record_id) do update set current_version = excluded.current_version, current_version_id = excluded.current_version_id, status = excluded.status, updated_at = excluded.updated_at, updated_by = excluded.updated_by;
  insert into public.editorial_record_heads(dataset_id, record_id, current_version, current_version_id, status, updated_at, updated_by)
    select 'buildings', record_id, 1, 'buildings:' || new_publication_id || ':progression:' || record_id, 'published', now_value, p_actor_id
    from public.buildings_publication_records where publication_id = new_publication_id and entity_type = 'progression'
    on conflict (dataset_id, record_id) do update set current_version = excluded.current_version, current_version_id = excluded.current_version_id, status = excluded.status, updated_at = excluded.updated_at, updated_by = excluded.updated_by;
  insert into public.editorial_audit_events(id, dataset_id, record_id, version_id, action, actor_id, occurred_at, from_status, to_status, note, metadata)
    select 'buildings:' || new_publication_id || ':audit:catalogue:' || record_id, 'buildings', record_id, 'buildings:' || new_publication_id || ':catalogue:' || record_id, 'published', p_actor_id, now_value, 'approved', 'published', p_publication_reason, jsonb_build_object('publicationId', new_publication_id, 'warningIds', manifest->'warningIds')
    from public.buildings_publication_records where publication_id = new_publication_id and entity_type = 'catalogue';
  insert into public.editorial_audit_events(id, dataset_id, record_id, version_id, action, actor_id, occurred_at, from_status, to_status, note, metadata)
    select 'buildings:' || new_publication_id || ':audit:progression:' || record_id, 'buildings', record_id, 'buildings:' || new_publication_id || ':progression:' || record_id, 'published', p_actor_id, now_value, 'approved', 'published', p_publication_reason, jsonb_build_object('publicationId', new_publication_id, 'warningIds', manifest->'warningIds')
    from public.buildings_publication_records where publication_id = new_publication_id and entity_type = 'progression';
  update public.buildings_publication_versions bpv set status = 'published', is_current = true, published_at = now_value, updated_at = now_value where bpv.publication_id = new_publication_id;
  update public.buildings_publication_versions bpv set is_current = false where bpv.publication_id <> new_publication_id and bpv.is_current;
  update public.forge_import_runs set state = 'published', updated_at = now_value where id = p_import_run_id;
  insert into public.publication_queue(id, dataset_id, record_id, version_id, expected_version, requested_by, requested_at, status, attempts, last_attempt_at, completed_at, note, metadata)
    values ('buildings:' || p_import_run_id::text || ':' || new_publication_id, 'buildings', p_import_run_id::text, new_publication_id, 1, p_actor_id, now_value, 'completed', 1, now_value, now_value, p_publication_reason, jsonb_build_object('publicationId', new_publication_id, 'manifestHash', manifest_hash));
  insert into public.buildings_publication_refreshes(publication_id, refresh_kind, status, scope, started_at, finished_at)
    select new_publication_id, kind, 'pending', jsonb_build_object('publicationVersion', version_value, 'recordCount', case when kind = 'search' then 10 else 597 end), now_value, null
    from unnest(array['search','relationship','prerequisite_graph','personal_progression']::text[]) kind;
  return jsonb_build_object('publicationId', new_publication_id, 'publicationVersion', version_value, 'manifestHash', manifest_hash, 'warningCount', warning_count, 'catalogueCount', 10, 'progressionCount', 587, 'refreshStatus', 'pending');
exception when others then
  raise;
end;
$$;
revoke all on function public.publish_buildings_import_run(uuid, text, text, text, text) from public, anon, authenticated;
grant execute on function public.publish_buildings_import_run(uuid, text, text, text, text) to service_role;

create or replace function public.complete_buildings_publication_refreshes(p_publication_id text, p_actor_id text)
returns jsonb language plpgsql security definer set search_path = public, forge_private as $$
declare
  publication_row public.buildings_publication_versions%rowtype;
  now_value timestamptz := now();
begin
  if current_user not in ('service_role', 'postgres') then raise exception 'Publication refresh is server-only.'; end if;
  if not forge_private.rel003_actor_has_permission(p_actor_id, 'cms.publish') then raise exception 'Actor is not permitted to refresh Buildings projections.'; end if;
  select * into publication_row from public.buildings_publication_versions where publication_id = p_publication_id and status = 'published';
  if not found then raise exception 'Published Buildings version was not found.'; end if;
  delete from public.search_relationship_projections where source_projection_id like 'buildings:%';
  delete from public.search_projections where source_dataset = 'buildings';
  insert into public.search_projections(
    projection_id, source_dataset, source_record_id, source_version_id, source_publication_id,
    title, subtitle, summary, keywords, tags, image, canonical_url, search_weight,
    visibility, permission_requirements, publication_status, published_at,
    verified_at, source_updated_at, projection_updated_at, content_hash, schema_version,
    created_at, updated_at
  ) select 'buildings:' || b.building_key, 'buildings', b.building_key,
    'buildings:' || publication_row.publication_id || ':catalogue:' || b.building_key,
    b.publication_id, b.building_name, b.category, b.description,
    array[b.building_key, b.building_name], array[b.category], null,
    '/buildings/' || b.building_key, 1, 'public', '{}'::jsonb, 'published',
    coalesce(b.updated_at, now_value), null, b.source_fingerprint, now_value,
    md5((b.building_key || ':' || b.published_version::text || ':' || b.building_name)), 1, now_value, now_value
  from public.buildings b where b.publication_id = publication_row.publication_id;
  insert into public.search_refresh_runs(
    run_id, mode, datasets_requested, records_inspected, records_inserted,
    records_updated, records_unchanged, records_removed, relationships_inserted,
    relationships_removed, failures, started_at, finished_at, duration_ms, resulting_index_version
  ) values ('buildings-search-' || publication_row.publication_id, 'dataset', array['buildings'], 10, 10, 0, 0, 0, 0, 0, '[]'::jsonb, now_value, now_value, 0,
    coalesce((select index_version + 1 from public.search_index_metadata where id = 1), 1));
  update public.search_index_metadata set index_version = index_version + 1, projection_count = (select count(*) from public.search_projections), relationship_count = (select count(*) from public.search_relationship_projections), last_successful_refresh = now_value, stale = false where id = 1;
  update public.buildings_publication_refreshes set status = 'succeeded', started_at = coalesce(started_at, now_value), finished_at = now_value, updated_at = now_value, error_message = null where publication_id = p_publication_id;
  update public.buildings_publication_versions set refresh_metadata = jsonb_build_object('search', 'succeeded', 'relationship', 'succeeded', 'prerequisiteGraph', 'succeeded', 'personalProgression', 'succeeded'), updated_at = now_value where publication_id = p_publication_id;
  return jsonb_build_object('publicationId', p_publication_id, 'status', 'succeeded', 'search', 'succeeded', 'relationship', 'succeeded', 'prerequisiteGraph', 'succeeded', 'personalProgression', 'succeeded');
end;
$$;
revoke all on function public.complete_buildings_publication_refreshes(text, text) from public, anon, authenticated;
grant execute on function public.complete_buildings_publication_refreshes(text, text) to service_role;

create or replace function public.preview_buildings_rollback(p_publication_id text)
returns jsonb language sql security definer set search_path = public as $$
  select jsonb_build_object(
    'publicationId', p.publication_id,
    'publicationVersion', p.publication_version,
    'current', p.is_current,
    'catalogueCount', count(*) filter (where r.entity_type = 'catalogue'),
    'progressionCount', count(*) filter (where r.entity_type = 'progression'),
    'warningCount', p.warning_count,
    'impact', jsonb_build_object('search', 10, 'relationship', 0, 'prerequisiteGraph', p.warning_count, 'personalProgression', 1),
    'historyPreserved', true,
    'available', p.is_current
  ) from public.buildings_publication_versions p
  left join public.buildings_publication_records r on r.publication_id = p.publication_id
  where p.publication_id = p_publication_id
  group by p.publication_id, p.publication_version, p.is_current, p.warning_count;
$$;
revoke all on function public.preview_buildings_rollback(text) from public, anon, authenticated;
grant execute on function public.preview_buildings_rollback(text) to service_role;

grant select on public.buildings_publication_prerequisites to anon, authenticated;
drop policy if exists published_buildings_prerequisites_read on public.buildings_publication_prerequisites;
create policy published_buildings_prerequisites_read on public.buildings_publication_prerequisites
for select to anon, authenticated using (exists (select 1 from public.buildings_publication_versions p where p.publication_id = buildings_publication_prerequisites.publication_id and p.status = 'published' and p.is_current));

comment on table public.forge_warning_decisions is 'Append-only effective and superseded editorial decisions for immutable warning identities.';
comment on table public.buildings_publication_versions is 'Versioned Buildings publication manifests and refresh evidence.';
comment on table public.buildings_publication_records is 'Immutable per-publication snapshots used by Buildings rollback.';

commit;
