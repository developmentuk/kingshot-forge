import { supabase } from '../../lib/supabase'
import type { CastleCommandSessionStatus } from './castleCommandSessionDomain'
import type { CastleCommandAcknowledgementStatus } from './castleCommandLiveDomain'

type DatabaseErrorLike = {
  code?: string
  message?: string
}

export type CastleCommandLiveResult<T> =
  | { status: 'ready'; data: T }
  | { status: 'unavailable'; data: null }

export type CastleCommandAcknowledgement = {
  sessionId: string
  playerAccountId: string
  status: CastleCommandAcknowledgementStatus
  readyAt: string | null
  sentAt: string | null
  updatedAt: string
}

export type CastleCommandBroadcast = {
  entity: string
  operation: string
  sessionId: string
  changedAt: string
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

export async function loadCastleCommandAcknowledgements(
  sessionId: string,
): Promise<CastleCommandLiveResult<CastleCommandAcknowledgement[]>> {
  const result = await supabase
    .from('castle_command_session_acknowledgements')
    .select('session_id, player_account_id, status, ready_at, sent_at, updated_at')
    .eq('session_id', sessionId)

  if (result.error) {
    if (isSchemaUnavailable(result.error)) return { status: 'unavailable', data: null }
    throwDatabaseError(result.error, 'Castle Command acknowledgements could not be loaded.')
  }

  return {
    status: 'ready',
    data: (result.data ?? []).map((row) => ({
      sessionId: row.session_id,
      playerAccountId: row.player_account_id,
      status: row.status as CastleCommandAcknowledgementStatus,
      readyAt: row.ready_at,
      sentAt: row.sent_at,
      updatedAt: row.updated_at,
    })),
  }
}

export async function setCastleCommandAcknowledgement(input: {
  sessionId: string
  playerAccountId: string
  status: 'ready' | 'sent'
}): Promise<CastleCommandLiveResult<CastleCommandAcknowledgementStatus>> {
  const result = await supabase.rpc('set_castle_command_acknowledgement', {
    target_session_id: input.sessionId,
    target_player_account_id: input.playerAccountId,
    target_status: input.status,
  })

  if (result.error) {
    if (isSchemaUnavailable(result.error)) return { status: 'unavailable', data: null }
    throwDatabaseError(result.error, 'Castle Command acknowledgement could not be saved.')
  }

  return { status: 'ready', data: result.data as CastleCommandAcknowledgementStatus }
}

export async function resetCastleCommandAcknowledgement(input: {
  sessionId: string
  playerAccountId: string
}): Promise<CastleCommandLiveResult<'waiting'>> {
  const result = await supabase.rpc('reset_castle_command_acknowledgement', {
    target_session_id: input.sessionId,
    target_player_account_id: input.playerAccountId,
  })

  if (result.error) {
    if (isSchemaUnavailable(result.error)) return { status: 'unavailable', data: null }
    throwDatabaseError(result.error, 'Castle Command acknowledgement could not be reset.')
  }

  return { status: 'ready', data: 'waiting' }
}

export async function setCastleCommandLiveSessionStatus(input: {
  sessionId: string
  status: CastleCommandSessionStatus
}): Promise<CastleCommandLiveResult<CastleCommandSessionStatus>> {
  const result = await supabase.rpc('set_castle_command_session_status', {
    target_session_id: input.sessionId,
    target_status: input.status,
  })

  if (result.error) {
    if (isSchemaUnavailable(result.error)) return { status: 'unavailable', data: null }
    throwDatabaseError(result.error, 'Castle Command session status could not be changed.')
  }

  return { status: 'ready', data: result.data as CastleCommandSessionStatus }
}

export async function getCastleCommandServerTime(
  sessionId: string,
): Promise<CastleCommandLiveResult<Date>> {
  const result = await supabase.rpc('get_castle_command_server_time', {
    target_session_id: sessionId,
  })

  if (result.error) {
    if (isSchemaUnavailable(result.error)) return { status: 'unavailable', data: null }
    throwDatabaseError(result.error, 'Castle Command server clock could not be synchronised.')
  }

  const serverTime = new Date(result.data as string)
  if (!Number.isFinite(serverTime.getTime())) {
    throw new Error('Castle Command server returned an invalid clock value.')
  }

  return { status: 'ready', data: serverTime }
}

function countPresenceConnections(raw: unknown): number {
  if (!raw || typeof raw !== 'object') return 0
  let count = 0
  for (const presences of Object.values(raw as Record<string, unknown>)) {
    if (Array.isArray(presences)) count += presences.length
  }
  return count
}

export function subscribeCastleCommandLiveSession(input: {
  sessionId: string
  presenceKey: string
  onBroadcast: (event: CastleCommandBroadcast) => void
  onPresenceCount: (count: number) => void
  onStatus: (status: string) => void
}) {
  const channel = supabase.channel(`castle-command:${input.sessionId}`, {
    config: {
      private: true,
      presence: { key: input.presenceKey },
    },
  })

  const syncPresence = () => {
    input.onPresenceCount(countPresenceConnections(channel.presenceState()))
  }

  channel
    .on('broadcast', { event: 'state_changed' }, ({ payload }) => {
      if (!payload || typeof payload !== 'object') return
      const event = payload as Partial<CastleCommandBroadcast>
      if (
        typeof event.entity === 'string' &&
        typeof event.operation === 'string' &&
        typeof event.sessionId === 'string' &&
        typeof event.changedAt === 'string'
      ) {
        input.onBroadcast(event as CastleCommandBroadcast)
      }
    })
    .on('presence', { event: 'sync' }, syncPresence)
    .on('presence', { event: 'join' }, syncPresence)
    .on('presence', { event: 'leave' }, syncPresence)
    .subscribe((status) => {
      input.onStatus(status)
      if (status === 'SUBSCRIBED') {
        void channel.track({ onlineAt: new Date().toISOString() })
      }
    })

  return () => {
    void channel.untrack()
    void supabase.removeChannel(channel)
  }
}
