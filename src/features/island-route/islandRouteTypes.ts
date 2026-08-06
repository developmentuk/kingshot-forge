export type IslandRouteMode = 'single' | 'double'
export type IslandRunner = 'solo' | 'reservoir-1' | 'reservoir-2'
export type IslandNodeType = 'reservoir' | 'chest'

export type IslandCoordinate = {
  x: number
  y: number
}

export type IslandRouteNode = IslandCoordinate & {
  id: string
  label: string
  type: IslandNodeType
}

export type IslandChest = IslandRouteNode & {
  type: 'chest'
  sector: string
}

export type IslandReservoir = IslandRouteNode & {
  type: 'reservoir'
  runner: IslandRunner
}

export type IslandRouteEdge = {
  fromId: string
  toId: string
  runner: IslandRunner
  distance: number
}

export type IslandRouteStep = {
  order: number
  node: IslandChest
  fromId: string
  runner: IslandRunner
  distance: number
  cumulativeDistance: number
}

export type IslandRouteRound = {
  round: number
  steps: IslandRouteStep[]
}

export type IslandRouteResult = {
  mode: IslandRouteMode
  totalDistance: number
  steps: IslandRouteStep[]
  edges: IslandRouteEdge[]
  rounds: IslandRouteRound[]
}

export type IslandRouteSummary = {
  totalChests: number
  collectedChests: number
  remainingChests: number
  totalDistance: number
  visibleSteps: number
}
