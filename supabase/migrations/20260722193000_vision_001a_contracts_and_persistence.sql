begin;

-- VISION-001A: provider-neutral Forge Vision Platform foundation.
-- No Kingshot screen, coordinate or domain-field mapping is seeded here.

create type public.vision_mapping_status as enum ('draft', 'testing', 'published', 'deprecated');
create type public.vision_scan_status as enum ('uploaded', 'queued', 'processing', 'review_required', 'confirmed', 'failed', 'expired', 'deleted');
create type public.vision_value_status as enum ('proposed', 'low_confidence', 'invalid', 'conflict', 'confirmed', 'corrected', 'rejected', 'unavailable');
create type public.vision_extractor_family as enum ('ocr', 'computer_vision', 'ai_vision');
create type public.vision_execution_mode as enum ('local_worker', 'server_worker', 'external_api', 'browser_worker');
create type public.vision_plugin_status as enum ('draft', 'testing', 'active', 'disabled', 'retired');
create type public.vision_detection_method as enum ('ocr', 'computer_vision', 'ai_vision', 'hybrid');

create table public.vision_field_registry (
  field_key text primary key check (field_key ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$'),
  label text not null,
  description text not null default '',
  domain_key text not null,
  owning_service text not null,
  value_type text not null check (value_type in ('text','integer','bigint','boolean','percentage','evidence_image','json')),
  validation_schema jsonb not null default '{}'::jsonb check (jsonb_typeof(validation_schema) = 'object'),
  screenshot_import_allowed boolean not null default false,
  user_confirmation_required boolean not null default true,
  conflict_policy text not null default 'review' check (conflict_policy in ('review','block','newest_confirmed','existing_wins')),
  freshness_seconds integer check (freshness_seconds is null or freshness_seconds > 0),
  visibility text not null default 'private' check (visibility in ('private','profile','public')),
  sensitivity text not null default 'standard' check (sensitivity in ('standard','sensitive','restricted')),
  proposal_operation text not null check (proposal_operation ~ '^[a-z][a-z0-9_.-]+$'),
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vision_extractor_plugins (
  plugin_key text primary key check (plugin_key ~ '^[a-z][a-z0-9_.-]+$'),
  display_name text not null,
  family public.vision_extractor_family not null,
  execution_mode public.vision_execution_mode not null,
  engine_name text not null,
  engine_version text not null,
  plugin_version text not null,
  status public.vision_plugin_status not null default 'draft',
  supported_mime_types jsonb not null default '[]'::jsonb check (jsonb_typeof(supported_mime_types) = 'array'),
  capabilities jsonb not null default '[]'::jsonb check (jsonb_typeof(capabilities) = 'array'),
  configuration_schema jsonb not null default '{}'::jsonb check (jsonb_typeof(configuration_schema) = 'object'),
  cost_profile text not null default 'unknown' check (cost_profile in ('local_zero_cost','metered','unknown')),
  source_reference text,
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vision_screen_types (
  id uuid primary key default gen_random_uuid(),
  screen_key text not null unique check (screen_key ~ '^[a-z][a-z0-9-]+$'),
  label text not null,
  description text not null default '',
  game_key text not null default 'kingshot',
  detection_rules jsonb not null default '{}'::jsonb check (jsonb_typeof(detection_rules) = 'object'),
  is_enabled boolean not null default true,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vision_mapping_versions (
  id uuid primary key default gen_random_uuid(),
  screen_type_id uuid not null references public.vision_screen_types(id) on delete restrict,
  version integer not null check (version > 0),
  game_version text,
  status public.vision_mapping_status not null default 'draft',
  layout_family text not null,
  source_aspect_ratio numeric(10,6) check (source_aspect_ratio is null or source_aspect_ratio > 0),
  recognition_rules jsonb not null default '{}'::jsonb check (jsonb_typeof(recognition_rules) = 'object'),
  retention_policy jsonb not null default '{"original_days":7,"retain_audit_metadata":true}'::jsonb,
  predecessor_version_id uuid references public.vision_mapping_versions(id) on delete restrict,
  change_note text not null default '',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  submitted_for_testing_at timestamptz,
  published_by uuid references auth.users(id),
  published_at timestamptz,
  deprecated_by uuid references auth.users(id),
  deprecated_at timestamptz,
  unique (screen_type_id, version),
  check ((status = 'testing' and submitted_for_testing_at is not null) or status <> 'testing'),
  check ((status = 'published' and published_at is not null and published_by is not null) or status <> 'published'),
  check ((status = 'deprecated' and deprecated_at is not null and deprecated_by is not null) or status <> 'deprecated')
);

create unique index vision_one_published_mapping_per_layout
  on public.vision_mapping_versions(screen_type_id, layout_family, coalesce(game_version, ''))
  where status = 'published';

create table public.vision_evidence_images (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users(id) on delete restrict,
  purpose text not null check (purpose in ('mapping_reference','test_case','scan_source','evidence_crop')),
  storage_bucket text not null default 'vision-evidence',
  storage_path text not null,
  sha256 text not null check (sha256 ~ '^[a-f0-9]{64}$'),
  width_px integer not null check (width_px > 0),
  height_px integer not null check (height_px > 0),
  mime_type text not null check (mime_type in ('image/png','image/jpeg','image/webp','image/tiff')),
  upload_purpose text not null,
  consent_recorded_at timestamptz,
  uploaded_by uuid references auth.users(id),
  uploaded_at timestamptz not null default now(),
  retention_until timestamptz,
  deletion_requested_at timestamptz,
  deleted_at timestamptz,
  unique (storage_bucket, storage_path)
);

create table public.vision_mapping_reference_images (
  mapping_version_id uuid not null references public.vision_mapping_versions(id) on delete restrict,
  evidence_image_id uuid not null references public.vision_evidence_images(id) on delete restrict,
  reference_role text not null default 'primary' check (reference_role in ('primary','variant','negative','anchor_reference')),
  sort_order integer not null default 0,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  primary key (mapping_version_id, evidence_image_id)
);

create table public.vision_regions (
  id uuid primary key default gen_random_uuid(),
  mapping_version_id uuid not null references public.vision_mapping_versions(id) on delete restrict,
  region_key text not null,
  label text not null,
  region_role text not null default 'source' check (region_role in ('source','anchor','comparison','evidence')),
  x numeric(9,8) not null check (x >= 0 and x <= 1),
  y numeric(9,8) not null check (y >= 0 and y <= 1),
  width numeric(9,8) not null check (width > 0 and x + width <= 1.00000001),
  height numeric(9,8) not null check (height > 0 and y + height <= 1.00000001),
  anchor_rules jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (mapping_version_id, region_key)
);

create table public.vision_field_mappings (
  id uuid primary key default gen_random_uuid(),
  mapping_version_id uuid not null references public.vision_mapping_versions(id) on delete restrict,
  mapping_key text not null,
  field_key text not null references public.vision_field_registry(field_key) on delete restrict,
  detection_method public.vision_detection_method not null,
  transform_rules jsonb not null default '[]'::jsonb check (jsonb_typeof(transform_rules) = 'array'),
  validation_overrides jsonb not null default '{}'::jsonb check (jsonb_typeof(validation_overrides) = 'object'),
  minimum_confidence numeric(5,4) not null default 0.8000 check (minimum_confidence between 0 and 1),
  required boolean not null default false,
  sort_order integer not null default 0,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (mapping_version_id, mapping_key),
  unique (mapping_version_id, field_key)
);

create table public.vision_mapping_extractors (
  id uuid primary key default gen_random_uuid(),
  field_mapping_id uuid not null references public.vision_field_mappings(id) on delete restrict,
  plugin_key text not null references public.vision_extractor_plugins(plugin_key) on delete restrict,
  extractor_role text not null check (extractor_role in ('primary','fallback','comparison')),
  priority integer not null default 0,
  plugin_version_constraint text,
  configuration jsonb not null default '{}'::jsonb,
  minimum_engine_confidence numeric(5,4) check (minimum_engine_confidence is null or minimum_engine_confidence between 0 and 1),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (field_mapping_id, plugin_key, extractor_role)
);

create unique index vision_one_primary_extractor_per_mapping
  on public.vision_mapping_extractors(field_mapping_id)
  where extractor_role = 'primary';

create table public.vision_mapping_regions (
  field_mapping_id uuid not null references public.vision_field_mappings(id) on delete restrict,
  region_id uuid not null references public.vision_regions(id) on delete restrict,
  binding_role text not null default 'source' check (binding_role in ('source','anchor','comparison','evidence')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (field_mapping_id, region_id, binding_role)
);

create table public.vision_test_cases (
  id uuid primary key default gen_random_uuid(),
  mapping_version_id uuid not null references public.vision_mapping_versions(id) on delete restrict,
  evidence_image_id uuid not null references public.vision_evidence_images(id) on delete restrict,
  label text not null,
  expected_values jsonb not null default '{}'::jsonb,
  notes text not null default '',
  is_enabled boolean not null default true,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (mapping_version_id, evidence_image_id)
);

create table public.vision_test_results (
  id uuid primary key default gen_random_uuid(),
  test_case_id uuid not null references public.vision_test_cases(id) on delete restrict,
  mapping_version_id uuid not null references public.vision_mapping_versions(id) on delete restrict,
  run_key uuid not null default gen_random_uuid(),
  status text not null check (status in ('queued','running','passed','failed','review_required','unavailable')),
  extractor_summary jsonb not null default '[]'::jsonb,
  confidence_summary jsonb not null default '{}'::jsonb,
  validation_summary jsonb not null default '{}'::jsonb,
  diagnostics jsonb not null default '{}'::jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.vision_scan_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  mapping_version_id uuid not null references public.vision_mapping_versions(id) on delete restrict,
  source_image_id uuid not null references public.vision_evidence_images(id) on delete restrict,
  status public.vision_scan_status not null default 'uploaded',
  source_kind text not null check (source_kind in ('admin_test','user_upload','system_import','api_submission')),
  purpose text not null,
  purpose_consent_at timestamptz not null,
  overall_confidence numeric(5,4) check (overall_confidence is null or overall_confidence between 0 and 1),
  confidence_model_version text,
  failure_code text,
  failure_detail text,
  retention_until timestamptz not null default (now() + interval '7 days'),
  confirmed_at timestamptz,
  expired_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vision_scan_values (
  id uuid primary key default gen_random_uuid(),
  scan_run_id uuid not null references public.vision_scan_runs(id) on delete restrict,
  field_mapping_id uuid not null references public.vision_field_mappings(id) on delete restrict,
  field_key text not null references public.vision_field_registry(field_key) on delete restrict,
  status public.vision_value_status not null default 'proposed',
  raw_value jsonb,
  transformed_value jsonb,
  confirmed_value jsonb,
  confidence numeric(5,4) check (confidence is null or confidence between 0 and 1),
  confidence_status text check (confidence_status is null or confidence_status in ('accepted','review_required','blocked','unavailable')),
  confidence_rationale jsonb not null default '[]'::jsonb,
  validation_status text not null default 'unavailable' check (validation_status in ('valid','warning','invalid','unavailable')),
  validation_result jsonb not null default '{}'::jsonb,
  conflict_status text not null default 'none' check (conflict_status in ('none','review_required','blocked','resolved')),
  conflict_result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  confirmed_by uuid references auth.users(id),
  confirmed_at timestamptz,
  unique (scan_run_id, field_mapping_id)
);

create table public.vision_extraction_evidence (
  id uuid primary key default gen_random_uuid(),
  scan_value_id uuid not null references public.vision_scan_values(id) on delete restrict,
  scan_run_id uuid not null references public.vision_scan_runs(id) on delete restrict,
  mapping_version_id uuid not null references public.vision_mapping_versions(id) on delete restrict,
  field_mapping_id uuid not null references public.vision_field_mappings(id) on delete restrict,
  field_key text not null references public.vision_field_registry(field_key) on delete restrict,
  source_image_id uuid not null references public.vision_evidence_images(id) on delete restrict,
  extractor_plugin_key text not null references public.vision_extractor_plugins(plugin_key) on delete restrict,
  extractor_plugin_version text not null,
  engine_name text not null,
  engine_version text not null,
  extractor_configuration jsonb not null default '{}'::jsonb,
  source_region jsonb,
  bounding_boxes jsonb not null default '[]'::jsonb,
  raw_text text,
  raw_payload jsonb not null default '{}'::jsonb,
  extracted_value jsonb,
  confidence numeric(5,4) check (confidence is null or confidence between 0 and 1),
  confidence_detail jsonb not null default '{}'::jsonb,
  validation_status text not null check (validation_status in ('valid','warning','invalid','unavailable')),
  validation_detail jsonb not null default '{}'::jsonb,
  conflict_detail jsonb not null default '{}'::jsonb,
  extracted_at timestamptz not null default now()
);

create table public.vision_user_corrections (
  id uuid primary key default gen_random_uuid(),
  scan_value_id uuid not null references public.vision_scan_values(id) on delete restrict,
  previous_value jsonb,
  corrected_value jsonb not null,
  correction_reason text not null default '',
  corrected_by uuid not null references auth.users(id),
  corrected_at timestamptz not null default now()
);

create table public.vision_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id),
  event_type text not null check (event_type ~ '^vision\.[a-z0-9_.-]+$'),
  entity_type text not null,
  entity_id uuid not null,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index vision_versions_screen_status_idx on public.vision_mapping_versions(screen_type_id, status);
create index vision_scans_user_created_idx on public.vision_scan_runs(user_id, created_at desc);
create index vision_evidence_scan_value_idx on public.vision_extraction_evidence(scan_value_id, extracted_at);
create index vision_audit_entity_idx on public.vision_audit_events(entity_type, entity_id, occurred_at desc);

insert into public.vision_extractor_plugins
  (plugin_key, display_name, family, execution_mode, engine_name, engine_version, plugin_version, status, supported_mime_types, capabilities, configuration_schema, cost_profile, source_reference)
values (
  'ocr.tesseract.cli', 'Tesseract OCR (local CLI)', 'ocr', 'local_worker', 'Tesseract',
  'runtime-discovered', '1.0.0', 'testing',
  '["image/png","image/jpeg","image/tiff"]'::jsonb,
  '["text","word_confidence","word_boxes","tsv_diagnostics","language_selection"]'::jsonb,
  '{"language":{"type":"string","default":"eng"},"pageSegmentationMode":{"type":"integer","minimum":0,"maximum":13,"default":6},"ocrEngineMode":{"type":"integer","minimum":0,"maximum":3,"default":1}}'::jsonb,
  'local_zero_cost', 'tesseract-ocr/tesseract@b34d7a8d7f25cada5f753d9ca68d0c2ed3056850'
);

create or replace function public.guard_published_vision_version_mutation()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  if old.status in ('published','deprecated') then
    if tg_op = 'UPDATE' and old.status = 'published' and new.status = 'deprecated'
       and (to_jsonb(new) - array['status','deprecated_by','deprecated_at','updated_at'])
           = (to_jsonb(old) - array['status','deprecated_by','deprecated_at','updated_at']) then
      return new;
    end if;
    raise exception 'Published and deprecated Forge Vision mapping versions are immutable; create a draft successor.';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger guard_published_vision_version
before update or delete on public.vision_mapping_versions
for each row execute function public.guard_published_vision_version_mutation();

create or replace function public.guard_published_vision_direct_child_mutation()
returns trigger language plpgsql security invoker set search_path = public as $$
declare parent_status public.vision_mapping_status;
begin
  select status into parent_status from public.vision_mapping_versions
  where id = coalesce(new.mapping_version_id, old.mapping_version_id);
  if parent_status in ('published','deprecated') then
    raise exception 'Published or deprecated Forge Vision mapping content is immutable.';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger guard_published_vision_region before insert or update or delete on public.vision_regions
for each row execute function public.guard_published_vision_direct_child_mutation();
create trigger guard_published_vision_mapping before insert or update or delete on public.vision_field_mappings
for each row execute function public.guard_published_vision_direct_child_mutation();
create trigger guard_published_vision_reference before insert or update or delete on public.vision_mapping_reference_images
for each row execute function public.guard_published_vision_direct_child_mutation();
create trigger guard_published_vision_test_case before insert or update or delete on public.vision_test_cases
for each row execute function public.guard_published_vision_direct_child_mutation();

create or replace function public.guard_published_vision_mapping_child_mutation()
returns trigger language plpgsql security invoker set search_path = public as $$
declare parent_status public.vision_mapping_status;
begin
  select v.status into parent_status
  from public.vision_field_mappings m
  join public.vision_mapping_versions v on v.id = m.mapping_version_id
  where m.id = coalesce(new.field_mapping_id, old.field_mapping_id);
  if parent_status in ('published','deprecated') then
    raise exception 'Published or deprecated Forge Vision extractor and region bindings are immutable.';
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create trigger guard_published_vision_mapping_extractor before insert or update or delete on public.vision_mapping_extractors
for each row execute function public.guard_published_vision_mapping_child_mutation();
create trigger guard_published_vision_mapping_region before insert or update or delete on public.vision_mapping_regions
for each row execute function public.guard_published_vision_mapping_child_mutation();

create or replace function public.guard_append_only_vision_evidence()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  raise exception 'Forge Vision evidence, results, corrections and audit events are append-only.';
end;
$$;

create trigger vision_test_results_append_only before update or delete on public.vision_test_results
for each row execute function public.guard_append_only_vision_evidence();
create trigger vision_extraction_evidence_append_only before update or delete on public.vision_extraction_evidence
for each row execute function public.guard_append_only_vision_evidence();
create trigger vision_user_corrections_append_only before update or delete on public.vision_user_corrections
for each row execute function public.guard_append_only_vision_evidence();
create trigger vision_audit_events_append_only before update or delete on public.vision_audit_events
for each row execute function public.guard_append_only_vision_evidence();

create or replace function public.publish_vision_mapping_version(p_mapping_version_id uuid)
returns public.vision_mapping_versions
language plpgsql security definer set search_path = public as $$
declare target public.vision_mapping_versions;
declare actor uuid := auth.uid();
begin
  if actor is null or not public.has_forge_permission('vision.admin.publish') then
    raise exception 'Forge Vision mapping publication is not permitted.';
  end if;
  select * into target from public.vision_mapping_versions where id = p_mapping_version_id for update;
  if target.id is null then raise exception 'Forge Vision mapping version not found.'; end if;
  if target.status <> 'testing' then raise exception 'Only testing Forge Vision mapping versions can be published.'; end if;
  if not exists (select 1 from public.vision_field_mappings where mapping_version_id = target.id) then
    raise exception 'Forge Vision mapping version has no governed field mappings.';
  end if;
  if exists (
    select 1 from public.vision_field_mappings m
    where m.mapping_version_id = target.id
      and not exists (select 1 from public.vision_mapping_extractors e where e.field_mapping_id = m.id and e.extractor_role = 'primary')
  ) then raise exception 'Every Forge Vision field mapping requires one primary extractor.'; end if;
  if not exists (select 1 from public.vision_test_cases where mapping_version_id = target.id and is_enabled) then
    raise exception 'Forge Vision publication requires at least one enabled test case.';
  end if;
  if exists (
    select 1 from public.vision_test_cases tc
    where tc.mapping_version_id = target.id and tc.is_enabled
      and not exists (select 1 from public.vision_test_results tr where tr.test_case_id = tc.id and tr.mapping_version_id = target.id and tr.status = 'passed')
  ) then raise exception 'Every enabled Forge Vision test case requires a passing result.'; end if;

  update public.vision_mapping_versions
  set status = 'published', published_by = actor, published_at = now(), updated_at = now()
  where id = target.id returning * into target;
  insert into public.vision_audit_events(actor_id,event_type,entity_type,entity_id,payload)
  values (actor,'vision.mapping.published','vision_mapping_version',target.id,jsonb_build_object('version',target.version,'screen_type_id',target.screen_type_id));
  return target;
end;
$$;

insert into public.forge_permissions (permission_key, label, description)
select * from (values
  ('vision.admin.read','View Vision Studio','View Forge Vision mappings, plugins, tests and diagnostics.'),
  ('vision.admin.edit','Edit Vision Studio','Create and edit draft mappings through server-authoritative operations.'),
  ('vision.admin.test','Test Forge Vision','Run draft mappings against authorised test evidence.'),
  ('vision.admin.publish','Publish Forge Vision','Publish and deprecate immutable mapping versions.'),
  ('vision.scan.create','Create Forge Vision scans','Submit screenshots to supported Forge Vision workflows.'),
  ('vision.scan.review-own','Review own Forge Vision scans','Review and correct values from the actor''s own scans.'),
  ('vision.evidence.review','Review Forge Vision evidence','Access restricted screenshot evidence for authorised review.')
) capability(permission_key,label,description)
where not exists (select 1 from public.forge_permissions p where p.permission_key = capability.permission_key);

insert into public.forge_role_permissions (role, permission_key)
select mapping.role::public.forge_platform_role, mapping.permission_key
from (values
  ('owner','vision.admin.read'),('owner','vision.admin.edit'),('owner','vision.admin.test'),('owner','vision.admin.publish'),('owner','vision.scan.create'),('owner','vision.scan.review-own'),('owner','vision.evidence.review'),
  ('admin','vision.admin.read'),('admin','vision.admin.edit'),('admin','vision.admin.test'),('admin','vision.admin.publish'),('admin','vision.scan.create'),('admin','vision.scan.review-own'),('admin','vision.evidence.review'),
  ('moderator','vision.admin.read'),('moderator','vision.admin.test'),('moderator','vision.scan.create'),('moderator','vision.scan.review-own'),('moderator','vision.evidence.review'),
  ('content_creator','vision.scan.create'),('content_creator','vision.scan.review-own'),
  ('beta_tester','vision.scan.create'),('beta_tester','vision.scan.review-own'),
  ('contributor','vision.scan.create'),('contributor','vision.scan.review-own'),
  ('viewer','vision.scan.create'),('viewer','vision.scan.review-own')
) mapping(role,permission_key)
where not exists (
  select 1 from public.forge_role_permissions rp
  where rp.role = mapping.role::public.forge_platform_role and rp.permission_key = mapping.permission_key
);

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'vision_field_registry','vision_extractor_plugins','vision_screen_types','vision_mapping_versions',
    'vision_evidence_images','vision_mapping_reference_images','vision_regions','vision_field_mappings',
    'vision_mapping_extractors','vision_mapping_regions','vision_test_cases','vision_test_results',
    'vision_scan_runs','vision_scan_values','vision_extraction_evidence','vision_user_corrections','vision_audit_events'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('alter table public.%I force row level security', table_name);
  end loop;
end;
$$;

create policy vision_registry_read on public.vision_field_registry for select to authenticated
using ((screenshot_import_allowed and is_enabled) or public.has_forge_permission('vision.admin.read'));
create policy vision_plugins_read on public.vision_extractor_plugins for select to authenticated
using ((is_enabled and status in ('testing','active')) or public.has_forge_permission('vision.admin.read'));
create policy vision_screen_types_read on public.vision_screen_types for select to authenticated
using (public.has_forge_permission('vision.admin.read') or (is_enabled and exists (select 1 from public.vision_mapping_versions v where v.screen_type_id = id and v.status = 'published')));
create policy vision_versions_read on public.vision_mapping_versions for select to authenticated
using (status = 'published' or public.has_forge_permission('vision.admin.read'));
create policy vision_regions_read on public.vision_regions for select to authenticated
using (exists (select 1 from public.vision_mapping_versions v where v.id = mapping_version_id and (v.status = 'published' or public.has_forge_permission('vision.admin.read'))));
create policy vision_mappings_read on public.vision_field_mappings for select to authenticated
using (exists (select 1 from public.vision_mapping_versions v where v.id = mapping_version_id and (v.status = 'published' or public.has_forge_permission('vision.admin.read'))));
create policy vision_mapping_extractors_read on public.vision_mapping_extractors for select to authenticated
using (exists (select 1 from public.vision_field_mappings m join public.vision_mapping_versions v on v.id = m.mapping_version_id where m.id = field_mapping_id and (v.status = 'published' or public.has_forge_permission('vision.admin.read'))));
create policy vision_mapping_regions_read on public.vision_mapping_regions for select to authenticated
using (exists (select 1 from public.vision_field_mappings m join public.vision_mapping_versions v on v.id = m.mapping_version_id where m.id = field_mapping_id and (v.status = 'published' or public.has_forge_permission('vision.admin.read'))));
create policy vision_admin_references_read on public.vision_mapping_reference_images for select to authenticated using (public.has_forge_permission('vision.admin.read'));
create policy vision_admin_test_cases_read on public.vision_test_cases for select to authenticated using (public.has_forge_permission('vision.admin.read'));
create policy vision_admin_test_results_read on public.vision_test_results for select to authenticated using (public.has_forge_permission('vision.admin.read'));
create policy vision_images_read on public.vision_evidence_images for select to authenticated
using (owner_user_id = auth.uid() or public.has_forge_permission('vision.evidence.review') or public.has_forge_permission('vision.admin.read'));
create policy vision_scans_read on public.vision_scan_runs for select to authenticated
using (user_id = auth.uid() or public.has_forge_permission('vision.evidence.review'));
create policy vision_values_read on public.vision_scan_values for select to authenticated
using (exists (select 1 from public.vision_scan_runs s where s.id = scan_run_id and (s.user_id = auth.uid() or public.has_forge_permission('vision.evidence.review'))));
create policy vision_extraction_evidence_read on public.vision_extraction_evidence for select to authenticated
using (exists (select 1 from public.vision_scan_runs s where s.id = scan_run_id and (s.user_id = auth.uid() or public.has_forge_permission('vision.evidence.review'))));
create policy vision_corrections_read on public.vision_user_corrections for select to authenticated
using (exists (select 1 from public.vision_scan_values sv join public.vision_scan_runs sr on sr.id = sv.scan_run_id where sv.id = scan_value_id and (sr.user_id = auth.uid() or public.has_forge_permission('vision.evidence.review'))));
create policy vision_audit_read on public.vision_audit_events for select to authenticated
using (actor_id = auth.uid() or public.has_forge_permission('vision.admin.read'));

revoke all on public.vision_field_registry, public.vision_extractor_plugins, public.vision_screen_types,
  public.vision_mapping_versions, public.vision_evidence_images, public.vision_mapping_reference_images,
  public.vision_regions, public.vision_field_mappings, public.vision_mapping_extractors,
  public.vision_mapping_regions, public.vision_test_cases, public.vision_test_results,
  public.vision_scan_runs, public.vision_scan_values, public.vision_extraction_evidence,
  public.vision_user_corrections, public.vision_audit_events from anon, authenticated;

grant select on public.vision_field_registry, public.vision_extractor_plugins, public.vision_screen_types,
  public.vision_mapping_versions, public.vision_evidence_images, public.vision_mapping_reference_images,
  public.vision_regions, public.vision_field_mappings, public.vision_mapping_extractors,
  public.vision_mapping_regions, public.vision_test_cases, public.vision_test_results,
  public.vision_scan_runs, public.vision_scan_values, public.vision_extraction_evidence,
  public.vision_user_corrections, public.vision_audit_events to authenticated;

revoke all on function public.publish_vision_mapping_version(uuid) from public, anon;
grant execute on function public.publish_vision_mapping_version(uuid) to authenticated;

commit;
