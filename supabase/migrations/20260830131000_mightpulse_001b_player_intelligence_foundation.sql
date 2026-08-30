begin;

create table if not exists public.player_intelligence_observations (
  id uuid primary key default gen_random_uuid(),
  player_account_id uuid not null
    references public.player_accounts(id) on delete cascade,
  provider text not null
    check (provider = 'mightpulse'),
  request_reason text not null
    check (
      request_reason = any (
        array[
          'sign-in'::text,
          'automatic'::text,
          'manual'::text,
          'intelligence'::text
        ]
      )
    ),
  sections text[] not null
    check (cardinality(sections) >= 1 and cardinality(sections) <= 8),
  normalized_snapshot jsonb not null
    check (jsonb_typeof(normalized_snapshot) = 'object'::text),
  content_sha256 text not null
    check (content_sha256 ~ '^[0-9a-f]{64}$'),
  provider_fetched_at timestamptz not null,
  provider_cached_at timestamptz null,
  provider_age_seconds integer null
    check (provider_age_seconds is null or provider_age_seconds >= 0),
  provider_fresh boolean null,
  created_at timestamptz not null default now()
);

comment on table public.player_intelligence_observations is
  'Immutable, server-only allowlisted MightPulse Player intelligence observations. Raw provider payloads are not stored here.';

comment on column public.player_intelligence_observations.normalized_snapshot is
  'Validated Forge-normalised Player intelligence. Restricted fields remain server-only unless explicitly projected by a governed API.';

create index if not exists player_intelligence_observations_latest_idx
  on public.player_intelligence_observations (
    player_account_id,
    provider_fetched_at desc,
    created_at desc
  );

create index if not exists player_intelligence_observations_hash_idx
  on public.player_intelligence_observations (
    player_account_id,
    content_sha256
  );

create or replace function public.reject_player_intelligence_observation_mutation()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  raise exception 'Player intelligence observations are immutable.'
    using errcode = '55000';
end;
$$;

drop trigger if exists reject_player_intelligence_observation_mutation
  on public.player_intelligence_observations;

create trigger reject_player_intelligence_observation_mutation
before update or delete
on public.player_intelligence_observations
for each row
execute function public.reject_player_intelligence_observation_mutation();

alter table public.player_intelligence_observations enable row level security;

revoke all on table public.player_intelligence_observations from public;
revoke all on table public.player_intelligence_observations from anon;
revoke all on table public.player_intelligence_observations from authenticated;
grant select, insert on table public.player_intelligence_observations to service_role;

create table if not exists public.provider_quota_reservations (
  id uuid primary key default gen_random_uuid(),
  provider text not null
    check (provider = 'mightpulse'),
  category text not null
    check (
      category = any (
        array[
          'player_link'::text,
          'player_sign_in'::text,
          'player_manual'::text,
          'player_automatic'::text,
          'player_intelligence'::text,
          'alliance_roster'::text,
          'kingdom'::text,
          'kvk_target'::text
        ]
      )
    ),
  priority text not null
    check (priority = any (array['high'::text, 'normal'::text, 'low'::text])),
  reserved_at timestamptz not null default clock_timestamp()
);

comment on table public.provider_quota_reservations is
  'Server-only rolling provider request reservations used to coordinate shared API-key limits across runtime instances.';

create index if not exists provider_quota_reservations_provider_time_idx
  on public.provider_quota_reservations (provider, reserved_at desc);

alter table public.provider_quota_reservations enable row level security;

revoke all on table public.provider_quota_reservations from public;
revoke all on table public.provider_quota_reservations from anon;
revoke all on table public.provider_quota_reservations from authenticated;
revoke all on table public.provider_quota_reservations from service_role;

create or replace function public.reserve_provider_request(
  p_provider text,
  p_category text,
  p_priority text default 'normal'
)
returns table (
  allowed boolean,
  reservation_id uuid,
  minute_used integer,
  day_used integer,
  minute_limit integer,
  day_limit integer,
  normal_day_limit integer
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  now_at timestamptz := clock_timestamp();
  day_start timestamptz;
  minute_count integer;
  day_count integer;
  effective_day_limit integer;
  created_id uuid;
begin
  if p_provider <> 'mightpulse' then
    raise exception 'Unsupported provider.'
      using errcode = '22023';
  end if;

  if p_category <> all (
    array[
      'player_link'::text,
      'player_sign_in'::text,
      'player_manual'::text,
      'player_automatic'::text,
      'player_intelligence'::text,
      'alliance_roster'::text,
      'kingdom'::text,
      'kvk_target'::text
    ]
  ) then
    raise exception 'Unsupported provider request category.'
      using errcode = '22023';
  end if;

  if p_priority <> all (array['high'::text, 'normal'::text, 'low'::text]) then
    raise exception 'Unsupported provider request priority.'
      using errcode = '22023';
  end if;

  minute_limit := 60;
  day_limit := 5000;
  normal_day_limit := 4500;
  effective_day_limit := case
    when p_priority = 'high' then day_limit
    else normal_day_limit
  end;

  day_start := (
    date_trunc('day', now_at at time zone 'UTC')
    at time zone 'UTC'
  );

  perform pg_advisory_xact_lock(
    hashtextextended('forge-provider-quota:' || p_provider, 0)
  );

  select count(*)::integer
  into minute_count
  from public.provider_quota_reservations reservation
  where reservation.provider = p_provider
    and reservation.reserved_at > now_at - interval '60 seconds';

  select count(*)::integer
  into day_count
  from public.provider_quota_reservations reservation
  where reservation.provider = p_provider
    and reservation.reserved_at >= day_start;

  if minute_count >= minute_limit
    or day_count >= effective_day_limit then
    allowed := false;
    reservation_id := null;
    minute_used := minute_count;
    day_used := day_count;
    return next;
    return;
  end if;

  created_id := gen_random_uuid();

  insert into public.provider_quota_reservations (
    id,
    provider,
    category,
    priority,
    reserved_at
  )
  values (
    created_id,
    p_provider,
    p_category,
    p_priority,
    now_at
  );

  allowed := true;
  reservation_id := created_id;
  minute_used := minute_count + 1;
  day_used := day_count + 1;
  return next;
end;
$$;

revoke all on function public.reserve_provider_request(text, text, text)
  from public;
revoke all on function public.reserve_provider_request(text, text, text)
  from anon;
revoke all on function public.reserve_provider_request(text, text, text)
  from authenticated;
grant execute on function public.reserve_provider_request(text, text, text)
  to service_role;

commit;
