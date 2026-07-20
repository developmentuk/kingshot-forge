-- Release 0.8.2 Sprint 2: derived Search projections.
--
-- Proposal only. Do not apply to the connected project until a disposable
-- non-production database is proven and the migration is explicitly approved.
-- Search projections are rebuildable derived data; canonical/editorial tables
-- remain authoritative and browser clients never receive mutation privileges.

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

create table public.search_projections (
  projection_id text primary key,
  source_dataset text not null,
  source_record_id text not null,
  source_version_id text,
  source_publication_id text,
  title text not null,
  subtitle text,
  summary text,
  keywords text[] not null default '{}',
  tags text[] not null default '{}',
  image text,
  canonical_url text,
  search_weight numeric not null default 0,
  visibility text not null,
  permission_requirements jsonb not null default '{"visibility":"public"}'::jsonb,
  publication_status text not null default 'published',
  published_at timestamptz not null,
  verified_at timestamptz,
  source_updated_at timestamptz,
  projection_updated_at timestamptz not null default now(),
  content_hash text not null,
  schema_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_dataset, source_record_id),
  constraint search_projection_dataset_check check (source_dataset ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint search_projection_identity_check check (length(trim(source_record_id)) > 0),
  constraint search_projection_title_check check (length(trim(title)) > 0),
  constraint search_projection_visibility_check check (visibility in ('public', 'authenticated', 'restricted', 'internal')),
  constraint search_projection_status_check check (publication_status = 'published'),
  constraint search_projection_url_check check (canonical_url is null or canonical_url ~ '^(/|https://)'),
  constraint search_projection_hash_check check (length(trim(content_hash)) > 0),
  constraint search_projection_schema_check check (schema_version > 0)
);

create index search_projections_dataset_idx on public.search_projections (source_dataset, source_record_id);
create index search_projections_public_idx on public.search_projections (published_at desc, source_dataset)
  where publication_status = 'published' and visibility = 'public';
create index search_projections_content_hash_idx on public.search_projections (content_hash);

create table public.search_relationship_projections (
  source_projection_id text not null references public.search_projections(projection_id) on delete cascade,
  relationship_type text not null,
  target_dataset text not null,
  target_record_id text not null,
  weight numeric,
  label text,
  created_at timestamptz not null default now(),
  primary key (source_projection_id, relationship_type, target_dataset, target_record_id),
  constraint search_relationship_type_check check (length(trim(relationship_type)) > 0),
  constraint search_relationship_target_check check (length(trim(target_dataset)) > 0 and length(trim(target_record_id)) > 0)
);

create index search_relationship_target_idx on public.search_relationship_projections (target_dataset, target_record_id);

create table public.search_index_metadata (
  id smallint primary key default 1 check (id = 1),
  index_version bigint not null default 0,
  projection_count integer not null default 0,
  relationship_count integer not null default 0,
  last_successful_refresh timestamptz,
  last_failed_refresh timestamptz,
  cache_built_at timestamptz,
  schema_version integer not null default 1,
  provider_versions jsonb not null default '{}'::jsonb,
  stale boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.search_index_metadata (id) values (1) on conflict (id) do nothing;

create table public.search_refresh_runs (
  run_id text primary key,
  mode text not null,
  datasets_requested text[] not null default '{}',
  records_inspected integer not null default 0,
  records_inserted integer not null default 0,
  records_updated integer not null default 0,
  records_unchanged integer not null default 0,
  records_removed integer not null default 0,
  relationships_inserted integer not null default 0,
  relationships_removed integer not null default 0,
  failures jsonb not null default '[]'::jsonb,
  started_at timestamptz not null,
  finished_at timestamptz not null,
  duration_ms integer not null,
  resulting_index_version bigint not null
);

create table public.search_refresh_errors (
  id bigint generated always as identity primary key,
  dataset text not null,
  record_id text,
  code text not null,
  message text not null,
  occurred_at timestamptz not null default now()
);

create table public.search_permission_simulations (
  id bigint generated always as identity primary key,
  real_actor_id uuid not null,
  simulated_role text not null,
  simulated_permissions text[] not null default '{}',
  occurred_at timestamptz not null default now()
);

-- Defense in depth: no browser role can read or mutate derived projections.
alter table public.search_projections enable row level security;
alter table public.search_relationship_projections enable row level security;
alter table public.search_index_metadata enable row level security;
alter table public.search_refresh_runs enable row level security;
alter table public.search_refresh_errors enable row level security;
alter table public.search_permission_simulations enable row level security;
revoke all on table public.search_projections, public.search_relationship_projections,
  public.search_index_metadata, public.search_refresh_runs, public.search_refresh_errors
  , public.search_permission_simulations
  from public, anon, authenticated;
grant select, insert, update, delete on table public.search_projections,
  public.search_relationship_projections, public.search_index_metadata,
  public.search_refresh_runs, public.search_refresh_errors to service_role;
grant insert, select on table public.search_permission_simulations to service_role;
grant usage, select on sequence public.search_permission_simulations_id_seq to service_role;
grant usage, select on sequence public.search_refresh_errors_id_seq to service_role;

comment on table public.search_projections is 'Rebuildable derived published-only Search projection; canonical datasets remain authoritative.';
comment on table public.search_relationship_projections is 'Rebuildable derived Search relationship edges, replaced per source projection.';
comment on table public.search_index_metadata is 'Operational Search index/cache health; not a public data contract.';

-- Rollback is a reviewed forward migration: stop refresh workers, preserve a
-- final diagnostic export, then drop these five derived tables in dependency
-- order only after public Search has been disabled. No canonical data is lost.
commit;

