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

const migration = 'supabase/migrations/20260823170500_castle_command_tactical_snapshot_session_lock_order.sql'
const sql = stripSqlComments(await read(migration))

for (const required of [
  'create or replace function public.enforce_castle_command_tactical_assignment_snapshot',
  'from public.castle_command_sessions session',
  'for update of session;',
  'from public.castle_command_session_assignments assignment',
  'order by assignment.id',
  'for update of assignment;',
  'public.build_castle_command_assignment_snapshot(new.session_id)',
  "errcode = '40001'",
]) {
  assert.ok(sql.includes(required), `F17 tactical snapshot serialization missing ${required}`)
}

const sessionRead = sql.indexOf('from public.castle_command_sessions session')
const sessionLock = sql.indexOf('for update of session;')
const assignmentRead = sql.indexOf('from public.castle_command_session_assignments assignment')
const assignmentLock = sql.indexOf('for update of assignment;')
const snapshotBuild = sql.indexOf('public.build_castle_command_assignment_snapshot(new.session_id)')
const snapshotCompare = sql.indexOf('current_snapshot is distinct from new.assignment_snapshot')

assert.ok(sessionRead >= 0)
assert.ok(sessionLock > sessionRead, 'tactical snapshot guard must lock the session row first')
assert.ok(assignmentRead > sessionLock, 'assignment reads must begin only after session locking')
assert.ok(assignmentLock > assignmentRead, 'assignment rows must be locked deterministically after session')
assert.ok(snapshotBuild > assignmentLock, 'snapshot must be rebuilt only after assignment locks')
assert.ok(snapshotCompare > snapshotBuild, 'snapshot comparison must follow the locked rebuild')

const addendum = await read('docs/releases/CASTLE-COMMAND-001F-F17-RELEASE-ADDENDUM.md')
assert.ok(addendum.includes('26 ordered Castle Command migrations'))
assert.ok(addendum.includes('20260823170500_castle_command_tactical_snapshot_session_lock_order.sql'))
assert.ok(addendum.includes('session → assignments → snapshot'))
assert.ok(addendum.includes('F17'))

console.log('CASTLE-COMMAND-001F F17 tests passed')
