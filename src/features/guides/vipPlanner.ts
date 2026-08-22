import type { VipBenefit, VipLevel } from './vipGuideData'

export type VipBenefitChange = {
  key: string
  label: string
  unit: VipBenefit['unit']
  status: VipBenefit['status']
  fromValue: number | null
  toValue: number | null
}

export type VipPlan = {
  currentLevel: number
  targetLevel: number
  levelsCrossed: number[]
  requiredVipXp: number
  gemEquivalent: number
  target: VipLevel
  benefitChanges: VipBenefitChange[]
}

function clampLevel(value: number): number {
  if (!Number.isFinite(value)) return 1
  return Math.min(12, Math.max(1, Math.floor(value)))
}

export function calculateVipPlan(levels: VipLevel[], currentLevelValue: number, targetLevelValue: number): VipPlan {
  if (levels.length !== 12) throw new Error('VIP planner requires all 12 governed levels.')
  const currentLevel = clampLevel(currentLevelValue)
  const targetLevel = clampLevel(targetLevelValue)
  const target = levels[targetLevel - 1]
  if (!target || target.level !== targetLevel) throw new Error('VIP planner target level is unavailable.')

  const rows = targetLevel > currentLevel
    ? levels.filter((row) => row.level > currentLevel && row.level <= targetLevel)
    : []

  const currentBenefits = new Map(levels[currentLevel - 1]?.benefits.map((benefit) => [benefit.key, benefit]) ?? [])
  const benefitChanges: VipBenefitChange[] = []

  if (targetLevel > currentLevel) {
    for (const benefit of target.benefits) {
      const current = currentBenefits.get(benefit.key)
      if (benefit.status === 'conflicted') {
        benefitChanges.push({
          key: benefit.key,
          label: benefit.label,
          unit: benefit.unit,
          status: benefit.status,
          fromValue: current?.value ?? null,
          toValue: null,
        })
        continue
      }

      if (!current || current.status !== benefit.status || current.value !== benefit.value) {
        benefitChanges.push({
          key: benefit.key,
          label: benefit.label,
          unit: benefit.unit,
          status: benefit.status,
          fromValue: current?.value ?? null,
          toValue: benefit.value,
        })
      }
    }
  }

  return {
    currentLevel,
    targetLevel,
    levelsCrossed: rows.map((row) => row.level),
    requiredVipXp: rows.reduce((total, row) => total + row.xpToReach, 0),
    gemEquivalent: rows.reduce((total, row) => total + row.gemsEquivalent, 0),
    target,
    benefitChanges,
  }
}
