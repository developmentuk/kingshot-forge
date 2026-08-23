import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

async function read(path) {
  return readFile(resolve(process.cwd(), path), 'utf8')
}

function stripSqlComments(sql) {
  return sql
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
}

const sql = stripSqlComments(await read(
  'supabase/migrations/20260823165000_castle_command_ack_assignment_lock_order.sql',
))

for (const required of [
  'create or replace function public.set_castle_command_acknowledgement',
  'public.lock_castle_command_participant_authority(',
  'from public.castle_command_session_acknowledgements acknowledgement',
  'for update;',
  "Castle Command participant access denied",
  "Castle Command session is closed",
  "Castle Command session must be active before marking sent",
  "Sent acknowledgement cannot be moved backwards",
]) {
  assert.ok(sql.includes(required), `001F F14 acknowledgement lock-order migration missing ${required}`)
}

const sessionRead = sql.indexOf('from public.castle_command_sessions')
const participantAuthority = sql.indexOf('public.lock_castle_command_participant_authority(')
const acknowledgementRead = sql.indexOf('from public.castle_command_session_acknowledgements acknowledgement')
assert.ok(sessionRead >= 0)
assert.ok(participantAuthority > sessionRead, 'participant authority must be locked only after session locking')
assert.ok(acknowledgementRead > participantAuthority, 'assignment-backed participant authority must be locked before acknowledgement state')

const f13 = stripSqlComments(await read(
  'supabase/migrations/20260823164500_castle_command_authority_record_serialization.sql',
))
const participantHelperStart = f13.indexOf('create or replace function public.lock_castle_command_participant_authority')
const tacticalGuardStart = f13.indexOf('create or replace function public.enforce_castle_command_tactical_assignment_snapshot')
const participantHelper = f13.slice(participantHelperStart, tacticalGuardStart)
assert.ok(participantHelper.includes('for update of membership, assignment;'), 'F14 depends on F13 locking the concrete assignment row')

const release = await read('docs/releases/CASTLE-COMMAND-001F-F14-RELEASE-ADDENDUM.md')
const orderStart = release.indexOf('## Final migration dependency order')
const orderEnd = release.indexOf('## Permanent regression gate', orderStart)
assert.ok(orderStart >= 0 && orderEnd > orderStart)
const governedOrder = release.slice(orderStart, orderEnd)
const f13Position = governedOrder.indexOf('20260823164500_castle_command_authority_record_serialization.sql')
const f14Position = governedOrder.indexOf('20260823165000_castle_command_ack_assignment_lock_order.sql')
assert.ok(f13Position >= 0 && f14Position > f13Position, 'F14 migration must follow F13 in the governed order')
assert.ok(release.includes('Finding F14 — participant acknowledgement locking inverted the assignment cascade order'))
assert.ok(release.includes('23 Castle Command migrations'))
assert.ok(release.includes('**STOP. Do not apply Castle Command migrations to production yet.**'))

console.log('CASTLE-COMMAND-001F F14 tests passed')
