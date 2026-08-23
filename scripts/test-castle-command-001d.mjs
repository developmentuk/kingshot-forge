import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import {
  buildCastleCommandDiscordBrief,
  buildCastleCommandGameBrief,
  buildCastleCommandTacticalPlan,
  createDefaultCastleCommandWaves,
  nextCastleCommandCue,
} from '../src/features/castle-command/castleCommandTacticsDomain.ts'

const assignments = [
  {
    id: 'a', playerAccountId: 'pa', playerId: '101', playerName: 'Alpha', target: 'castle',
    useHowler: false, howlerSkillLevel: 8, marchSeconds: 60, timingSource: 'normal',
    needsHowlerCalibration: false, profileUpdatedAt: '2026-08-23T12:00:00Z',
  },
  {
    id: 'b', playerAccountId: 'pb', playerId: '102', playerName: 'Bravo', target: 'north',
    useHowler: true, howlerSkillLevel: 8, marchSeconds: 40, timingSource: 'howler-observed',
    needsHowlerCalibration: false, profileUpdatedAt: '2026-08-23T12:00:00Z',
  },
]

function testSimultaneousAndWaves() {
  const plan = buildCastleCommandTacticalPlan({
    mode: 'simultaneous',
    sessionImpactAt: new Date('2026-08-23T15:00:00Z'),
    counterAnchorAt: null,
    counterOffsetSeconds: 1,
    staggerSeconds: 1,
    waves: [
      { id: 'w1', label: 'Wave 1', offsetSeconds: 0 },
      { id: 'w2', label: 'Wave 2', offsetSeconds: 5 },
    ],
    rallyPreparationSeconds: 300,
    assignments,
  })
  assert.ok(plan)
  assert.equal(plan.rows.length, 4)
  assert.equal(plan.rows.filter((row) => row.waveId === 'w1').every((row) => row.impactAt.toISOString() === '2026-08-23T15:00:00.000Z'), true)
  assert.equal(plan.rows.filter((row) => row.waveId === 'w2').every((row) => row.impactAt.toISOString() === '2026-08-23T15:00:05.000Z'), true)
}

function testControlledStagger() {
  const plan = buildCastleCommandTacticalPlan({
    mode: 'staggered',
    sessionImpactAt: new Date('2026-08-23T15:00:00Z'),
    counterAnchorAt: null,
    counterOffsetSeconds: 1,
    staggerSeconds: 2,
    waves: createDefaultCastleCommandWaves(),
    rallyPreparationSeconds: 300,
    assignments,
  })
  assert.ok(plan)
  const impacts = plan.rows.map((row) => row.impactAt.getTime()).sort((a, b) => a - b)
  assert.equal(impacts[1] - impacts[0], 2_000)
}

function testCounterIsOperatorAnchored() {
  const missing = buildCastleCommandTacticalPlan({
    mode: 'counter',
    sessionImpactAt: new Date('2026-08-23T15:00:00Z'),
    counterAnchorAt: null,
    counterOffsetSeconds: 3,
    staggerSeconds: 0,
    waves: createDefaultCastleCommandWaves(),
    rallyPreparationSeconds: 300,
    assignments,
  })
  assert.equal(missing, null)

  const plan = buildCastleCommandTacticalPlan({
    mode: 'counter',
    sessionImpactAt: new Date('2026-08-23T15:00:00Z'),
    counterAnchorAt: new Date('2026-08-23T16:10:20Z'),
    counterOffsetSeconds: 3,
    staggerSeconds: 0,
    waves: createDefaultCastleCommandWaves(),
    rallyPreparationSeconds: 300,
    assignments,
  })
  assert.ok(plan)
  assert.equal(plan.anchorAt.toISOString(), '2026-08-23T16:10:23.000Z')
  assert.equal(plan.rows.every((row) => row.impactAt.toISOString() === '2026-08-23T16:10:23.000Z'), true)
}

function testBriefsAndCue() {
  const plan = buildCastleCommandTacticalPlan({
    mode: 'simultaneous',
    sessionImpactAt: new Date('2026-08-23T15:00:00Z'),
    counterAnchorAt: null,
    counterOffsetSeconds: 1,
    staggerSeconds: 0,
    waves: createDefaultCastleCommandWaves(),
    rallyPreparationSeconds: 300,
    assignments,
  })
  assert.ok(plan)
  assert.match(buildCastleCommandGameBrief(plan), /CASTLE COMMAND/)
  assert.match(buildCastleCommandDiscordBrief(plan), /Forge Castle Command/)
  assert.match(buildCastleCommandDiscordBrief(plan), /Forge does not detect enemy capture state/)

  const alpha = plan.rows.find((row) => row.playerAccountId === 'pa')
  assert.ok(alpha)
  const cue = nextCastleCommandCue({
    rows: plan.rows,
    nowMs: alpha.rallyStartAt.getTime() - 500,
    playerAccountId: 'pa',
    includeAllPlayers: false,
  })
  assert.equal(cue?.playerAccountId, 'pa')
}

async function testAuthorityContracts() {
  const migration = await readFile(resolve(process.cwd(), 'supabase/migrations/20260823141000_castle_command_battle_tactics_deputies.sql'), 'utf8')
  const service = await readFile(resolve(process.cwd(), 'src/features/castle-command/castleCommandTacticsService.ts'), 'utf8')
  const panel = await readFile(resolve(process.cwd(), 'src/features/castle-command/CastleCommandTacticsPanel.tsx'), 'utf8')

  for (const required of [
    'create table public.castle_command_session_deputies',
    'foreign key (session_id, player_account_id)',
    'create or replace function public.can_manage_castle_command_session',
    'create or replace function public.get_castle_command_session_authority',
    'create or replace function public.set_castle_command_session_deputy',
    "if not public.can_manage_castle_command(command_session.alliance_id)",
    'create trigger castle_command_deputies_broadcast_change',
  ]) assert.ok(migration.includes(required), `001D migration missing ${required}`)

  assert.equal(migration.includes('grant insert on public.castle_command_session_deputies to authenticated'), false)
  assert.equal(migration.includes('grant update on public.castle_command_session_deputies to authenticated'), false)
  assert.equal(migration.includes('grant delete on public.castle_command_session_deputies to authenticated'), false)
  assert.ok(service.includes(".rpc('set_castle_command_session_deputy'"))
  assert.ok(panel.includes('Forge does not detect enemy ownership'))
  assert.ok(panel.includes('Audio + spoken launch cues'))
}

testSimultaneousAndWaves()
testControlledStagger()
testCounterIsOperatorAnchored()
testBriefsAndCue()
await testAuthorityContracts()
console.log('CASTLE-COMMAND-001D tests passed')
