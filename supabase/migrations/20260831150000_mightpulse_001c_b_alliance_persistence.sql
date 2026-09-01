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
-- The same aid may have multiple exact-case historical provider identity records,
-- but never a provider_alliance_id_collision across Forge Alliances. The
-- insert/update trigger takes a transaction-scoped advisory lock first.
-- Historical provider identity records
--
-- The same aid may have multiple exact-case historical bindings, but never
-- across Forge Alliances. The trigger below enforces that collision boundary.
create index alliance_provider_bindings_provider_aid_idx
  on public.alliance_provider_bindings (provider, provider_alliance_id);
create unique index alliance_provider_bindings_exact_lookup_idx
  on public.alliance_provider_bindings (provider, provider_kingdom_number, provider_tag)
  where binding_status = 'active';
create index alliance_provider_bindings_normalized_lookup_idx
  on public.alliance_provider_bindings (provider, provider_kingdom_number, lower(provider_tag));

create table public.alliance_intelligence_observations (
  id uuid primary key default gen_random_uuid(),
  binding_id uuid not null references public.alliance_provider_bindings(id),
  alliance_id uuid not null references public.alliances(id),
  provider text not null check (provider = 'mightpulse'),
  provider_kingdom_number integer not null check (provider_kingdom_number between 1 and 9999),
  provider_tag text not null check (provider_tag = btrim(provider_tag) and provider_tag !~ '[[:cntrl:]]'),
  provider_alliance_id text not null check (provider_alliance_id = btrim(provider_alliance_id) and provider_alliance_id !~ '[[:cntrl:]]'),
  refresh_id uuid not null,
  refresh_envelope_sha256 text not null check (refresh_envelope_sha256 ~ '^[0-9a-f]{64}$'),
  alliance_name text null,
  alliance_power bigint null check (alliance_power is null or alliance_power >= 0),
  member_count integer null check (member_count is null or member_count >= 0),
  leader_identity text null,
  leader_name text null,
  flag_reference text null,
  power_rank integer null check (power_rank is null or power_rank >= 1),
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
  'Fingerprint of governed provider facts; refresh_id, not content, defines retry idempotency.';

create unique index alliance_intelligence_observations_refresh_idx
  on public.alliance_intelligence_observations (binding_id, refresh_id);
create index alliance_intelligence_observations_content_idx
  on public.alliance_intelligence_observations (binding_id, content_sha256);
create index alliance_intelligence_observations_latest_idx
  on public.alliance_intelligence_observations (binding_id, provider_fetched_at desc, observed_at desc);

create or replace function public.reject_alliance_provider_binding_identity_change()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.alliance_id <> old.alliance_id
    or new.provider <> old.provider
    or new.provider_kingdom_number <> old.provider_kingdom_number
    or new.provider_tag <> old.provider_tag
    or new.provider_alliance_id <> old.provider_alliance_id
    or new.source <> old.source
    or new.first_seen_at <> old.first_seen_at
    or new.created_at <> old.created_at then
    raise exception 'MightPulse provider binding identity is immutable; create a new historical binding.' using errcode = '55000';
  end if;
  return new;
end;
$$;

create trigger alliance_provider_bindings_identity_guard
before update on public.alliance_provider_bindings
for each row execute function public.reject_alliance_provider_binding_identity_change();

create or replace function public.reject_alliance_provider_aid_collision()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  aid_lock_key text := 'mightpulse:aid:' || new.provider || ':' || new.provider_alliance_id;
  tag_lock_key text := 'mightpulse:tag:' || new.provider || ':' || new.provider_kingdom_number::text || ':' || lower(new.provider_tag);
begin
  -- Serialize both logical identities before checking existing history. Hash
  -- collisions only over-serialize and cannot weaken correctness.
  -- A stable lexical order also prevents lock-order deadlocks when a refresh
  -- changes both identity dimensions.
  if aid_lock_key < tag_lock_key then
    perform pg_advisory_xact_lock(hashtextextended(aid_lock_key, 0));
    perform pg_advisory_xact_lock(hashtextextended(tag_lock_key, 0));
  else
    perform pg_advisory_xact_lock(hashtextextended(tag_lock_key, 0));
    perform pg_advisory_xact_lock(hashtextextended(aid_lock_key, 0));
  end if;
  if exists (
    select 1 from public.alliance_provider_bindings b
    where b.provider = new.provider
      and b.provider_alliance_id = new.provider_alliance_id
      and b.alliance_id <> new.alliance_id
      and b.id <> new.id
  ) then
    raise exception 'MightPulse aid is already bound to a different Forge Alliance.' using errcode = '23505';
  end if;
  if exists (
    select 1 from public.alliance_provider_bindings b
    where b.provider = new.provider
      and b.provider_kingdom_number = new.provider_kingdom_number
      and lower(b.provider_tag) = lower(new.provider_tag)
      and b.alliance_id <> new.alliance_id
      and b.id <> new.id
  ) then
    raise exception 'MightPulse case-normalized tag is already bound to a different Forge Alliance.' using errcode = '23505';
  end if;
  return new;
end;
$$;

create trigger alliance_provider_bindings_aid_collision_guard
before insert or update on public.alliance_provider_bindings
for each row execute function public.reject_alliance_provider_aid_collision();

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
  town_center_level integer null check (town_center_level is null or town_center_level between 1 and 84),
  kills bigint null check (kills is null or kills >= 0),
  alliance_rank integer null check (alliance_rank is null or alliance_rank between 1 and 5),
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

-- The only write boundary for a complete observation. The function is
-- SECURITY DEFINER so the tables need not grant INSERT to service_role.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;

create or replace function private.persist_mightpulse_alliance_observation(
  p_binding_id uuid,
  p_observation jsonb,
  p_roster jsonb,
  p_refresh_id uuid,
  p_content_sha256 text,
  p_refresh_envelope_sha256 text
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  binding public.alliance_provider_bindings;
  observation_id uuid;
  member jsonb;
  governor_id text;
begin
  if jsonb_typeof(p_observation) <> 'object' or jsonb_typeof(p_roster) <> 'array'
    or p_refresh_id is null
    or p_content_sha256 is null or p_content_sha256 !~ '^[0-9a-f]{64}$'
    or p_refresh_envelope_sha256 is null or p_refresh_envelope_sha256 !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid governed Alliance observation envelope.' using errcode = '22023';
  end if;

  select * into binding from public.alliance_provider_bindings where id = p_binding_id;
  if not found then raise exception 'Unknown Alliance provider binding.' using errcode = '23503'; end if;

  if jsonb_typeof(p_observation->'provider') <> 'string'
    or jsonb_typeof(p_observation->'provider_kingdom_number') <> 'number'
    or p_observation->>'provider_kingdom_number' !~ '^[0-9]+$'
    or jsonb_typeof(p_observation->'provider_tag') <> 'string'
    or jsonb_typeof(p_observation->'provider_alliance_id') <> 'string'
    or jsonb_typeof(p_observation->'alliance_name') not in ('null', 'string')
    or jsonb_typeof(p_observation->'leader_identity') not in ('null', 'string')
    or jsonb_typeof(p_observation->'leader_name') not in ('null', 'string')
    or jsonb_typeof(p_observation->'flag_reference') not in ('null', 'string')
    or jsonb_typeof(p_observation->'alliance_power') not in ('null', 'number')
    or jsonb_typeof(p_observation->'member_count') not in ('null', 'number')
    or jsonb_typeof(p_observation->'power_rank') not in ('null', 'number')
    or jsonb_typeof(p_observation->'freshness_shape') <> 'string' then
    raise exception 'Invalid Alliance observation primitive.' using errcode = '22023';
  end if;
  if p_observation->>'leader_identity' is not null and (char_length(p_observation->>'leader_identity') not between 1 and 120 or p_observation->>'leader_identity' <> btrim(p_observation->>'leader_identity') or p_observation->>'leader_identity' ~ '[[:cntrl:]]') then
    raise exception 'Invalid Alliance leader identity.' using errcode = '22023';
  end if;

  if p_observation->>'provider' <> binding.provider
    or (p_observation->>'provider_kingdom_number')::integer <> binding.provider_kingdom_number
    or p_observation->>'provider_tag' <> binding.provider_tag
    or p_observation->>'provider_alliance_id' <> binding.provider_alliance_id then
    raise exception 'Alliance observation provider identity does not match its selected binding.' using errcode = '22023';
  end if;

  if p_observation->>'member_count' is not null
    and (p_observation->>'member_count' !~ '^[0-9]+$'
      or (p_observation->>'member_count')::integer <> jsonb_array_length(p_roster)) then
    raise exception 'Invalid Alliance member count.' using errcode = '22023';
  end if;

  insert into public.alliance_intelligence_observations (
    binding_id, alliance_id, provider, provider_kingdom_number, provider_tag,
    provider_alliance_id, refresh_id, refresh_envelope_sha256, alliance_name, alliance_power, member_count,
    leader_identity, leader_name, flag_reference, power_rank, source, freshness_shape,
    info_fresh, roster_fresh, provider_fresh, provider_cached_at,
    provider_age_seconds, provider_fetched_at, observed_at, content_sha256
  ) values (
    binding.id, binding.alliance_id, binding.provider, binding.provider_kingdom_number,
    binding.provider_tag, binding.provider_alliance_id, p_refresh_id, p_refresh_envelope_sha256,
    p_observation->>'alliance_name', (p_observation->>'alliance_power')::bigint,
    (p_observation->>'member_count')::integer, p_observation->>'leader_identity', p_observation->>'leader_name',
    p_observation->>'flag_reference', (p_observation->>'power_rank')::integer,
    p_observation->>'source', p_observation->>'freshness_shape',
    (p_observation->>'info_fresh')::boolean, (p_observation->>'roster_fresh')::boolean,
    (p_observation->>'provider_fresh')::boolean, (p_observation->>'provider_cached_at')::timestamptz,
    (p_observation->>'provider_age_seconds')::integer, (p_observation->>'provider_fetched_at')::timestamptz,
    (p_observation->>'observed_at')::timestamptz, p_content_sha256
  ) on conflict (binding_id, refresh_id) do nothing returning id into observation_id;

  if observation_id is null then
    select id into observation_id from public.alliance_intelligence_observations
      where binding_id = p_binding_id and refresh_id = p_refresh_id
        and content_sha256 = p_content_sha256
        and refresh_envelope_sha256 = p_refresh_envelope_sha256;
    if observation_id is null then
      raise exception 'Refresh identity replay conflicts with its persisted envelope.' using errcode = '23505';
    end if;
    return observation_id;
  end if;

  for member in select value from jsonb_array_elements(p_roster) loop
    if jsonb_typeof(member) <> 'object' or jsonb_typeof(member->'governor_id') <> 'string'
      or nullif(member->>'governor_id', '') is null
      or jsonb_typeof(member->'provider_internal_uid') not in ('null', 'string')
      or jsonb_typeof(member->'provider_fid') not in ('null', 'string')
      or jsonb_typeof(member->'nickname') not in ('null', 'string')
      or jsonb_typeof(member->'power') not in ('null', 'number')
      or jsonb_typeof(member->'town_center_level') not in ('null', 'number')
      or jsonb_typeof(member->'kills') not in ('null', 'number')
      or jsonb_typeof(member->'alliance_rank') not in ('null', 'number')
      or jsonb_typeof(member->'alliance_rank_label') not in ('null', 'string')
      or (member ? 'last_active_value' and jsonb_typeof(member->'last_active_value') not in ('null', 'string', 'number', 'boolean')) then
      raise exception 'Invalid Alliance roster member primitive.' using errcode = '22023';
    end if;
    governor_id := member->>'governor_id';
    insert into public.alliance_roster_observations (
      alliance_observation_id, governor_id, provider_internal_uid, provider_fid,
      nickname, power, town_center_level, kills, alliance_rank, alliance_rank_label,
      kingdom_number, avatar_reference, last_active_value, online, source,
      provider_fresh, provider_cached_at, provider_age_seconds, provider_fetched_at,
      observed_at, player_account_id, match_status
    ) values (
      observation_id, governor_id, member->>'provider_internal_uid', member->>'provider_fid',
      member->>'nickname', (member->>'power')::bigint, (member->>'town_center_level')::integer,
      (member->>'kills')::bigint, (member->>'alliance_rank')::integer,
      member->>'alliance_rank_label', (member->>'kingdom_number')::integer,
      member->>'avatar_reference', case when member ? 'last_active_value' and jsonb_typeof(member->'last_active_value') <> 'null' then member->'last_active_value' else null end, (member->>'online')::boolean,
      p_observation->>'source', (p_observation->>'provider_fresh')::boolean,
      (p_observation->>'provider_cached_at')::timestamptz, (p_observation->>'provider_age_seconds')::integer,
      (p_observation->>'provider_fetched_at')::timestamptz, (p_observation->>'observed_at')::timestamptz,
      (member->>'player_account_id')::uuid, coalesce(member->>'match_status', 'unmatched')
    );
  end loop;
  return observation_id;
end;
$$;

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
revoke all on table public.alliance_provider_bindings from service_role;
revoke all on table public.alliance_intelligence_observations from service_role;
revoke all on table public.alliance_roster_observations from service_role;
revoke all on function public.reject_alliance_observation_mutation() from public, anon, authenticated;
revoke all on function public.validate_alliance_observation_binding() from public, anon, authenticated;
revoke all on function public.reject_alliance_provider_binding_identity_change() from public, anon, authenticated;
revoke all on function public.reject_alliance_provider_aid_collision() from public, anon, authenticated;
revoke all on function private.persist_mightpulse_alliance_observation(uuid, jsonb, jsonb, uuid, text, text) from public, anon, authenticated;
grant execute on function private.persist_mightpulse_alliance_observation(uuid, jsonb, jsonb, uuid, text, text) to service_role;

-- Rollback strategy (owner-gated, never run implicitly): drop dependent indexes,
-- triggers, function, and the three new tables in reverse dependency order.
-- No existing Alliance, membership, Player Account, authority, quota, or public
-- projection object is altered by this migration.

commit;
