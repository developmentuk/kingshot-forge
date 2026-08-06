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

const appSource = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8')
const navigationSource = await readFile(new URL('../src/navigation/workspaceRegistry.ts', import.meta.url), 'utf8')
assert.match(appSource, /calculators\/island-chest-route-optimizer/)
assert.match(navigationSource, /Island Chest Route/)

console.log('Island Route Optimizer: 55 coordinates, deterministic single/double routes and shell registration verified.')
