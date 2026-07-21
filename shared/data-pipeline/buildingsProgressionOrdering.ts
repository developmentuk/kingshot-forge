export type BuildingsProgressionRow = Record<string, unknown>

function integer(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isInteger(parsed) ? parsed : null
}

function phase(row: BuildingsProgressionRow): string {
  return typeof row.progression_phase === 'string' ? row.progression_phase : ''
}

function phaseRank(row: BuildingsProgressionRow): number {
  switch (phase(row)) {
    case 'normal': return 0
    case 'pre_truegold': return 1
    case 'truegold': return 2
    default: return 3
  }
}

function recordId(row: BuildingsProgressionRow): string {
  return typeof row.record_id === 'string' ? row.record_id : ''
}

/**
 * The canonical Buildings row order is structural, not label-based:
 * base/normal levels, pre-Truegold transition rows, then Truegold stage/tier.
 * The final record id tie-breaker keeps malformed or legacy rows deterministic.
 */
export function compareBuildingProgressionRows(left: BuildingsProgressionRow, right: BuildingsProgressionRow): number {
  const phaseDifference = phaseRank(left) - phaseRank(right)
  if (phaseDifference) return phaseDifference

  if (phase(left) === 'truegold' && phase(right) === 'truegold') {
    const stageDifference = (integer(left.stage) ?? Number.MAX_SAFE_INTEGER) - (integer(right.stage) ?? Number.MAX_SAFE_INTEGER)
    if (stageDifference) return stageDifference
    const tierDifference = (integer(left.truegold_tier) ?? Number.MAX_SAFE_INTEGER) - (integer(right.truegold_tier) ?? Number.MAX_SAFE_INTEGER)
    if (tierDifference) return tierDifference
  } else {
    const levelDifference = (integer(left.base_level ?? left.level) ?? Number.MAX_SAFE_INTEGER) - (integer(right.base_level ?? right.level) ?? Number.MAX_SAFE_INTEGER)
    if (levelDifference) return levelDifference
  }

  return recordId(left).localeCompare(recordId(right))
}

export function sortBuildingProgression<T extends BuildingsProgressionRow>(rows: readonly T[]): T[] {
  return [...rows].sort(compareBuildingProgressionRows)
}
