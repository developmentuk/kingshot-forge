export const MIN_TOWN_CENTER_RAW_LEVEL = 1
export const MAX_TOWN_CENTER_RAW_LEVEL = 84

export function isTownCenterRawLevel(value: unknown): value is number {
  return typeof value === 'number'
    && Number.isInteger(value)
    && value >= MIN_TOWN_CENTER_RAW_LEVEL
    && value <= MAX_TOWN_CENTER_RAW_LEVEL
}

export function rawTownCenterFromTruegold(tier: number, subStage = 0): number | null {
  if (!Number.isInteger(tier) || tier < 1 || tier > 10) return null
  if (!Number.isInteger(subStage) || subStage < 0 || subStage > 4) return null
  return 35 + ((tier - 1) * 5) + subStage
}

export function formatTownCenterRawLevel(value: unknown): string {
  if (!isTownCenterRawLevel(value)) return 'Town Center not recorded'
  if (value <= 30) return `Town Center ${value}`
  if (value <= 34) return `Town Center 30-${value - 30}`

  const offset = value - 35
  const tier = Math.floor(offset / 5) + 1
  const subStage = offset % 5
  return subStage === 0 ? `TG${tier}` : `TG${tier}-${subStage}`
}
