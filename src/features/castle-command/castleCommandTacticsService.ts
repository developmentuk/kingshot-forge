import { supabase } from '../../lib/supabase'

type DatabaseErrorLike = {
  code?: string
  message?: string
}

export type CastleCommandSessionAuthority = 'manager' | 'deputy' | 'participant' | 'denied'

export type CastleCommandDeputyRecord = {
  playerAccountId: string
}

export type CastleCommandTacticsResult<T> =
  | { status: 'ready'; data: T }
  | { status: 'unavailable'; data: null }

function isSchemaUnavailable(error: unknown): boolean {
  const candidate = (error ?? {}) as DatabaseErrorLike
  if (candidate.code === '42P01' || candidate.code === 'PGRST202' || candidate.code === 'PGRST205') return true
  const message = candidate.message?.toLowerCase() ?? ''
  return message.includes('castle_command_session_deput')
    || message.includes('get_castle_command_session_authority')
    || message.includes('list_castle_command_session_deputies')
    || message.includes('set_castle_command_session_deputy')
}

function throwDatabaseError(error: unknown, fallback: string): never {
  const candidate = (error ?? {}) as DatabaseErrorLike
  throw new Error(candidate.message || fallback)
}

export async function getCastleCommandSessionAuthority(
  sessionId: string,
): Promise<CastleCommandTacticsResult<CastleCommandSessionAuthority>> {
  const result = await supabase.rpc('get_castle_command_session_authority', {
    target_session_id: sessionId,
  })

  if (result.error) {
    if (isSchemaUnavailable(result.error)) return { status: 'unavailable', data: null }
    throwDatabaseError(result.error, 'Castle Command session authority could not be checked.')
  }

  const value = result.data
  if (value !== 'manager' && value !== 'deputy' && value !== 'participant' && value !== 'denied') {
    throw new Error('Castle Command returned an invalid session authority.')
  }

  return { status: 'ready', data: value }
}

export async function loadCastleCommandSessionDeputies(
  sessionId: string,
): Promise<CastleCommandTacticsResult<CastleCommandDeputyRecord[]>> {
  const result = await supabase.rpc('list_castle_command_session_deputies', {
    target_session_id: sessionId,
  })

  if (result.error) {
    if (isSchemaUnavailable(result.error)) return { status: 'unavailable', data: null }
    throwDatabaseError(result.error, 'Castle Command deputies could not be loaded.')
  }

  return {
    status: 'ready',
    data: (result.data ?? []).flatMap((row) => {
      const playerAccountId = row?.player_account_id
      return typeof playerAccountId === 'string' ? [{ playerAccountId }] : []
    }),
  }
}

export async function setCastleCommandSessionDeputy(input: {
  sessionId: string
  playerAccountId: string
  enabled: boolean
}): Promise<CastleCommandTacticsResult<boolean>> {
  const result = await supabase.rpc('set_castle_command_session_deputy', {
    target_session_id: input.sessionId,
    target_player_account_id: input.playerAccountId,
    target_enabled: input.enabled,
  })

  if (result.error) {
    if (isSchemaUnavailable(result.error)) return { status: 'unavailable', data: null }
    throwDatabaseError(result.error, 'Castle Command deputy authority could not be changed.')
  }

  return { status: 'ready', data: Boolean(result.data) }
}
