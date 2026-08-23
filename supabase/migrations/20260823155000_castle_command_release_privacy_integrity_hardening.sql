begin;

-- CASTLE-COMMAND-001F release hardening.
-- Minimise raw authenticated column access and make session creation state
-- server-enforced rather than trusting a direct client insert.

revoke select on public.castle_command_sessions from authenticated;
grant select (
  id,
  alliance_id,
  title,
  impact_at,
  rally_preparation_seconds,
  status,
  closed_at,
  created_at,
  updated_at
) on public.castle_command_sessions to authenticated;

revoke select on public.castle_command_session_assignments from authenticated;
grant select (
  id,
  session_id,
  player_account_id,
  player_id_snapshot,
  player_name_snapshot,
  target,
  use_howler,
  howler_skill_level_snapshot,
  march_seconds,
  timing_source,
  needs_howler_calibration,
  profile_updated_at_snapshot,
  created_at,
  updated_at
) on public.castle_command_session_assignments to authenticated;

revoke select on public.castle_command_session_acknowledgements from authenticated;
grant select (
  session_id,
  player_account_id,
  status,
  ready_at,
  sent_at,
  created_at,
  updated_at
) on public.castle_command_session_acknowledgements to authenticated;

create or replace function public.enforce_castle_command_session_creation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status is distinct from 'planning' or new.closed_at is not null then
    raise exception 'Castle Command sessions must be created in planning state' using errcode = '22023';
  end if;

  if new.created_by is distinct from auth.uid() then
    raise exception 'Castle Command session creator mismatch' using errcode = '42501';
  end if;

  new.created_at := now();
  new.updated_at := new.created_at;
  return new;
end;
$$;

create trigger castle_command_sessions_enforce_creation
before insert on public.castle_command_sessions
for each row execute function public.enforce_castle_command_session_creation();

-- The alliance timing projection needs an opaque player_account_id so managers
-- can target the server-owned assignment RPC. It does not need to expose the
-- underlying Castle profile row id or Forge user id.
drop function public.list_castle_command_alliance_profiles(uuid);

create function public.list_castle_command_alliance_profiles(target_alliance_id uuid)
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
  order by lower(account.player_name), account.player_id, timing.target;
end;
$$;

revoke all on function public.list_castle_command_alliance_profiles(uuid) from public;
grant execute on function public.list_castle_command_alliance_profiles(uuid) to authenticated;

comment on function public.enforce_castle_command_session_creation() is
  'Forces new Castle Command sessions to begin in planning state with server-owned timestamps.';
comment on function public.list_castle_command_alliance_profiles(uuid) is
  'Returns the minimum shared identity/timing projection required for Castle assignment; raw profile/user ids stay private.';

commit;
