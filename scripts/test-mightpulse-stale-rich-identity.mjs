import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const correctiveMigration = await readFile(
  new URL(
    '../supabase/migrations/20260830170000_mightpulse_001b_stale_identity_guard.sql',
    import.meta.url,
  ),
  'utf8',
)

assert.match(
  correctiveMigration,
  /create or replace function public\.apply_mightpulse_player_intelligence_sync/iu,
)
assert.match(
  correctiveMigration,
  /identity_observed_at timestamptz/iu,
)
assert.match(
  correctiveMigration,
  /when p_provider_cached_at is not null then p_provider_cached_at/iu,
)
assert.match(
  correctiveMigration,
  /when p_provider_age_seconds is not null then\s+p_provider_fetched_at - make_interval\(secs => p_provider_age_seconds\)/iu,
)
assert.match(
  correctiveMigration,
  /else null\s+end;/iu,
)
assert.match(
  correctiveMigration,
  /if identity_observed_at is not null[\s\S]*player_row\.last_refreshed_at is null[\s\S]*identity_observed_at >= player_row\.last_refreshed_at/iu,
)
assert.match(
  correctiveMigration,
  /last_refreshed_at = identity_observed_at/iu,
)
assert.doesNotMatch(
  correctiveMigration,
  /last_refreshed_at = p_provider_fetched_at/iu,
)
assert.match(
  correctiveMigration,
  /end if;[\s\S]*insert into public\.player_intelligence_observations/iu,
)
assert.match(
  correctiveMigration,
  /update public\.provider_quota_reservations[\s\S]*status = 'completed'/iu,
)
assert.equal(
  (correctiveMigration.match(/\bbegin;/giu) ?? []).length,
  1,
)
assert.equal(
  (correctiveMigration.match(/\bcommit;/giu) ?? []).length,
  1,
)

console.log('MIGHTPULSE-001B stale rich identity ordering regression passed.')
