-- PLAYER-PROFILE-PRIVATE-OWNER-001
--
-- Private player profiles must remain readable by their authenticated owner.
-- The existing public SELECT policy intentionally exposes only rows where
-- is_public = true. This additional policy is additive and does not broaden
-- anonymous/public access.

drop policy if exists "Players can view their own profile"
on public.player_profiles;

create policy "Players can view their own profile"
on public.player_profiles
for select
to authenticated
using (
  exists (
    select 1
    from public.player_accounts
    where player_accounts.id = player_profiles.player_account_id
      and player_accounts.user_id = auth.uid()
  )
);
