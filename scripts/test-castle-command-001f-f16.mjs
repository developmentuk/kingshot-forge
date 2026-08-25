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

const migration = 'supabase/migrations/20260823170000_castle_command_assignment_snapshot_serialization.sql'
const sql = stripSqlComments(await read(migration))

for (const required of [
  'create or replace function public.set_castle_command_session_assignment',
  'for update of membership;',
  'for update of account_row;',
  'for update of profile;',
  'for update of timing_row;',
  'greatest(command_profile.updated_at, timing.updated_at)',
  'snapshot_updated_at',
]) {
  assert.ok(sql.includes(required), `F16 assignment snapshot serialization missing ${required}`)
}

const sessionLock = sql.indexOf('from public.castle_command_sessions')
const membershipLock = sql.indexOf('for update of membership;')
const accountLock = sql.indexOf('for update of account_row;')
const profileLock = sql.indexOf('for update of profile;')
const timingLock = sql.indexOf('for update of timing_row;')
const resolveTiming = sql.indexOf("resolved_source := 'howler-observed'")
const snapshotTime = sql.indexOf('snapshot_updated_at := greatest(command_profile.updated_at, timing.updated_at);')
const assignmentWrite = sql.indexOf('insert into public.castle_command_session_assignments')

assert.ok(sessionLock >= 0)
assert.ok(membershipLock > sessionLock, 'assignment must lock membership after session')
assert.ok(accountLock > membershipLock, 'assignment must lock player account after membership')
assert.ok(profileLock > accountLock, 'assignment must lock shared profile after player account')
assert.ok(timingLock > profileLock, 'assignment must lock selected timing after shared profile')
assert.ok(resolveTiming > timingLock, 'march timing must be derived only after the timing row is locked')
assert.ok(snapshotTime > timingLock, 'snapshot timestamp must be derived from locked profile/timing rows')
assert.ok(assignmentWrite > snapshotTime, 'assignment persistence must follow complete source-row locking')

const addendum = await read('docs/releases/CASTLE-COMMAND-001F-F16-RELEASE-ADDENDUM.md')
assert.ok(addendum.includes('25 ordered Castle Command migrations'))
assert.ok(addendum.includes('20260823170000_castle_command_assignment_snapshot_serialization.sql'))
assert.ok(addendum.includes('session → membership → account → profile → timing'))
assert.ok(addendum.includes('F16'))

console.log('CASTLE-COMMAND-001F F16 tests passed')
