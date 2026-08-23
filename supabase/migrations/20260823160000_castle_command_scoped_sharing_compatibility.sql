begin;

-- CASTLE-COMMAND-001F compatibility hardening.
-- Keep the original client RPC shape while resolving the exact share scope on
-- the server. Sharing is accepted only when the caller has exactly one current
-- alliance, matching the Forge UI's single-current-alliance model.

create function public.save_castle_command_profile(
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
  resolved_alliance_id uuid;
  current_alliance_count integer;
begin
  if target_share_with_alliance is null then
    raise exception 'Castle Command sharing choice is required' using errcode = '22023';
  end if;

  if target_share_with_alliance then
    select count(*)::integer
      into current_alliance_count
    from public.alliance_memberships membership
    where membership.user_id = auth.uid()
      and membership.status = 'current'::public.alliance_membership_status;

    if current_alliance_count <> 1 then
      raise exception 'Castle Command sharing requires exactly one current alliance' using errcode = '22023';
    end if;

    select membership.alliance_id
      into resolved_alliance_id
    from public.alliance_memberships membership
    where membership.user_id = auth.uid()
      and membership.status = 'current'::public.alliance_membership_status
    limit 1;

    if resolved_alliance_id is null then
      raise exception 'Castle Command sharing requires a current alliance' using errcode = '22023';
    end if;
  else
    resolved_alliance_id := null;
  end if;

  return public.save_castle_command_profile(
    target_player_account_id,
    target_howler_skill_level,
    target_share_with_alliance,
    resolved_alliance_id,
    castle_normal_seconds,
    castle_howler_seconds,
    north_normal_seconds,
    north_howler_seconds,
    east_normal_seconds,
    east_howler_seconds,
    south_normal_seconds,
    south_howler_seconds,
    west_normal_seconds,
    west_howler_seconds
  );
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

comment on function public.save_castle_command_profile(
  uuid, smallint, boolean,
  integer, integer, integer, integer, integer, integer,
  integer, integer, integer, integer
) is 'Compatibility RPC that binds Castle timing sharing to the caller single current alliance server-side.';

commit;
