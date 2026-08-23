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
  'supabase/migrations/20260823165500_castle_command_reset_assignment_lock_order.sql',
))

for (const required of [
  'create or replace function public.reset_castle_command_acknowledgement',
  'from public.castle_command_sessions',
  'from public.castle_command_session_assignments assignment',
  'for update of assignment;',
  'public.lock_castle_command_event_manager(command_session.alliance_id)',
  'public.lock_castle_command_deputy_authority(',
  'insert into public.castle_command_session_acknowledgements',
  "Closed Castle Command acknowledgements are immutable",
]) {
  assert.ok(sql.includes(required), `001F F15 reset lock-order migration missing ${required}`)
}

const sessionRead = sql.indexOf('from public.castle_command_sessions')
const assignmentRead = sql.indexOf('from public.castle_command_session_assignments assignment')
const assignmentLock = sql.indexOf('for update of assignment;', assignmentRead)
const managerAuthority = sql.indexOf('public.lock_castle_command_event_manager(command_session.alliance_id)')
const deputyAuthority = sql.indexOf('public.lock_castle_command_deputy_authority(')
const acknowledgementWrite = sql.indexOf('insert into public.castle_command_session_acknowledgements')
assert.ok(sessionRead >= 0)
assert.ok(assignmentRead > sessionRead, 'reset target assignment must be selected after the session lock')
assert.ok(assignmentLock > assignmentRead, 'reset target assignment must be locked')
assert.ok(managerAuthority > assignmentLock, 'command authority must be evaluated only after target assignment locking')
assert.ok(deputyAuthority > assignmentLock, 'deputy grant authority must be evaluated only after target assignment locking')
assert.ok(acknowledgementWrite > deputyAuthority, 'acknowledgement reset must write only after locked assignment and command authority')

const f13 = stripSqlComments(await read(
  'supabase/migrations/20260823164500_castle_command_authority_record_serialization.sql',
))
assert.ok(f13.includes('for update of membership, deputy;'), 'F15 depends on F13 locking the concrete deputy grant')

const release = await read('docs/releases/CASTLE-COMMAND-001F-F15-RELEASE-ADDENDUM.md')
const orderStart = release.indexOf('## Final migration dependency order')
const orderEnd = release.indexOf('## Permanent regression gate', orderStart)
assert.ok(orderStart >= 0 && orderEnd > orderStart)
const governedOrder = release.slice(orderStart, orderEnd)
const f14Position = governedOrder.indexOf('20260823165000_castle_command_ack_assignment_lock_order.sql')
const f15Position = governedOrder.indexOf('20260823165500_castle_command_reset_assignment_lock_order.sql')
assert.ok(f14Position >= 0 && f15Position > f14Position, 'F15 migration must follow F14 in the governed order')
assert.ok(release.includes('Finding F15 — acknowledgement reset still crossed assignment/deputy cascades in child-first order'))
assert.ok(release.includes('24 Castle Command migrations'))
assert.ok(release.includes('**STOP. Do not apply Castle Command migrations to production yet.**'))

console.log('CASTLE-COMMAND-001F F15 tests passed')
