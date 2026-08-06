export type IslandCoordinate = Readonly<{
  x: number
  y: number
}>

export type IslandChestNode = IslandCoordinate & Readonly<{
  id: string
  label: string
  sourceIndex: number
  referenceGroup: 'reservoir-1' | 'reservoir-2'
  referenceSequence: number
}>

export const ISLAND_MAP_BOUNDS = Object.freeze({ width: 60, height: 60 })

export const ISLAND_HQ = Object.freeze({
  id: 'hq',
  label: 'HQ Centre',
  x: 0,
  y: 0,
})

const RESERVOIR_ONE_REFERENCE = [
  [9, 6],
  [4, 12],
  [5, 17],
  [11, 11],
  [13, 14],
  [24, 14],
  [3, 25],
  [6, 36],
  [30, 18],
  [28, 24],
  [23, 30],
  [29, 32],
  [22, 48],
  [19, 20],
  [13, 50],
  [8, 57],
  [19, 59],
  [13, 9],
  [28, 3],
  [29, 2],
  [40, 2],
  [49, 26],
  [50, 5],
  [40, 32],
  [45, 51],
  [52, 50],
  [60, 60],
] as const

const RESERVOIR_TWO_REFERENCE = [
  [6, 9],
  [7, 14],
  [8, 18],
  [11, 23],
  [17, 12],
  [7, 28],
  [5, 33],
  [13, 30],
  [8, 39],
  [13, 42],
  [18, 39],
  [24, 43],
  [30, 45],
  [26, 54],
  [31, 59],
  [5, 48],
  [2, 59],
  [39, 22],
  [42, 12],
  [49, 15],
  [56, 19],
  [59, 11],
  [58, 2],
  [39, 51],
  [48, 58],
  [57, 56],
  [48, 41],
  [54, 37],
] as const

const referenceCoordinates = [
  ...RESERVOIR_ONE_REFERENCE.map(([x, y], index) => ({
    x,
    y,
    referenceGroup: 'reservoir-1' as const,
    referenceSequence: index + 1,
  })),
  ...RESERVOIR_TWO_REFERENCE.map(([x, y], index) => ({
    x,
    y,
    referenceGroup: 'reservoir-2' as const,
    referenceSequence: index + 1,
  })),
]

export const islandChestNodes: ReadonlyArray<IslandChestNode> = Object.freeze(
  referenceCoordinates.map((coordinate, index) => Object.freeze({
    id: `chest-${String(index + 1).padStart(2, '0')}`,
    label: `Chest ${String(index + 1).padStart(2, '0')}`,
    sourceIndex: index + 1,
    ...coordinate,
  })),
)

export const islandRouteDatasetProvenance = Object.freeze({
  title: 'Oasis Island community chest coordinates',
  status: 'community-reference' as const,
  confidenceScore: 75,
  confidenceBand: 'Likely' as const,
  retrievedAt: '2026-08-06',
  sourceUrl: 'https://www.kingshotapp.com/apps/island-chest-route-optimizer',
  underlyingReferenceUrl: 'https://docs.google.com/document/d/1Z4z0h8fescy-DmEhBXn_ONKdTddibQT1MEoXs9REvsk/edit?tab=t.0',
  note: 'The 55 coordinates were transcribed from the community route visualisation referenced by the public optimiser. Forge recalculates routes independently and does not copy third-party map artwork.',
})

export type IslandRouteDatasetValidation = Readonly<{
  valid: boolean
  errors: ReadonlyArray<string>
}>

export function validateIslandRouteDataset(
  nodes: ReadonlyArray<IslandChestNode> = islandChestNodes,
): IslandRouteDatasetValidation {
  const errors: string[] = []
  const coordinateKeys = new Set<string>()
  const ids = new Set<string>()

  if (nodes.length !== 55) errors.push(`Expected 55 chest nodes; received ${nodes.length}.`)

  for (const node of nodes) {
    if (ids.has(node.id)) errors.push(`Duplicate chest ID: ${node.id}.`)
    ids.add(node.id)

    if (!Number.isInteger(node.x) || !Number.isInteger(node.y)) {
      errors.push(`${node.id} must use whole-number coordinates.`)
    }

    if (node.x < 0 || node.x > ISLAND_MAP_BOUNDS.width || node.y < 0 || node.y > ISLAND_MAP_BOUNDS.height) {
      errors.push(`${node.id} is outside the ${ISLAND_MAP_BOUNDS.width}×${ISLAND_MAP_BOUNDS.height} map bounds.`)
    }

    const coordinateKey = `${node.x},${node.y}`
    if (coordinateKeys.has(coordinateKey)) errors.push(`Duplicate coordinate: ${coordinateKey}.`)
    coordinateKeys.add(coordinateKey)
  }

  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors) })
}
