create table if not exists public.forge_dataset_contracts (
  dataset_key text primary key, display_name text not null, contract_version integer not null, definition jsonb not null, active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.forge_import_runs (
  id uuid primary key default gen_random_uuid(), dataset_key text not null references public.forge_dataset_contracts(dataset_key), file_fingerprint text not null, original_filename text not null, uploader_id uuid not null references auth.users(id), parser_version text not null, contract_version integer not null, state text not null check (state in ('uploaded','parsing','validation_failed','review_required','staged','approved','publishing','published','failed','rolled_back','cancelled')), validation_result jsonb not null default '{}'::jsonb, source_metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(dataset_key, file_fingerprint)
);
create table if not exists public.forge_import_records (
  id uuid primary key default gen_random_uuid(), import_run_id uuid not null references public.forge_import_runs(id) on delete cascade, sheet_name text not null, source_row integer not null, external_key text not null, original_values jsonb not null, editorial_values jsonb, issue_state text not null default 'valid' check (issue_state in ('valid','warning','rejected','approved')), editorial_note text, created_at timestamptz not null default now(), unique(import_run_id, sheet_name, external_key)
);
create table if not exists public.buildings (
  building_key text primary key, building_name text not null, slug text not null unique, category text not null, description text not null, standard_max_level integer not null, truegold_supported boolean not null, record_count integer not null, source_url text not null, verification_note text not null, source_metadata jsonb not null default '{}'::jsonb, editorial_status text not null default 'published', published_version bigint, updated_at timestamptz not null default now()
);
create table if not exists public.building_progression (
  record_id text primary key, building_key text not null references public.buildings(building_key), building_name text not null, category text not null, level_label text not null, progression_phase text not null, base_level integer, truegold_tier integer, stage integer, requirements_text text not null, requirements_json jsonb not null, truegold numeric, tempered_truegold numeric, bread numeric, wood numeric, stone numeric, iron numeric, upgrade_time_seconds numeric, upgrade_time_display text, power numeric, max_hero_level integer, training_capacity integer, rally_capacity integer, ally_help_count integer, training_speed_percent numeric, troop_deploy_capacity integer, reinforcement_capacity integer, source_url text not null, verification_status text not null, verified_on date, quality_flags text, original_row integer, published_version bigint, updated_at timestamptz not null default now()
);
create index if not exists building_progression_lookup_idx on public.building_progression(building_key, progression_phase, truegold_tier, stage, base_level);
create index if not exists forge_import_runs_dataset_state_idx on public.forge_import_runs(dataset_key, state, created_at desc);
create index if not exists forge_import_records_run_issue_idx on public.forge_import_records(import_run_id, issue_state);
alter table public.forge_dataset_contracts enable row level security; alter table public.forge_import_runs enable row level security; alter table public.forge_import_records enable row level security; alter table public.buildings enable row level security; alter table public.building_progression enable row level security;
revoke all on public.forge_dataset_contracts, public.forge_import_runs, public.forge_import_records from anon, authenticated;
grant select on public.buildings, public.building_progression to anon, authenticated;
create policy buildings_public_read on public.buildings for select to anon, authenticated using (editorial_status = 'published');
create policy building_progression_public_read on public.building_progression for select to anon, authenticated using (published_version is not null);
comment on table public.forge_import_runs is 'Immutable source import run metadata; uploads never write published tables directly.';
comment on table public.building_progression is 'Published Buildings progression projection. Source resource costs are raw/base costs.';
