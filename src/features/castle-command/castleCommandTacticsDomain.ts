import {
  buildLaunchTiming,
  formatClockTime,
  formatMarchDuration,
  type CastleCommandTarget,
  type RallyPreparationSeconds,
} from './castleCommandDomain'
import type { CastleCommandAssignmentSnapshot } from './castleCommandSessionDomain'

export type CastleCommandTacticalMode = 'simultaneous' | 'staggered' | 'counter'

export type CastleCommandTacticalWave = {
  id: string
  label: string
  offsetSeconds: number
}

export type CastleCommandTacticalRow = CastleCommandAssignmentSnapshot & {
  waveId: string
  waveLabel: string
  waveNumber: number
  rowNumber: number
  impactAt: Date
  rallyStartAt: Date
  marchDepartureAt: Date
}

export type CastleCommandTacticalPlan = {
  mode: CastleCommandTacticalMode
  anchorAt: Date
  staggerSeconds: number
  counterOffsetSeconds: number
  waves: CastleCommandTacticalWave[]
  rows: CastleCommandTacticalRow[]
}

export const MAX_CASTLE_COMMAND_WAVES = 5
export const MAX_CASTLE_COMMAND_WAVE_OFFSET_SECONDS = 300
export const MAX_CASTLE_COMMAND_STAGGER_SECONDS = 30
export const MAX_CASTLE_COMMAND_COUNTER_OFFSET_SECONDS = 60

export function createDefaultCastleCommandWaves(): CastleCommandTacticalWave[] {
  return [{ id: 'wave-1', label: 'Wave 1', offsetSeconds: 0 }]
}

function validWholeSeconds(value: number, maximum: number) {
  return Number.isInteger(value) && value >= 0 && value <= maximum
}

export function validateCastleCommandWaves(waves: CastleCommandTacticalWave[]): boolean {
  if (waves.length < 1 || waves.length > MAX_CASTLE_COMMAND_WAVES) return false
  const ids = new Set<string>()

  return waves.every((wave) => {
    if (!wave.id || ids.has(wave.id)) return false
    ids.add(wave.id)
    return wave.label.trim().length > 0
      && wave.label.trim().length <= 40
      && validWholeSeconds(wave.offsetSeconds, MAX_CASTLE_COMMAND_WAVE_OFFSET_SECONDS)
  })
}

function targetLabel(target: CastleCommandTarget) {
  if (target === 'castle') return 'Castle'
  return `${target[0].toUpperCase()}${target.slice(1)} Tower`
}

export function resolveCastleCommandTacticalAnchor(input: {
  mode: CastleCommandTacticalMode
  sessionImpactAt: Date
  counterAnchorAt: Date | null
  counterOffsetSeconds: number
}): Date | null {
  if (input.mode !== 'counter') {
    return Number.isFinite(input.sessionImpactAt.getTime()) ? input.sessionImpactAt : null
  }

  if (
    !input.counterAnchorAt
    || !Number.isFinite(input.counterAnchorAt.getTime())
    || !validWholeSeconds(input.counterOffsetSeconds, MAX_CASTLE_COMMAND_COUNTER_OFFSET_SECONDS)
  ) {
    return null
  }

  return new Date(input.counterAnchorAt.getTime() + input.counterOffsetSeconds * 1000)
}

export function buildCastleCommandTacticalPlan(input: {
  mode: CastleCommandTacticalMode
  sessionImpactAt: Date
  counterAnchorAt: Date | null
  counterOffsetSeconds: number
  staggerSeconds: number
  waves: CastleCommandTacticalWave[]
  rallyPreparationSeconds: RallyPreparationSeconds
  assignments: CastleCommandAssignmentSnapshot[]
}): CastleCommandTacticalPlan | null {
  if (
    !validateCastleCommandWaves(input.waves)
    || !validWholeSeconds(input.staggerSeconds, MAX_CASTLE_COMMAND_STAGGER_SECONDS)
  ) {
    return null
  }

  const anchorAt = resolveCastleCommandTacticalAnchor(input)
  if (!anchorAt) return null

  const orderedAssignments = [...input.assignments].sort((left, right) => {
    const marchDifference = right.marchSeconds - left.marchSeconds
    if (marchDifference !== 0) return marchDifference
    const nameDifference = left.playerName.localeCompare(right.playerName, 'en', { sensitivity: 'base' })
    if (nameDifference !== 0) return nameDifference
    return left.id.localeCompare(right.id)
  })

  const rows: CastleCommandTacticalRow[] = []

  input.waves.forEach((wave, waveIndex) => {
    orderedAssignments.forEach((assignment, assignmentIndex) => {
      const staggerOffsetSeconds = input.mode === 'staggered'
        ? assignmentIndex * input.staggerSeconds
        : 0
      const impactAt = new Date(
        anchorAt.getTime()
        + wave.offsetSeconds * 1000
        + staggerOffsetSeconds * 1000,
      )
      const timing = buildLaunchTiming({
        impactAt,
        marchSeconds: assignment.marchSeconds,
        rallyPreparationSeconds: input.rallyPreparationSeconds,
      })

      if (!timing) return
      rows.push({
        ...assignment,
        waveId: wave.id,
        waveLabel: wave.label,
        waveNumber: waveIndex + 1,
        rowNumber: assignmentIndex + 1,
        impactAt,
        rallyStartAt: timing.rallyStartAt,
        marchDepartureAt: timing.marchDepartureAt,
      })
    })
  })

  rows.sort((left, right) => {
    const startDifference = left.rallyStartAt.getTime() - right.rallyStartAt.getTime()
    if (startDifference !== 0) return startDifference
    if (left.waveNumber !== right.waveNumber) return left.waveNumber - right.waveNumber
    return left.rowNumber - right.rowNumber
  })

  return {
    mode: input.mode,
    anchorAt,
    staggerSeconds: input.staggerSeconds,
    counterOffsetSeconds: input.counterOffsetSeconds,
    waves: input.waves.map((wave) => ({ ...wave })),
    rows,
  }
}

function utcClock(value: Date) {
  return `${value.toISOString().slice(11, 19)} UTC`
}

export function buildCastleCommandGameBrief(plan: CastleCommandTacticalPlan): string {
  const mode = plan.mode === 'counter'
    ? `COUNTER +${plan.counterOffsetSeconds}s`
    : plan.mode.toUpperCase()
  const lines = [`CASTLE COMMAND · ${mode} · anchor ${utcClock(plan.anchorAt)}`]

  for (const wave of plan.waves) {
    const rows = plan.rows.filter((row) => row.waveId === wave.id)
    lines.push(`${wave.label} +${wave.offsetSeconds}s`)
    for (const row of rows) {
      lines.push(`${formatClockTime(row.rallyStartAt)} ${row.playerName} → ${targetLabel(row.target)} (${formatMarchDuration(row.marchSeconds)})`)
    }
  }

  return lines.join('\n')
}

export function buildCastleCommandDiscordBrief(plan: CastleCommandTacticalPlan): string {
  const modeLabel = plan.mode === 'counter'
    ? `Counter rally · operator anchor +${plan.counterOffsetSeconds}s`
    : plan.mode === 'staggered'
      ? `Controlled stagger · ${plan.staggerSeconds}s between impacts`
      : 'Simultaneous impact'
  const lines = [
    `**Forge Castle Command — ${modeLabel}**`,
    `Anchor: **${utcClock(plan.anchorAt)}**`,
    '',
  ]

  for (const wave of plan.waves) {
    lines.push(`**${wave.label}** · impact offset +${wave.offsetSeconds}s`)
    const rows = plan.rows.filter((row) => row.waveId === wave.id)
    for (const row of rows) {
      lines.push(`• **${row.playerName}** → ${targetLabel(row.target)} · start ${utcClock(row.rallyStartAt)} · impact ${utcClock(row.impactAt)} · march ${formatMarchDuration(row.marchSeconds)}${row.useHowler ? ` · Howler L${row.howlerSkillLevel}` : ''}`)
    }
    lines.push('')
  }

  lines.push('_Counter anchors and offsets are commander-entered observations; Forge does not detect enemy capture state._')
  return lines.join('\n').trim()
}

export function nextCastleCommandCue(input: {
  rows: CastleCommandTacticalRow[]
  nowMs: number
  playerAccountId?: string | null
  includeAllPlayers: boolean
  cueWindowMilliseconds?: number
}): CastleCommandTacticalRow | null {
  const cueWindowMilliseconds = input.cueWindowMilliseconds ?? 1_000
  const candidates = input.rows.filter((row) => {
    if (!input.includeAllPlayers && row.playerAccountId !== input.playerAccountId) return false
    const delta = row.rallyStartAt.getTime() - input.nowMs
    return delta <= cueWindowMilliseconds && delta >= 0
  })

  return candidates.sort((left, right) => left.rallyStartAt.getTime() - right.rallyStartAt.getTime())[0] ?? null
}
