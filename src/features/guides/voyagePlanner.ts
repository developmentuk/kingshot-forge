export type VoyagePlanInput = {
  currentVoyages: number
  targetVoyages: number
  activeTeams: number
  compasses: number
  voyageHours?: number
  hoursReducedPerCompass?: number
}

export type VoyagePlan = {
  remainingVoyages: number
  dispatchRounds: number
  baselineHours: number
  compassHoursAvailable: number
  fullyAcceleratedVoyages: number
  partialVoyageHoursReduced: number
  compassesForImmediateCompletion: number
}

function safeInteger(value: number, fallback = 0): number {
  if (!Number.isFinite(value)) return fallback
  return Math.max(0, Math.floor(value))
}

export function calculateVoyagePlan(input: VoyagePlanInput): VoyagePlan {
  const currentVoyages = safeInteger(input.currentVoyages)
  const targetVoyages = safeInteger(input.targetVoyages)
  const activeTeams = Math.min(4, Math.max(1, safeInteger(input.activeTeams, 1)))
  const compasses = safeInteger(input.compasses)
  const voyageHours = Math.max(1, safeInteger(input.voyageHours ?? 8, 8))
  const hoursReducedPerCompass = Math.max(1, safeInteger(input.hoursReducedPerCompass ?? 1, 1))

  const remainingVoyages = Math.max(0, targetVoyages - currentVoyages)
  const dispatchRounds = remainingVoyages === 0 ? 0 : Math.ceil(remainingVoyages / activeTeams)
  const baselineHours = dispatchRounds * voyageHours
  const totalVoyageHours = remainingVoyages * voyageHours
  const compassHoursAvailable = Math.min(totalVoyageHours, compasses * hoursReducedPerCompass)
  const fullyAcceleratedVoyages = Math.floor(compassHoursAvailable / voyageHours)
  const partialVoyageHoursReduced = compassHoursAvailable % voyageHours
  const compassesForImmediateCompletion = remainingVoyages === 0
    ? 0
    : Math.ceil(totalVoyageHours / hoursReducedPerCompass)

  return {
    remainingVoyages,
    dispatchRounds,
    baselineHours,
    compassHoursAvailable,
    fullyAcceleratedVoyages,
    partialVoyageHoursReduced,
    compassesForImmediateCompletion,
  }
}
