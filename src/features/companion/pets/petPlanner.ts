import type { ProgressionCurve } from './petData'

export type PetUpgradePlan = {
  currentLevel: number
  targetLevel: number
  levelsCrossed: number
  milestoneLevels: number[]
  petFood: number
  growthManual: number
  nutrientPotion: number
  promotionMedallion: number
}

function clampLevel(value: number, maxLevel: number): number {
  if (!Number.isSafeInteger(value)) return 1
  return Math.min(maxLevel, Math.max(1, value))
}

export function calculatePetUpgradePlan(
  curve: ProgressionCurve,
  currentLevelInput: number,
  targetLevelInput: number,
): PetUpgradePlan {
  const currentLevel = clampLevel(currentLevelInput, curve.maxLevel)
  const requestedTarget = clampLevel(targetLevelInput, curve.maxLevel)
  const targetLevel = Math.max(currentLevel, requestedTarget)
  const crossedRows = curve.levelProgression.filter((row) => row.level > currentLevel && row.level <= targetLevel)

  return crossedRows.reduce<PetUpgradePlan>((plan, row) => ({
    ...plan,
    levelsCrossed: plan.levelsCrossed + 1,
    milestoneLevels: row.level % 10 === 0 ? [...plan.milestoneLevels, row.level] : plan.milestoneLevels,
    petFood: plan.petFood + row.petFood,
    growthManual: plan.growthManual + (row.growthManual ?? 0),
    nutrientPotion: plan.nutrientPotion + (row.nutrientPotion ?? 0),
    promotionMedallion: plan.promotionMedallion + (row.promotionMedallion ?? 0),
  }), {
    currentLevel,
    targetLevel,
    levelsCrossed: 0,
    milestoneLevels: [],
    petFood: 0,
    growthManual: 0,
    nutrientPotion: 0,
    promotionMedallion: 0,
  })
}
