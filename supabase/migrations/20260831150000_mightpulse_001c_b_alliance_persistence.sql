begin;

-- MIGHTPULSE-001C-B foundation only. This file is intentionally unapplied to
-- production. No provider/runtime, membership, authority, or public-view path
-- is introduced here.

create table public.alliance_provider_bindings (
  id uuid primary key default gen_random_uuid(),
  alliance_id uuid not null references public.alliances(id),
  provider text not null check (provider = 'mightpulse'),
  provider_kingdom_number integer not null check (provider_kingdom_number between 1 and 9999),
  provider_tag text not null check (
    char_length(provider_tag) between 2 and 12
    and provider_tag = btrim(provider_tag)
    and provider_tag !~ '[[:cntrl:]]'
  ),
  provider_alliance_id text not null check (
    char_length(provider_alliance_id) between 1 and 120
    and provider_alliance_id = btrim(provider_alliance_id)
    and provider_alliance_id !~ '[[:cntrl:]]'
  ),
  binding_status text not null default 'active'
    check (binding_status = any (array['active'::text, 'superseded'::text, 'suspended'::text])),
  source text not null check (char_length(source) between 1 and 120),
  first_seen_at timestamptz not null,
  last_confirmed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.alliance_provider_bindings is
  'Server-only exact-case MightPulse identity bindings. Provider identity is separate from the Forge Alliance tag and is never an ownership or authority claim.';
comment on column public.alliance_provider_bindings.provider_tag is
  'The exact case-sensitive provider tag used for lookup. Never lower- or upper-case this value.';
comment on column public.alliance_provider_bindings.provider_alliance_id is
  'MightPulse aid. Globally unique for this provider so one aid cannot silently bind to multiple Forge Alliances.';

create unique index alliance_provider_bindings_active_alliance_idx
  on public.alliance_provider_bindings (alliance_id, provider)
  where binding_status = 'active';
create unique index alliance_provider_bindings_provider_aid_idx
  on public.alliance_provider_bindings (provider, provider_alliance_id);
create unique index alliance_provider_bindings_exact_lookup_idx
  on public.alliance_provider_bindings (provider, provider_kingdom_number, provider_tag);

create table public.alliance_intelligence_observations (
  id uuid primary key default gen_random_uuid(),
  binding_id uuid not null references public.alliance_provider_bindings(id),
  alliance_id uuid not null references public.alliances(id),
  provider text not null check (provider = 'mightpulse'),
  provider_kingdom_number integer not null check (provider_kingdom_number between 1 and 9999),
  provider_tag text not null check (provider_tag = btrim(provider_tag) and provider_tag !~ '[[:cntrl:]]'),
  provider_alliance_id text not null check (provider_alliance_id = btrim(provider_alliance_id) and provider_alliance_id !~ '[[:cntrl:]]'),
  alliance_name text null,
  alliance_power bigint null check (alliance_power is null or alliance_power >= 0),
  member_count integer null check (member_count is null or member_count >= 0),
  leader_identity text null,
  leader_name text null,
  flag_reference text null,
  power_rank integer null check (power_rank is null or power_rank >= 0),
  source text not null check (char_length(source) between 1 and 120),
  freshness_shape text not null check (freshness_shape = any (array['sectioned'::text, 'scalar'::text, 'unknown'::text])),
  info_fresh boolean null,
  roster_fresh boolean null,
  provider_fresh boolean null,
  provider_cached_at timestamptz null,
  provider_age_seconds integer null check (provider_age_seconds is null or provider_age_seconds >= 0),
  provider_fetched_at timestamptz not null,
  observed_at timestamptz not null,
  content_sha256 text not null check (content_sha256 ~ '^[0-9a-f]{64}$'),
  check (provider_fresh is distinct from true or freshness_shape = 'scalar' or (info_fresh is true and roster_fresh is true)),
  check (freshness_shape <> 'sectioned' or provider_fresh is distinct from true or (info_fresh is true and roster_fresh is true))
);

comment on table public.alliance_intelligence_observations is
  'Immutable, server-only allowlisted Alliance info+roster observations. Raw provider payloads are not stored.';
comment on column public.alliance_intelligence_observations.provider_fresh is
  'Nullable provider freshness. Null is unknown; it is never inferred from a missing timestamp or age.';
comment on column public.alliance_intelligence_observations.content_sha256 is
  'Fingerprint of the governed normalized observation; the same binding/fingerprint is idempotent.';

create unique index alliance_intelligence_observations_idempotency_idx
  on public.alliance_intelligence_observations (binding_id, content_sha256);
create index alliance_intelligence_observations_latest_idx
  on public.alliance_intelligence_observations (binding_id, provider_fetched_at desc, observed_at desc);

create or replace function public.validate_alliance_observation_binding()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  binding public.alliance_provider_bindings;
begin
  select * into binding
  from public.alliance_provider_bindings
  where id = new.binding_id;
  if binding.alliance_id is null
    or new.alliance_id <> binding.alliance_id
    or new.provider <> binding.provider
    or new.provider_kingdom_number <> binding.provider_kingdom_number
    or new.provider_tag <> binding.provider_tag
    or new.provider_alliance_id <> binding.provider_alliance_id then
    raise exception 'Alliance observation does not match its provider binding.' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger alliance_intelligence_observations_binding_guard
before insert on public.alliance_intelligence_observations
for each row execute function public.validate_alliance_observation_binding();

create table public.alliance_roster_observations (
  id uuid primary key default gen_random_uuid(),
  alliance_observation_id uuid not null references public.alliance_intelligence_observations(id),
  governor_id text not null check (char_length(governor_id) between 1 and 120 and governor_id = btrim(governor_id)),
  provider_internal_uid text null check (provider_internal_uid is null or (char_length(provider_internal_uid) between 1 and 120 and provider_internal_uid = btrim(provider_internal_uid))),
  provider_fid text null check (provider_fid is null or (char_length(provider_fid) between 1 and 120 and provider_fid = btrim(provider_fid))),
  nickname text null,
  power bigint null check (power is null or power >= 0),
  town_center_level integer null check (town_center_level is null or town_center_level between 1 and 30),
  kills bigint null check (kills is null or kills >= 0),
  alliance_rank text null,
  alliance_rank_label text null,
  kingdom_number integer null check (kingdom_number is null or kingdom_number between 1 and 9999),
  avatar_reference text null,
  last_active_value jsonb null check (last_active_value is null or jsonb_typeof(last_active_value) = any (array['string'::text, 'number'::text, 'boolean'::text])),
  online boolean null,
  source text not null check (char_length(source) between 1 and 120),
  provider_fresh boolean null,
  provider_cached_at timestamptz null,
  provider_age_seconds integer null check (provider_age_seconds is null or provider_age_seconds >= 0),
  provider_fetched_at timestamptz not null,
  observed_at timestamptz not null,
  player_account_id uuid null references public.player_accounts(id),
  match_status text not null default 'unmatched'
    check (match_status = any (array['unmatched'::text, 'matched'::text, 'ambiguous'::text, 'invalid'::text])),
  check ((match_status = 'matched') = (player_account_id is not null))
);

comment on table public.alliance_roster_observations is
  'Immutable server-only whole-roster member facts. player_account_id is a reference to an existing Forge Player Account only; provider fields never overwrite it.';
comment on column public.alliance_roster_observations.last_active_value is
  'Allowlisted provider value preserved as supplied; no fabricated timestamp or age is created.';

create unique index alliance_roster_observations_governor_idx
  on public.alliance_roster_observations (alliance_observation_id, governor_id);
create unique index alliance_roster_observations_uid_idx
  on public.alliance_roster_observations (alliance_observation_id, provider_internal_uid)
  where provider_internal_uid is not null;
create unique index alliance_roster_observations_fid_idx
  on public.alliance_roster_observations (alliance_observation_id, provider_fid)
  where provider_fid is not null;
create index alliance_roster_observations_player_idx
  on public.alliance_roster_observations (player_account_id)
  where player_account_id is not null;

create or replace function public.reject_alliance_observation_mutation()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  raise exception 'MightPulse Alliance observations are immutable.' using errcode = '55000';
end;
$$;

create trigger alliance_intelligence_observations_immutable
before update or delete on public.alliance_intelligence_observations
for each row execute function public.reject_alliance_observation_mutation();
create trigger alliance_roster_observations_immutable
before update or delete on public.alliance_roster_observations
for each row execute function public.reject_alliance_observation_mutation();

alter table public.alliance_provider_bindings enable row level security;
alter table public.alliance_provider_bindings force row level security;
alter table public.alliance_intelligence_observations enable row level security;
alter table public.alliance_intelligence_observations force row level security;
alter table public.alliance_roster_observations enable row level security;
alter table public.alliance_roster_observations force row level security;

revoke all on table public.alliance_provider_bindings from public, anon, authenticated;
revoke all on table public.alliance_intelligence_observations from public, anon, authenticated;
revoke all on table public.alliance_roster_observations from public, anon, authenticated;
grant select, insert, update on table public.alliance_provider_bindings to service_role;
grant select, insert on table public.alliance_intelligence_observations to service_role;
grant select, insert on table public.alliance_roster_observations to service_role;
revoke all on function public.reject_alliance_observation_mutation() from public, anon, authenticated;
revoke all on function public.validate_alliance_observation_binding() from public, anon, authenticated;

-- Rollback strategy (owner-gated, never run implicitly): drop dependent indexes,
-- triggers, function, and the three new tables in reverse dependency order.
-- No existing Alliance, membership, Player Account, authority, quota, or public
-- projection object is altered by this migration.

commit;
