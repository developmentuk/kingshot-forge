import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

const migration = await readFile(
  "supabase/migrations/20260718170000_protect_player_verification_columns.sql",
  "utf8",
)

assert.match(
  migration,
  /revoke update on table public\.player_accounts from anon, authenticated;/u,
)
assert.match(
  migration,
  /grant update \([\s\S]*?is_public\s*,[\s\S]*?updated_at\s*\)[\s\S]*?to authenticated;/u,
)
assert.doesNotMatch(migration, /verification_status/u)
assert.doesNotMatch(migration, /verification_method/u)
assert.doesNotMatch(migration, /verified_by/u)
assert.doesNotMatch(migration, /verified_at/u)
assert.match(
  migration,
  /revoke insert, update, delete on table public\.player_verification_events/u,
)

console.log("Player verification boundary tests passed.")
