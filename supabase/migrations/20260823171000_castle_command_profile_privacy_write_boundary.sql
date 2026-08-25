begin;

-- CASTLE-COMMAND-001F release hardening — F18/P1 + F19/P2.
--
-- Final profile privacy contract:
-- - direct profile/target reads are owner/admin only;
-- - alliance timing sharing is exposed only through the exact-alliance
--   list_castle_command_alliance_profiles(...) SECURITY DEFINER projection;
-- - authenticated profile/timing mutation is RPC-only through
--   save_castle_command_profile(...), whose final implementation locks and
--   validates the selected current alliance membership before opt-in persists.

-- F18: remove every legacy direct shared-row read policy and reassert the
-- narrow owner/admin-only final RLS state. This is deliberately explicit even
-- though an earlier 001B lockdown migration already moved toward this model;
-- release activation must not depend on interpreting superseded policy layers.
drop policy if exists "Players can view owned or explicitly shared Castle Command profiles"
  on public.castle_command_profiles;
drop policy if exists "Players can view their own Castle Command profiles"
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
drop policy if exists "Players can view targets for their own Castle Command profile"
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

-- Keep own-profile loading available to the existing client while RLS prevents
-- any ordinary alliance member from reading another player's raw profile row.
grant select on public.castle_command_profiles to authenticated;
grant select on public.castle_command_profile_targets to authenticated;

-- F19: the original foundation owner write policies are no longer part of the
-- supported write surface. Remove them as defence in depth and reassert the
-- table privilege boundary so authenticated clients cannot bypass the locked
-- profile-save RPC with raw PostgREST INSERT/UPDATE/target mutations.
drop policy if exists "Players can create their own Castle Command profile"
  on public.castle_command_profiles;
drop policy if exists "Players can update their own Castle Command profile"
  on public.castle_command_profiles;

drop policy if exists "Players can create targets for their own Castle Command profile"
  on public.castle_command_profile_targets;
drop policy if exists "Players can update targets for their own Castle Command profile"
  on public.castle_command_profile_targets;
drop policy if exists "Players can delete targets for their own Castle Command profile"
  on public.castle_command_profile_targets;

revoke insert, update on public.castle_command_profiles from authenticated;
revoke insert, update, delete on public.castle_command_profile_targets from authenticated;

-- Preserve the existing owner-controlled top-level profile deletion surface.
-- Deleting a profile is not a sharing-consent mutation; its FK/cascade rules
-- remain authoritative and assignments retain their existing restrictive FK.
grant delete on public.castle_command_profiles to authenticated;

comment on table public.castle_command_profiles is
  'Castle Command private timing profile. Direct reads are owner/admin only; authenticated mutations use governed RPCs except owner-controlled profile deletion.';
comment on table public.castle_command_profile_targets is
  'Castle Command observed timing rows. Direct reads are owner/admin only and authenticated mutations are RPC-only.';

commit;
