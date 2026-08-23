begin;

-- CASTLE-COMMAND-001B privacy hardening.
-- Alliance sharing is exposed only through list_castle_command_alliance_profiles().
-- Underlying profile/user/player-account identifiers are not directly readable by
-- ordinary alliance members merely because the owner opted into timing sharing.

drop policy if exists "Players can view owned or explicitly shared Castle Command profiles"
  on public.castle_command_profiles;

create policy "Players can view their own Castle Command profiles"
on public.castle_command_profiles
for select
to authenticated
using (
  user_id = auth.uid()
  or public.current_user_role() in ('admin', 'owner')
);

drop policy if exists "Visible Castle Command profile targets are readable"
  on public.castle_command_profile_targets;

create policy "Players can view targets for their own Castle Command profile"
on public.castle_command_profile_targets
for select
to authenticated
using (
  exists (
    select 1
    from public.castle_command_profiles profile
    where profile.id = profile_id
      and (
        profile.user_id = auth.uid()
        or public.current_user_role() in ('admin', 'owner')
      )
  )
);

-- This helper was useful for the first draft of direct shared-row RLS. The final
-- design uses the narrower security-definer projection RPC instead, so remove the
-- general same-alliance relationship oracle entirely.
revoke all on function public.users_share_current_alliance(uuid) from authenticated;
drop function public.users_share_current_alliance(uuid);

commit;
