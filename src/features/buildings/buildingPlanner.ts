import {
  getBuildingProgressionSemantics,
  sortBuildingProgression,
} from '../../../shared/data-pipeline/buildingsProgressionOrdering'
import {
  numberValue,
  textValue,
  type BuildingCompanionRecord,
  type BuildingProgressionRow,
} from './buildingData'

export type BuildingPlannerResourceKey =
  | 'bread'
  | 'wood'
  | 'stone'
  | 'iron'
  | 'truegold'
  | 'tempered_truegold'

export type BuildingPlannerStep = {
  id: string
  label: string
  shortLabel: string
  phase: 'standard' | 'transition' | 'truegold'
  source: BuildingProgressionRow
  bread: number
  wood: number
  stone: number
  iron: number
  truegold: number
  temperedTruegold: number
  upgradeTimeSeconds: number
  power: number | null
  requirements: string
}

export type BuildingPlannerPosition = {
  id: string
  label: string
  completedIndex: number
}

export type BuildingPlannerTotals = {
  steps: BuildingPlannerStep[]
  bread: number
  wood: number
  stone: number
  iron: number
  truegold: number
  temperedTruegold: number
  baseTimeSeconds: number
  adjustedTimeSeconds: number
  powerGain: number | null
  currentPower: number | null
  targetPower: number | null
  missingPowerCoverage: boolean
  basicResourceReductionPercent: number
  constructionSpeedPercent: number
}

export type BuildingPlannerModel = {
  building: BuildingCompanionRecord
  steps: BuildingPlannerStep[]
  positions: BuildingPlannerPosition[]
}

function clampPercent(value: unknown): number {
  const parsed = numberValue(value) ?? 0
  return Math.min(95, Math.max(0, parsed))
}

function resource(value: unknown): number {
  return Math.max(0, numberValue(value) ?? 0)
}

function transitionLabel(row: BuildingProgressionRow, index: number): string {
  const publishedLabel = textValue(row.level_label).trim()
  if (publishedLabel) return `Transition ${publishedLabel}`

  const tier = numberValue(row.truegold_tier)
  if (tier !== null) return `Transition ${tier}`

  return `Transition ${index + 1}`
}

function stepLabel(row: BuildingProgressionRow, index: number): {
  label: string
  shortLabel: string
  phase: BuildingPlannerStep['phase']
} {
  const semantics = getBuildingProgressionSemantics(row)

  if (semantics.rowKind === 'transition') {
    const label = transitionLabel(row, index)
    return { label, shortLabel: label.replace('Transition ', 'T'), phase: 'transition' }
  }

  if (
    semantics.rowKind === 'truegold-tier' ||
    semantics.rowKind === 'truegold-sub-stage'
  ) {
    return {
      label: semantics.displayLabel,
      shortLabel: semantics.displayLabel,
      phase: 'truegold',
    }
  }

  const level = semantics.baseLevel ?? numberValue(row.level_label)
  const label = level === null ? `Step ${index + 1}` : `Level ${level}`
  return {
    label,
    shortLabel: level === null ? String(index + 1) : String(level),
    phase: 'standard',
  }
}

export function createBuildingPlannerSteps(
  progression: readonly BuildingProgressionRow[],
): BuildingPlannerStep[] {
  return sortBuildingProgression(progression)
    .filter((row) => getBuildingProgressionSemantics(row).rowKind !== 'base-state')
    .map((row, index) => {
      const labels = stepLabel(row, index)
      const recordId = textValue(row.record_id).trim()

      return {
        id: recordId || `${labels.phase}-${index + 1}`,
        label: labels.label,
        shortLabel: labels.shortLabel,
        phase: labels.phase,
        source: row,
        bread: resource(row.bread),
        wood: resource(row.wood),
        stone: resource(row.stone),
        iron: resource(row.iron),
        truegold: resource(row.truegold),
        temperedTruegold: resource(row.tempered_truegold),
        upgradeTimeSeconds: resource(row.upgrade_time_seconds),
        power: numberValue(row.power),
        requirements: textValue(row.requirements_text, '—').trim() || '—',
      }
    })
}

export function createBuildingPlannerModel(
  building: BuildingCompanionRecord,
): BuildingPlannerModel {
  const steps = createBuildingPlannerSteps(building.progression)
  const firstStep = steps[0]
  const initialLabel = firstStep?.phase === 'truegold'
    ? `Before ${firstStep.label}`
    : 'Before first upgrade'

  const positions: BuildingPlannerPosition[] = [
    { id: 'start', label: initialLabel, completedIndex: -1 },
    ...steps.map((step, index) => ({
      id: step.id,
      label: step.label,
      completedIndex: index,
    })),
  ]

  return { building, steps, positions }
}

function powerAtOrBefore(
  steps: BuildingPlannerStep[],
  completedIndex: number,
): number | null {
  for (let index = completedIndex; index >= 0; index -= 1) {
    const power = steps[index]?.power
    if (power !== null && power !== undefined) return power
  }
  return completedIndex < 0 ? 0 : null
}

export function calculateBuildingPlan(
  model: BuildingPlannerModel,
  currentPositionId: string,
  targetPositionId: string,
  constructionSpeedPercent: unknown = 0,
  basicResourceReductionPercent: unknown = 0,
): BuildingPlannerTotals {
  const current = model.positions.find((position) => position.id === currentPositionId)
    ?? model.positions[0]
  const target = model.positions.find((position) => position.id === targetPositionId)
    ?? model.positions[Math.min(1, model.positions.length - 1)]

  const fromIndex = Math.min(current.completedIndex, target.completedIndex)
  const toIndex = Math.max(current.completedIndex, target.completedIndex)
  const selectedSteps = target.completedIndex > current.completedIndex
    ? model.steps.slice(fromIndex + 1, toIndex + 1)
    : []

  const speed = Math.max(0, numberValue(constructionSpeedPercent) ?? 0)
  const reduction = clampPercent(basicResourceReductionPercent)
  const basicResourceMultiplier = 1 - reduction / 100

  const raw = selectedSteps.reduce(
    (totals, step) => ({
      bread: totals.bread + step.bread,
      wood: totals.wood + step.wood,
      stone: totals.stone + step.stone,
      iron: totals.iron + step.iron,
      truegold: totals.truegold + step.truegold,
      temperedTruegold: totals.temperedTruegold + step.temperedTruegold,
      baseTimeSeconds: totals.baseTimeSeconds + step.upgradeTimeSeconds,
    }),
    {
      bread: 0,
      wood: 0,
      stone: 0,
      iron: 0,
      truegold: 0,
      temperedTruegold: 0,
      baseTimeSeconds: 0,
    },
  )

  const currentPower = powerAtOrBefore(model.steps, current.completedIndex)
  const targetPower = powerAtOrBefore(model.steps, target.completedIndex)
  const powerGain = currentPower !== null && targetPower !== null
    ? Math.max(0, targetPower - currentPower)
    : null

  return {
    steps: selectedSteps,
    bread: Math.ceil(raw.bread * basicResourceMultiplier),
    wood: Math.ceil(raw.wood * basicResourceMultiplier),
    stone: Math.ceil(raw.stone * basicResourceMultiplier),
    iron: Math.ceil(raw.iron * basicResourceMultiplier),
    truegold: raw.truegold,
    temperedTruegold: raw.temperedTruegold,
    baseTimeSeconds: raw.baseTimeSeconds,
    adjustedTimeSeconds: raw.baseTimeSeconds / (1 + speed / 100),
    powerGain,
    currentPower,
    targetPower,
    missingPowerCoverage: selectedSteps.some((step) => step.power === null),
    basicResourceReductionPercent: reduction,
    constructionSpeedPercent: speed,
  }
}

export function nextTargetPositionId(
  model: BuildingPlannerModel,
  currentPositionId: string,
): string {
  const currentIndex = model.positions.findIndex((position) => position.id === currentPositionId)
  const targetIndex = Math.min(
    Math.max(currentIndex + 1, 1),
    model.positions.length - 1,
  )
  return model.positions[targetIndex]?.id ?? 'start'
}
