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
  'Server-only rolling provider request reservations used to coordinate shared API-key limits across runtime instances. The daily budget is enforced over a conservative rolling 24-hour window.';

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
    and reservation.reserved_at > now_at - interval '24 hours';

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

create table if not exists public.player_alliance_provider_state (
  player_account_id uuid primary key
    references public.player_accounts(id) on delete cascade,
  user_id uuid not null
    references public.profiles(id) on delete cascade,
  provider text not null
    check (provider = 'mightpulse'),
  provider_observed_at timestamptz not null,
  provider_fetched_at timestamptz not null,
  alliance_tag text null,
  member_role public.alliance_member_role null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (alliance_tag is null and member_role is null)
    or (alliance_tag is not null and member_role is not null)
  )
);

comment on table public.player_alliance_provider_state is
  'Server-only last-applied MightPulse Alliance authority observation per linked Player. Used to prevent stale provider snapshots from rolling membership or rank backwards.';

alter table public.player_alliance_provider_state enable row level security;

revoke all on table public.player_alliance_provider_state from public;
revoke all on table public.player_alliance_provider_state from anon;
revoke all on table public.player_alliance_provider_state from authenticated;
grant select, insert, update on table public.player_alliance_provider_state
  to service_role;

create or replace function public.sync_mightpulse_alliance_membership(
  p_user_id uuid,
  p_player_account_id uuid,
  p_kingdom_number integer,
  p_alliance_tag text,
  p_alliance_name text,
  p_member_role public.alliance_member_role,
  p_observed_at timestamptz,
  p_fetched_at timestamptz
)
returns table (
  alliance_id uuid,
  membership_id uuid,
  member_role public.alliance_member_role,
  admin_active boolean
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  player_row public.player_accounts;
  kingdom_row public.kingdoms;
  alliance_row public.alliances;
  current_membership public.alliance_memberships;
  resulting_membership public.alliance_memberships;
  previous_admin public.alliance_admins;
  resulting_admin public.alliance_admins;
  authority_state public.player_alliance_provider_state;
  normalized_tag text;
  normalized_name text;
  management_role boolean;
begin
  if p_user_id is null
    or p_player_account_id is null
    or p_kingdom_number < 1
    or p_kingdom_number > 9999
    or p_observed_at is null
    or p_fetched_at is null
    or p_observed_at > p_fetched_at then
    raise exception 'Invalid MightPulse Alliance sync input.'
      using errcode = '22023';
  end if;

  select *
  into player_row
  from public.player_accounts account
  where account.id = p_player_account_id
    and account.user_id = p_user_id
    and account.is_primary = true
  for update;

  if player_row.id is null then
    raise exception 'Linked Player account not found for Alliance sync.'
      using errcode = 'P0002';
  end if;

  if player_row.kingdom_id <> p_kingdom_number then
    raise exception 'Player State conflicts with Alliance sync State.'
      using errcode = '22023';
  end if;

  select *
  into authority_state
  from public.player_alliance_provider_state state
  where state.player_account_id = p_player_account_id
  for update;

  select *
  into current_membership
  from public.alliance_memberships membership
  where membership.player_account_id = p_player_account_id
    and membership.status = 'current'
  for update;

  if authority_state.player_account_id is not null
    and p_observed_at <= authority_state.provider_observed_at then
    alliance_id := current_membership.alliance_id;
    membership_id := current_membership.id;
    member_role := current_membership.member_role;
    admin_active := current_membership.id is not null and exists (
      select 1
      from public.alliance_admins administrator
      where administrator.alliance_id = current_membership.alliance_id
        and administrator.user_id = p_user_id
        and administrator.is_active = true
        and administrator.revoked_at is null
    );
    return next;
    return;
  end if;

  normalized_tag := nullif(btrim(p_alliance_tag), '');
  normalized_name := nullif(btrim(p_alliance_name), '');

  if normalized_tag is null then
    if current_membership.id is not null then
      update public.alliance_memberships
      set
        status = 'previous',
        left_at = p_observed_at,
        updated_at = p_observed_at,
        review_notes = 'Membership superseded by MightPulse Alliance observation.'
      where id = current_membership.id
      returning * into resulting_membership;

      select *
      into previous_admin
      from public.alliance_admins administrator
      where administrator.alliance_id = current_membership.alliance_id
        and administrator.user_id = p_user_id
      for update;

      if previous_admin.id is not null and previous_admin.is_active = true then
        update public.alliance_admins
        set
          is_active = false,
          revoked_at = p_observed_at,
          updated_at = p_observed_at
        where id = previous_admin.id
        returning * into resulting_admin;

        insert into public.alliance_audit_log (
          alliance_id,
          user_id,
          player_account_id,
          action,
          previous_data,
          new_data,
          notes
        )
        values (
          current_membership.alliance_id,
          p_user_id,
          p_player_account_id,
          'mightpulse_admin_revoked',
          to_jsonb(previous_admin),
          to_jsonb(resulting_admin),
          'MightPulse reported no current Alliance.'
        );
      end if;

      insert into public.alliance_audit_log (
        alliance_id,
        user_id,
        player_account_id,
        action,
        previous_data,
        new_data,
        notes
      )
      values (
        current_membership.alliance_id,
        p_user_id,
        p_player_account_id,
        'mightpulse_membership_ended',
        to_jsonb(current_membership),
        to_jsonb(resulting_membership),
        'MightPulse reported no current Alliance.'
      );
    end if;

    alliance_id := null;
    membership_id := null;
    member_role := null;
    admin_active := false;
    return next;
    return;
  end if;

  if char_length(normalized_tag) < 2
    or char_length(normalized_tag) > 12
    or normalized_name is null
    or p_member_role is null then
    raise exception 'Invalid MightPulse Alliance identity or rank.'
      using errcode = '22023';
  end if;

  insert into public.kingdoms (
    kingdom_number,
    display_name
  )
  values (
    p_kingdom_number,
    'State ' || p_kingdom_number::text
  )
  on conflict (kingdom_number) do nothing;

  select *
  into kingdom_row
  from public.kingdoms kingdom
  where kingdom.kingdom_number = p_kingdom_number
  for update;

  if kingdom_row.id is null then
    raise exception 'Unable to resolve canonical State.'
      using errcode = 'P0002';
  end if;

  insert into public.alliances (
    kingdom_id,
    kingdom_number,
    tag,
    name,
    verification_status,
    recruitment_status,
    is_public,
    is_active
  )
  values (
    kingdom_row.id,
    p_kingdom_number,
    normalized_tag,
    normalized_name,
    'unverified',
    'unknown',
    true,
    true
  )
  on conflict (kingdom_id, tag) do nothing;

  select *
  into alliance_row
  from public.alliances alliance
  where alliance.kingdom_id = kingdom_row.id
    and alliance.tag = normalized_tag
  for update;

  if alliance_row.id is null then
    raise exception 'Unable to resolve canonical Alliance.'
      using errcode = 'P0002';
  end if;

  if current_membership.id is not null
    and current_membership.alliance_id <> alliance_row.id then
    update public.alliance_memberships
    set
      status = 'previous',
      left_at = p_observed_at,
      updated_at = p_observed_at,
      review_notes = 'Membership superseded by MightPulse Alliance observation.'
    where id = current_membership.id
    returning * into resulting_membership;

    select *
    into previous_admin
    from public.alliance_admins administrator
    where administrator.alliance_id = current_membership.alliance_id
      and administrator.user_id = p_user_id
    for update;

    if previous_admin.id is not null and previous_admin.is_active = true then
      update public.alliance_admins
      set
        is_active = false,
        revoked_at = p_observed_at,
        updated_at = p_observed_at
      where id = previous_admin.id
      returning * into resulting_admin;

      insert into public.alliance_audit_log (
        alliance_id,
        user_id,
        player_account_id,
        action,
        previous_data,
        new_data,
        notes
      )
      values (
        current_membership.alliance_id,
        p_user_id,
        p_player_account_id,
        'mightpulse_admin_revoked',
        to_jsonb(previous_admin),
        to_jsonb(resulting_admin),
        'MightPulse reported a different current Alliance.'
      );
    end if;

    insert into public.alliance_audit_log (
      alliance_id,
      user_id,
      player_account_id,
      action,
      previous_data,
      new_data,
      notes
    )
    values (
      current_membership.alliance_id,
      p_user_id,
      p_player_account_id,
      'mightpulse_membership_moved',
      to_jsonb(current_membership),
      to_jsonb(resulting_membership),
      'MightPulse reported a different current Alliance.'
    );

    current_membership := null;
  end if;

  update public.alliance_memberships
  set
    status = 'removed',
    left_at = p_observed_at,
    updated_at = p_observed_at,
    review_notes = 'Pending request superseded by MightPulse current Alliance observation.'
  where player_account_id = p_player_account_id
    and status = 'pending';

  if current_membership.id is null then
    insert into public.alliance_memberships (
      alliance_id,
      player_account_id,
      user_id,
      kingdom_id,
      kingdom_number,
      status,
      member_role,
      joined_at,
      left_at,
      review_notes
    )
    values (
      alliance_row.id,
      p_player_account_id,
      p_user_id,
      kingdom_row.id,
      p_kingdom_number,
      'current',
      p_member_role,
      p_observed_at,
      null,
      'Membership synchronised from MightPulse.'
    )
    returning * into resulting_membership;

    insert into public.alliance_audit_log (
      alliance_id,
      user_id,
      player_account_id,
      action,
      new_data,
      notes
    )
    values (
      alliance_row.id,
      p_user_id,
      p_player_account_id,
      'mightpulse_membership_created',
      to_jsonb(resulting_membership),
      'Current Alliance membership synchronised from MightPulse.'
    );
  else
    update public.alliance_memberships
    set
      kingdom_id = kingdom_row.id,
      kingdom_number = p_kingdom_number,
      member_role = p_member_role,
      status = 'current',
      left_at = null,
      updated_at = p_observed_at,
      review_notes = 'Membership synchronised from MightPulse.'
    where id = current_membership.id
    returning * into resulting_membership;

    if current_membership.member_role is distinct from resulting_membership.member_role then
      insert into public.alliance_audit_log (
        alliance_id,
        user_id,
        player_account_id,
        action,
        previous_data,
        new_data,
        notes
      )
      values (
        alliance_row.id,
        p_user_id,
        p_player_account_id,
        'mightpulse_rank_changed',
        to_jsonb(current_membership),
        to_jsonb(resulting_membership),
        'Alliance rank synchronised from MightPulse.'
      );
    end if;
  end if;

  management_role := p_member_role in ('r4', 'leader');

  select *
  into previous_admin
  from public.alliance_admins administrator
  where administrator.alliance_id = alliance_row.id
    and administrator.user_id = p_user_id
  for update;

  if management_role then
    if previous_admin.id is null then
      insert into public.alliance_admins (
        alliance_id,
        user_id,
        role,
        can_manage_members,
        can_manage_recruitment,
        can_manage_transfers,
        can_manage_discord,
        can_manage_events,
        granted_by,
        granted_at,
        revoked_at,
        is_active,
        updated_at
      )
      values (
        alliance_row.id,
        p_user_id,
        p_member_role,
        true,
        true,
        true,
        true,
        true,
        null,
        p_observed_at,
        null,
        true,
        p_observed_at
      )
      returning * into resulting_admin;
    else
      update public.alliance_admins
      set
        role = p_member_role,
        can_manage_members = true,
        can_manage_recruitment = true,
        can_manage_transfers = true,
        can_manage_discord = true,
        can_manage_events = true,
        revoked_at = null,
        is_active = true,
        updated_at = p_observed_at
      where id = previous_admin.id
      returning * into resulting_admin;
    end if;

    insert into public.alliance_audit_log (
      alliance_id,
      user_id,
      player_account_id,
      action,
      previous_data,
      new_data,
      notes
    )
    values (
      alliance_row.id,
      p_user_id,
      p_player_account_id,
      'mightpulse_admin_synced',
      case when previous_admin.id is null then null else to_jsonb(previous_admin) end,
      to_jsonb(resulting_admin),
      'R4/R5 Alliance-management authority synchronised from MightPulse.'
    );
  elsif previous_admin.id is not null and previous_admin.is_active = true then
    update public.alliance_admins
    set
      role = p_member_role,
      is_active = false,
      revoked_at = p_observed_at,
      updated_at = p_observed_at
    where id = previous_admin.id
    returning * into resulting_admin;

    insert into public.alliance_audit_log (
      alliance_id,
      user_id,
      player_account_id,
      action,
      previous_data,
      new_data,
      notes
    )
    values (
      alliance_row.id,
      p_user_id,
      p_player_account_id,
      'mightpulse_admin_revoked',
      to_jsonb(previous_admin),
      to_jsonb(resulting_admin),
      'MightPulse rank is below R4.'
    );
  end if;

  alliance_id := alliance_row.id;
  membership_id := resulting_membership.id;
  member_role := resulting_membership.member_role;
  admin_active := management_role;
  return next;
end;
$$;

revoke all on function public.sync_mightpulse_alliance_membership(
  uuid,
  uuid,
  integer,
  text,
  text,
  public.alliance_member_role,
  timestamptz
) from public;
revoke all on function public.sync_mightpulse_alliance_membership(
  uuid,
  uuid,
  integer,
  text,
  text,
  public.alliance_member_role,
  timestamptz
) from anon;
revoke all on function public.sync_mightpulse_alliance_membership(
  uuid,
  uuid,
  integer,
  text,
  text,
  public.alliance_member_role,
  timestamptz
) from authenticated;
grant execute on function public.sync_mightpulse_alliance_membership(
  uuid,
  uuid,
  integer,
  text,
  text,
  public.alliance_member_role,
  timestamptz
) to service_role;

commit;
