import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const service = await readFile('src/services/playerProfileService.ts', 'utf8')
const migration = await readFile(
  'supabase/migrations/20260830103000_player_profiles_private_owner_read.sql',
  'utf8',
)

assert.match(service, /\.upsert\(/)
assert.match(service, /onConflict:\s*'player_account_id'/)
assert.doesNotMatch(service, /data:\s*existingProfile/)
assert.doesNotMatch(service, /\.insert\(profilePayload\)/)

assert.match(migration, /create policy "Players can view their own profile"/)
assert.match(migration, /for select\s+to authenticated/)
assert.match(migration, /player_accounts\.user_id = auth\.uid\(\)/)
assert.doesNotMatch(migration, /drop policy if exists "Public player profiles can be viewed"/)
assert.doesNotMatch(migration, /is_public\s*=\s*true/)

console.log('Private Player Passport owner-read and conflict-safe save contracts passed.')
