create table if not exists public.forge_import_warnings (
  warning_id text primary key,
  import_run_id uuid not null references public.forge_import_runs(id) on delete restrict,
  import_record_id uuid null references public.forge_import_records(id) on delete restrict,
  dataset_key text not null,
  sheet_name text not null,
  source_row integer not null,
  record_id text not null,
  building_key text not null,
  code text not null,
  severity text not null check (severity in ('warning','blocking','informational')),
  message text not null,
  source_text text not null,
  parsed_name text,
  required_level integer,
  required_stage integer,
  occurred_at timestamptz not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (import_run_id, warning_id)
);

create index if not exists forge_import_warnings_run_idx on public.forge_import_warnings(import_run_id, occurred_at, warning_id);
alter table public.forge_import_warnings enable row level security;
revoke all on public.forge_import_warnings from anon, authenticated;
grant select on public.forge_import_warnings to service_role;

create or replace function public.prevent_forge_import_warning_mutation()
returns trigger language plpgsql as $$
begin
  raise exception 'forge_import_warnings is append-only';
end;
$$;
alter function public.prevent_forge_import_warning_mutation() set search_path = pg_catalog;
drop trigger if exists forge_import_warnings_immutable on public.forge_import_warnings;
create trigger forge_import_warnings_immutable before update or delete on public.forge_import_warnings for each row execute function public.prevent_forge_import_warning_mutation();

comment on table public.forge_import_warnings is 'One immutable row per validation warning identity; warning records never collapse by source record.';
