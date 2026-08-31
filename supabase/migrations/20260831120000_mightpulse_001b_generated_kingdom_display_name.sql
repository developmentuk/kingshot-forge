begin;

-- MIGHTPULSE-001B production correction:
-- public.kingdoms.display_name is GENERATED ALWAYS from kingdom_number.
-- Alliance sync must not provide a non-DEFAULT value for that generated column.
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
  authority_override public.alliance_provider_authority_overrides;
  authority_override_history public.alliance_provider_authority_overrides;
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

  normalized_tag := upper(nullif(btrim(p_alliance_tag), ''));
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
      null,
      null,
      p_fetched_at
    )
    on conflict (player_account_id) do update
    set
      user_id = excluded.user_id,
      provider = excluded.provider,
      provider_observed_at = excluded.provider_observed_at,
      provider_fetched_at = excluded.provider_fetched_at,
      alliance_tag = excluded.alliance_tag,
      member_role = excluded.member_role,
      updated_at = excluded.updated_at;

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
    kingdom_number
  )
  values (
    p_kingdom_number
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

  select *
  into authority_override
  from public.alliance_provider_authority_overrides override_row
  where override_row.alliance_id = alliance_row.id
    and override_row.user_id = p_user_id
    and override_row.cleared_at is null
    and (
      override_row.suspended_until is null
      or override_row.suspended_until > p_fetched_at
    )
  for update;

  select *
  into authority_override_history
  from public.alliance_provider_authority_overrides override_row
  where override_row.alliance_id = alliance_row.id
    and override_row.user_id = p_user_id
  for update;

  if management_role
    and authority_override.alliance_id is null
    and previous_admin.id is not null
    and previous_admin.is_active = false
    and previous_admin.revoked_at is not null
    and (
      (
        authority_state.player_account_id is not null
        and authority_state.alliance_tag = normalized_tag
        and authority_state.member_role in ('r4', 'leader')
        and previous_admin.revoked_at >= authority_state.provider_fetched_at
      )
      or (
        authority_state.player_account_id is null
        and previous_admin.role in ('r4', 'leader')
      )
    )
    and (
      authority_override_history.alliance_id is null
      or previous_admin.revoked_at > greatest(
        coalesce(
          authority_override_history.cleared_at,
          '-infinity'::timestamptz
        ),
        coalesce(
          authority_override_history.suspended_until,
          '-infinity'::timestamptz
        ),
        coalesce(
          authority_override_history.updated_at,
          '-infinity'::timestamptz
        )
      )
    ) then

    insert into public.alliance_provider_authority_overrides (
      alliance_id,
      user_id,
      suspended_at,
      suspended_until,
      reason,
      suspended_by,
      cleared_at,
      cleared_by,
      updated_at
    )
    values (
      alliance_row.id,
      p_user_id,
      previous_admin.revoked_at,
      null,
      'Existing manual/emergency Alliance-admin revocation preserved against MightPulse reactivation.',
      null,
      null,
      null,
      p_fetched_at
    )
    on conflict (alliance_id, user_id) do update
    set
      suspended_at = excluded.suspended_at,
      suspended_until = null,
      reason = excluded.reason,
      suspended_by = excluded.suspended_by,
      cleared_at = null,
      cleared_by = null,
      updated_at = excluded.updated_at;

    select *
    into authority_override
    from public.alliance_provider_authority_overrides override_row
    where override_row.alliance_id = alliance_row.id
      and override_row.user_id = p_user_id
    for update;

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
      'mightpulse_manual_suspension_preserved',
      to_jsonb(previous_admin),
      to_jsonb(authority_override),
      'Manual/emergency Alliance-admin revocation converted into a provider-authority suspension ceiling.'
    );
  end if;

  if management_role and authority_override.alliance_id is not null then
    if previous_admin.id is not null then
      update public.alliance_admins
      set
        role = p_member_role,
        is_active = false,
        revoked_at = coalesce(previous_admin.revoked_at, authority_override.suspended_at),
        updated_at = greatest(previous_admin.updated_at, p_fetched_at)
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
      'mightpulse_admin_suspension_preserved',
      case when previous_admin.id is null then null else to_jsonb(previous_admin) end,
      case when resulting_admin.id is null then to_jsonb(authority_override) else to_jsonb(resulting_admin) end,
      'Active manual/emergency suspension prevented MightPulse R4/R5 authority reactivation.'
    );

  elsif management_role then
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
    normalized_tag,
    p_member_role,
    p_fetched_at
  )
  on conflict (player_account_id) do update
  set
    user_id = excluded.user_id,
    provider = excluded.provider,
    provider_observed_at = excluded.provider_observed_at,
    provider_fetched_at = excluded.provider_fetched_at,
    alliance_tag = excluded.alliance_tag,
    member_role = excluded.member_role,
    updated_at = excluded.updated_at;

  alliance_id := alliance_row.id;
  membership_id := resulting_membership.id;
  member_role := resulting_membership.member_role;
  admin_active := management_role
    and authority_override.alliance_id is null;
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
  timestamptz,
  timestamptz
) from public;
revoke all on function public.sync_mightpulse_alliance_membership(
  uuid,
  uuid,
  integer,
  text,
  text,
  public.alliance_member_role,
  timestamptz,
  timestamptz
) from anon;
revoke all on function public.sync_mightpulse_alliance_membership(
  uuid,
  uuid,
  integer,
  text,
  text,
  public.alliance_member_role,
  timestamptz,
  timestamptz
) from authenticated;
grant execute on function public.sync_mightpulse_alliance_membership(
  uuid,
  uuid,
  integer,
  text,
  text,
  public.alliance_member_role,
  timestamptz,
  timestamptz
) to service_role;

commit;
