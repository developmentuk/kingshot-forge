import { ISLAND_RESERVOIRS } from './islandChestData.js'
import type {
  IslandChest,
  IslandReservoir,
  IslandRouteEdge,
  IslandRouteMode,
  IslandRouteResult,
  IslandRouteRound,
  IslandRouteStep,
  IslandRunner,
  IslandRouteNode,
} from './islandRouteTypes.js'

export function manhattanDistance(a: IslandRouteNode, b: IslandRouteNode): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
}

function compareCandidate(
  left: { from: IslandRouteNode; to: IslandChest; distance: number },
  right: { from: IslandRouteNode; to: IslandChest; distance: number },
): number {
  if (left.distance !== right.distance) return left.distance - right.distance
  if (left.from.id !== right.from.id) return left.from.id.localeCompare(right.from.id)
  return left.to.id.localeCompare(right.to.id)
}

function nearestCandidate(visited: readonly IslandRouteNode[], unvisited: readonly IslandChest[]) {
  const candidates = visited.flatMap((from) => unvisited.map((to) => ({ from, to, distance: manhattanDistance(from, to) })))
  return candidates.sort(compareCandidate)[0]
}

function buildRoundGroups(steps: readonly IslandRouteStep[]): IslandRouteRound[] {
  const rounds: IslandRouteRound[] = []
  for (let index = 0; index < steps.length; index += 2) {
    rounds.push({ round: rounds.length + 1, steps: steps.slice(index, index + 2) })
  }
  return rounds
}

function emptyRoute(mode: IslandRouteMode): IslandRouteResult {
  return { mode, totalDistance: 0, steps: [], edges: [], rounds: [] }
}

export function calculateSingleReservoirRoute(
  chests: readonly IslandChest[],
  start: IslandReservoir = ISLAND_RESERVOIRS[0],
): IslandRouteResult {
  if (chests.length === 0) return emptyRoute('single')

  const visited: IslandRouteNode[] = [start]
  const unvisited = [...chests].sort((left, right) => left.id.localeCompare(right.id))
  const steps: IslandRouteStep[] = []
  const edges: IslandRouteEdge[] = []
  let cumulativeDistance = 0

  while (unvisited.length > 0) {
    const candidate = nearestCandidate(visited, unvisited)
    if (!candidate) break

    cumulativeDistance += candidate.distance
    const step: IslandRouteStep = {
      order: steps.length + 1,
      node: candidate.to,
      fromId: candidate.from.id,
      runner: 'solo',
      distance: candidate.distance,
      cumulativeDistance,
    }

    steps.push(step)
    edges.push({ fromId: candidate.from.id, toId: candidate.to.id, runner: 'solo', distance: candidate.distance })
    visited.push(candidate.to)
    unvisited.splice(unvisited.findIndex((chest) => chest.id === candidate.to.id), 1)
  }

  return { mode: 'single', totalDistance: cumulativeDistance, steps, edges, rounds: steps.map((step) => ({ round: step.order, steps: [step] })) }
}

function nextRunnerStep(
  runner: IslandRunner,
  visited: IslandRouteNode[],
  unvisited: IslandChest[],
  order: number,
  cumulativeDistance: number,
): { step: IslandRouteStep; edge: IslandRouteEdge; cumulativeDistance: number } | null {
  const candidate = nearestCandidate(visited, unvisited)
  if (!candidate) return null

  const nextDistance = cumulativeDistance + candidate.distance
  const step: IslandRouteStep = {
    order,
    node: candidate.to,
    fromId: candidate.from.id,
    runner,
    distance: candidate.distance,
    cumulativeDistance: nextDistance,
  }

  visited.push(candidate.to)
  unvisited.splice(unvisited.findIndex((chest) => chest.id === candidate.to.id), 1)

  return {
    step,
    cumulativeDistance: nextDistance,
    edge: { fromId: candidate.from.id, toId: candidate.to.id, runner, distance: candidate.distance },
  }
}

export function calculateDoubleReservoirRoute(
  chests: readonly IslandChest[],
  reservoirOne: IslandReservoir = ISLAND_RESERVOIRS[1],
  reservoirTwo: IslandReservoir = ISLAND_RESERVOIRS[2],
): IslandRouteResult {
  if (chests.length === 0) return emptyRoute('double')

  const unvisited = [...chests].sort((left, right) => left.id.localeCompare(right.id))
  const visitedOne: IslandRouteNode[] = [reservoirOne]
  const visitedTwo: IslandRouteNode[] = [reservoirTwo]
  const steps: IslandRouteStep[] = []
  const edges: IslandRouteEdge[] = []
  let cumulativeDistance = 0

  while (unvisited.length > 0) {
    const first = nextRunnerStep('reservoir-1', visitedOne, unvisited, steps.length + 1, cumulativeDistance)
    if (first) {
      cumulativeDistance = first.cumulativeDistance
      steps.push(first.step)
      edges.push(first.edge)
    }

    const second = nextRunnerStep('reservoir-2', visitedTwo, unvisited, steps.length + 1, cumulativeDistance)
    if (second) {
      cumulativeDistance = second.cumulativeDistance
      steps.push(second.step)
      edges.push(second.edge)
    }
  }

  return { mode: 'double', totalDistance: cumulativeDistance, steps, edges, rounds: buildRoundGroups(steps) }
}

export function calculateIslandRoute(mode: IslandRouteMode, chests: readonly IslandChest[]): IslandRouteResult {
  return mode === 'single' ? calculateSingleReservoirRoute(chests) : calculateDoubleReservoirRoute(chests)
}

export function nodeLookup(chests: readonly IslandChest[], reservoirs: readonly IslandReservoir[] = ISLAND_RESERVOIRS) {
  return new Map<string, IslandRouteNode>([...reservoirs, ...chests].map((node) => [node.id, node]))
}

export function visibleStepCount(route: IslandRouteResult, progressIndex: number): number {
  if (route.steps.length === 0) return 0
  if (route.mode === 'single') return Math.min(Math.max(progressIndex, 1), route.steps.length)
  const selectedRounds = Math.min(Math.max(progressIndex, 1), route.rounds.length)
  return route.rounds.slice(0, selectedRounds).reduce((total, round) => total + round.steps.length, 0)
}
