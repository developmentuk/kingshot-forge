begin;

insert into public.forge_permissions (permission_key, label, description)
values (
  'users.manage_players',
  'Manage linked Player Accounts',
  'Lookup, link and correct Player IDs and States through audited Operations workflows.'
)
on conflict (permission_key) do update set
  label = excluded.label,
  description = excluded.description;

insert into public.forge_role_permissions (role, permission_key)
values
  ('owner', 'users.manage_players'),
  ('admin', 'users.manage_players')
on conflict (role, permission_key) do nothing;

create or replace function public.admin_link_player_account(
  p_actor_user_id uuid,
  p_target_user_id uuid,
  p_player_id text,
  p_kingdom_id integer,
  p_player_name text,
  p_player_level integer,
  p_level_rendered text,
  p_level_rendered_detailed text,
  p_level_image text,
  p_profile_photo text,
  p_verification_status public.player_verification_status,
  p_verification_method public.player_verification_method,
  p_reason text,
  p_replace_existing boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_existing public.player_accounts%rowtype;
  v_saved public.player_accounts%rowtype;
  v_now timestamptz := now();
  v_before jsonb := '{}'::jsonb;
  v_actor_active boolean;
begin
  if not exists (
    select 1
    from (
      select role from public.forge_user_role_assignments
      where user_id = p_actor_user_id and active = true
      union
      select role from public.forge_user_roles
      where user_id = p_actor_user_id
    ) actor_roles
    join public.forge_role_permissions permissions
      on permissions.role = actor_roles.role
    where permissions.permission_key = 'users.manage_players'
  ) then
    raise exception 'Player account management permission is required.' using errcode = '42501';
  end if;

  select coalesce(status = 'active', true)
  into v_actor_active
  from public.forge_user_account_status
  where user_id = p_actor_user_id;

  if coalesce(v_actor_active, true) is not true then
    raise exception 'The actor account is not active for privileged operations.' using errcode = '42501';
  end if;

  if not exists (select 1 from public.profiles where id = p_target_user_id) then
    raise exception 'Forge user not found.' using errcode = 'P0002';
  end if;

  if p_player_id is null or p_player_id !~ '^[0-9]{1,20}$' then
    raise exception 'Enter a valid Kingshot Player ID.' using errcode = '22023';
  end if;
  if p_kingdom_id is null or p_kingdom_id < 1 or p_kingdom_id > 9999 then
    raise exception 'Enter a valid Kingshot State between 1 and 9999.' using errcode = '22023';
  end if;
  if p_player_name is null or btrim(p_player_name) = '' or char_length(btrim(p_player_name)) > 120 then
    raise exception 'A player name of 1 to 120 characters is required.' using errcode = '22023';
  end if;
  if p_reason is null or char_length(btrim(p_reason)) < 3 or char_length(btrim(p_reason)) > 2000 then
    raise exception 'A mutation reason of 3 to 2000 characters is required.' using errcode = '22023';
  end if;

  select * into v_existing
  from public.player_accounts
  where user_id = p_target_user_id
  for update;

  if found then
    v_before := jsonb_build_object(
      'playerAccountId', v_existing.id,
      'playerIdLast4', right(v_existing.player_id, 4),
      'kingdomId', v_existing.kingdom_id,
      'verificationStatus', v_existing.verification_status,
      'verificationMethod', v_existing.verification_method
    );
    if v_existing.player_id <> p_player_id and not p_replace_existing then
      raise exception 'A different Kingshot player is already linked. Confirm replacement before applying.' using errcode = 'P0001';
    end if;
  end if;

  if exists (
    select 1 from public.player_accounts
    where player_id = p_player_id and user_id <> p_target_user_id
  ) then
    raise exception 'This Kingshot player is already linked to another Forge account.' using errcode = '23505';
  end if;

  insert into public.player_accounts (
    user_id, player_id, player_name, kingdom_id, player_level,
    level_rendered, level_rendered_detailed, level_image, profile_photo,
    verification_status, verification_method, verified_by, verified_at,
    last_refreshed_at, is_primary, is_public, created_at, updated_at
  ) values (
    p_target_user_id, p_player_id, btrim(p_player_name), p_kingdom_id, p_player_level,
    nullif(btrim(coalesce(p_level_rendered, '')), ''),
    nullif(btrim(coalesce(p_level_rendered_detailed, '')), ''),
    nullif(btrim(coalesce(p_level_image, '')), ''),
    nullif(btrim(coalesce(p_profile_photo, '')), ''),
    p_verification_status, p_verification_method, p_actor_user_id, v_now,
    v_now, true, true, v_now, v_now
  )
  on conflict (user_id) do update set
    player_id = excluded.player_id,
    player_name = excluded.player_name,
    kingdom_id = excluded.kingdom_id,
    player_level = excluded.player_level,
    level_rendered = excluded.level_rendered,
    level_rendered_detailed = excluded.level_rendered_detailed,
    level_image = excluded.level_image,
    profile_photo = excluded.profile_photo,
    verification_status = excluded.verification_status,
    verification_method = excluded.verification_method,
    verified_by = excluded.verified_by,
    verified_at = excluded.verified_at,
    last_refreshed_at = excluded.last_refreshed_at,
    is_primary = true,
    updated_at = excluded.updated_at
  returning * into v_saved;

  insert into public.forge_identity_audit_events (
    actor_user_id, target_user_id, action, domain, reason, before_state, after_state
  ) values (
    p_actor_user_id,
    p_target_user_id,
    case when v_existing.id is null then 'player_account_linked' else 'player_account_relinked' end,
    'player_identity',
    btrim(p_reason),
    v_before,
    jsonb_build_object(
      'playerAccountId', v_saved.id,
      'playerIdLast4', right(v_saved.player_id, 4),
      'kingdomId', v_saved.kingdom_id,
      'verificationStatus', v_saved.verification_status,
      'verificationMethod', v_saved.verification_method,
      'replacedExisting', v_existing.id is not null and v_existing.player_id <> v_saved.player_id
    )
  );

  return jsonb_build_object(
    'playerAccountId', v_saved.id,
    'playerId', v_saved.player_id,
    'playerName', v_saved.player_name,
    'kingdomId', v_saved.kingdom_id,
    'verificationStatus', v_saved.verification_status,
    'verificationMethod', v_saved.verification_method,
    'verifiedAt', v_saved.verified_at,
    'isPrimary', v_saved.is_primary
  );
end;
$$;

revoke all on function public.admin_link_player_account(
  uuid, uuid, text, integer, text, integer, text, text, text, text,
  public.player_verification_status, public.player_verification_method,
  text, boolean
) from public, anon, authenticated;

grant execute on function public.admin_link_player_account(
  uuid, uuid, text, integer, text, integer, text, text, text, text,
  public.player_verification_status, public.player_verification_method,
  text, boolean
) to service_role;

commit;
