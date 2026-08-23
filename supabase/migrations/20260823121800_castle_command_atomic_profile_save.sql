begin;

-- CASTLE-COMMAND-001B hardening: player timing writes are one atomic RPC and
-- session ownership fields cannot be rewritten after creation.

create or replace function public.save_castle_command_profile(
  target_player_account_id uuid,
  target_howler_skill_level smallint,
  target_share_with_alliance boolean,
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
  profile_id uuid;
begin
  if target_howler_skill_level not between 1 and 8 then
    raise exception 'Invalid Howler skill level' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.player_accounts account
    where account.id = target_player_account_id
      and account.user_id = auth.uid()
  ) then
    raise exception 'Castle Command player profile access denied' using errcode = '42501';
  end if;

  insert into public.castle_command_profiles (
    player_account_id,
    user_id,
    howler_skill_level,
    share_with_alliance
  ) values (
    target_player_account_id,
    auth.uid(),
    target_howler_skill_level,
    target_share_with_alliance
  )
  on conflict (player_account_id) do update set
    howler_skill_level = excluded.howler_skill_level,
    share_with_alliance = excluded.share_with_alliance,
    updated_at = now()
  returning id into profile_id;

  insert into public.castle_command_profile_targets (
    profile_id,
    target,
    normal_seconds,
    howler_seconds
  ) values
    (profile_id, 'castle', castle_normal_seconds, castle_howler_seconds),
    (profile_id, 'north', north_normal_seconds, north_howler_seconds),
    (profile_id, 'east', east_normal_seconds, east_howler_seconds),
    (profile_id, 'south', south_normal_seconds, south_howler_seconds),
    (profile_id, 'west', west_normal_seconds, west_howler_seconds)
  on conflict (profile_id, target) do update set
    normal_seconds = excluded.normal_seconds,
    howler_seconds = excluded.howler_seconds,
    updated_at = now();

  return profile_id;
end;
$$;

revoke all on function public.save_castle_command_profile(
  uuid, smallint, boolean,
  integer, integer, integer, integer, integer, integer,
  integer, integer, integer, integer
) from public;
grant execute on function public.save_castle_command_profile(
  uuid, smallint, boolean,
  integer, integer, integer, integer, integer, integer,
  integer, integer, integer, integer
) to authenticated;

-- Reads remain RLS-controlled. Authenticated clients may delete their own
-- top-level profile, but insert/update timing mutations must go through the
-- atomic function above.
revoke insert, update on public.castle_command_profiles from authenticated;
revoke insert, update, delete on public.castle_command_profile_targets from authenticated;

create or replace function public.preserve_castle_command_session_identity()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.alliance_id is distinct from old.alliance_id
    or new.created_by is distinct from old.created_by
    or new.created_at is distinct from old.created_at then
    raise exception 'Castle Command session identity fields are immutable' using errcode = '22023';
  end if;

  return new;
end;
$$;

create trigger castle_command_sessions_preserve_identity
before update on public.castle_command_sessions
for each row execute function public.preserve_castle_command_session_identity();

commit;
