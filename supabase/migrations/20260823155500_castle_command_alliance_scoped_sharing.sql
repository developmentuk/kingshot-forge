begin;

-- CASTLE-COMMAND-001F privacy correction.
-- Sharing consent is scoped to the exact current alliance selected at save time;
-- it must not silently follow a player into a future alliance.

alter table public.castle_command_profiles
  add column shared_alliance_id uuid references public.alliances(id) on delete restrict;

-- Defensive handling for any unexpected rows created during an interrupted
-- activation sequence: never infer an alliance. Disable unbound sharing instead.
update public.castle_command_profiles
set share_with_alliance = false
where share_with_alliance = true
  and shared_alliance_id is null;

alter table public.castle_command_profiles
  add constraint castle_command_profiles_sharing_scope_check
  check (
    (share_with_alliance = false and shared_alliance_id is null)
    or (share_with_alliance = true and shared_alliance_id is not null)
  );

drop function public.save_castle_command_profile(
  uuid, smallint, boolean,
  integer, integer, integer, integer, integer, integer,
  integer, integer, integer, integer
);

create function public.save_castle_command_profile(
  target_player_account_id uuid,
  target_howler_skill_level smallint,
  target_share_with_alliance boolean,
  target_shared_alliance_id uuid,
  castle_normal_seconds integer,
  castle_howler_seconds integer,
  north_normal_seconds integer,
  north_howler_seconds integer,
  east_normal_seconds integer,
  east_howler_seconds integer,
  south_normal_seconds integer,
  south_howler_seconds integer,
  west_normal_seconds integer,
  west_howler_seconds integer
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  saved_profile_id uuid;
  resolved_shared_alliance_id uuid;
begin
  if target_howler_skill_level not between 1 and 8 then
    raise exception 'Invalid Howler skill level' using errcode = '22023';
  end if;

  if target_share_with_alliance is null then
    raise exception 'Castle Command sharing choice is required' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.player_accounts account
    where account.id = target_player_account_id
      and account.user_id = auth.uid()
  ) then
    raise exception 'Castle Command player profile access denied' using errcode = '42501';
  end if;

  if target_share_with_alliance then
    if target_shared_alliance_id is null
      or not public.current_user_is_alliance_member(target_shared_alliance_id) then
      raise exception 'Castle Command sharing requires a current alliance membership' using errcode = '42501';
    end if;
    resolved_shared_alliance_id := target_shared_alliance_id;
  else
    if target_shared_alliance_id is not null then
      raise exception 'Castle Command unshared profile cannot retain an alliance scope' using errcode = '22023';
    end if;
    resolved_shared_alliance_id := null;
  end if;

  insert into public.castle_command_profiles (
    player_account_id,
    user_id,
    howler_skill_level,
    share_with_alliance,
    shared_alliance_id
  ) values (
    target_player_account_id,
    auth.uid(),
    target_howler_skill_level,
    target_share_with_alliance,
    resolved_shared_alliance_id
  )
  on conflict (player_account_id) do update set
    howler_skill_level = excluded.howler_skill_level,
    share_with_alliance = excluded.share_with_alliance,
    shared_alliance_id = excluded.shared_alliance_id,
    updated_at = now()
  returning id into saved_profile_id;

  insert into public.castle_command_profile_targets (
    profile_id,
    target,
    normal_seconds,
    howler_seconds
  ) values
    (saved_profile_id, 'castle', castle_normal_seconds, castle_howler_seconds),
    (saved_profile_id, 'north', north_normal_seconds, north_howler_seconds),
    (saved_profile_id, 'east', east_normal_seconds, east_howler_seconds),
    (saved_profile_id, 'south', south_normal_seconds, south_howler_seconds),
    (saved_profile_id, 'west', west_normal_seconds, west_howler_seconds)
  on conflict (profile_id, target) do update set
    normal_seconds = excluded.normal_seconds,
    howler_seconds = excluded.howler_seconds,
    updated_at = now();

  return saved_profile_id;
end;
$$;

revoke all on function public.save_castle_command_profile(
  uuid, smallint, boolean, uuid,
  integer, integer, integer, integer, integer, integer,
  integer, integer, integer, integer
) from public;
grant execute on function public.save_castle_command_profile(
  uuid, smallint, boolean, uuid,
  integer, integer, integer, integer, integer, integer,
  integer, integer, integer, integer
) to authenticated;

create or replace function public.list_castle_command_alliance_profiles(target_alliance_id uuid)
returns table (
  player_account_id uuid,
  player_id text,
  player_name text,
  howler_skill_level smallint,
  profile_updated_at timestamptz,
  target text,
  normal_seconds integer,
  howler_seconds integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not (
    public.current_user_is_alliance_member(target_alliance_id)
    or public.can_manage_castle_command(target_alliance_id)
  ) then
    raise exception 'Castle Command alliance access denied' using errcode = '42501';
  end if;

  return query
  select
    profile.player_account_id,
    account.player_id,
    account.player_name,
    profile.howler_skill_level,
    profile.updated_at,
    timing.target,
    timing.normal_seconds,
    timing.howler_seconds
  from public.castle_command_profiles profile
  join public.player_accounts account on account.id = profile.player_account_id
  join public.alliance_memberships membership
    on membership.user_id = profile.user_id
   and membership.alliance_id = target_alliance_id
   and membership.status = 'current'::public.alliance_membership_status
  left join public.castle_command_profile_targets timing on timing.profile_id = profile.id
  where profile.share_with_alliance = true
    and profile.shared_alliance_id = target_alliance_id
  order by lower(account.player_name), account.player_id, timing.target;
end;
$$;

revoke all on function public.list_castle_command_alliance_profiles(uuid) from public;
grant execute on function public.list_castle_command_alliance_profiles(uuid) to authenticated;

comment on column public.castle_command_profiles.shared_alliance_id is
  'Exact current alliance that the profile owner explicitly consented to share Castle timings with.';

commit;
