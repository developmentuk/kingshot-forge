import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import {
  buildCoordinatedLaunchOrder,
  sessionStatusAllowsAssignment,
} from '../src/features/castle-command/castleCommandSessionDomain.ts'

function assignment(overrides = {}) {
  return {
    id: 'assignment-a',
    playerAccountId: 'player-account-a',
    playerId: '1001',
    playerName: 'Alpha',
    target: 'castle',
    useHowler: false,
    howlerSkillLevel: 8,
    marchSeconds: 69,
    timingSource: 'normal',
    needsHowlerCalibration: false,
    profileUpdatedAt: '2026-08-23T12:00:00.000Z',
    ...overrides,
  }
}

function testLaunchOrder() {
  const rows = buildCoordinatedLaunchOrder({
    impactAt: new Date('2026-08-29T14:32:00.000Z'),
    rallyPreparationSeconds: 300,
    assignments: [
      assignment({ id: 'short', playerName: 'Zulu', marchSeconds: 69 }),
      assignment({ id: 'long', playerName: 'Bravo', marchSeconds: 80 }),
      assignment({ id: 'tie-a', playerName: 'Alpha', marchSeconds: 69 }),
    ],
  })

  assert.deepEqual(rows.map((row) => row.id), ['long', 'tie-a', 'short'])
  assert.equal(rows[0].timing.rallyStartAt.toISOString(), '2026-08-29T14:25:40.000Z')
  assert.equal(rows[1].timing.rallyStartAt.toISOString(), '2026-08-29T14:25:51.000Z')
  assert.equal(rows[2].timing.impactAt.toISOString(), '2026-08-29T14:32:00.000Z')
}

function testClosedSessionRule() {
  assert.equal(sessionStatusAllowsAssignment('planning'), true)
  assert.equal(sessionStatusAllowsAssignment('active'), true)
  assert.equal(sessionStatusAllowsAssignment('closed'), false)
}

async function testMigrationContract() {
  const migrationPath = resolve(
    process.cwd(),
    'supabase/migrations/20260823120400_castle_command_session_foundation.sql',
  )
  const hardeningPath = resolve(
    process.cwd(),
    'supabase/migrations/20260823121800_castle_command_atomic_profile_save.sql',
  )
  const [sql, hardeningSql] = await Promise.all([
    readFile(migrationPath, 'utf8'),
    readFile(hardeningPath, 'utf8'),
  ])

  for (const required of [
    'create table public.castle_command_profiles',
    'create table public.castle_command_profile_targets',
    'create table public.castle_command_sessions',
    'create table public.castle_command_session_assignments',
    'share_with_alliance boolean not null default false',
    'administrator.can_manage_events = true',
    'profile.share_with_alliance = true',
    'membership.status = \'current\'::public.alliance_membership_status',
    'create or replace function public.list_castle_command_alliance_profiles',
    'create or replace function public.set_castle_command_session_assignment',
    "resolved_source := 'normal-fallback'",
    'calibration_required := true',
    'profile_updated_at_snapshot',
    'player_name_snapshot',
    'enable row level security',
    'grant select on public.castle_command_session_assignments to authenticated',
  ]) {
    assert.ok(sql.includes(required), `foundation migration is missing: ${required}`)
  }

  for (const required of [
    'create or replace function public.save_castle_command_profile',
    'saved_profile_id uuid;',
    'returning id into saved_profile_id;',
    "(saved_profile_id, 'castle'",
    'return saved_profile_id;',
    'revoke insert, update on public.castle_command_profiles from authenticated;',
    'revoke insert, update, delete on public.castle_command_profile_targets from authenticated;',
    'create or replace function public.preserve_castle_command_session_identity()',
    'create trigger castle_command_sessions_preserve_identity',
    "raise exception 'Castle Command session identity fields are immutable'",
  ]) {
    assert.ok(hardeningSql.includes(required), `hardening migration is missing: ${required}`)
  }

  assert.equal(
    /declare\s+profile_id\s+uuid;/i.test(hardeningSql),
    false,
    'atomic profile function must not shadow the profile_id table column',
  )
  assert.equal(
    sql.includes('grant select, insert, update, delete on public.castle_command_session_assignments'),
    false,
    'assignment snapshots must be written only through the server-authoritative RPC boundary',
  )
  assert.equal(
    `${sql}\n${hardeningSql}`.includes('alter publication supabase_realtime'),
    false,
    '001B must not activate realtime publication before live state semantics are accepted',
  )
  assert.equal(
    /howler[^\n]{0,80}(\/|\*)[^\n]{0,80}(speed|percent)/i.test(`${sql}\n${hardeningSql}`),
    false,
    'migrations must not derive Howler duration from advertised speed percentage',
  )
}

testLaunchOrder()
testClosedSessionRule()
await testMigrationContract()

console.log('CASTLE-COMMAND-001B tests passed')
