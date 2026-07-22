begin;

-- VISION-001A: governed, admin-configurable screenshot mapping.
-- Mappings target registry keys only; they never contain arbitrary table/column writes.

create type public.vision_version_status as enum ('draft', 'testing', 'published', 'deprecated');
create type public.vision_scan_status as enum ('uploaded', 'processing', 'review_required', 'confirmed', 'failed', 'expired', 'deleted');
create type public.vision_value_status as enum ('proposed', 'low_confidence', 'invalid', 'conflict', 'confirmed', 'corrected', 'rejected', 'unavailable');
create type public.vision_extractor_type as enum ('ocr_text', 'ocr_digits', 'compact_number', 'integer', 'percentage', 'presence', 'evidence_crop', 'icon_classification', 'colour_classification', 'count_markers', 'repeating_grid');

create table public.vision_field_registry (
  field_key text primary key check (field_key ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$'),
  label text not null check (char_length(label) between 1 and 120),
  description text not null default '',
  domain_key text not null check (domain_key ~ '^[a-z][a-z0-9_-]*$'),
  owning_service text not null check (char_length(owning_service) between 1 and 120),
  value_type text not null check (value_type in ('text', 'integer', 'bigint', 'boolean', 'percentage', 'evidence_image')),
  validation_schema jsonb not null default '{}'::jsonb,
  screenshot_import_allowed boolean not null default false,
  user_confirmation_required boolean not null default true,
  conflict_policy text not null default 'review' check (conflict_policy in ('review', 'block', 'newest_confirmed', 'existing_wins')),
  freshness_seconds integer check (freshness_seconds is null or freshness_seconds > 0),
  visibility text not null default 'private' check (visibility in ('private', 'profile', 'public')),
  sensitivity text not null default 'standard' check (sensitivity in ('standard', 'sensitive', 'restricted')),
  write_operation text not null check (write_operation ~ '^[a-z][a-z0-9_.-]+$'),
  is_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vision_screen_types (
  id uuid primary key default gen_random_uuid(),
  screen_key text not null unique check (screen_key ~ '^[a-z][a-z0-9-]+$'),
  label text not null check (char_length(label) between 1 and 120),
  description text not null default '',
  game_key text not null default 'kingshot',
  is_enabled boolean not null default true,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vision_screen_versions (
  id uuid primary key default gen_random_uuid(),
  screen_type_id uuid not null references public.vision_screen_types(id) on delete restrict,
  version integer not null check (version > 0),
  status public.vision_version_status not null default 'draft',
  layout_family text not null check (char_length(layout_family) between 1 and 120),
  source_aspect_ratio numeric(10,6) check (source_aspect_ratio is null or source_aspect_ratio > 0),
  recognition_rules jsonb not null default '{}'::jsonb,
  retention_policy jsonb not null default '{"original_days": 7, "retain_audit_metadata": true}'::jsonb,
  predecessor_version_id uuid references public.vision_screen_versions(id) on delete restrict,
  change_note text not null default '',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  submitted_for_testing_at timestamptz,
  published_by uuid references auth.users(id),
  published_at timestamptz,
  deprecated_by uuid references auth.users(id),
  deprecated_at timestamptz,
  unique (screen_type_id, version),
  check ((status = 'published' and published_at is not null and published_by is not null) or status <> 'published'),
  check ((status = 'deprecated' and deprecated_at is not null and deprecated_by is not null) or status <> 'deprecated')
);

create unique index vision_one_published_version_per_layout
  on public.vision_screen_versions(screen_type_id, layout_family)
  where status = 'published';

create table public.vision_reference_images (
  id uuid primary key default gen_random_uuid(),
  screen_version_id uuid not null references public.vision_screen_versions(id) on delete restrict,
  storage_bucket text not null default 'vision-evidence',
  storage_path text not null,
  sha256 text not null check (sha256 ~ '^[a-f0-9]{64}$'),
  width_px integer not null check (width_px > 0),
  height_px integer not null check (height_px > 0),
  mime_type text not null check (mime_type in ('image/png', 'image/jpeg', 'image/webp')),
  purpose text not null default 'mapping_reference' check (purpose in ('mapping_reference', 'test_case')),
  uploaded_by uuid not null references auth.users(id),
  uploaded_at timestamptz not null default now(),
  retention_until timestamptz,
  deleted_at timestamptz,
  unique (storage_bucket, storage_path)
);

create table public.vision_regions (
  id uuid primary key default gen_random_uuid(),
  screen_version_id uuid not null references public.vision_screen_versions(id) on delete restrict,
  region_key text not null check (region_key ~ '^[a-z][a-z0-9_-]*$'),
  label text not null check (char_length(label) between 1 and 120),
  x numeric(9,8) not null check (x >= 0 and x <= 1),
  y numeric(9,8) not null check (y >= 0 and y <= 1),
  width numeric(9,8) not null check (width > 0 and width <= 1 and x + width <= 1.00000001),
  height numeric(9,8) not null check (height > 0 and height <= 1 and y + height <= 1.00000001),
  anchor_rules jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (screen_version_id, region_key)
);

create table public.vision_field_mappings (
  id uuid primary key default gen_random_uuid(),
  region_id uuid not null unique references public.vision_regions(id) on delete restrict,
  field_key text not null references public.vision_field_registry(field_key) on delete restrict,
  extractor public.vision_extractor_type not null,
  extractor_config jsonb not null default '{}'::jsonb,
  transform_rules jsonb not null default '[]'::jsonb check (jsonb_typeof(transform_rules) = 'array'),
  validation_overrides jsonb not null default '{}'::jsonb,
  minimum_confidence numeric(5,4) not null default 0.8000 check (minimum_confidence >= 0 and minimum_confidence <= 1),
  required boolean not null default false,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vision_scan_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  screen_version_id uuid not null references public.vision_screen_versions(id) on delete restrict,
  status public.vision_scan_status not null default 'uploaded',
  source_kind text not null default 'api_fallback' check (source_kind in ('api_fallback', 'manual_import', 'admin_test')),
  source_api_attempt_id uuid,
  storage_bucket text not null default 'vision-evidence',
  storage_path text,
  source_sha256 text check (source_sha256 is null or source_sha256 ~ '^[a-f0-9]{64}$'),
  source_width_px integer check (source_width_px is null or source_width_px > 0),
  source_height_px integer check (source_height_px is null or source_height_px > 0),
  extractor_name text,
  extractor_version text,
  overall_confidence numeric(5,4) check (overall_confidence is null or (overall_confidence >= 0 and overall_confidence <= 1)),
  failure_code text,
  failure_detail text,
  purpose_consent_at timestamptz not null default now(),
  retention_until timestamptz not null default (now() + interval '7 days'),
  confirmed_at timestamptz,
  expired_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (storage_path is not null or status in ('failed', 'expired', 'deleted'))
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
  confidence numeric(5,4) check (confidence is null or (confidence >= 0 and confidence <= 1)),
  confidence_rationale jsonb not null default '[]'::jsonb,
  validation_result jsonb not null default '{}'::jsonb,
  conflict_result jsonb not null default '{}'::jsonb,
  crop_storage_path text,
  created_at timestamptz not null default now(),
  confirmed_by uuid references auth.users(id),
  confirmed_at timestamptz,
  unique (scan_run_id, field_mapping_id),
  check ((status in ('confirmed', 'corrected') and confirmed_at is not null and confirmed_by is not null) or status not in ('confirmed', 'corrected'))
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

create index vision_versions_screen_status_idx on public.vision_screen_versions(screen_type_id, status);
create index vision_regions_version_sort_idx on public.vision_regions(screen_version_id, sort_order);
create index vision_scans_user_created_idx on public.vision_scan_runs(user_id, created_at desc);
create index vision_scan_values_run_idx on public.vision_scan_values(scan_run_id);
create index vision_audit_entity_idx on public.vision_audit_events(entity_type, entity_id, occurred_at desc);

-- Published mapping structures are immutable. Deprecation is the only allowed update.
create or replace function public.guard_published_vision_version_mutation()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  if old.status = 'published' then
    if new.status <> 'deprecated' then
      raise exception 'Published Vision Mapper versions are immutable; create a successor version.';
    end if;
    if row(new.id, new.screen_type_id, new.version, new.layout_family, new.source_aspect_ratio, new.recognition_rules, new.retention_policy, new.predecessor_version_id, new.created_by, new.created_at, new.published_by, new.published_at)
       is distinct from
       row(old.id, old.screen_type_id, old.version, old.layout_family, old.source_aspect_ratio, old.recognition_rules, old.retention_policy, old.predecessor_version_id, old.created_by, old.created_at, old.published_by, old.published_at) then
      raise exception 'Published Vision Mapper version content cannot be changed.';
    end if;
  end if;
  return new;
end;
$$;

create trigger guard_published_vision_version
before update on public.vision_screen_versions
for each row execute function public.guard_published_vision_version_mutation();

create or replace function public.guard_published_vision_child_mutation()
returns trigger language plpgsql security invoker set search_path = public as $$
declare parent_status public.vision_version_status;
begin
  select status into parent_status
  from public.vision_screen_versions
  where id = coalesce(new.screen_version_id, old.screen_version_id);
  if parent_status in ('published', 'deprecated') then
    raise exception 'Published or deprecated Vision Mapper structures are immutable.';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger guard_published_vision_region
before insert or update or delete on public.vision_regions
for each row execute function public.guard_published_vision_child_mutation();

create or replace function public.guard_published_vision_mapping_mutation()
returns trigger language plpgsql security invoker set search_path = public as $$
declare parent_status public.vision_version_status;
begin
  select v.status into parent_status
  from public.vision_regions r
  join public.vision_screen_versions v on v.id = r.screen_version_id
  where r.id = coalesce(new.region_id, old.region_id);
  if parent_status in ('published', 'deprecated') then
    raise exception 'Published or deprecated Vision Mapper mappings are immutable.';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger guard_published_vision_mapping
before insert or update or delete on public.vision_field_mappings
for each row execute function public.guard_published_vision_mapping_mutation();

insert into public.forge_permissions (permission_key, label, description)
select permission_key, label, description
from (values
  ('vision.admin.read', 'View Vision Mapper', 'View screen definitions, versions, mappings and test diagnostics.'),
  ('vision.admin.edit', 'Edit Vision Mapper', 'Create and edit draft screen mappings.'),
  ('vision.admin.test', 'Test Vision Mapper', 'Run mappings against authorised test evidence.'),
  ('vision.admin.publish', 'Publish Vision Mapper', 'Publish and deprecate immutable mapping versions.'),
  ('vision.scan.create', 'Create Vision scans', 'Upload screenshots for supported Forge extraction flows.'),
  ('vision.scan.review-own', 'Review own Vision scans', 'Review and correct values from the actor''s own scans.'),
  ('vision.evidence.review', 'Review Vision evidence', 'Access restricted screenshot evidence for authorised support and moderation.')
) capability(permission_key, label, description)
where not exists (select 1 from public.forge_permissions existing where existing.permission_key = capability.permission_key);

insert into public.forge_role_permissions (role, permission_key)
select mapping.role::public.forge_platform_role, mapping.permission_key
from (values
  ('owner','vision.admin.read'),('owner','vision.admin.edit'),('owner','vision.admin.test'),('owner','vision.admin.publish'),('owner','vision.scan.create'),('owner','vision.scan.review-own'),('owner','vision.evidence.review'),
  ('admin','vision.admin.read'),('admin','vision.admin.edit'),('admin','vision.admin.test'),('admin','vision.admin.publish'),('admin','vision.scan.create'),('admin','vision.scan.review-own'),('admin','vision.evidence.review'),
  ('moderator','vision.admin.read'),('moderator','vision.admin.test'),('moderator','vision.scan.create'),('moderator','vision.scan.review-own'),('moderator','vision.evidence.review'),
  ('player','vision.scan.create'),('player','vision.scan.review-own'),
  ('verified_player','vision.scan.create'),('verified_player','vision.scan.review-own')
) mapping(role, permission_key)
where not exists (
  select 1 from public.forge_role_permissions existing
  where existing.role = mapping.role::public.forge_platform_role
    and existing.permission_key = mapping.permission_key
);

insert into public.vision_field_registry
(field_key, label, description, domain_key, owning_service, value_type, validation_schema, screenshot_import_allowed, user_confirmation_required, conflict_policy, freshness_seconds, visibility, sensitivity, write_operation)
values
('player.game_name', 'Game name', 'Current Kingshot governor name.', 'player', 'player-profile', 'text', '{"minLength":1,"maxLength":80,"unicode":true}'::jsonb, true, true, 'review', 86400, 'profile', 'standard', 'player-profile.propose-game-name'),
('player.game_id', 'Player ID', 'Stable numeric Kingshot player identifier.', 'player', 'player-identity', 'text', '{"pattern":"^[0-9]{4,20}$"}'::jsonb, true, true, 'block', null, 'profile', 'sensitive', 'player-identity.propose-game-id'),
('player.power', 'Power', 'Current player power as an integer.', 'player', 'player-profile', 'bigint', '{"minimum":0}'::jsonb, true, true, 'newest_confirmed', 86400, 'profile', 'standard', 'player-profile.propose-power'),
('player.kills', 'Kills', 'Current lifetime kill count as an integer.', 'player', 'player-profile', 'bigint', '{"minimum":0}'::jsonb, true, true, 'newest_confirmed', 86400, 'profile', 'standard', 'player-profile.propose-kills'),
('player.alliance_name', 'Alliance', 'Current in-game alliance tag or displayed name.', 'player', 'player-profile', 'text', '{"maxLength":80,"nullable":true}'::jsonb, true, true, 'review', 86400, 'profile', 'standard', 'player-profile.propose-alliance'),
('player.kingdom_id', 'Kingdom', 'Current Kingshot kingdom number.', 'player', 'player-profile', 'integer', '{"minimum":1,"maximum":99999}'::jsonb, true, true, 'review', 86400, 'profile', 'standard', 'player-profile.propose-kingdom'),
('player.avatar_evidence', 'Avatar evidence crop', 'Restricted crop used as supporting profile evidence; not canonical public media.', 'player', 'vision-evidence', 'evidence_image', '{"mimeTypes":["image/png","image/jpeg","image/webp"]}'::jsonb, true, true, 'existing_wins', 604800, 'private', 'restricted', 'vision-evidence.attach-avatar-crop');

alter table public.vision_field_registry enable row level security;
alter table public.vision_screen_types enable row level security;
alter table public.vision_screen_versions enable row level security;
alter table public.vision_reference_images enable row level security;
alter table public.vision_regions enable row level security;
alter table public.vision_field_mappings enable row level security;
alter table public.vision_scan_runs enable row level security;
alter table public.vision_scan_values enable row level security;
alter table public.vision_user_corrections enable row level security;
alter table public.vision_audit_events enable row level security;

alter table public.vision_field_registry force row level security;
alter table public.vision_screen_types force row level security;
alter table public.vision_screen_versions force row level security;
alter table public.vision_reference_images force row level security;
alter table public.vision_regions force row level security;
alter table public.vision_field_mappings force row level security;
alter table public.vision_scan_runs force row level security;
alter table public.vision_scan_values force row level security;
alter table public.vision_user_corrections force row level security;
alter table public.vision_audit_events force row level security;

create policy vision_registry_read on public.vision_field_registry for select to authenticated
using (screenshot_import_allowed and is_enabled or (select public.has_forge_permission('vision.admin.read')));
create policy vision_registry_admin on public.vision_field_registry for all to authenticated
using ((select public.has_forge_permission('vision.admin.edit')))
with check ((select public.has_forge_permission('vision.admin.edit')));

create policy vision_screen_types_read on public.vision_screen_types for select to authenticated
using ((select public.has_forge_permission('vision.admin.read')) or (is_enabled and exists (select 1 from public.vision_screen_versions v where v.screen_type_id = id and v.status = 'published')));
create policy vision_screen_types_admin on public.vision_screen_types for all to authenticated
using ((select public.has_forge_permission('vision.admin.edit')))
with check ((select public.has_forge_permission('vision.admin.edit')));

create policy vision_versions_read on public.vision_screen_versions for select to authenticated
using (status = 'published' or (select public.has_forge_permission('vision.admin.read')));
create policy vision_versions_edit on public.vision_screen_versions for insert to authenticated
with check ((select public.has_forge_permission('vision.admin.edit')) and status in ('draft','testing'));
create policy vision_versions_update on public.vision_screen_versions for update to authenticated
using ((select public.has_forge_permission(case when status = 'published' then 'vision.admin.publish' else 'vision.admin.edit' end)))
with check ((select public.has_forge_permission(case when status in ('published','deprecated') then 'vision.admin.publish' else 'vision.admin.edit' end)));

create policy vision_regions_read on public.vision_regions for select to authenticated
using (exists (select 1 from public.vision_screen_versions v where v.id = screen_version_id and (v.status = 'published' or (select public.has_forge_permission('vision.admin.read')))));
create policy vision_regions_edit on public.vision_regions for all to authenticated
using ((select public.has_forge_permission('vision.admin.edit')))
with check ((select public.has_forge_permission('vision.admin.edit')));

create policy vision_mappings_read on public.vision_field_mappings for select to authenticated
using (exists (select 1 from public.vision_regions r join public.vision_screen_versions v on v.id = r.screen_version_id where r.id = region_id and (v.status = 'published' or (select public.has_forge_permission('vision.admin.read')))));
create policy vision_mappings_edit on public.vision_field_mappings for all to authenticated
using ((select public.has_forge_permission('vision.admin.edit')))
with check ((select public.has_forge_permission('vision.admin.edit')));

create policy vision_references_admin_read on public.vision_reference_images for select to authenticated
using ((select public.has_forge_permission('vision.admin.read')));
create policy vision_references_admin_write on public.vision_reference_images for all to authenticated
using ((select public.has_forge_permission('vision.admin.edit')))
with check ((select public.has_forge_permission('vision.admin.edit')));

create policy vision_scans_owner_read on public.vision_scan_runs for select to authenticated
using (user_id = (select auth.uid()) or (select public.has_forge_permission('vision.evidence.review')));
create policy vision_scans_owner_insert on public.vision_scan_runs for insert to authenticated
with check (user_id = (select auth.uid()) and (select public.has_forge_permission('vision.scan.create')));
create policy vision_scans_owner_update on public.vision_scan_runs for update to authenticated
using (user_id = (select auth.uid()) and (select public.has_forge_permission('vision.scan.review-own')))
with check (user_id = (select auth.uid()));

create policy vision_values_owner_read on public.vision_scan_values for select to authenticated
using (exists (select 1 from public.vision_scan_runs s where s.id = scan_run_id and (s.user_id = (select auth.uid()) or (select public.has_forge_permission('vision.evidence.review')))));
create policy vision_values_owner_update on public.vision_scan_values for update to authenticated
using (exists (select 1 from public.vision_scan_runs s where s.id = scan_run_id and s.user_id = (select auth.uid()) and (select public.has_forge_permission('vision.scan.review-own'))))
with check (exists (select 1 from public.vision_scan_runs s where s.id = scan_run_id and s.user_id = (select auth.uid())));

create policy vision_corrections_owner_read on public.vision_user_corrections for select to authenticated
using (exists (select 1 from public.vision_scan_values sv join public.vision_scan_runs sr on sr.id = sv.scan_run_id where sv.id = scan_value_id and (sr.user_id = (select auth.uid()) or (select public.has_forge_permission('vision.evidence.review')))));
create policy vision_corrections_owner_insert on public.vision_user_corrections for insert to authenticated
with check (corrected_by = (select auth.uid()) and exists (select 1 from public.vision_scan_values sv join public.vision_scan_runs sr on sr.id = sv.scan_run_id where sv.id = scan_value_id and sr.user_id = (select auth.uid())));

create policy vision_audit_admin_read on public.vision_audit_events for select to authenticated
using ((select public.has_forge_permission('vision.admin.read')) or actor_id = (select auth.uid()));

revoke all on public.vision_field_registry, public.vision_screen_types, public.vision_screen_versions, public.vision_reference_images, public.vision_regions, public.vision_field_mappings, public.vision_scan_runs, public.vision_scan_values, public.vision_user_corrections, public.vision_audit_events from anon;
grant select on public.vision_field_registry, public.vision_screen_types, public.vision_screen_versions, public.vision_regions, public.vision_field_mappings to authenticated;
grant select, insert, update on public.vision_scan_runs, public.vision_scan_values to authenticated;
grant select, insert on public.vision_user_corrections to authenticated;
grant select on public.vision_reference_images, public.vision_audit_events to authenticated;
grant insert, update, delete on public.vision_field_registry, public.vision_screen_types, public.vision_screen_versions, public.vision_reference_images, public.vision_regions, public.vision_field_mappings to authenticated;

commit;
