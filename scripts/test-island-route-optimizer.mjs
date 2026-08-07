import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  ISLAND_HQ,
  ISLAND_MAP_BOUNDS,
  islandChestNodes,
  validateIslandRouteDataset,
} from '../src/features/island-route-optimizer/islandRouteData.ts'
import {
  buildIslandRoutePlan,
  manhattanDistance,
} from '../src/features/island-route-optimizer/routeEngine.ts'
import {
  createIslandRouteProgressState,
  createEmptyIslandRouteProgress,
  getActiveIslandRouteProgress,
  islandRouteProgressKey,
  islandRouteProgressStorageKey,
  isCurrentIslandRouteProgressRevision,
  islandRouteProgressSaveStatus,
  mergeIslandRouteProgress,
  updateIslandRouteProgress,
} from '../src/features/island-route-optimizer/islandRouteProgress.ts'

const validation = validateIslandRouteDataset()
assert.equal(validation.valid, true, validation.errors.join('\n'))
assert.equal(islandChestNodes.length, 55)
assert.equal(new Set(islandChestNodes.map((node) => node.id)).size, 55)
assert.equal(new Set(islandChestNodes.map((node) => `${node.x},${node.y}`)).size, 55)
assert.ok(islandChestNodes.every((node) => node.x >= 0 && node.x <= ISLAND_MAP_BOUNDS.width))
assert.ok(islandChestNodes.every((node) => node.y >= 0 && node.y <= ISLAND_MAP_BOUNDS.height))
assert.equal(manhattanDistance({ x: 2, y: 4 }, { x: 9, y: 12 }), 15)

function assertPlanIntegrity(plan, expectedRounds, expectedDistance) {
  assert.equal(plan.rounds.length, expectedRounds)
  assert.equal(plan.totalPlacements, 55)
  assert.equal(plan.totalDistance, expectedDistance)

  const placed = plan.rounds.flatMap((round) => round.placements)
  assert.equal(placed.length, 55)
  assert.equal(new Set(placed.map((placement) => placement.chest.id)).size, 55)
  assert.deepEqual(
    [...new Set(placed.map((placement) => placement.chest.id))].sort(),
    islandChestNodes.map((node) => node.id).sort(),
  )

  const cleared = new Set([ISLAND_HQ.id])
  for (const round of plan.rounds) {
    assert.ok(round.placements.length >= 1 && round.placements.length <= (plan.mode === 'double' ? 2 : 1))
    assert.equal(round.distance, round.placements.reduce((total, placement) => total + placement.distance, 0))

    const preRoundCleared = new Set(cleared)
    for (const placement of round.placements) {
      assert.equal(preRoundCleared.has(placement.from.id), true, `${placement.chest.id} references a point not cleared before round ${round.index}.`)
      assert.equal(placement.distance, manhattanDistance(placement.from, placement.chest))
    }

    round.placements.forEach((placement) => cleared.add(placement.chest.id))
  }
}

const single = buildIslandRoutePlan('single')
assertPlanIntegrity(single, 55, 478)
assert.ok(single.rounds.every((round) => round.placements[0]?.reservoir === 1))

const double = buildIslandRoutePlan('double')
assertPlanIntegrity(double, 28, 504)
assert.ok(double.rounds.slice(0, -1).every((round) => round.placements.length === 2))
assert.equal(double.rounds.at(-1)?.placements.length, 1)
assert.ok(double.rounds.every((round) => new Set(round.placements.map((placement) => placement.chest.id)).size === round.placements.length))

assert.deepEqual(buildIslandRoutePlan('single'), single)
assert.deepEqual(buildIslandRoutePlan('double'), double)

assert.equal(islandRouteProgressKey('single'), 'oasis-island:single:v1')
assert.equal(islandRouteProgressKey('double'), 'oasis-island:double:v1')
assert.notEqual(islandRouteProgressStorageKey('single'), islandRouteProgressStorageKey('double'))
assert.match(islandRouteProgressStorageKey('single'), /oasis-island:single:v1$/)
assert.match(islandRouteProgressStorageKey('double'), /oasis-island:double:v1$/)

const localProgress = createIslandRouteProgressState({
  completedChestIds: ['chest-002', 'chest-001', 'chest-002'],
  currentRound: 4,
  mode: 'single',
  updatedAt: '2026-08-06T12:00:00.000Z',
})
const remoteProgress = createIslandRouteProgressState({
  completedChestIds: ['chest-003'],
  currentRound: 2,
  mode: 'single',
  updatedAt: '2026-08-06T12:01:00.000Z',
})
const localWins = mergeIslandRouteProgress(localProgress, remoteProgress, '2026-08-06T12:02:00.000Z')
assert.deepEqual(localWins.completedChestIds, ['chest-001', 'chest-002', 'chest-003'])
assert.equal(localWins.currentRound, 4)
assert.equal(localWins.updatedAt, '2026-08-06T12:02:00.000Z')

const remoteWinsRound = mergeIslandRouteProgress(
  createIslandRouteProgressState({ completedChestIds: ['chest-001'], currentRound: 9, mode: 'double', updatedAt: 'local' }),
  createIslandRouteProgressState({ completedChestIds: ['chest-001', 'chest-002'], currentRound: 3, mode: 'double', updatedAt: 'remote' }),
  'merged',
)
assert.deepEqual(remoteWinsRound.completedChestIds, ['chest-001', 'chest-002'])
assert.equal(remoteWinsRound.currentRound, 3)

const singleOnly = createIslandRouteProgressState({ completedChestIds: ['single-chest'], currentRound: 2, mode: 'single', updatedAt: 'single' })
const doubleOnly = createIslandRouteProgressState({ completedChestIds: ['double-chest'], currentRound: 2, mode: 'double', updatedAt: 'double' })
assert.deepEqual(mergeIslandRouteProgress(singleOnly, null, 'single').completedChestIds, ['single-chest'])
assert.deepEqual(mergeIslandRouteProgress(doubleOnly, null, 'double').completedChestIds, ['double-chest'])
assert.deepEqual(mergeIslandRouteProgress(singleOnly, doubleOnly, 'mismatch').completedChestIds, ['single-chest'])
assert.deepEqual(mergeIslandRouteProgress(doubleOnly, singleOnly, 'mismatch').completedChestIds, ['double-chest'])

const progressByKey = {
  [islandRouteProgressKey('single')]: singleOnly,
  [islandRouteProgressKey('double')]: doubleOnly,
}
assert.deepEqual(getActiveIslandRouteProgress(progressByKey, 'single').completedChestIds, ['single-chest'])
assert.deepEqual(getActiveIslandRouteProgress(progressByKey, 'double').completedChestIds, ['double-chest'])
assert.deepEqual(getActiveIslandRouteProgress({
  [islandRouteProgressKey('single')]: singleOnly,
}, 'double').completedChestIds, [])
assert.equal(getActiveIslandRouteProgress({
  [islandRouteProgressKey('single')]: createIslandRouteProgressState({ completedChestIds: ['wrong-mode'], currentRound: 1, mode: 'double', updatedAt: 'mismatch' }),
}, 'single').completedChestIds.length, 0)
assert.deepEqual(createEmptyIslandRouteProgress('single').completedChestIds, [])
const updatedSingleProgress = updateIslandRouteProgress(progressByKey, 'single', (current) => createIslandRouteProgressState({
  completedChestIds: [...current.completedChestIds, 'single-added'],
  currentRound: 3,
  mode: 'single',
  updatedAt: 'updated',
}))
assert.deepEqual(updatedSingleProgress[islandRouteProgressKey('single')].completedChestIds, ['single-added', 'single-chest'])
assert.deepEqual(updatedSingleProgress[islandRouteProgressKey('double')].completedChestIds, ['double-chest'])

const doubleReset = updateIslandRouteProgress(progressByKey, 'double', () => createIslandRouteProgressState({
  completedChestIds: [],
  currentRound: 1,
  mode: 'double',
  reset: true,
  updatedAt: 'reset',
}))
assert.deepEqual(doubleReset[islandRouteProgressKey('double')].completedChestIds, [])
assert.deepEqual(doubleReset[islandRouteProgressKey('single')].completedChestIds, ['single-chest'])
const doubleAfterReset = updateIslandRouteProgress(doubleReset, 'double', (current) => createIslandRouteProgressState({
  completedChestIds: [...current.completedChestIds, 'double-new'],
  currentRound: 2,
  mode: 'double',
  updatedAt: 'marked',
}))
assert.deepEqual(doubleAfterReset[islandRouteProgressKey('double')].completedChestIds, ['double-new'])
assert.deepEqual(doubleAfterReset[islandRouteProgressKey('single')].completedChestIds, ['single-chest'])
const singleAfterChest28 = updateIslandRouteProgress(
  updateIslandRouteProgress(
    updateIslandRouteProgress({
      [islandRouteProgressKey('single')]: createIslandRouteProgressState({ completedChestIds: [], currentRound: 1, mode: 'single', reset: true, updatedAt: 'reset' }),
    }, 'single', (current) => createIslandRouteProgressState({ completedChestIds: [...current.completedChestIds, 'chest-28'], currentRound: 1, mode: 'single', updatedAt: '28' })),
    'single', (current) => createIslandRouteProgressState({ completedChestIds: [...current.completedChestIds, 'chest-02'], currentRound: 2, mode: 'single', updatedAt: '02' })),
  'single', (current) => createIslandRouteProgressState({ completedChestIds: [...current.completedChestIds, 'chest-29'], currentRound: 3, mode: 'single', updatedAt: '29' }),
)
assert.deepEqual(singleAfterChest28[islandRouteProgressKey('single')].completedChestIds, ['chest-02', 'chest-28', 'chest-29'])
assert.deepEqual(mergeIslandRouteProgress(
  singleAfterChest28[islandRouteProgressKey('single')],
  createIslandRouteProgressState({ completedChestIds: ['chest-28'], currentRound: 1, mode: 'single', updatedAt: 'older' }),
  'merged',
).completedChestIds, ['chest-02', 'chest-28', 'chest-29'])
assert.deepEqual(updateIslandRouteProgress({
  [islandRouteProgressKey('double')]: createIslandRouteProgressState({ completedChestIds: [], currentRound: 1, mode: 'double', reset: true, updatedAt: 'reset' }),
}, 'double', (current) => createIslandRouteProgressState({ completedChestIds: [...current.completedChestIds, 'double-01', 'double-02'], currentRound: 2, mode: 'double', updatedAt: 'double' }))[islandRouteProgressKey('double')].completedChestIds, ['double-01', 'double-02'])
assert.equal(isCurrentIslandRouteProgressRevision({
  activeProgressKey: islandRouteProgressKey('double'),
  progressKey: islandRouteProgressKey('double'),
  currentRevision: 2,
  expectedRevision: 2,
}), true)
assert.equal(isCurrentIslandRouteProgressRevision({
  activeProgressKey: islandRouteProgressKey('double'),
  progressKey: islandRouteProgressKey('double'),
  currentRevision: 3,
  expectedRevision: 2,
}), false)
assert.equal(isCurrentIslandRouteProgressRevision({
  activeProgressKey: islandRouteProgressKey('single'),
  progressKey: islandRouteProgressKey('double'),
  currentRevision: 2,
  expectedRevision: 2,
}), false)
assert.equal(islandRouteProgressSaveStatus('saved'), 'synced')
assert.equal(islandRouteProgressSaveStatus('fallback'), 'error')
assert.deepEqual(mergeIslandRouteProgress(
  createIslandRouteProgressState({ completedChestIds: ['stale'], currentRound: 4, mode: 'double', updatedAt: '2026-08-06T12:00:00.000Z' }),
  createIslandRouteProgressState({ completedChestIds: [], currentRound: 1, mode: 'double', reset: true, updatedAt: '2026-08-06T12:01:00.000Z' }),
  'merged',
).completedChestIds, [])

const pageSource = await readFile(new URL('../src/features/island-route-optimizer/IslandRouteOptimizerPage.tsx', import.meta.url), 'utf8')
assert.match(pageSource, /storedActiveProgress\?\.mode === mode/)
assert.match(pageSource, /progressByKeyRef/)
assert.match(pageSource, /key=\{progressKey\}/)
assert.match(pageSource, /progressRevisionRef/)
assert.match(pageSource, /saveQueueRef/)
assert.doesNotMatch(pageSource, /selectRound\(merged\.currentRound\)/)

const migration = await readFile(new URL('../supabase/migrations/20260806195647_user_tool_progress.sql', import.meta.url), 'utf8')
assert.match(migration, /create table if not exists public\.user_tool_progress/)
assert.match(migration, /alter table public\.user_tool_progress enable row level security/)
assert.match(migration, /create policy user_tool_progress_select_owner/)
assert.match(migration, /create policy user_tool_progress_update_owner/)
assert.doesNotMatch(pageSource, /20260806120000_user_tool_progress\.sql/)

const appSource = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')
const navigationSource = await readFile(new URL('../src/navigation/workspaceRegistry.ts', import.meta.url), 'utf8')
assert.match(appSource, /calculators\/island-chest-route-optimizer/)
assert.match(navigationSource, /Island Chest Route/)

console.log('Island Route Optimizer: 55 coordinates, deterministic single/double routes and shell registration verified.')
