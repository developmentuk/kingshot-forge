export type CastleCommandAcknowledgementStatus = 'waiting' | 'ready' | 'sent'

export type CastleCommandLiveConnectionState =
  | 'connecting'
  | 'live'
  | 'offline'
  | 'error'

export type CastleCommandCountdownPhase =
  | 'waiting'
  | 'launch-window'
  | 'late'
  | 'invalid'

export type CastleCommandCountdown = {
  phase: CastleCommandCountdownPhase
  deltaMilliseconds: number | null
  display: string
}

export function estimateServerClockOffset(input: {
  requestStartedAtMs: number
  responseReceivedAtMs: number
  serverNowMs: number
}): number | null {
  const { requestStartedAtMs, responseReceivedAtMs, serverNowMs } = input
  if (
    !Number.isFinite(requestStartedAtMs) ||
    !Number.isFinite(responseReceivedAtMs) ||
    !Number.isFinite(serverNowMs) ||
    responseReceivedAtMs < requestStartedAtMs
  ) {
    return null
  }

  const requestMidpoint = requestStartedAtMs + (responseReceivedAtMs - requestStartedAtMs) / 2
  return serverNowMs - requestMidpoint
}

export function resolveServerNow(localNowMs: number, offsetMs: number): number {
  return localNowMs + offsetMs
}

function formatDuration(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function buildCastleCommandCountdown(
  targetAt: Date,
  serverNowMs: number,
): CastleCommandCountdown {
  const targetMs = targetAt.getTime()
  if (!Number.isFinite(targetMs) || !Number.isFinite(serverNowMs)) {
    return { phase: 'invalid', deltaMilliseconds: null, display: '—' }
  }

  const deltaMilliseconds = targetMs - serverNowMs

  if (deltaMilliseconds > 0) {
    return {
      phase: 'waiting',
      deltaMilliseconds,
      display: formatDuration(deltaMilliseconds),
    }
  }

  if (deltaMilliseconds >= -5_000) {
    return {
      phase: 'launch-window',
      deltaMilliseconds,
      display: 'START NOW',
    }
  }

  return {
    phase: 'late',
    deltaMilliseconds,
    display: `LATE ${formatDuration(Math.abs(deltaMilliseconds))}`,
  }
}

export function isCastleCommandLiveStateStale(input: {
  connectionState: CastleCommandLiveConnectionState
  lastServerSyncAtMs: number | null
  localNowMs: number
  maximumClockAgeMs?: number
}): boolean {
  if (input.connectionState !== 'live' || input.lastServerSyncAtMs === null) return true
  const maximumClockAgeMs = input.maximumClockAgeMs ?? 5 * 60_000
  return input.localNowMs - input.lastServerSyncAtMs > maximumClockAgeMs
}
