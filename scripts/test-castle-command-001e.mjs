import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { buildCastleCommandTacticalPlan } from '../src/features/castle-command/castleCommandTacticsDomain.ts'

function testFrozenVersionContext() {
  const assignments = [{
    id: 'snapshot-a',
    playerAccountId: 'player-a',
    playerId: '101',
    playerName: 'Alpha',
    target: 'castle',
    useHowler: false,
    howlerSkillLevel: 8,
    marchSeconds: 60,
    timingSource: 'normal',
    needsHowlerCalibration: false,
    profileUpdatedAt: '2026-08-23T12:00:00Z',
  }]
  const plan = buildCastleCommandTacticalPlan({
    mode: 'simultaneous',
    sessionImpactAt: new Date('2026-08-23T15:00:00Z'),
    counterAnchorAt: null,
    counterOffsetSeconds: 1,
    staggerSeconds: 0,
    waves: [{ id: 'wave-1', label: 'Wave 1', offsetSeconds: 0 }],
    rallyPreparationSeconds: 300,
    assignments,
  })
  assert.ok(plan)
  assert.equal(plan.rows[0].impactAt.toISOString(), '2026-08-23T15:00:00.000Z')
  assert.equal(plan.rows[0].rallyStartAt.toISOString(), '2026-08-23T14:54:00.000Z')
}

async function testSharedContracts() {
  const migration = await readFile(resolve(process.cwd(), 'supabase/migrations/20260823151500_castle_command_shared_tactical_operations.sql'), 'utf8')
  const hardening = await readFile(resolve(process.cwd(), 'supabase/migrations/20260823152000_castle_command_tactical_context_snapshot.sql'), 'utf8')
  const service = await readFile(resolve(process.cwd(), 'src/features/castle-command/castleCommandSharedService.ts'), 'utf8')
  const panel = await readFile(resolve(process.cwd(), 'src/features/castle-command/CastleCommandTacticsPanel.tsx'), 'utf8')
  const liveRoom = await readFile(resolve(process.cwd(), 'src/features/castle-command/CastleCommandLiveRoom.tsx'), 'utf8')

  for (const required of [
    'create table public.castle_command_tactical_plan_versions',
    'create table public.castle_command_tactical_plans',
    'target_expected_version bigint',
    "raise exception 'Castle Command tactical plan version conflict' using errcode = '40001'",
    'assignment_snapshot jsonb not null',
    'public.build_castle_command_assignment_snapshot(target_session_id)',
    'public.can_manage_castle_command_session(target_session_id)',
    "Closed Castle Command session tactical plan is immutable",
    'create trigger castle_command_tactical_plans_broadcast_change',
    'get_castle_command_battle_summary',
  ]) assert.ok(migration.includes(required), `001E migration missing ${required}`)

  assert.equal(migration.includes('grant select on public.castle_command_tactical_plan_versions to authenticated'), false)
  assert.equal(migration.includes('grant select on public.castle_command_tactical_plans to authenticated'), false)
  assert.equal(migration.includes('grant insert on public.castle_command_tactical_plan_versions to authenticated'), false)

  for (const required of [
    'session_impact_at_snapshot timestamptz',
    'rally_preparation_seconds_snapshot integer',
    'command_session.impact_at',
    'command_session.rally_preparation_seconds',
  ]) assert.ok(hardening.includes(required), `001E context hardening missing ${required}`)

  assert.ok(service.includes(".rpc('get_castle_command_shared_tactical_plan'"))
  assert.ok(service.includes(".rpc('save_castle_command_tactical_plan'"))
  assert.ok(service.includes(".rpc('list_castle_command_tactical_plan_history'"))
  assert.ok(service.includes(".rpc('get_castle_command_battle_summary'"))
  assert.ok(service.includes("candidate.code === '40001'"))

  assert.ok(panel.includes('Another commander published a newer tactical version'))
  assert.ok(panel.includes('Shared plan assignments are stale'))
  assert.ok(panel.includes('Load as draft'))
  assert.ok(panel.includes('history is never overwritten'))
  assert.ok(panel.includes('Forge records command coordination only'))
  assert.ok(panel.includes('realtimeRevision'))

  assert.ok(liveRoom.includes("event.entity === 'castle_command_tactical_plans'"))
  assert.ok(liveRoom.includes('setSharedRealtimeRevision'))
  assert.ok(liveRoom.includes('realtimeRevision={sharedRealtimeRevision}'))
}

testFrozenVersionContext()
await testSharedContracts()
console.log('CASTLE-COMMAND-001E tests passed')
