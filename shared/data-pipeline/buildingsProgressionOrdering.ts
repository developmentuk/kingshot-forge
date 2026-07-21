export type BuildingsProgressionRow = Record<string, unknown>

export type BuildingProgressionPhase = 'normal' | 'pre_truegold' | 'truegold' | 'unknown'
export type BuildingProgressionRowKind = 'base-state' | 'standard' | 'transition' | 'truegold-tier' | 'truegold-sub-stage' | 'unknown'

export interface BuildingProgressionSemantics {
  phase: BuildingProgressionPhase
  baseLevel: number | null
  tier: number | null
  subStage: number | null
  sourceSequence: number | null
  displayLabel: string
  rowKind: BuildingProgressionRowKind
  recordId: string
}

function integer(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isInteger(parsed) ? parsed : null
}

function phase(row: BuildingsProgressionRow): BuildingProgressionPhase {
  if (row.progression_phase === 'normal' || row.progression_phase === 'pre_truegold' || row.progression_phase === 'truegold') return row.progression_phase
  return 'unknown'
}

function sourceSequence(row: BuildingsProgressionRow): number | null {
  return integer(row.progression_sequence ?? row.source_sequence ?? row.original_row)
}

function recordId(row: BuildingsProgressionRow): string {
  return typeof row.record_id === 'string' ? row.record_id : ''
}

export function getBuildingProgressionSemantics(row: BuildingsProgressionRow): BuildingProgressionSemantics {
  const currentPhase = phase(row)
  const baseLevel = integer(row.base_level ?? row.level)
  const tier = currentPhase === 'truegold' ? integer(row.truegold_tier) : null
  const subStage = currentPhase === 'truegold' ? integer(row.stage) : null
  const rowKind: BuildingProgressionRowKind = currentPhase === 'truegold'
    ? subStage === 0 ? 'truegold-tier' : 'truegold-sub-stage'
    : currentPhase === 'normal' && baseLevel === 0 ? 'base-state'
      : currentPhase === 'pre_truegold' ? 'transition'
        : currentPhase === 'normal' ? 'standard' : 'unknown'

  let displayLabel = '—'
  if (currentPhase === 'truegold' && tier !== null && subStage !== null) displayLabel = `TG${tier}${subStage > 0 ? `-${subStage}` : ''}`
  else if (baseLevel !== null) displayLabel = String(baseLevel)

  return { phase: currentPhase, baseLevel, tier, subStage, sourceSequence: sourceSequence(row), displayLabel, rowKind, recordId: recordId(row) }
}

function phaseRank(value: BuildingProgressionPhase): number {
  return value === 'normal' ? 0 : value === 'pre_truegold' ? 1 : value === 'truegold' ? 2 : 3
}

/** Canonical order is phase, standard level, Truegold tier, sub-stage, source sequence, then ID. */
export function compareBuildingProgressionRows(left: BuildingsProgressionRow, right: BuildingsProgressionRow): number {
  const a = getBuildingProgressionSemantics(left)
  const b = getBuildingProgressionSemantics(right)
  const phaseDifference = phaseRank(a.phase) - phaseRank(b.phase)
  if (phaseDifference) return phaseDifference

  if (a.phase === 'truegold' && b.phase === 'truegold') {
    const tierDifference = (a.tier ?? Number.MAX_SAFE_INTEGER) - (b.tier ?? Number.MAX_SAFE_INTEGER)
    if (tierDifference) return tierDifference
    const subStageDifference = (a.subStage ?? Number.MAX_SAFE_INTEGER) - (b.subStage ?? Number.MAX_SAFE_INTEGER)
    if (subStageDifference) return subStageDifference
  } else {
    const levelDifference = (a.baseLevel ?? Number.MAX_SAFE_INTEGER) - (b.baseLevel ?? Number.MAX_SAFE_INTEGER)
    if (levelDifference) return levelDifference
  }

  const sourceDifference = (a.sourceSequence ?? Number.MAX_SAFE_INTEGER) - (b.sourceSequence ?? Number.MAX_SAFE_INTEGER)
  if (sourceDifference) return sourceDifference
  return a.recordId.localeCompare(b.recordId)
}

export function getBuildingProgressionLabel(row: BuildingsProgressionRow): string {
  return getBuildingProgressionSemantics(row).displayLabel
}

export function sortBuildingProgression<T extends BuildingsProgressionRow>(rows: readonly T[]): T[] {
  return [...rows].sort(compareBuildingProgressionRows)
}
