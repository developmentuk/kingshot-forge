-- Keep verification state server-authoritative until a legitimate verification
-- provider and trusted transition route are available.
-- Existing owner RLS remains in place for row-level ownership checks.

revoke update on table public.player_accounts from anon, authenticated;

grant update (
  player_name,
  kingdom_id,
  player_level,
  level_rendered,
  level_rendered_detailed,
  level_image,
  profile_photo,
  last_refreshed_at,
  is_public,
  updated_at
) on table public.player_accounts to authenticated;

-- Verification events are immutable server-side history, not a browser write
-- surface. Keep SELECT available through the existing RLS policies.
revoke insert, update, delete on table public.player_verification_events
  from anon, authenticated;
