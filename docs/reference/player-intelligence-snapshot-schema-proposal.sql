-- PLAYER INTELLIGENCE SNAPSHOT SCHEMA PROPOSAL — UNAPPLIED
-- PLAYER-INTEL-001 design artifact. Deliberately outside supabase/migrations.
--
-- DO NOT RUN AGAINST PRODUCTION.
-- This proposal depends on the separately proposed Player Identity replacement
-- schema and requires Clark/Aegis, Privacy, Security and Database approval,
-- a clean non-production rehearsal, retention decisions and an approved
-- migration receipt before the terminal ROLLBACK may be replaced.

begin;

-- Explicit non-production rehearsal guard.
do $$
begin
  if current_setting('forge.player_intelligence_validation_mode', true)
       is distinct from 'non_production_approved_rehearsal' then
    raise exception using
      message = 'Player Intelligence proposal aborted: non-production approval marker missing',
      hint = 'Do not execute this proposal against production.';
  end if;
end
$$;

-- The observation model belongs to a game character, not to a legacy
-- user-owned player_accounts row. Do not entrench the legacy identity model.
do $$
begin
  if to_regclass('player_identity_private.game_characters') is null then
    raise exception using
      message = 'Player Intelligence proposal aborted: private game-character baseline missing',
      hint = 'Approve and rehearse the Player Identity replacement schema first.';
  end if;

  if to_regclass('public.player_progression_snapshots') is null then
    raise exception 'Player Intelligence proposal aborted: discovered legacy progression baseline missing';
  end if;

  if to_regclass('player_intelligence_private.source_registry') is not null
     or to_regclass('player_intelligence_private.source_observations') is not null then
    raise exception 'Player Intelligence proposal aborted: target objects already exist';
  end if;
end
$$;

create schema player_intelligence_private;
revoke all on schema player_intelligence_private from public, anon, authenticated;

comment on schema player_intelligence_private is
  'Server-owned Kingshot player source observations, normalised basic profile states and derived changes. No browser role has direct access.';

-- Mutable governance record. Sources are retired rather than deleted.
create table player_intelligence_private.source_registry (
  source_key text primary key,
  display_name text not null check (char_length(display_name) between 1 and 120),
  source_type text not null check (
    source_type in ('server_api', 'user_evidence', 'vision_evidence', 'alliance_import', 'manual_review')
  ),
  operator_name text not null check (char_length(operator_name) between 1 and 160),
  current_contract_version text not null check (current_contract_version ~ '^[0-9]+\.[0-9]+\.[0-9]+([+-][A-Za-z0-9.-]+)?$'),
  approval_status text not null default 'proposed' check (
    approval_status in ('proposed', 'approved', 'suspended', 'retired')
  ),
  operational_status text not null default 'disabled' check (
    operational_status in ('disabled', 'healthy', 'degraded', 'unavailable', 'retired')
  ),
  allowed_purposes text[] not null default '{}' check (
    allowed_purposes <@ array['link_revalidation', 'private_profile_refresh', 'support_review']::text[]
  ),
  trust_rationale text not null check (char_length(trust_rationale) between 8 and 4000),
  terms_reference text,
  rate_policy jsonb not null default '{}'::jsonb check (jsonb_typeof(rate_policy) = 'object'),
  cache_policy jsonb not null default '{}'::jsonb check (jsonb_typeof(cache_policy) = 'object'),
  retention_class text not null default 'decision_pending' check (
    retention_class in ('decision_pending', 'ephemeral', 'short_term_evidence', 'operational_history')
  ),
  reviewed_by uuid references auth.users(id) on delete restrict,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint source_registry_key_format check (source_key ~ '^[a-z][a-z0-9._-]{2,79}$'),
  constraint source_registry_review_pair check (
    (reviewed_by is null and reviewed_at is null)
    or (reviewed_by is not null and reviewed_at is not null)
  )
);

comment on table player_intelligence_private.source_registry is
  'Governed registry of source adapters. This table is mutable; source observations are not.';

-- Immutable metadata for every attempted source lookup. The first slice stores
-- no raw payload body. The exact payload is represented by its SHA-256,
-- content type and byte length. A future evidence-payload table requires a
-- separate retention/encryption decision.
create table player_intelligence_private.source_observations (
  id uuid primary key default gen_random_uuid(),
  game_character_id bigint not null references player_identity_private.game_characters(id) on delete restrict,
  source_key text not null references player_intelligence_private.source_registry(source_key) on delete restrict,
  source_contract_version text not null check (char_length(source_contract_version) between 1 and 80),
  request_idempotency_key uuid not null unique,
  request_correlation_id uuid not null,
  purpose text not null check (
    purpose in ('link_revalidation', 'private_profile_refresh', 'support_review')
  ),
  actor_kind text not null check (actor_kind in ('forge_user', 'support', 'system')),
  actor_forge_user_id uuid references auth.users(id) on delete restrict,
  requested_at timestamptz not null,
  retrieved_at timestamptz,
  source_reported_at timestamptz,
  http_status smallint check (http_status between 100 and 599),
  result_code text not null check (
    result_code in (
      'success',
      'invalid_player_id',
      'player_not_found',
      'source_not_configured',
      'source_unavailable',
      'source_timeout',
      'source_rate_limited',
      'invalid_content_type',
      'payload_too_large',
      'invalid_source_payload',
      'mismatched_player_id',
      'refresh_not_permitted',
      'internal_error'
    )
  ),
  payload_content_type text,
  payload_byte_length integer check (payload_byte_length between 0 and 1048576),
  payload_sha256 text check (payload_sha256 ~ '^[0-9a-f]{64}$'),
  safe_error_code text check (safe_error_code is null or safe_error_code ~ '^[a-z][a-z0-9_]{2,79}$'),
  safe_metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(safe_metadata) = 'object'),
  created_at timestamptz not null default now(),
  constraint source_observations_actor_consistency check (
    (actor_kind in ('forge_user', 'support') and actor_forge_user_id is not null)
    or (actor_kind = 'system' and actor_forge_user_id is null)
  ),
  constraint source_observations_timing check (
    retrieved_at is null or retrieved_at >= requested_at
  ),
  constraint source_observations_payload_triplet check (
    (payload_sha256 is null and payload_content_type is null and payload_byte_length is null)
    or (payload_sha256 is not null and payload_content_type is not null and payload_byte_length is not null)
  ),
  constraint source_observations_success_has_payload check (
    result_code <> 'success'
    or (retrieved_at is not null and http_status between 200 and 299 and payload_sha256 is not null)
  ),
  constraint source_observations_id_character_unique unique (id, game_character_id)
);

create index source_observations_character_time_idx
  on player_intelligence_private.source_observations (game_character_id, requested_at desc);
create index source_observations_source_time_idx
  on player_intelligence_private.source_observations (source_key, requested_at desc);
create index source_observations_result_time_idx
  on player_intelligence_private.source_observations (result_code, requested_at desc);
create index source_observations_payload_hash_idx
  on player_intelligence_private.source_observations (payload_sha256)
  where payload_sha256 is not null;

comment on table player_intelligence_private.source_observations is
  'Append-only source request evidence. Contains payload metadata/fingerprint but no raw payload body in the first slice.';

-- Immutable distinct normalised state. Repeated observations of unchanged
-- data reuse the same state row and create another observation link instead of
-- producing unlimited duplicate snapshots.
create table player_intelligence_private.basic_profile_snapshots (
  id uuid primary key default gen_random_uuid(),
  game_character_id bigint not null references player_identity_private.game_characters(id) on delete restrict,
  state_sha256 text not null check (state_sha256 ~ '^[0-9a-f]{64}$'),
  normaliser_version text not null check (normaliser_version ~ '^[0-9]+\.[0-9]+\.[0-9]+([+-][A-Za-z0-9.-]+)?$'),
  player_name text not null check (char_length(player_name) between 1 and 64),
  kingdom_id integer not null check (kingdom_id between 1 and 9999),
  player_level integer not null check (player_level between 0 and 1000),
  level_rendered text check (level_rendered is null or char_length(level_rendered) between 1 and 120),
  level_rendered_detailed text check (
    level_rendered_detailed is null or char_length(level_rendered_detailed) between 1 and 240
  ),
  level_image_url text check (level_image_url is null or level_image_url ~ '^https://'),
  profile_image_url text check (profile_image_url is null or profile_image_url ~ '^https://'),
  created_at timestamptz not null default now(),
  constraint basic_profile_snapshots_state_unique
    unique (game_character_id, normaliser_version, state_sha256),
  constraint basic_profile_snapshots_id_character_unique unique (id, game_character_id)
);

create index basic_profile_snapshots_character_created_idx
  on player_intelligence_private.basic_profile_snapshots (game_character_id, created_at desc);

comment on table player_intelligence_private.basic_profile_snapshots is
  'Append-only distinct basic profile states. Freshness and confidence belong to observation links, not to the reusable state.';

-- One accepted observation confirms exactly one normalised state. This table
-- retains current freshness even when the state has not changed.
create table player_intelligence_private.snapshot_observation_links (
  id uuid primary key default gen_random_uuid(),
  game_character_id bigint not null,
  observation_id uuid not null unique,
  snapshot_id uuid not null,
  observed_at timestamptz not null,
  freshness_status text not null check (freshness_status in ('fresh', 'stale', 'unknown')),
  source_age_seconds integer check (source_age_seconds is null or source_age_seconds >= 0),
  confidence_score smallint not null check (confidence_score between 0 and 100),
  confidence_rationale text not null check (char_length(confidence_rationale) between 8 and 2000),
  accepted_by_service text not null check (accepted_by_service ~ '^[a-z][a-z0-9._-]{2,79}$'),
  created_at timestamptz not null default now(),
  constraint snapshot_links_observation_character_fk
    foreign key (observation_id, game_character_id)
    references player_intelligence_private.source_observations(id, game_character_id)
    on delete restrict,
  constraint snapshot_links_snapshot_character_fk
    foreign key (snapshot_id, game_character_id)
    references player_intelligence_private.basic_profile_snapshots(id, game_character_id)
    on delete restrict,
  constraint snapshot_links_source_age_consistency check (
    (freshness_status = 'unknown' and source_age_seconds is null)
    or freshness_status in ('fresh', 'stale')
  )
);

create index snapshot_links_character_observed_idx
  on player_intelligence_private.snapshot_observation_links (game_character_id, observed_at desc);
create index snapshot_links_snapshot_observed_idx
  on player_intelligence_private.snapshot_observation_links (snapshot_id, observed_at desc);

comment on table player_intelligence_private.snapshot_observation_links is
  'Append-only acceptance links. Repeated unchanged observations update freshness by adding links, never by rewriting snapshot state.';

-- Optional materialised/reproducible change events between two distinct state
-- rows. Values are limited to the allowlisted basic fields.
create table player_intelligence_private.snapshot_changes (
  id uuid primary key default gen_random_uuid(),
  game_character_id bigint not null,
  previous_snapshot_id uuid not null,
  current_snapshot_id uuid not null,
  field_key text not null check (
    field_key in (
      'player_name',
      'kingdom_id',
      'player_level',
      'level_rendered',
      'level_rendered_detailed',
      'level_image_url',
      'profile_image_url'
    )
  ),
  previous_value jsonb,
  current_value jsonb,
  classification text not null check (
    classification in ('name_change', 'kingdom_change', 'level_change', 'rendered_level_change', 'image_change')
  ),
  confidence_score smallint not null check (confidence_score between 0 and 100),
  derivation_version text not null check (derivation_version ~ '^[0-9]+\.[0-9]+\.[0-9]+([+-][A-Za-z0-9.-]+)?$'),
  detected_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint snapshot_changes_different_snapshots check (previous_snapshot_id <> current_snapshot_id),
  constraint snapshot_changes_previous_character_fk
    foreign key (previous_snapshot_id, game_character_id)
    references player_intelligence_private.basic_profile_snapshots(id, game_character_id)
    on delete restrict,
  constraint snapshot_changes_current_character_fk
    foreign key (current_snapshot_id, game_character_id)
    references player_intelligence_private.basic_profile_snapshots(id, game_character_id)
    on delete restrict,
  constraint snapshot_changes_unique
    unique (previous_snapshot_id, current_snapshot_id, field_key, derivation_version)
);

create index snapshot_changes_character_time_idx
  on player_intelligence_private.snapshot_changes (game_character_id, detected_at desc);
create index snapshot_changes_field_time_idx
  on player_intelligence_private.snapshot_changes (field_key, detected_at desc);

comment on table player_intelligence_private.snapshot_changes is
  'Append-only derived basic profile changes. A kingdom value change is not automatically a confirmed Transfer-domain event.';

-- Generic trigger prevents update/delete even through privileged service-role
-- operations. Corrections are new evidence/state/derivation records.
create function player_intelligence_private.reject_append_only_mutation()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  raise exception using
    message = format('%I.%I is append-only', TG_TABLE_SCHEMA, TG_TABLE_NAME),
    hint = 'Insert a new observation/state/derivation record; do not rewrite evidence.';
end
$$;

revoke all on function player_intelligence_private.reject_append_only_mutation() from public, anon, authenticated;

create trigger source_observations_append_only
before update or delete on player_intelligence_private.source_observations
for each row execute function player_intelligence_private.reject_append_only_mutation();

create trigger basic_profile_snapshots_append_only
before update or delete on player_intelligence_private.basic_profile_snapshots
for each row execute function player_intelligence_private.reject_append_only_mutation();

create trigger snapshot_observation_links_append_only
before update or delete on player_intelligence_private.snapshot_observation_links
for each row execute function player_intelligence_private.reject_append_only_mutation();

create trigger snapshot_changes_append_only
before update or delete on player_intelligence_private.snapshot_changes
for each row execute function player_intelligence_private.reject_append_only_mutation();

-- Internal current-state projection. It exposes only normalised fields and
-- source/freshness metadata; raw source bodies do not exist in this slice.
create view player_intelligence_private.latest_basic_player_profiles
with (security_invoker = true)
as
select distinct on (link.game_character_id)
  link.game_character_id,
  snapshot.id as snapshot_id,
  observation.id as observation_id,
  snapshot.player_name,
  snapshot.kingdom_id,
  snapshot.player_level,
  snapshot.level_rendered,
  snapshot.level_rendered_detailed,
  snapshot.level_image_url,
  snapshot.profile_image_url,
  link.observed_at,
  link.freshness_status,
  link.source_age_seconds,
  link.confidence_score,
  link.confidence_rationale,
  observation.source_key,
  observation.source_contract_version,
  observation.payload_sha256
from player_intelligence_private.snapshot_observation_links link
join player_intelligence_private.basic_profile_snapshots snapshot
  on snapshot.id = link.snapshot_id
join player_intelligence_private.source_observations observation
  on observation.id = link.observation_id
order by link.game_character_id, link.observed_at desc, link.created_at desc;

comment on view player_intelligence_private.latest_basic_player_profiles is
  'Server-only latest accepted basic profile projection. Not a public API contract.';

-- Defense in depth. No browser-facing role receives a policy or privilege.
alter table player_intelligence_private.source_registry enable row level security;
alter table player_intelligence_private.source_observations enable row level security;
alter table player_intelligence_private.basic_profile_snapshots enable row level security;
alter table player_intelligence_private.snapshot_observation_links enable row level security;
alter table player_intelligence_private.snapshot_changes enable row level security;

revoke all on all tables in schema player_intelligence_private from public, anon, authenticated;
revoke all on all sequences in schema player_intelligence_private from public, anon, authenticated;

-- Source governance is mutable but never deletable through the application.
grant usage on schema player_intelligence_private to service_role;
grant select, insert, update on player_intelligence_private.source_registry to service_role;

-- Evidence, states, confirmations and changes are append-only.
grant select, insert on
  player_intelligence_private.source_observations,
  player_intelligence_private.basic_profile_snapshots,
  player_intelligence_private.snapshot_observation_links,
  player_intelligence_private.snapshot_changes
  to service_role;

grant select on player_intelligence_private.latest_basic_player_profiles to service_role;

-- Deliberate non-goals of this proposal:
-- * no grant to anon or authenticated;
-- * no public external-Player-ID route or view;
-- * no raw payload body storage;
-- * no link to legacy public.player_accounts;
-- * no use of public.player_progression_snapshots;
-- * no refresh quota/rate implementation;
-- * no scheduled collection;
-- * no detailed hero/loadout schema;
-- * no retention expiry worker or legal/security hold model;
-- * no confirmation that a kingdom value change is a Transfer-domain event.

-- Required before an approved migration could replace this ROLLBACK:
-- * Player Identity replacement schema approved and rehearsed;
-- * source terms/rate/cache posture approved;
-- * raw evidence retention explicitly decided;
-- * private-schema grants and service-role boundaries verified;
-- * append-only trigger and idempotency/concurrency tests pass;
-- * duplicate state and repeated unchanged-observation tests pass;
-- * account closure/export/deletion behaviour approved;
-- * rollback/recovery and migration receipt prepared;
-- * field canary proves unknown upstream fields never enter projections;
-- * no conflict with existing player_progression_snapshots semantics.

rollback;
