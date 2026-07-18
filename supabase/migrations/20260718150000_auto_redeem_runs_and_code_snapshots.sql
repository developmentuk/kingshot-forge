-- Release 0.7.5 corrective persistence: group user-triggered requests into
-- immutable runs and retain the submitted code only for owner history/audit.

create table public.gift_code_redemption_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  player_account_id uuid not null references public.player_accounts(id) on delete restrict,
  status text not null default 'processing' check (status in ('processing', 'completed', 'partial', 'failed')),
  requested_code_count smallint not null check (requested_code_count between 0 and 50),
  processed_code_count smallint not null default 0 check (processed_code_count between 0 and requested_code_count),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'processing' and completed_at is null) or (status <> 'processing' and completed_at is not null)),
  check (completed_at is null or completed_at >= started_at)
);

alter table public.gift_code_redemption_requests
  add column run_id uuid references public.gift_code_redemption_runs(id) on delete restrict;

alter table public.gift_code_redemption_attempts
  add column code_publication_id text,
  add column publication_version text,
  add column code_snapshot text check (code_snapshot is null or char_length(code_snapshot) between 3 and 64);

alter table public.gift_code_redemption_runs enable row level security;
alter table public.gift_code_redemption_runs force row level security;

create policy "Gift Code owners read their runs"
on public.gift_code_redemption_runs
for select to authenticated
using ((select auth.uid()) = user_id);

revoke all on table public.gift_code_redemption_runs from public, anon, authenticated;
grant select (id, player_account_id, status, requested_code_count, processed_code_count, started_at, completed_at, created_at, updated_at)
on public.gift_code_redemption_runs to authenticated;
grant all on table public.gift_code_redemption_runs to service_role;

grant select (code_publication_id, publication_version, code_snapshot)
on public.gift_code_redemption_attempts to authenticated;

create index gift_code_runs_owner_history_idx
on public.gift_code_redemption_runs (user_id, created_at desc, id desc);

create unique index gift_code_runs_one_active_player_idx
on public.gift_code_redemption_runs (player_account_id)
where status = 'processing';

create index gift_code_requests_run_idx
on public.gift_code_redemption_requests (run_id, created_at);

comment on table public.gift_code_redemption_runs is
  'Server-created, user-triggered Auto Redeem runs; client mutations are denied.';
comment on column public.gift_code_redemption_attempts.code_snapshot is
  'Immutable owner-history display value; never a credential or provider payload.';
