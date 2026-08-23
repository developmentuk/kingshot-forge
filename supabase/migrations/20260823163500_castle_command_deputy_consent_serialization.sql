begin;

-- CASTLE-COMMAND-001F release hardening.
-- Close the remaining membership-transition races found by exact-head review:
-- 1) deputy lifecycle/reset mutations must serialize with caller membership removal;
-- 2) sharing opt-in must serialize with owner membership removal in both RPC shapes.
--
-- Lock discipline remains one-way:
-- - lifecycle/reset: session -> deputy caller membership;
-- - explicit profile share: owner membership -> profile -> timing rows;
-- - compatibility profile share: all current owner memberships (deterministic order),
--   then the explicit overload re-locks the chosen membership before profile save.

create or replace function public.save_castle_command_profile(
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
  locked_membership_user_id uuid;
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
    if target_shared_alliance_id is null then
      raise exception 'Castle Command sharing requires a current alliance membership' using errcode = '42501';
    end if;

    select membership.user_id into locked_membership_user_id
    from public.alliance_memberships membership
    where membership.alliance_id = target_shared_alliance_id
      and membership.user_id = auth.uid()
      and membership.status = 'current'::public.alliance_membership_status
    for update of membership;

    if locked_membership_user_id is null then
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
  resolved_alliance_id uuid;
  current_alliance_count integer;
begin
  if target_share_with_alliance is null then
    raise exception 'Castle Command sharing choice is required' using errcode = '22023';
  end if;

  if target_share_with_alliance then
    -- Lock every currently qualifying membership first and in deterministic
    -- order. Existing current rows cannot be removed between scope resolution
    -- and the delegated explicit save. The STRICT lookup also fails closed if
    -- a second current membership appears between the count and selection.
    perform membership.alliance_id
    from public.alliance_memberships membership
    where membership.user_id = auth.uid()
      and membership.status = 'current'::public.alliance_membership_status
    order by membership.alliance_id
    for update of membership;

    select count(*)::integer
      into current_alliance_count
    from public.alliance_memberships membership
    where membership.user_id = auth.uid()
      and membership.status = 'current'::public.alliance_membership_status;

    if current_alliance_count <> 1 then
      raise exception 'Castle Command sharing requires exactly one current alliance' using errcode = '22023';
    end if;

    select membership.alliance_id
      into strict resolved_alliance_id
    from public.alliance_memberships membership
    where membership.user_id = auth.uid()
      and membership.status = 'current'::public.alliance_membership_status;
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

create or replace function public.set_castle_command_session_status(
  target_session_id uuid,
  target_status text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  command_session public.castle_command_sessions%rowtype;
  deputy_member_user_id uuid;
begin
  if target_status not in ('planning', 'active', 'closed') then
    raise exception 'Invalid Castle Command session status' using errcode = '22023';
  end if;

  select * into command_session
  from public.castle_command_sessions
  where id = target_session_id
  for update;

  if command_session.id is null then
    raise exception 'Castle Command session not found' using errcode = 'P0002';
  end if;

  if not public.can_manage_castle_command(command_session.alliance_id) then
    -- Deputy authority is membership-sensitive. Lock the caller's qualifying
    -- membership after the session row so removal cannot commit between
    -- authorization and lifecycle mutation.
    select membership.user_id into deputy_member_user_id
    from public.alliance_memberships membership
    join public.player_accounts account
      on account.user_id = membership.user_id
    join public.castle_command_session_deputies deputy
      on deputy.player_account_id = account.id
     and deputy.session_id = target_session_id
    where membership.alliance_id = command_session.alliance_id
      and membership.user_id = auth.uid()
      and membership.status = 'current'::public.alliance_membership_status
    for update of membership;

    if deputy_member_user_id is null then
      raise exception 'Castle Command live-session access denied' using errcode = '42501';
    end if;
  end if;

  if command_session.status = target_status then
    return target_status;
  end if;

  if command_session.status = 'closed' then
    raise exception 'Closed Castle Command session cannot be reopened' using errcode = '22023';
  end if;

  if command_session.status = 'planning' and target_status not in ('active', 'closed') then
    raise exception 'Invalid Castle Command session transition' using errcode = '22023';
  end if;

  if command_session.status = 'active' and target_status <> 'closed' then
    raise exception 'Invalid Castle Command session transition' using errcode = '22023';
  end if;

  update public.castle_command_sessions
  set
    status = target_status,
    closed_at = case when target_status = 'closed' then now() else null end,
    updated_at = now()
  where id = target_session_id;

  return target_status;
end;
$$;

revoke all on function public.set_castle_command_session_status(uuid, text) from public;
grant execute on function public.set_castle_command_session_status(uuid, text) to authenticated;

create or replace function public.reset_castle_command_acknowledgement(
  target_session_id uuid,
  target_player_account_id uuid
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  command_session public.castle_command_sessions%rowtype;
  deputy_member_user_id uuid;
begin
  select * into command_session
  from public.castle_command_sessions
  where id = target_session_id
  for update;

  if command_session.id is null then
    raise exception 'Castle Command session not found' using errcode = 'P0002';
  end if;

  if command_session.status = 'closed' then
    raise exception 'Closed Castle Command acknowledgements are immutable' using errcode = '22023';
  end if;

  if not public.can_manage_castle_command(command_session.alliance_id) then
    select membership.user_id into deputy_member_user_id
    from public.alliance_memberships membership
    join public.player_accounts account
      on account.user_id = membership.user_id
    join public.castle_command_session_deputies deputy
      on deputy.player_account_id = account.id
     and deputy.session_id = target_session_id
    where membership.alliance_id = command_session.alliance_id
      and membership.user_id = auth.uid()
      and membership.status = 'current'::public.alliance_membership_status
    for update of membership;

    if deputy_member_user_id is null then
      raise exception 'Castle Command live-session access denied' using errcode = '42501';
    end if;
  end if;

  if not exists (
    select 1
    from public.castle_command_session_assignments assignment
    where assignment.session_id = target_session_id
      and assignment.player_account_id = target_player_account_id
  ) then
    raise exception 'Castle Command assignment not found' using errcode = 'P0002';
  end if;

  insert into public.castle_command_session_acknowledgements (
    session_id,
    player_account_id,
    status,
    ready_at,
    sent_at,
    last_changed_by
  ) values (
    target_session_id,
    target_player_account_id,
    'waiting',
    null,
    null,
    auth.uid()
  )
  on conflict (session_id, player_account_id) do update set
    status = 'waiting',
    ready_at = null,
    sent_at = null,
    last_changed_by = excluded.last_changed_by,
    updated_at = now();

  return 'waiting';
end;
$$;

revoke all on function public.reset_castle_command_acknowledgement(uuid, uuid) from public;
grant execute on function public.reset_castle_command_acknowledgement(uuid, uuid) to authenticated;

comment on function public.save_castle_command_profile(
  uuid, smallint, boolean, uuid,
  integer, integer, integer, integer, integer, integer,
  integer, integer, integer, integer
) is 'Saves Castle timing profile atomically; sharing opt-in is serialized with the exact current alliance membership row.';
comment on function public.save_castle_command_profile(
  uuid, smallint, boolean,
  integer, integer, integer, integer, integer, integer,
  integer, integer, integer, integer
) is 'Compatibility profile save; current alliance scope is locked and resolved server-side before opt-in persists.';
comment on function public.set_castle_command_session_status(uuid, text) is
  'Mutates Castle lifecycle under the session lock; deputy authority is serialized with current-membership removal.';
comment on function public.reset_castle_command_acknowledgement(uuid, uuid) is
  'Resets open-session acknowledgement state; deputy authority is serialized with current-membership removal.';

commit;
