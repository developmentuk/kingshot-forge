import { supabase } from '../../lib/supabase'
import {
  validateCastleCommandWaves,
  type CastleCommandTacticalMode,
  type CastleCommandTacticalWave,
} from './castleCommandTacticsDomain'
import type {
  CastleCommandAssignmentSnapshot,
  CastleCommandTimingSource,
} from './castleCommandSessionDomain'

type DatabaseErrorLike = {
  code?: string
  message?: string
}

type UnknownRow = Record<string, unknown>

export type CastleCommandSharedPlan = {
  version: number
  mode: CastleCommandTacticalMode
  staggerSeconds: number
  counterAnchorAt: string | null
  counterOffsetSeconds: number
  waves: CastleCommandTacticalWave[]
  assignments: CastleCommandAssignmentSnapshot[]
  sessionImpactAt: string
  rallyPreparationSeconds: 60 | 180 | 300
  assignmentSnapshotCurrent: boolean
  savedAt: string
}

export type CastleCommandSharedPlanHistory = Omit<CastleCommandSharedPlan, 'assignmentSnapshotCurrent'>

export type CastleCommandBattleSummary = {
  sessionStatus: string
  assignmentCount: number
  readyCount: number
  sentCount: number
  waitingCount: number
  howlerAssignmentCount: number
  planVersionCount: number
  latestPlanVersion: number | null
  latestPlanSavedAt: string | null
  latestPlanMatchesAssignments: boolean | null
  closedAt: string | null
}

export type CastleCommandSharedResult<T> =
  | { status: 'ready'; data: T }
  | { status: 'unavailable'; data: null }

export type CastleCommandSaveResult =
  | { status: 'ready'; data: number }
  | { status: 'conflict'; data: null }
  | { status: 'unavailable'; data: null }

function databaseError(error: unknown): DatabaseErrorLike {
  return (error ?? {}) as DatabaseErrorLike
}

function isSchemaUnavailable(error: unknown): boolean {
  const candidate = databaseError(error)
  if (candidate.code === '42P01' || candidate.code === 'PGRST202' || candidate.code === 'PGRST205') {
    return true
  }
  const message = candidate.message?.toLowerCase() ?? ''
  return message.includes('castle_command_tactical_') && (
    message.includes('schema cache')
    || message.includes('does not exist')
    || message.includes('could not find')
  )
}

function isVersionConflict(error: unknown): boolean {
  const candidate = databaseError(error)
  return candidate.code === '40001'
    || (candidate.message?.toLowerCase() ?? '').includes('tactical plan version conflict')
}

function throwDatabaseError(error: unknown, fallback: string): never {
  throw new Error(databaseError(error).message || fallback)
}

function integer(value: unknown, minimum = 0): number {
  const parsed = typeof value === 'number' ? value : Number(value)
  if (!Number.isSafeInteger(parsed) || parsed < minimum) throw new Error('Castle Command returned invalid numeric data.')
  return parsed
}

function rallyPreparation(value: unknown): 60 | 180 | 300 {
  const parsed = integer(value)
  if (parsed === 60 || parsed === 180 || parsed === 300) return parsed
  throw new Error('Castle Command returned an invalid rally preparation duration.')
}

function nullableIso(value: unknown): string | null {
  if (value === null || value === undefined) return null
  if (typeof value !== 'string' || !Number.isFinite(new Date(value).getTime())) {
    throw new Error('Castle Command returned an invalid timestamp.')
  }
  return value
}

function requiredIso(value: unknown): string {
  const parsed = nullableIso(value)
  if (!parsed) throw new Error('Castle Command returned a missing timestamp.')
  return parsed
}

function tacticalMode(value: unknown): CastleCommandTacticalMode {
  if (value === 'simultaneous' || value === 'staggered' || value === 'counter') return value
  throw new Error('Castle Command returned an invalid tactical mode.')
}

function waves(value: unknown): CastleCommandTacticalWave[] {
  if (!Array.isArray(value)) throw new Error('Castle Command returned invalid tactical waves.')
  const parsed = value.map((candidate) => {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
      throw new Error('Castle Command returned an invalid tactical wave.')
    }
    const row = candidate as UnknownRow
    if (typeof row.id !== 'string' || typeof row.label !== 'string') {
      throw new Error('Castle Command returned an invalid tactical wave.')
    }
    return {
      id: row.id,
      label: row.label,
      offsetSeconds: integer(row.offsetSeconds),
    }
  })
  if (!validateCastleCommandWaves(parsed)) throw new Error('Castle Command returned invalid tactical waves.')
  return parsed
}

function timingSource(value: unknown): CastleCommandTimingSource {
  if (value === 'normal' || value === 'howler-observed' || value === 'normal-fallback') return value
  throw new Error('Castle Command returned an invalid timing source.')
}

function assignments(value: unknown): CastleCommandAssignmentSnapshot[] {
  if (!Array.isArray(value)) throw new Error('Castle Command returned an invalid assignment snapshot.')
  return value.map((candidate) => {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
      throw new Error('Castle Command returned an invalid assignment snapshot.')
    }
    const row = candidate as UnknownRow
    if (
      typeof row.id !== 'string'
      || typeof row.playerAccountId !== 'string'
      || typeof row.playerId !== 'string'
      || typeof row.playerName !== 'string'
      || (row.target !== 'castle' && row.target !== 'north' && row.target !== 'east' && row.target !== 'south' && row.target !== 'west')
      || typeof row.useHowler !== 'boolean'
      || typeof row.needsHowlerCalibration !== 'boolean'
    ) {
      throw new Error('Castle Command returned an invalid assignment snapshot.')
    }

    return {
      id: row.id,
      playerAccountId: row.playerAccountId,
      playerId: row.playerId,
      playerName: row.playerName,
      target: row.target,
      useHowler: row.useHowler,
      howlerSkillLevel: integer(row.howlerSkillLevel, 1),
      marchSeconds: integer(row.marchSeconds),
      timingSource: timingSource(row.timingSource),
      needsHowlerCalibration: row.needsHowlerCalibration,
      profileUpdatedAt: requiredIso(row.profileUpdatedAt),
    }
  })
}

function planFromRow(row: UnknownRow, includeCurrent: boolean): CastleCommandSharedPlan {
  return {
    version: integer(row.version, 1),
    mode: tacticalMode(row.mode),
    staggerSeconds: integer(row.stagger_seconds),
    counterAnchorAt: nullableIso(row.counter_anchor_at),
    counterOffsetSeconds: integer(row.counter_offset_seconds),
    waves: waves(row.waves),
    assignments: assignments(row.assignment_snapshot),
    sessionImpactAt: requiredIso(row.session_impact_at_snapshot),
    rallyPreparationSeconds: rallyPreparation(row.rally_preparation_seconds_snapshot),
    assignmentSnapshotCurrent: includeCurrent ? row.assignment_snapshot_current === true : true,
    savedAt: requiredIso(row.saved_at),
  }
}

export async function loadCastleCommandSharedTacticalPlan(
  sessionId: string,
): Promise<CastleCommandSharedResult<CastleCommandSharedPlan | null>> {
  const result = await supabase.rpc('get_castle_command_shared_tactical_plan', {
    target_session_id: sessionId,
  })

  if (result.error) {
    if (isSchemaUnavailable(result.error)) return { status: 'unavailable', data: null }
    throwDatabaseError(result.error, 'Shared Castle Command tactical plan could not be loaded.')
  }

  const rows = (result.data ?? []) as UnknownRow[]
  return { status: 'ready', data: rows[0] ? planFromRow(rows[0], true) : null }
}

export async function loadCastleCommandTacticalPlanHistory(
  sessionId: string,
  limit = 20,
): Promise<CastleCommandSharedResult<CastleCommandSharedPlanHistory[]>> {
  const result = await supabase.rpc('list_castle_command_tactical_plan_history', {
    target_session_id: sessionId,
    target_limit: Math.max(1, Math.min(50, Math.trunc(limit))),
  })

  if (result.error) {
    if (isSchemaUnavailable(result.error)) return { status: 'unavailable', data: null }
    throwDatabaseError(result.error, 'Castle Command tactical history could not be loaded.')
  }

  const rows = (result.data ?? []) as UnknownRow[]
  return {
    status: 'ready',
    data: rows.map((row) => {
      const plan = planFromRow(row, false)
      return {
        version: plan.version,
        mode: plan.mode,
        staggerSeconds: plan.staggerSeconds,
        counterAnchorAt: plan.counterAnchorAt,
        counterOffsetSeconds: plan.counterOffsetSeconds,
        waves: plan.waves,
        assignments: plan.assignments,
        sessionImpactAt: plan.sessionImpactAt,
        rallyPreparationSeconds: plan.rallyPreparationSeconds,
        savedAt: plan.savedAt,
      }
    }),
  }
}

export async function saveCastleCommandSharedTacticalPlan(input: {
  sessionId: string
  expectedVersion: number
  mode: CastleCommandTacticalMode
  staggerSeconds: number
  counterAnchorAt: string | null
  counterOffsetSeconds: number
  waves: CastleCommandTacticalWave[]
}): Promise<CastleCommandSaveResult> {
  const result = await supabase.rpc('save_castle_command_tactical_plan', {
    target_session_id: input.sessionId,
    target_expected_version: input.expectedVersion,
    target_mode: input.mode,
    target_stagger_seconds: input.staggerSeconds,
    target_counter_anchor_at: input.counterAnchorAt,
    target_counter_offset_seconds: input.counterOffsetSeconds,
    target_waves: input.waves,
  })

  if (result.error) {
    if (isSchemaUnavailable(result.error)) return { status: 'unavailable', data: null }
    if (isVersionConflict(result.error)) return { status: 'conflict', data: null }
    throwDatabaseError(result.error, 'Shared Castle Command tactical plan could not be saved.')
  }

  return { status: 'ready', data: integer(result.data, 1) }
}

export async function loadCastleCommandBattleSummary(
  sessionId: string,
): Promise<CastleCommandSharedResult<CastleCommandBattleSummary | null>> {
  const result = await supabase.rpc('get_castle_command_battle_summary', {
    target_session_id: sessionId,
  })

  if (result.error) {
    if (isSchemaUnavailable(result.error)) return { status: 'unavailable', data: null }
    throwDatabaseError(result.error, 'Castle Command battle summary could not be loaded.')
  }

  const row = ((result.data ?? []) as UnknownRow[])[0]
  if (!row) return { status: 'ready', data: null }

  return {
    status: 'ready',
    data: {
      sessionStatus: typeof row.session_status === 'string' ? row.session_status : 'unknown',
      assignmentCount: integer(row.assignment_count),
      readyCount: integer(row.ready_count),
      sentCount: integer(row.sent_count),
      waitingCount: integer(row.waiting_count),
      howlerAssignmentCount: integer(row.howler_assignment_count),
      planVersionCount: integer(row.plan_version_count),
      latestPlanVersion: row.latest_plan_version === null ? null : integer(row.latest_plan_version, 1),
      latestPlanSavedAt: nullableIso(row.latest_plan_saved_at),
      latestPlanMatchesAssignments: row.latest_plan_matches_assignments === null
        ? null
        : row.latest_plan_matches_assignments === true,
      closedAt: nullableIso(row.closed_at),
    },
  }
}
