export const CASTLE_COMMAND_TARGETS = [
  { id: 'castle', label: 'Castle' },
  { id: 'north', label: 'North Turret' },
  { id: 'east', label: 'East Turret' },
  { id: 'south', label: 'South Turret' },
  { id: 'west', label: 'West Turret' },
] as const

export type CastleCommandTarget = (typeof CASTLE_COMMAND_TARGETS)[number]['id']

export type RallyPreparationSeconds = 60 | 180 | 300

export type MarchTimeProfile = Record<
  CastleCommandTarget,
  {
    normalSeconds: number | null
    howlerSeconds: number | null
  }
>

export type ResolvedMarchTime = {
  seconds: number | null
  source: 'howler-observed' | 'normal' | 'normal-fallback'
  needsHowlerCalibration: boolean
}

export type LaunchTiming = {
  rallyStartAt: Date
  marchDepartureAt: Date
  impactAt: Date
  marchSeconds: number
  rallyPreparationSeconds: RallyPreparationSeconds
}

export function createEmptyMarchTimeProfile(): MarchTimeProfile {
  return {
    castle: { normalSeconds: null, howlerSeconds: null },
    north: { normalSeconds: null, howlerSeconds: null },
    east: { normalSeconds: null, howlerSeconds: null },
    south: { normalSeconds: null, howlerSeconds: null },
    west: { normalSeconds: null, howlerSeconds: null },
  }
}

/**
 * Parses a player-observed march duration. Accepted forms are m:ss and h:mm:ss.
 * A bare integer is treated as seconds so copy/pasted in-game values remain usable.
 */
export function parseMarchDuration(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  if (/^\d+$/.test(trimmed)) {
    const seconds = Number(trimmed)
    return Number.isSafeInteger(seconds) && seconds >= 0 ? seconds : null
  }

  const parts = trimmed.split(':')
  if (parts.length !== 2 && parts.length !== 3) return null
  if (parts.some((part) => !/^\d+$/.test(part))) return null

  const numbers = parts.map(Number)
  const seconds = numbers.at(-1)
  const minutes = numbers.at(-2)
  const hours = parts.length === 3 ? numbers[0] : 0

  if (
    seconds === undefined ||
    minutes === undefined ||
    !Number.isSafeInteger(seconds) ||
    !Number.isSafeInteger(minutes) ||
    !Number.isSafeInteger(hours) ||
    seconds < 0 ||
    seconds > 59 ||
    minutes < 0 ||
    (parts.length === 3 && minutes > 59) ||
    hours < 0
  ) {
    return null
  }

  const total = hours * 3600 + minutes * 60 + seconds
  return Number.isSafeInteger(total) ? total : null
}

export function formatMarchDuration(totalSeconds: number | null): string {
  if (totalSeconds === null || !Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return '—'
  }

  const roundedSeconds = Math.round(totalSeconds)
  const hours = Math.floor(roundedSeconds / 3600)
  const minutes = Math.floor((roundedSeconds % 3600) / 60)
  const seconds = roundedSeconds % 60

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

/**
 * Howler timings are deliberately observation-led. We never infer an exact buffed
 * march time from the advertised March Speed percentage because Kingshot applies
 * march-speed modifiers within its own movement calculation.
 */
export function resolveMarchTime(
  target: MarchTimeProfile[CastleCommandTarget],
  howlerEnabled: boolean,
): ResolvedMarchTime {
  if (howlerEnabled && target.howlerSeconds !== null) {
    return {
      seconds: target.howlerSeconds,
      source: 'howler-observed',
      needsHowlerCalibration: false,
    }
  }

  if (howlerEnabled) {
    return {
      seconds: target.normalSeconds,
      source: 'normal-fallback',
      needsHowlerCalibration: target.normalSeconds !== null,
    }
  }

  return {
    seconds: target.normalSeconds,
    source: 'normal',
    needsHowlerCalibration: false,
  }
}

export function buildLaunchTiming(input: {
  impactAt: Date
  marchSeconds: number
  rallyPreparationSeconds: RallyPreparationSeconds
}): LaunchTiming | null {
  const impactMs = input.impactAt.getTime()
  if (
    !Number.isFinite(impactMs) ||
    !Number.isSafeInteger(input.marchSeconds) ||
    input.marchSeconds < 0
  ) {
    return null
  }

  const marchMilliseconds = input.marchSeconds * 1000
  const preparationMilliseconds = input.rallyPreparationSeconds * 1000

  return {
    rallyStartAt: new Date(impactMs - marchMilliseconds - preparationMilliseconds),
    marchDepartureAt: new Date(impactMs - marchMilliseconds),
    impactAt: new Date(impactMs),
    marchSeconds: input.marchSeconds,
    rallyPreparationSeconds: input.rallyPreparationSeconds,
  }
}

export function formatClockTime(date: Date, timeZone?: string): string {
  if (!Number.isFinite(date.getTime())) return '—'

  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    ...(timeZone ? { timeZone } : {}),
  }).format(date)
}
