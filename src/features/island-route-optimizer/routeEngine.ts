import {
  ISLAND_HQ,
  islandChestNodes,
  type IslandChestNode,
  type IslandCoordinate,
} from './islandRouteData.ts'

export type IslandRouteMode = 'single' | 'double'
export type IslandReservoir = 1 | 2

export type IslandRoutePoint = IslandCoordinate & Readonly<{
  id: string
  label: string
}>

export type IslandRoutePlacement = Readonly<{
  chest: IslandChestNode
  reservoir: IslandReservoir
  round: number
  from: IslandRoutePoint
  distance: number
}>

export type IslandRouteRound = Readonly<{
  index: number
  placements: ReadonlyArray<IslandRoutePlacement>
  distance: number
}>

export type IslandRoutePlan = Readonly<{
  mode: IslandRouteMode
  rounds: ReadonlyArray<IslandRouteRound>
  totalPlacements: number
  totalDistance: number
}>

type RouteCandidate = Readonly<{
  chest: IslandChestNode
  from: IslandRoutePoint
  distance: number
}>

export function manhattanDistance(a: IslandCoordinate, b: IslandCoordinate): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
}

function comparePoints(a: IslandRoutePoint, b: IslandRoutePoint): number {
  return a.x - b.x || a.y - b.y || a.id.localeCompare(b.id)
}

function compareCandidates(a: RouteCandidate, b: RouteCandidate): number {
  return (
    a.distance - b.distance ||
    a.chest.x - b.chest.x ||
    a.chest.y - b.chest.y ||
    a.chest.id.localeCompare(b.chest.id) ||
    comparePoints(a.from, b.from)
  )
}

function routeCandidates(
  cleared: ReadonlyArray<IslandRoutePoint>,
  unvisited: ReadonlyArray<IslandChestNode>,
): ReadonlyArray<RouteCandidate> {
  const candidates: RouteCandidate[] = []

  for (const from of cleared) {
    for (const chest of unvisited) {
      candidates.push(Object.freeze({
        chest,
        from,
        distance: manhattanDistance(from, chest),
      }))
    }
  }

  return candidates.sort(compareCandidates)
}

function buildSingleRoute(
  nodes: ReadonlyArray<IslandChestNode>,
  origin: IslandRoutePoint,
): IslandRoutePlan {
  const cleared: IslandRoutePoint[] = [origin]
  const unvisited = [...nodes]
  const rounds: IslandRouteRound[] = []

  while (unvisited.length > 0) {
    const candidate = routeCandidates(cleared, unvisited)[0]
    if (!candidate) throw new Error('Unable to find the next Island route candidate.')

    const roundIndex = rounds.length + 1
    const placement: IslandRoutePlacement = Object.freeze({
      chest: candidate.chest,
      reservoir: 1,
      round: roundIndex,
      from: candidate.from,
      distance: candidate.distance,
    })

    rounds.push(Object.freeze({
      index: roundIndex,
      placements: Object.freeze([placement]),
      distance: placement.distance,
    }))

    cleared.push(candidate.chest)
    unvisited.splice(unvisited.findIndex((node) => node.id === candidate.chest.id), 1)
  }

  return Object.freeze({
    mode: 'single',
    rounds: Object.freeze(rounds),
    totalPlacements: nodes.length,
    totalDistance: rounds.reduce((total, round) => total + round.distance, 0),
  })
}

function buildDoubleRoute(
  nodes: ReadonlyArray<IslandChestNode>,
  origin: IslandRoutePoint,
): IslandRoutePlan {
  const cleared: IslandRoutePoint[] = [origin]
  const unvisited = [...nodes]
  const rounds: IslandRouteRound[] = []

  while (unvisited.length > 0) {
    const candidates = routeCandidates(cleared, unvisited)
    const first = candidates[0]
    if (!first) throw new Error('Unable to find the next Island route candidate.')

    const second = candidates.find((candidate) => candidate.chest.id !== first.chest.id)
    const selected = second ? [first, second] : [first]
    const roundIndex = rounds.length + 1

    const placements = selected.map((candidate, index) => Object.freeze({
      chest: candidate.chest,
      reservoir: (index + 1) as IslandReservoir,
      round: roundIndex,
      from: candidate.from,
      distance: candidate.distance,
    }))

    rounds.push(Object.freeze({
      index: roundIndex,
      placements: Object.freeze(placements),
      distance: placements.reduce((total, placement) => total + placement.distance, 0),
    }))

    const selectedIds = new Set(placements.map((placement) => placement.chest.id))
    cleared.push(...placements.map((placement) => placement.chest))

    for (let index = unvisited.length - 1; index >= 0; index -= 1) {
      if (selectedIds.has(unvisited[index].id)) unvisited.splice(index, 1)
    }
  }

  return Object.freeze({
    mode: 'double',
    rounds: Object.freeze(rounds),
    totalPlacements: nodes.length,
    totalDistance: rounds.reduce((total, round) => total + round.distance, 0),
  })
}

export function buildIslandRoutePlan(
  mode: IslandRouteMode,
  nodes: ReadonlyArray<IslandChestNode> = islandChestNodes,
  origin: IslandRoutePoint = ISLAND_HQ,
): IslandRoutePlan {
  if (nodes.length === 0) {
    return Object.freeze({
      mode,
      rounds: Object.freeze([]),
      totalPlacements: 0,
      totalDistance: 0,
    })
  }

  return mode === 'double'
    ? buildDoubleRoute(nodes, origin)
    : buildSingleRoute(nodes, origin)
}

export function placementsThroughRound(
  plan: IslandRoutePlan,
  round: number,
): ReadonlyArray<IslandRoutePlacement> {
  return plan.rounds
    .filter((routeRound) => routeRound.index <= round)
    .flatMap((routeRound) => routeRound.placements)
}

export function roundForChest(plan: IslandRoutePlan, chestId: string): number | undefined {
  return plan.rounds.find((round) => round.placements.some((placement) => placement.chest.id === chestId))?.index
}

export function describeRoutePlacement(placement: IslandRoutePlacement): string {
  return `${placement.chest.label} at X ${placement.chest.x}, Y ${placement.chest.y}; ${placement.distance} grid steps from ${placement.from.label}.`
}
