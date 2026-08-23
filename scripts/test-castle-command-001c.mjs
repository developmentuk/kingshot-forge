import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import {
  buildCastleCommandCountdown,
  estimateServerClockOffset,
  isCastleCommandLiveStateStale,
  resolveServerNow,
} from '../src/features/castle-command/castleCommandLiveDomain.ts'

function testServerClockCalibration() {
  const offset = estimateServerClockOffset({
    requestStartedAtMs: 1_000,
    responseReceivedAtMs: 1_100,
    serverNowMs: 1_250,
  })
  assert.equal(offset, 200)
  assert.equal(resolveServerNow(2_000, offset), 2_200)
  assert.equal(estimateServerClockOffset({ requestStartedAtMs: 2, responseReceivedAtMs: 1, serverNowMs: 3 }), null)
}

function testCountdownPhases() {
  const now = Date.parse('2026-08-23T12:00:00.000Z')
  assert.deepEqual(
    buildCastleCommandCountdown(new Date(now + 10_000), now),
    { phase: 'waiting', deltaMilliseconds: 10_000, display: '0:10' },
  )
  assert.equal(buildCastleCommandCountdown(new Date(now + 3_000), now).display, 'START NOW')
  assert.equal(buildCastleCommandCountdown(new Date(now - 7_000), now).display, 'LATE 0:07')
}

function testStaleState() {
  const now = 1_000_000
  assert.equal(isCastleCommandLiveStateStale({ connectionState: 'live', lastServerSyncAtMs: now - 60_000, localNowMs: now }), false)
  assert.equal(isCastleCommandLiveStateStale({ connectionState: 'offline', lastServerSyncAtMs: now - 1_000, localNowMs: now }), true)
  assert.equal(isCastleCommandLiveStateStale({ connectionState: 'live', lastServerSyncAtMs: now - 301_000, localNowMs: now }), true)
}

async function testMigrationAndClientContracts() {
  const migrationPath = resolve(process.cwd(), 'supabase/migrations/20260823132500_castle_command_live_command_room.sql')
  const hardeningPath = resolve(process.cwd(), 'supabase/migrations/20260823133600_castle_command_live_authority_hardening.sql')
  const resetPath = resolve(process.cwd(), 'supabase/migrations/20260823134100_castle_command_assignment_ack_reset.sql')
  const servicePath = resolve(process.cwd(), 'src/features/castle-command/castleCommandLiveService.ts')
  const [sql, hardeningSql, resetSql, service] = await Promise.all([
    readFile(migrationPath, 'utf8'),
    readFile(hardeningPath, 'utf8'),
    readFile(resetPath, 'utf8'),
    readFile(servicePath, 'utf8'),
  ])

  for (const required of [
    'create table public.castle_command_session_acknowledgements',
    "status text not null default 'waiting' check (status in ('waiting', 'ready', 'sent'))",
    'create or replace function public.can_participate_castle_command_session',
    'create or replace function public.set_castle_command_acknowledgement',
    'create or replace function public.reset_castle_command_acknowledgement',
    'create or replace function public.set_castle_command_session_status',
    'create or replace function public.can_access_castle_command_realtime_topic',
    'on realtime.messages',
    "realtime.messages.extension in ('broadcast', 'presence')",
    "realtime.messages.extension = 'presence'",
    'create or replace function public.broadcast_castle_command_state_change()',
    "'state_changed'",
    "'castle-command:' || command_session_id::text",
    'true',
  ]) {
    assert.ok(sql.includes(required), `live migration is missing: ${required}`)
  }

  assert.equal(
    sql.includes('alter publication supabase_realtime'),
    false,
    '001C uses private database Broadcast and must not add Castle Command tables to Postgres Changes publication',
  )
  assert.equal(
    /extension\s*=\s*'broadcast'[\s\S]{0,180}for insert/i.test(sql),
    false,
    'clients must not receive a policy allowing them to publish Castle Command broadcast commands',
  )
  assert.ok(hardeningSql.includes('revoke update, delete on public.castle_command_sessions from authenticated;'))
  assert.ok(hardeningSql.includes('volatile'))
  assert.ok(resetSql.includes('create or replace function public.reset_castle_command_ack_on_assignment_change()'))
  assert.ok(resetSql.includes('delete from public.castle_command_session_acknowledgements acknowledgement'))
  assert.ok(resetSql.includes('create trigger castle_command_assignment_reset_ack'))
  assert.ok(service.includes('private: true'))
  assert.ok(service.includes(".on('presence'"))
  assert.ok(service.includes(".on('broadcast'"))
  assert.ok(service.includes('onPresenceCount'))
  assert.ok(service.includes("channel.track({ onlineAt: new Date().toISOString() })"))
  assert.equal(service.includes("type: 'broadcast'"), false)
  assert.equal(service.includes('playerName'), false, 'client-authored Presence must not claim a player identity')
  assert.equal(service.includes("role: 'participant'"), false, 'client-authored Presence must not claim a participant role')
  assert.equal(service.includes("role: 'manager'"), false, 'client-authored Presence must not claim a manager role')
}

testServerClockCalibration()
testCountdownPhases()
testStaleState()
await testMigrationAndClientContracts()

console.log('CASTLE-COMMAND-001C tests passed')
