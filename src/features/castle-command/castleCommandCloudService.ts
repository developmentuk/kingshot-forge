import { supabase } from '../../lib/supabase'
import {
  CASTLE_COMMAND_TARGETS,
  createEmptyMarchTimeProfile,
  type CastleCommandTarget,
  type MarchTimeProfile,
  type RallyPreparationSeconds,
} from './castleCommandDomain'
import type {
  CastleCommandAssignmentSnapshot,
  CastleCommandSessionStatus,
} from './castleCommandSessionDomain'

type DatabaseErrorLike = {
  code?: string
  message?: string
}

export type CastleCommandCloudResult<T> =
  | { status: 'ready'; data: T }
  | { status: 'unavailable'; data: null }

export type CastleCommandCloudProfile = {
  id: string
  playerAccountId: string
  howlerSkillLevel: number
  shareWithAlliance: boolean
  updatedAt: string
  timings: MarchTimeProfile
}

export type CastleCommandAllianceProfile = CastleCommandCloudProfile & {
  playerId: string
  playerName: string
}

export type CastleCommandSessionRecord = {
  id: string
  allianceId: string
  title: string
  impactAt: string
  rallyPreparationSeconds: RallyPreparationSeconds
  status: CastleCommandSessionStatus
  createdBy: string
  closedAt: string | null
  createdAt: string
  updatedAt: string
  assignments: CastleCommandAssignmentSnapshot[]
}

function isSchemaUnavailable(error: unknown): boolean {
  const candidate = (error ?? {}) as DatabaseErrorLike
  if (candidate.code === '42P01' || candidate.code === 'PGRST202' || candidate.code === 'PGRST205') {
    return true
  }

  const message = candidate.message?.toLowerCase() ?? ''
  return message.includes('castle_command_') && (
    message.includes('schema cache') ||
    message.includes('does not exist') ||
    message.includes('could not find')
  )
}

function throwDatabaseError(error: unknown, fallback: string): never {
  const candidate = (error ?? {}) as DatabaseErrorLike
  throw new Error(candidate.message || fallback)
}

function parseTarget(value: unknown): CastleCommandTarget | null {
  return CASTLE_COMMAND_TARGETS.some((target) => target.id === value)
    ? value as CastleCommandTarget
    : null
}

function mapProfileTargets(rows: unknown[]): MarchTimeProfile {
  const timings = createEmptyMarchTimeProfile()

  for (const raw of rows) {
    const row = raw as {
      target?: unknown
      normal_seconds?: unknown
      howler_seconds?: unknown
    }
    const target = parseTarget(row.target)
    if (!target) continue

    timings[target] = {
      normalSeconds: typeof row.normal_seconds === 'number' ? row.normal_seconds : null,
      howlerSeconds: typeof row.howler_seconds === 'number' ? row.howler_seconds : null,
    }
  }

  return timings
}

export async function loadCastleCommandCloudProfile(
  playerAccountId: string,
): Promise<CastleCommandCloudResult<CastleCommandCloudProfile | null>> {
  const profileResult = await supabase
    .from('castle_command_profiles')
    .select('id, player_account_id, howler_skill_level, share_with_alliance, updated_at')
    .eq('player_account_id', playerAccountId)
    .maybeSingle()

  if (profileResult.error) {
    if (isSchemaUnavailable(profileResult.error)) return { status: 'unavailable', data: null }
    throwDatabaseError(profileResult.error, 'Castle Command cloud profile could not be loaded.')
  }

  if (!profileResult.data) return { status: 'ready', data: null }

  const targetsResult = await supabase
    .from('castle_command_profile_targets')
    .select('target, normal_seconds, howler_seconds')
    .eq('profile_id', profileResult.data.id)

  if (targetsResult.error) {
    if (isSchemaUnavailable(targetsResult.error)) return { status: 'unavailable', data: null }
    throwDatabaseError(targetsResult.error, 'Castle Command timing rows could not be loaded.')
  }

  return {
    status: 'ready',
    data: {
      id: profileResult.data.id,
      playerAccountId: profileResult.data.player_account_id,
      howlerSkillLevel: profileResult.data.howler_skill_level,
      shareWithAlliance: profileResult.data.share_with_alliance,
      updatedAt: profileResult.data.updated_at,
      timings: mapProfileTargets(targetsResult.data ?? []),
    },
  }
}

export async function saveCastleCommandCloudProfile(input: {
  playerAccountId: string
  userId: string
  howlerSkillLevel: number
  shareWithAlliance: boolean
  timings: MarchTimeProfile
}): Promise<CastleCommandCloudResult<CastleCommandCloudProfile>> {
  const profileResult = await supabase
    .from('castle_command_profiles')
    .upsert({
      player_account_id: input.playerAccountId,
      user_id: input.userId,
      howler_skill_level: input.howlerSkillLevel,
      share_with_alliance: input.shareWithAlliance,
    }, { onConflict: 'player_account_id' })
    .select('id, player_account_id, howler_skill_level, share_with_alliance, updated_at')
    .single()

  if (profileResult.error) {
    if (isSchemaUnavailable(profileResult.error)) return { status: 'unavailable', data: null }
    throwDatabaseError(profileResult.error, 'Castle Command cloud profile could not be saved.')
  }

  const targetRows = CASTLE_COMMAND_TARGETS.map(({ id }) => ({
    profile_id: profileResult.data.id,
    target: id,
    normal_seconds: input.timings[id].normalSeconds,
    howler_seconds: input.timings[id].howlerSeconds,
  }))

  const targetsResult = await supabase
    .from('castle_command_profile_targets')
    .upsert(targetRows, { onConflict: 'profile_id,target' })

  if (targetsResult.error) {
    if (isSchemaUnavailable(targetsResult.error)) return { status: 'unavailable', data: null }
    throwDatabaseError(targetsResult.error, 'Castle Command timing rows could not be saved.')
  }

  return {
    status: 'ready',
    data: {
      id: profileResult.data.id,
      playerAccountId: profileResult.data.player_account_id,
      howlerSkillLevel: profileResult.data.howler_skill_level,
      shareWithAlliance: profileResult.data.share_with_alliance,
      updatedAt: profileResult.data.updated_at,
      timings: input.timings,
    },
  }
}

export async function listCastleCommandAllianceProfiles(
  allianceId: string,
): Promise<CastleCommandCloudResult<CastleCommandAllianceProfile[]>> {
  const result = await supabase.rpc('list_castle_command_alliance_profiles', {
    target_alliance_id: allianceId,
  })

  if (result.error) {
    if (isSchemaUnavailable(result.error)) return { status: 'unavailable', data: null }
    throwDatabaseError(result.error, 'Alliance Castle Command profiles could not be loaded.')
  }

  const grouped = new Map<string, CastleCommandAllianceProfile>()

  for (const raw of result.data ?? []) {
    const row = raw as {
      profile_id: string
      player_account_id: string
      player_id: string
      player_name: string
      howler_skill_level: number
      profile_updated_at: string
      target: unknown
      normal_seconds: unknown
      howler_seconds: unknown
    }

    const current = grouped.get(row.profile_id) ?? {
      id: row.profile_id,
      playerAccountId: row.player_account_id,
      playerId: row.player_id,
      playerName: row.player_name,
      howlerSkillLevel: row.howler_skill_level,
      shareWithAlliance: true,
      updatedAt: row.profile_updated_at,
      timings: createEmptyMarchTimeProfile(),
    }

    const target = parseTarget(row.target)
    if (target) {
      current.timings[target] = {
        normalSeconds: typeof row.normal_seconds === 'number' ? row.normal_seconds : null,
        howlerSeconds: typeof row.howler_seconds === 'number' ? row.howler_seconds : null,
      }
    }

    grouped.set(row.profile_id, current)
  }

  return { status: 'ready', data: [...grouped.values()] }
}

function mapAssignment(raw: unknown): CastleCommandAssignmentSnapshot | null {
  const row = raw as Record<string, unknown>
  const target = parseTarget(row.target)
  if (!target || typeof row.id !== 'string' || typeof row.player_account_id !== 'string') return null
  if (typeof row.player_id_snapshot !== 'string' || typeof row.player_name_snapshot !== 'string') return null
  if (typeof row.march_seconds !== 'number' || typeof row.profile_updated_at_snapshot !== 'string') return null
  if (row.timing_source !== 'normal' && row.timing_source !== 'howler-observed' && row.timing_source !== 'normal-fallback') return null

  return {
    id: row.id,
    playerAccountId: row.player_account_id,
    playerId: row.player_id_snapshot,
    playerName: row.player_name_snapshot,
    target,
    useHowler: row.use_howler === true,
    howlerSkillLevel: typeof row.howler_skill_level_snapshot === 'number' ? row.howler_skill_level_snapshot : 1,
    marchSeconds: row.march_seconds,
    timingSource: row.timing_source,
    needsHowlerCalibration: row.needs_howler_calibration === true,
    profileUpdatedAt: row.profile_updated_at_snapshot,
  }
}

export async function loadCastleCommandSessions(
  allianceId: string,
): Promise<CastleCommandCloudResult<CastleCommandSessionRecord[]>> {
  const sessionsResult = await supabase
    .from('castle_command_sessions')
    .select('id, alliance_id, title, impact_at, rally_preparation_seconds, status, created_by, closed_at, created_at, updated_at')
    .eq('alliance_id', allianceId)
    .order('impact_at', { ascending: false })

  if (sessionsResult.error) {
    if (isSchemaUnavailable(sessionsResult.error)) return { status: 'unavailable', data: null }
    throwDatabaseError(sessionsResult.error, 'Castle Command sessions could not be loaded.')
  }

  const sessions = sessionsResult.data ?? []
  if (sessions.length === 0) return { status: 'ready', data: [] }

  const assignmentResult = await supabase
    .from('castle_command_session_assignments')
    .select('id, session_id, player_account_id, player_id_snapshot, player_name_snapshot, target, use_howler, howler_skill_level_snapshot, march_seconds, timing_source, needs_howler_calibration, profile_updated_at_snapshot')
    .in('session_id', sessions.map((session) => session.id))

  if (assignmentResult.error) {
    if (isSchemaUnavailable(assignmentResult.error)) return { status: 'unavailable', data: null }
    throwDatabaseError(assignmentResult.error, 'Castle Command assignments could not be loaded.')
  }

  const bySession = new Map<string, CastleCommandAssignmentSnapshot[]>()
  for (const raw of assignmentResult.data ?? []) {
    const sessionId = raw.session_id
    const assignment = mapAssignment(raw)
    if (typeof sessionId !== 'string' || !assignment) continue
    const existing = bySession.get(sessionId) ?? []
    existing.push(assignment)
    bySession.set(sessionId, existing)
  }

  return {
    status: 'ready',
    data: sessions.map((session) => ({
      id: session.id,
      allianceId: session.alliance_id,
      title: session.title,
      impactAt: session.impact_at,
      rallyPreparationSeconds: session.rally_preparation_seconds as RallyPreparationSeconds,
      status: session.status as CastleCommandSessionStatus,
      createdBy: session.created_by,
      closedAt: session.closed_at,
      createdAt: session.created_at,
      updatedAt: session.updated_at,
      assignments: bySession.get(session.id) ?? [],
    })),
  }
}

export async function createCastleCommandSession(input: {
  allianceId: string
  title: string
  impactAt: Date
  rallyPreparationSeconds: RallyPreparationSeconds
  userId: string
}): Promise<CastleCommandCloudResult<string>> {
  const result = await supabase
    .from('castle_command_sessions')
    .insert({
      alliance_id: input.allianceId,
      title: input.title.trim(),
      impact_at: input.impactAt.toISOString(),
      rally_preparation_seconds: input.rallyPreparationSeconds,
      created_by: input.userId,
    })
    .select('id')
    .single()

  if (result.error) {
    if (isSchemaUnavailable(result.error)) return { status: 'unavailable', data: null }
    throwDatabaseError(result.error, 'Castle Command session could not be created.')
  }

  return { status: 'ready', data: result.data.id }
}

export async function setCastleCommandSessionAssignment(input: {
  sessionId: string
  playerAccountId: string
  target: CastleCommandTarget
  useHowler: boolean
}): Promise<CastleCommandCloudResult<string>> {
  const result = await supabase.rpc('set_castle_command_session_assignment', {
    target_session_id: input.sessionId,
    target_player_account_id: input.playerAccountId,
    target_target: input.target,
    target_use_howler: input.useHowler,
  })

  if (result.error) {
    if (isSchemaUnavailable(result.error)) return { status: 'unavailable', data: null }
    throwDatabaseError(result.error, 'Castle Command assignment could not be saved.')
  }

  return { status: 'ready', data: result.data as string }
}

export async function removeCastleCommandSessionAssignment(
  assignmentId: string,
): Promise<CastleCommandCloudResult<true>> {
  const result = await supabase.rpc('remove_castle_command_session_assignment', {
    target_assignment_id: assignmentId,
  })

  if (result.error) {
    if (isSchemaUnavailable(result.error)) return { status: 'unavailable', data: null }
    throwDatabaseError(result.error, 'Castle Command assignment could not be removed.')
  }

  return { status: 'ready', data: true }
}
