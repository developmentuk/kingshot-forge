import { useCallback, useEffect, useState } from 'react'
import { getMyAllianceMemberships, type AllianceMembershipDetails } from '../../services/allianceMembershipService'
import { checkCastleCommandManagement, type CastleCommandManagementCapability } from './castleCommandCapabilityService'
import { loadCastleCommandSessions, type CastleCommandSessionRecord } from './castleCommandCloudService'
import CastleCommandLiveRoom from './CastleCommandLiveRoom'
import './castleCommandLive.css'

type Props = {
  userId: string
  playerAccountId: string
}

type HubState = 'loading' | 'ready' | 'unavailable' | 'error'

const CASTLE_COMMAND_CANONICAL_CHANGE_EVENT = 'kingshot-forge:castle-command:canonical-change'

export default function CastleCommandLiveHub({ userId, playerAccountId }: Props) {
  const [state, setState] = useState<HubState>('loading')
  const [alliance, setAlliance] = useState<AllianceMembershipDetails | null>(null)
  const [sessions, setSessions] = useState<CastleCommandSessionRecord[]>([])
  const [management, setManagement] = useState<CastleCommandManagementCapability>('denied')
  const [selectedSessionId, setSelectedSessionId] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const memberships = await getMyAllianceMemberships(userId)
      const currentAlliance = memberships.find((membership) => membership.status === 'current') ?? null
      setAlliance(currentAlliance)

      if (!currentAlliance) {
        setSessions([])
        setManagement('denied')
        setState('ready')
        return
      }

      const [sessionResult, capability] = await Promise.all([
        loadCastleCommandSessions(currentAlliance.alliance_id),
        checkCastleCommandManagement(currentAlliance.alliance_id),
      ])

      if (sessionResult.status === 'unavailable' || capability === 'unavailable') {
        setState('unavailable')
        return
      }

      setSessions(sessionResult.data)
      setManagement(capability)
      setSelectedSessionId((current) => {
        if (current && sessionResult.data.some((session) => session.id === current)) return current
        return sessionResult.data.find((session) => session.status !== 'closed')?.id ?? sessionResult.data[0]?.id ?? ''
      })
      setState('ready')
    } catch (caught) {
      setState('error')
      setError(caught instanceof Error ? caught.message : 'Castle Command Live Room could not be loaded.')
    }
  }, [userId])

  useEffect(() => {
    setState('loading')
    void load()
  }, [load])

  useEffect(() => {
    const handleCanonicalChange = () => {
      void load()
    }

    window.addEventListener(CASTLE_COMMAND_CANONICAL_CHANGE_EVENT, handleCanonicalChange)
    return () => window.removeEventListener(CASTLE_COMMAND_CANONICAL_CHANGE_EVENT, handleCanonicalChange)
  }, [load])

  const selectedSession = sessions.find((session) => session.id === selectedSessionId) ?? null

  return <section className="castle-command__panel castle-command-live-hub">
    <div className="castle-command-live-hub__heading">
      <div><p className="eyebrow">5 · Live Command Room</p><h2>Battle second screen</h2><p>Private realtime presence, server-synchronised launch countdowns and durable READY/SENT state.</p></div>
      <span className={`castle-command-live-hub__state is-${state}`}>{state === 'ready' ? 'Live foundation ready' : state === 'loading' ? 'Checking…' : state === 'unavailable' ? 'Activation pending' : 'Live error'}</span>
    </div>

    {state === 'loading' ? <p>Preparing Live Command Room…</p> : null}
    {state === 'unavailable' ? <div className="castle-command-live__activation"><strong>001C activation is intentionally pending.</strong><p>The Live Room migration and Supabase private-channel authorization have not been activated. No Realtime production setting or database schema was changed.</p></div> : null}
    {state === 'error' ? <p className="profile-panel__error">{error}</p> : null}

    {state === 'ready' && !alliance ? <p>A current Forge alliance membership is required for shared Castle Command sessions.</p> : null}

    {state === 'ready' && alliance && sessions.length === 0 ? <p>No Castle Command sessions exist for [{alliance.alliance_tag}] yet. Create one in the Forge cloud & alliance section above.</p> : null}

    {state === 'ready' && alliance && sessions.length > 0 ? <>
      <label className="castle-command-live-hub__selector">Live session<select value={selectedSessionId} onChange={(event) => setSelectedSessionId(event.target.value)}>{sessions.map((session) => <option key={session.id} value={session.id}>{session.title} · {session.status} · {new Date(session.impactAt).toLocaleString('en-GB')}</option>)}</select></label>
      {selectedSession ? <CastleCommandLiveRoom
        session={selectedSession}
        userId={userId}
        playerAccountId={playerAccountId}
        management={management}
        onCanonicalChange={load}
      /> : null}
    </> : null}
  </section>
}
