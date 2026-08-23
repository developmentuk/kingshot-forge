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
  'supabase/migrations/20260823164500_castle_command_authority_record_serialization.sql',
))

for (const required of [
  'create or replace function public.lock_castle_command_deputy_authority',
  'for update of membership, deputy;',
  'create or replace function public.lock_castle_command_participant_authority',
  'for update of membership, assignment;',
  'create or replace function public.enforce_castle_command_tactical_assignment_snapshot',
  'order by assignment.id',
  'for update of assignment;',
  'current_snapshot is distinct from new.assignment_snapshot',
  "errcode = '40001'",
  'create trigger castle_command_tactical_versions_assignment_snapshot_guard',
]) {
  assert.ok(sql.includes(required), `001F F13 authority-record serialization missing ${required}`)
}

const deputyStart = sql.indexOf('create or replace function public.lock_castle_command_deputy_authority')
const participantStart = sql.indexOf('create or replace function public.lock_castle_command_participant_authority')
const tacticalStart = sql.indexOf('create or replace function public.enforce_castle_command_tactical_assignment_snapshot')
assert.ok(deputyStart >= 0 && participantStart > deputyStart && tacticalStart > participantStart)

const deputy = sql.slice(deputyStart, participantStart)
assert.ok(deputy.includes('public.castle_command_session_deputies deputy'))
assert.ok(deputy.indexOf('for update of membership, deputy;') > deputy.indexOf('public.castle_command_session_deputies deputy'))

const participant = sql.slice(participantStart, tacticalStart)
assert.ok(participant.includes('public.castle_command_session_assignments assignment'))
assert.ok(participant.indexOf('for update of membership, assignment;') > participant.indexOf('public.castle_command_session_assignments assignment'))

const tactical = sql.slice(tacticalStart)
const assignmentLock = tactical.indexOf('for update of assignment;')
const snapshotBuild = tactical.indexOf('public.build_castle_command_assignment_snapshot')
const snapshotCompare = tactical.indexOf('current_snapshot is distinct from new.assignment_snapshot')
assert.ok(assignmentLock >= 0)
assert.ok(snapshotBuild > assignmentLock, 'tactical snapshot must be rebuilt only after concrete assignment rows are locked')
assert.ok(snapshotCompare > snapshotBuild, 'tactical version must compare the locked current snapshot before persistence')

const release = await read('docs/releases/CASTLE-COMMAND-001F-F13-RELEASE-ADDENDUM.md')
const orderStart = release.indexOf('## Final migration dependency order')
const orderEnd = release.indexOf('## Permanent regression gate', orderStart)
assert.ok(orderStart >= 0 && orderEnd > orderStart)
const governedOrder = release.slice(orderStart, orderEnd)
const f12 = governedOrder.indexOf('20260823164000_castle_command_write_authority_boundary.sql')
const f13 = governedOrder.indexOf('20260823164500_castle_command_authority_record_serialization.sql')
assert.ok(f12 >= 0 && f13 > f12, 'F13 migration must be governed immediately after F12')
assert.ok(release.includes('Finding F13 — deputy/participant authority records were not serialized with direct service revocation'))
assert.ok(release.includes('22 Castle Command migrations'))
assert.ok(release.includes('**STOP. Do not apply Castle Command migrations to production yet.**'))

console.log('CASTLE-COMMAND-001F F13 tests passed')
