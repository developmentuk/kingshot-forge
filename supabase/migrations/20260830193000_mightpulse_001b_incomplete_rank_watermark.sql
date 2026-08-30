begin;

create or replace function public.advance_mightpulse_alliance_authority_watermark(
  p_user_id uuid,
  p_player_account_id uuid,
  p_kingdom_number integer,
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
as $watermark$
declare
  player_row public.player_accounts;
  authority_state public.player_alliance_provider_state;
  current_membership public.alliance_memberships;
begin
  if p_user_id is null
    or p_player_account_id is null
    or p_kingdom_number < 1
    or p_kingdom_number > 9999
    or p_observed_at is null
    or p_fetched_at is null
    or p_observed_at > p_fetched_at then
    raise exception 'Invalid MightPulse Alliance watermark input.'
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
    raise exception 'Linked Player account not found for Alliance watermark.'
      using errcode = 'P0002';
  end if;

  if player_row.kingdom_id <> p_kingdom_number then
    raise exception 'Player State conflicts with Alliance watermark State.'
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

  if authority_state.player_account_id is null
    or p_observed_at > authority_state.provider_observed_at then
    insert into public.player_alliance_provider_state (
      player_account_id,
      user_id,
      provider,
      provider_observed_at,
      provider_fetched_at,
      alliance_tag,
      member_role,
      updated_at
    )
    values (
      p_player_account_id,
      p_user_id,
      'mightpulse',
      p_observed_at,
      p_fetched_at,
      authority_state.alliance_tag,
      authority_state.member_role,
      p_fetched_at
    )
    on conflict (player_account_id) do update
    set
      user_id = excluded.user_id,
      provider = excluded.provider,
      provider_observed_at = excluded.provider_observed_at,
      provider_fetched_at = excluded.provider_fetched_at,
      alliance_tag = public.player_alliance_provider_state.alliance_tag,
      member_role = public.player_alliance_provider_state.member_role,
      updated_at = excluded.updated_at;
  end if;

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
end;
$watermark$;

revoke all on function public.advance_mightpulse_alliance_authority_watermark(
  uuid,
  uuid,
  integer,
  timestamptz,
  timestamptz
) from public;
revoke all on function public.advance_mightpulse_alliance_authority_watermark(
  uuid,
  uuid,
  integer,
  timestamptz,
  timestamptz
) from anon;
revoke all on function public.advance_mightpulse_alliance_authority_watermark(
  uuid,
  uuid,
  integer,
  timestamptz,
  timestamptz
) from authenticated;
grant execute on function public.advance_mightpulse_alliance_authority_watermark(
  uuid,
  uuid,
  integer,
  timestamptz,
  timestamptz
) to service_role;

create or replace function public.apply_mightpulse_player_intelligence_sync(
  p_user_id uuid,
  p_player_account_id uuid,
  p_player_id text,
  p_kingdom_number integer,
  p_player_name text,
  p_town_center_level integer,
  p_avatar_url text,
  p_request_reason text,
  p_sections text[],
  p_normalized_snapshot jsonb,
  p_content_sha256 text,
  p_provider_fetched_at timestamptz,
  p_provider_cached_at timestamptz,
  p_provider_age_seconds integer,
  p_provider_fresh boolean,
  p_apply_alliance_authority boolean,
  p_alliance_tag text,
  p_alliance_name text,
  p_member_role public.alliance_member_role,
  p_authority_observed_at timestamptz,
  p_quota_reservation_id uuid,
  p_quota_attempt_token uuid
)
returns table (
  observation_id uuid,
  alliance_id uuid,
  membership_id uuid,
  member_role public.alliance_member_role,
  admin_active boolean
)
language plpgsql
security definer
set search_path = public, pg_temp
as $apply$
declare
  player_row public.player_accounts;
  authority_result record;
  quota_completed integer;
  identity_observed_at timestamptz;
begin
  if p_user_id is null
    or p_player_account_id is null
    or p_player_id is null
    or p_player_id !~ '^[0-9]{1,20}$'
    or p_kingdom_number < 1
    or p_kingdom_number > 9999
    or p_player_name is null
    or btrim(p_player_name) = ''
    or p_request_reason <> all (
      array[
        'sign-in'::text,
        'automatic'::text,
        'manual'::text,
        'intelligence'::text
      ]
    )
    or p_sections is null
    or cardinality(p_sections) < 1
    or cardinality(p_sections) > 8
    or jsonb_typeof(p_normalized_snapshot) <> 'object'
    or p_content_sha256 !~ '^[0-9a-f]{64}$'
    or p_provider_fetched_at is null
    or p_quota_reservation_id is null
    or p_quota_attempt_token is null
    or (
      p_provider_cached_at is not null
      and p_provider_cached_at > p_provider_fetched_at
    )
    or (
      p_provider_age_seconds is not null
      and p_provider_age_seconds < 0
    )
    or (
      p_town_center_level is not null
      and (p_town_center_level < 1 or p_town_center_level > 84)
    )
    or (
      p_authority_observed_at is not null
      and p_authority_observed_at > p_provider_fetched_at
    ) then
    raise exception 'Invalid MightPulse Player intelligence sync input.'
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
    raise exception 'Linked Player account not found for intelligence sync.'
      using errcode = 'P0002';
  end if;

  if player_row.player_id <> p_player_id
    or player_row.kingdom_id <> p_kingdom_number then
    raise exception 'Player identity conflicts with intelligence sync.'
      using errcode = '22023';
  end if;

  identity_observed_at := case
    when p_provider_cached_at is not null then p_provider_cached_at
    when p_provider_age_seconds is not null then
      p_provider_fetched_at - make_interval(secs => p_provider_age_seconds)
    else null
  end;

  if identity_observed_at is not null
    and (
      player_row.last_refreshed_at is null
      or identity_observed_at >= player_row.last_refreshed_at
    ) then
    update public.player_accounts
    set
      player_name = p_player_name,
      town_center_level = coalesce(
        p_town_center_level,
        player_row.town_center_level
      ),
      profile_photo = coalesce(
        p_avatar_url,
        player_row.profile_photo
      ),
      last_refreshed_at = identity_observed_at,
      updated_at = p_provider_fetched_at
    where id = p_player_account_id
      and user_id = p_user_id
      and is_primary = true;
  end if;

  insert into public.player_intelligence_observations (
    player_account_id,
    provider,
    request_reason,
    sections,
    normalized_snapshot,
    content_sha256,
    provider_fetched_at,
    provider_cached_at,
    provider_age_seconds,
    provider_fresh
  )
  values (
    p_player_account_id,
    'mightpulse',
    p_request_reason,
    p_sections,
    p_normalized_snapshot,
    p_content_sha256,
    p_provider_fetched_at,
    p_provider_cached_at,
    p_provider_age_seconds,
    p_provider_fresh
  )
  returning id into observation_id;

  alliance_id := null;
  membership_id := null;
  member_role := null;
  admin_active := false;

  if p_apply_alliance_authority then
    if p_authority_observed_at is null then
      raise exception 'Alliance authority sync requires an observation time.'
        using errcode = '22023';
    end if;

    if nullif(btrim(p_alliance_tag), '') is not null
      and p_member_role is null then
      select *
      into authority_result
      from public.advance_mightpulse_alliance_authority_watermark(
        p_user_id,
        p_player_account_id,
        p_kingdom_number,
        p_authority_observed_at,
        p_provider_fetched_at
      );
    else
      select *
      into authority_result
      from public.sync_mightpulse_alliance_membership(
        p_user_id,
        p_player_account_id,
        p_kingdom_number,
        p_alliance_tag,
        p_alliance_name,
        p_member_role,
        p_authority_observed_at,
        p_provider_fetched_at
      );
    end if;

    alliance_id := authority_result.alliance_id;
    membership_id := authority_result.membership_id;
    member_role := authority_result.member_role;
    admin_active := authority_result.admin_active;
  end if;

  update public.provider_quota_reservations
  set
    status = 'completed',
    completed_at = clock_timestamp(),
    failed_at = null,
    lease_expires_at = clock_timestamp()
  where id = p_quota_reservation_id
    and attempt_token = p_quota_attempt_token
    and status = 'pending';

  get diagnostics quota_completed = row_count;

  if quota_completed <> 1 then
    raise exception 'Provider quota attempt is no longer active.'
      using errcode = '55000';
  end if;

  return next;
end;
$apply$;

revoke all on function public.apply_mightpulse_player_intelligence_sync(
  uuid,
  uuid,
  text,
  integer,
  text,
  integer,
  text,
  text,
  text[],
  jsonb,
  text,
  timestamptz,
  timestamptz,
  integer,
  boolean,
  boolean,
  text,
  text,
  public.alliance_member_role,
  timestamptz,
  uuid,
  uuid
) from public;
revoke all on function public.apply_mightpulse_player_intelligence_sync(
  uuid,
  uuid,
  text,
  integer,
  text,
  integer,
  text,
  text,
  text[],
  jsonb,
  text,
  timestamptz,
  timestamptz,
  integer,
  boolean,
  boolean,
  text,
  text,
  public.alliance_member_role,
  timestamptz,
  uuid,
  uuid
) from anon;
revoke all on function public.apply_mightpulse_player_intelligence_sync(
  uuid,
  uuid,
  text,
  integer,
  text,
  integer,
  text,
  text,
  text[],
  jsonb,
  text,
  timestamptz,
  timestamptz,
  integer,
  boolean,
  boolean,
  text,
  text,
  public.alliance_member_role,
  timestamptz,
  uuid,
  uuid
) from authenticated;
grant execute on function public.apply_mightpulse_player_intelligence_sync(
  uuid,
  uuid,
  text,
  integer,
  text,
  integer,
  text,
  text,
  text[],
  jsonb,
  text,
  timestamptz,
  timestamptz,
  integer,
  boolean,
  boolean,
  text,
  text,
  public.alliance_member_role,
  timestamptz,
  uuid,
  uuid
) to service_role;

commit;
