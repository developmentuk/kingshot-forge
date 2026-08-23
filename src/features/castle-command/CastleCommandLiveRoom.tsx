import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  formatClockTime,
  formatMarchDuration,
} from './castleCommandDomain'
import type { CastleCommandManagementCapability } from './castleCommandCapabilityService'
import type { CastleCommandSessionRecord } from './castleCommandCloudService'
import { buildCoordinatedLaunchOrder } from './castleCommandSessionDomain'
import {
  buildCastleCommandCountdown,
  estimateServerClockOffset,
  isCastleCommandLiveStateStale,
  resolveServerNow,
  type CastleCommandLiveConnectionState,
} from './castleCommandLiveDomain'
import {
  getCastleCommandServerTime,
  loadCastleCommandAcknowledgements,
  resetCastleCommandAcknowledgement,
  setCastleCommandAcknowledgement,
  setCastleCommandLiveSessionStatus,
  subscribeCastleCommandLiveSession,
  type CastleCommandAcknowledgement,
} from './castleCommandLiveService'
import CastleCommandTacticsPanel from './CastleCommandTacticsPanel'
import {
  getCastleCommandSessionAuthority,
  type CastleCommandSessionAuthority,
} from './castleCommandTacticsService'
import './castleCommandLive.css'

type Props = {
  session: CastleCommandSessionRecord
  userId: string
  playerAccountId: string
  management: CastleCommandManagementCapability
  onCanonicalChange: () => void | Promise<void>
}

type LiveAvailability = 'loading' | 'ready' | 'unavailable' | 'error'

function acknowledgementFor(
  acknowledgements: CastleCommandAcknowledgement[],
  playerAccountId: string,
) {
  return acknowledgements.find((item) => item.playerAccountId === playerAccountId) ?? null
}

function connectionLabel(state: CastleCommandLiveConnectionState) {
  if (state === 'live') return 'Live sync'
  if (state === 'connecting') return 'Connecting…'
  if (state === 'offline') return 'Reconnecting…'
  return 'Sync error'
}

export default function CastleCommandLiveRoom({
  session,
  userId,
  playerAccountId,
  management,
  onCanonicalChange,
}: Props) {
  const [availability, setAvailability] = useState<LiveAvailability>('loading')
  const [acknowledgements, setAcknowledgements] = useState<CastleCommandAcknowledgement[]>([])
  const [presenceCount, setPresenceCount] = useState(0)
  const [connectionState, setConnectionState] = useState<CastleCommandLiveConnectionState>('connecting')
  const [serverOffsetMs, setServerOffsetMs] = useState(0)
  const [lastServerSyncAtMs, setLastServerSyncAtMs] = useState<number | null>(null)
  const [localNowMs, setLocalNowMs] = useState(Date.now())
  const [workingKey, setWorkingKey] = useState('')
  const [error, setError] = useState('')
  const [sessionAuthority, setSessionAuthority] = useState<CastleCommandSessionAuthority>(management === 'allowed' ? 'manager' : 'participant')
  const [sharedRealtimeRevision, setSharedRealtimeRevision] = useState(0)
  const canonicalChangeRef = useRef(onCanonicalChange)

  useEffect(() => {
    canonicalChangeRef.current = onCanonicalChange
  }, [onCanonicalChange])

  const launchOrder = useMemo(() => buildCoordinatedLaunchOrder({
    impactAt: new Date(session.impactAt),
    rallyPreparationSeconds: session.rallyPreparationSeconds,
    assignments: session.assignments,
  }), [session])

  const ownAssignment = useMemo(
    () => session.assignments.find((assignment) => assignment.playerAccountId === playerAccountId) ?? null,
    [playerAccountId, session.assignments],
  )
  const canEnterLiveRoom = management === 'allowed' || ownAssignment !== null

  const refreshAcknowledgements = useCallback(async () => {
    const result = await loadCastleCommandAcknowledgements(session.id)
    if (result.status === 'unavailable') {
      setAvailability('unavailable')
      return false
    }
    setAcknowledgements(result.data)
    return true
  }, [session.id])

  const refreshAuthority = useCallback(async () => {
    try {
      const result = await getCastleCommandSessionAuthority(session.id)
      if (result.status === 'unavailable') {
        setSessionAuthority(management === 'allowed' ? 'manager' : ownAssignment ? 'participant' : 'denied')
        return false
      }
      setSessionAuthority(result.data)
      return true
    } catch {
      setSessionAuthority(management === 'allowed' ? 'manager' : ownAssignment ? 'participant' : 'denied')
      return false
    }
  }, [management, ownAssignment, session.id])

  const calibrateClock = useCallback(async () => {
    const requestStartedAtMs = Date.now()
    const result = await getCastleCommandServerTime(session.id)
    const responseReceivedAtMs = Date.now()
    if (result.status === 'unavailable') {
      setAvailability('unavailable')
      return false
    }

    const offset = estimateServerClockOffset({
      requestStartedAtMs,
      responseReceivedAtMs,
      serverNowMs: result.data.getTime(),
    })
    if (offset === null) throw new Error('Castle Command server clock could not be calibrated.')

    setServerOffsetMs(offset)
    setLastServerSyncAtMs(responseReceivedAtMs)
    return true
  }, [session.id])

  useEffect(() => {
    if (!canEnterLiveRoom) {
      setAvailability('ready')
      setConnectionState('offline')
      return
    }

    let cancelled = false
    async function initialise() {
      setAvailability('loading')
      setError('')
      try {
        const [ackReady, clockReady] = await Promise.all([
          refreshAcknowledgements(),
          calibrateClock(),
          refreshAuthority(),
        ])
        if (!cancelled && ackReady && clockReady) setAvailability('ready')
      } catch (caught) {
        if (cancelled) return
        setAvailability('error')
        setError(caught instanceof Error ? caught.message : 'Castle Command live state could not be loaded.')
      }
    }

    void initialise()
    return () => { cancelled = true }
  }, [calibrateClock, canEnterLiveRoom, refreshAcknowledgements, refreshAuthority])

  useEffect(() => {
    const timer = window.setInterval(() => setLocalNowMs(Date.now()), 250)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (availability !== 'ready' || !canEnterLiveRoom) return

    setConnectionState('connecting')

    return subscribeCastleCommandLiveSession({
      sessionId: session.id,
      presenceKey: userId,
      onBroadcast: (event) => {
        void refreshAcknowledgements().catch((caught) => {
          setError(caught instanceof Error ? caught.message : 'Live acknowledgements could not be refreshed.')
        })
        if (
          event.entity === 'castle_command_sessions'
          || event.entity === 'castle_command_session_assignments'
        ) {
          void canonicalChangeRef.current()
        }
        if (
          event.entity === 'castle_command_sessions'
          || event.entity === 'castle_command_session_assignments'
          || event.entity === 'castle_command_tactical_plans'
        ) {
          setSharedRealtimeRevision((current) => current + 1)
        }
        if (event.entity === 'castle_command_session_deputies') {
          void refreshAuthority()
        }
      },
      onPresenceCount: setPresenceCount,
      onStatus: (status) => {
        if (status === 'SUBSCRIBED') {
          setConnectionState('live')
          void calibrateClock()
          return
        }
        if (status === 'CHANNEL_ERROR') {
          setConnectionState('error')
          return
        }
        if (status === 'TIMED_OUT' || status === 'CLOSED') {
          setConnectionState('offline')
        }
      },
    })
  }, [availability, calibrateClock, canEnterLiveRoom, refreshAcknowledgements, refreshAuthority, session.id, userId])

  useEffect(() => {
    if (availability !== 'ready' || connectionState !== 'live' || !canEnterLiveRoom) return
    const timer = window.setInterval(() => {
      void calibrateClock().catch(() => setConnectionState('offline'))
    }, 120_000)
    return () => window.clearInterval(timer)
  }, [availability, calibrateClock, canEnterLiveRoom, connectionState])

  const serverNowMs = resolveServerNow(localNowMs, serverOffsetMs)
  const stale = isCastleCommandLiveStateStale({
    connectionState,
    lastServerSyncAtMs,
    localNowMs,
  })
  const ownAcknowledgement = ownAssignment
    ? acknowledgementFor(acknowledgements, ownAssignment.playerAccountId)
    : null
  const canCommandSession = management === 'allowed' || sessionAuthority === 'manager' || sessionAuthority === 'deputy'

  async function runMutation(key: string, action: () => Promise<{ status: 'ready' | 'unavailable' }>) {
    setWorkingKey(key)
    setError('')
    try {
      const result = await action()
      if (result.status === 'unavailable') {
        setAvailability('unavailable')
        return
      }
      await Promise.all([
        refreshAcknowledgements(),
        refreshAuthority(),
        Promise.resolve(canonicalChangeRef.current()),
      ])
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Castle Command live action failed.')
    } finally {
      setWorkingKey('')
    }
  }

  async function handleReady() {
    if (!ownAssignment) return
    await runMutation('ready', async () => setCastleCommandAcknowledgement({
      sessionId: session.id,
      playerAccountId: ownAssignment.playerAccountId,
      status: 'ready',
    }))
  }

  async function handleSent() {
    if (!ownAssignment) return
    await runMutation('sent', async () => setCastleCommandAcknowledgement({
      sessionId: session.id,
      playerAccountId: ownAssignment.playerAccountId,
      status: 'sent',
    }))
  }

  async function handleReset(targetPlayerAccountId: string) {
    await runMutation(`reset:${targetPlayerAccountId}`, async () => resetCastleCommandAcknowledgement({
      sessionId: session.id,
      playerAccountId: targetPlayerAccountId,
    }))
  }

  async function handleSessionStatus(status: 'active' | 'closed') {
    await runMutation(`session:${status}`, async () => setCastleCommandLiveSessionStatus({
      sessionId: session.id,
      status,
    }))
  }

  if (!canEnterLiveRoom) {
    return <div className="castle-command-live__boundary"><strong>Live Room restricted</strong><p>You can view the battle plan above, but the private Live Command Room is available only to assigned players and authorised event managers.</p></div>
  }

  if (availability === 'loading') {
    return <div className="castle-command-live__boundary"><strong>Preparing Live Command Room…</strong></div>
  }

  if (availability === 'unavailable') {
    return <div className="castle-command-live__activation"><strong>001C activation pending.</strong><p>The Live Command Room migration and private Realtime authorization are not active. The 001A/001B timing and session tools remain available without live state.</p></div>
  }

  if (availability === 'error') {
    return <div className="castle-command-live__boundary is-error"><strong>Live Command Room unavailable</strong><p>{error}</p></div>
  }

  return <div className="castle-command-live">
    <div className="castle-command-live__statusbar">
      <span className={`castle-command-live__connection is-${connectionState}`}>{connectionLabel(connectionState)}</span>
      <span>{presenceCount} connected</span>
      <span>Server clock {lastServerSyncAtMs ? 'synced' : 'not synced'}</span>
      <span className={`castle-command-live__session-state is-${session.status}`}>{session.status}</span>
      {sessionAuthority === 'deputy' ? <span>Deputy command</span> : null}
    </div>

    <p className="castle-command__hint">Presence is advisory only: Forge shows a private-channel connection count, not client-claimed player identities. Player names, assignments, roles and acknowledgements below come from canonical server state.</p>

    {stale ? <p className="castle-command-live__stale"><strong>Live sync is stale.</strong> Countdown timing uses the last successful server-clock calibration. Verify the in-game clock before launching.</p> : null}

    {canCommandSession && session.status !== 'closed' ? <div className="castle-command-live__commander">
      <strong>{sessionAuthority === 'deputy' && management !== 'allowed' ? 'Deputy controls' : 'Commander controls'}</strong>
      <div>
        {session.status === 'planning' ? <button type="button" className="button" disabled={Boolean(workingKey)} onClick={() => void handleSessionStatus('active')}>Start live command</button> : null}
        <button type="button" className="button button--secondary" disabled={Boolean(workingKey)} onClick={() => void handleSessionStatus('closed')}>Close session</button>
      </div>
    </div> : null}

    {ownAssignment ? (() => {
      const row = launchOrder.find((item) => item.playerAccountId === ownAssignment.playerAccountId)
      if (!row) return null
      const countdown = buildCastleCommandCountdown(row.timing.rallyStartAt, serverNowMs)
      const status = ownAcknowledgement?.status ?? 'waiting'
      return <div className={`castle-command-live__personal is-${countdown.phase}`}>
        <div><p className="eyebrow">Your rally call</p><h3>{row.playerName} · {row.target}</h3><p>{formatMarchDuration(row.marchSeconds)} march · Start {formatClockTime(row.timing.rallyStartAt)}</p></div>
        <div className="castle-command-live__personal-countdown"><span>Start rally in</span><strong>{countdown.display}</strong></div>
        <div className="castle-command-live__ack-actions"><span className={`castle-command-live__ack is-${status}`}>{status}</span>{status === 'waiting' && session.status !== 'closed' ? <button type="button" className="button" disabled={Boolean(workingKey)} onClick={() => void handleReady()}>I’m ready</button> : null}{status === 'ready' && session.status === 'active' ? <button type="button" className="button" disabled={Boolean(workingKey)} onClick={() => void handleSent()}>Rally sent</button> : null}</div>
      </div>
    })() : null}

    <div className="castle-command-live__roster">
      <div className="castle-command-live__roster-heading"><div><p className="eyebrow">Live roster</p><h3>Coordinated launch order</h3></div><strong>Impact {formatClockTime(new Date(session.impactAt))}</strong></div>
      {launchOrder.length === 0 ? <p>No assignments yet.</p> : <ol>{launchOrder.map((row) => {
        const acknowledgement = acknowledgementFor(acknowledgements, row.playerAccountId)
        const status = acknowledgement?.status ?? 'waiting'
        const countdown = buildCastleCommandCountdown(row.timing.rallyStartAt, serverNowMs)
        return <li key={row.id} className={`is-${countdown.phase}`}>
          <div className="castle-command-live__identity"><strong>{row.playerName}</strong><span>{row.target} · {formatMarchDuration(row.marchSeconds)}{row.useHowler ? ` · Howler L${row.howlerSkillLevel}` : ''}</span></div>
          <div className="castle-command-live__countdown"><span>{formatClockTime(row.timing.rallyStartAt)}</span><strong>{countdown.display}</strong></div>
          <div className="castle-command-live__roster-ack"><span className={`castle-command-live__ack is-${status}`}>{status}</span>{canCommandSession && status !== 'waiting' && session.status !== 'closed' ? <button type="button" disabled={Boolean(workingKey)} onClick={() => void handleReset(row.playerAccountId)}>Reset</button> : null}</div>
        </li>
      })}</ol>}
    </div>

    <CastleCommandTacticsPanel
      session={session}
      playerAccountId={playerAccountId}
      serverNowMs={serverNowMs}
      stale={stale}
      authority={sessionAuthority}
      canGrantDeputies={management === 'allowed'}
      realtimeRevision={sharedRealtimeRevision}
      onAuthorityChange={refreshAuthority}
    />

    {error ? <p className="profile-panel__error">{error}</p> : null}
  </div>
}
