import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const migration = await readFile(
  new URL(
    '../supabase/migrations/20260831120000_mightpulse_001b_generated_kingdom_display_name.sql',
    import.meta.url,
  ),
  'utf8',
)

assert.match(
  migration,
  /create or replace function public\.sync_mightpulse_alliance_membership/iu,
)
assert.match(
  migration,
  /insert into public\.kingdoms\s*\(\s*kingdom_number\s*\)\s*values\s*\(\s*p_kingdom_number\s*\)/iu,
)
assert.doesNotMatch(
  migration,
  /insert into public\.kingdoms\s*\([\s\S]{0,160}\bdisplay_name\b/iu,
)
assert.match(
  migration,
  /on conflict \(kingdom_number\) do nothing/iu,
)
assert.match(
  migration,
  /p_observed_at <= authority_state\.provider_observed_at/iu,
)
assert.match(
  migration,
  /authority_override public\.alliance_provider_authority_overrides/iu,
)
assert.match(
  migration,
  /management_role := p_member_role in \('r4', 'leader'\)/iu,
)
assert.match(
  migration,
  /grant execute on function public\.sync_mightpulse_alliance_membership/iu,
)
assert.doesNotMatch(
  migration,
  /create or replace function public\.apply_mightpulse_player_intelligence_sync/iu,
)
assert.doesNotMatch(
  migration,
  /\b(?:alter|drop|truncate)\s+table\b/iu,
)
assert.equal((migration.match(/\bbegin;/giu) ?? []).length, 1)
assert.equal((migration.match(/\bcommit;/giu) ?? []).length, 1)

console.log('MIGHTPULSE-001B generated Kingdom display-name regression passed.')
