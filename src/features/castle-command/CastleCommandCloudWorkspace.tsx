import { useEffect, useMemo, useState } from 'react'
import { getMyAllianceMemberships, type AllianceMembershipDetails } from '../../services/allianceMembershipService'
import {
  CASTLE_COMMAND_TARGETS,
  formatClockTime,
  formatMarchDuration,
  type CastleCommandTarget,
  type MarchTimeProfile,
  type RallyPreparationSeconds,
} from './castleCommandDomain'
import {
  createCastleCommandSession,
  listCastleCommandAllianceProfiles,
  loadCastleCommandCloudProfile,
  loadCastleCommandSessions,
  removeCastleCommandSessionAssignment,
  saveCastleCommandCloudProfile,
  setCastleCommandSessionAssignment,
  type CastleCommandAllianceProfile,
  type CastleCommandCloudProfile,
  type CastleCommandSessionRecord,
} from './castleCommandCloudService'
import { checkCastleCommandManagement, type CastleCommandManagementCapability } from './castleCommandCapabilityService'
import { buildCoordinatedLaunchOrder } from './castleCommandSessionDomain'
import './castleCommandCloud.css'

type Props = {
  userId: string
  playerAccountId: string
  timings: MarchTimeProfile
  howlerSkillLevel: number
  onImportCloudProfile: (profile: CastleCommandCloudProfile) => void
}

type CloudState = 'loading' | 'ready' | 'unavailable' | 'error'

function futureLocalDateTime() {
  const date = new Date(Date.now() + 30 * 60_000)
  date.setSeconds(0, 0)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

function targetLabel(target: CastleCommandTarget) {
  return CASTLE_COMMAND_TARGETS.find((item) => item.id === target)?.label ?? target
}

export default function CastleCommandCloudWorkspace({
  userId,
  playerAccountId,
  timings,
  howlerSkillLevel,
  onImportCloudProfile,
}: Props) {
  const [cloudState, setCloudState] = useState<CloudState>('loading')
  const [cloudProfile, setCloudProfile] = useState<CastleCommandCloudProfile | null>(null)
  const [shareWithAlliance, setShareWithAlliance] = useState(false)
  const [currentAlliance, setCurrentAlliance] = useState<AllianceMembershipDetails | null>(null)
  const [allianceProfiles, setAllianceProfiles] = useState<CastleCommandAllianceProfile[]>([])
  const [sessions, setSessions] = useState<CastleCommandSessionRecord[]>([])
  const [management, setManagement] = useState<CastleCommandManagementCapability>('denied')
  const [selectedSessionId, setSelectedSessionId] = useState('')
  const [sessionTitle, setSessionTitle] = useState('Castle Battle')
  const [sessionImpact, setSessionImpact] = useState(futureLocalDateTime)
  const [sessionPrep, setSessionPrep] = useState<RallyPreparationSeconds>(300)
  const [assignmentPlayer, setAssignmentPlayer] = useState('')
  const [assignmentTarget, setAssignmentTarget] = useState<CastleCommandTarget>('castle')
  const [assignmentHowler, setAssignmentHowler] = useState(false)
  const [working, setWorking] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setCloudState('loading')
      setError('')

      try {
        const [profileResult, memberships] = await Promise.all([
          loadCastleCommandCloudProfile(playerAccountId),
          getMyAllianceMemberships(userId),
        ])
        if (cancelled) return

        const currentMemberships = memberships.filter((membership) => membership.status === 'current')
        const preferredAllianceId = profileResult.status === 'ready'
          ? profileResult.data?.sharedAllianceId ?? null
          : null
        const alliance = currentMemberships.find((membership) => membership.alliance_id === preferredAllianceId)
          ?? currentMemberships[0]
          ?? null
        setCurrentAlliance(alliance)

        if (profileResult.status === 'unavailable') {
          setCloudState('unavailable')
          setCloudProfile(null)
          setManagement('unavailable')
          return
        }

        setCloudState('ready')
        setCloudProfile(profileResult.data)
        setShareWithAlliance(profileResult.data?.shareWithAlliance ?? false)

        if (!alliance) {
          setAllianceProfiles([])
          setSessions([])
          setManagement('denied')
          return
        }

        const [profilesResult, sessionsResult, capability] = await Promise.all([
          listCastleCommandAllianceProfiles(alliance.alliance_id),
          loadCastleCommandSessions(alliance.alliance_id),
          checkCastleCommandManagement(alliance.alliance_id),
        ])
        if (cancelled) return

        if (profilesResult.status === 'unavailable' || sessionsResult.status === 'unavailable' || capability === 'unavailable') {
          setCloudState('unavailable')
          setManagement('unavailable')
          return
        }

        setAllianceProfiles(profilesResult.data)
        setSessions(sessionsResult.data)
        setManagement(capability)
        setSelectedSessionId((current) => current || sessionsResult.data[0]?.id || '')
      } catch (caught) {
        if (cancelled) return
        setCloudState('error')
        setError(caught instanceof Error ? caught.message : 'Castle Command cloud workspace could not be loaded.')
      }
    }

    void load()
    return () => { cancelled = true }
  }, [playerAccountId, userId])

  const selectedSession = useMemo(
    () => sessions.find((session) => session.id === selectedSessionId) ?? null,
    [selectedSessionId, sessions],
  )

  const launchOrder = useMemo(() => {
    if (!selectedSession) return []
    return buildCoordinatedLaunchOrder({
      impactAt: new Date(selectedSession.impactAt),
      rallyPreparationSeconds: selectedSession.rallyPreparationSeconds,
      assignments: selectedSession.assignments,
    })
  }, [selectedSession])

  async function refreshAlliance() {
    if (!currentAlliance) return
    const [profilesResult, sessionsResult] = await Promise.all([
      listCastleCommandAllianceProfiles(currentAlliance.alliance_id),
      loadCastleCommandSessions(currentAlliance.alliance_id),
    ])

    if (profilesResult.status === 'unavailable' || sessionsResult.status === 'unavailable') {
      setCloudState('unavailable')
      return
    }

    setAllianceProfiles(profilesResult.data)
    setSessions(sessionsResult.data)
    setSelectedSessionId((current) => current || sessionsResult.data[0]?.id || '')
  }

  async function handleCloudSave() {
    if (shareWithAlliance && !currentAlliance) {
      setMessage('')
      setError('A current Forge alliance is required before Castle Command timings can be shared.')
      return
    }

    setWorking(true)
    setMessage('')
    setError('')
    try {
      const result = await saveCastleCommandCloudProfile({
        playerAccountId,
        userId,
        howlerSkillLevel,
        shareWithAlliance,
        sharedAllianceId: shareWithAlliance ? currentAlliance?.alliance_id ?? null : null,
        timings,
      })
      if (result.status === 'unavailable') {
        setCloudState('unavailable')
        return
      }
      setCloudProfile(result.data)
      setMessage('Castle Command profile saved to Forge.')
      await refreshAlliance()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Castle Command profile could not be saved.')
    } finally {
      setWorking(false)
    }
  }

  async function handleCreateSession() {
    if (!currentAlliance || management !== 'allowed') return
    const impactAt = new Date(sessionImpact)
    if (!sessionTitle.trim() || !Number.isFinite(impactAt.getTime())) {
      setError('Enter a session title and valid impact time.')
      return
    }

    setWorking(true)
    setMessage('')
    setError('')
    try {
      const result = await createCastleCommandSession({
        allianceId: currentAlliance.alliance_id,
        title: sessionTitle,
        impactAt,
        rallyPreparationSeconds: sessionPrep,
        userId,
      })
      if (result.status === 'unavailable') {
        setCloudState('unavailable')
        return
      }
      setSelectedSessionId(result.data)
      setMessage('Castle Command session created.')
      await refreshAlliance()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Castle Command session could not be created.')
    } finally {
      setWorking(false)
    }
  }

  async function handleAssignment() {
    if (!selectedSession || !assignmentPlayer || management !== 'allowed') return
    setWorking(true)
    setMessage('')
    setError('')
    try {
      const result = await setCastleCommandSessionAssignment({
        sessionId: selectedSession.id,
        playerAccountId: assignmentPlayer,
        target: assignmentTarget,
        useHowler: assignmentHowler,
      })
      if (result.status === 'unavailable') {
        setCloudState('unavailable')
        return
      }
      setMessage('Player assignment snapshotted into the command session.')
      await refreshAlliance()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Player assignment could not be saved.')
    } finally {
      setWorking(false)
    }
  }

  async function handleRemoveAssignment(assignmentId: string) {
    if (management !== 'allowed') return
    setWorking(true)
    setMessage('')
    setError('')
    try {
      const result = await removeCastleCommandSessionAssignment(assignmentId)
      if (result.status === 'unavailable') {
        setCloudState('unavailable')
        return
      }
      setMessage('Player removed from the command session.')
      await refreshAlliance()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Player assignment could not be removed.')
    } finally {
      setWorking(false)
    }
  }

  return <section className="castle-command__panel castle-command-cloud">
    <div className="castle-command-cloud__heading">
      <div><p className="eyebrow">4 · Forge cloud & alliance</p><h2>Persistent Command profile</h2></div>
      <span className={`castle-command-cloud__status is-${cloudState}`}>{cloudState === 'ready' ? 'Cloud ready' : cloudState === 'loading' ? 'Checking…' : cloudState === 'unavailable' ? 'Activation pending' : 'Cloud error'}</span>
    </div>

    {cloudState === 'unavailable' ? <div className="castle-command-cloud__activation"><strong>001B cloud activation is intentionally pending.</strong><p>The review-gated Supabase migration has not been applied. Your 001A local timing profile continues to work; no production schema or data was changed.</p></div> : null}
    {cloudState === 'error' ? <p className="profile-panel__error">{error || 'Castle Command cloud workspace could not be loaded.'}</p> : null}

    {cloudState === 'ready' ? <>
      <div className="castle-command-cloud__profile-actions">
        <label><input type="checkbox" checked={shareWithAlliance} onChange={(event) => setShareWithAlliance(event.target.checked)} /> Share my Castle Command timings with my current alliance</label>
        <div><button type="button" className="button" disabled={working} onClick={() => void handleCloudSave()}>{working ? 'Saving…' : 'Save to Forge'}</button>{cloudProfile ? <button type="button" className="button button--secondary" disabled={working} onClick={() => onImportCloudProfile(cloudProfile)}>Load cloud times</button> : null}</div>
      </div>
      <p className="castle-command__hint">Sharing is off by default. It exposes only the limited Castle Command identity/timing projection to authenticated current members of the selected alliance.</p>

      {currentAlliance ? <div className="castle-command-cloud__alliance">
        <div><span>Current alliance</span><strong>[{currentAlliance.alliance_tag}] {currentAlliance.alliance_name ?? 'Alliance'}</strong></div>
        <div><span>Shared profiles</span><strong>{allianceProfiles.length}</strong></div>
        <div><span>Session authority</span><strong>{management === 'allowed' ? 'Event manager' : 'View only'}</strong></div>
      </div> : <p>You do not currently have a Forge alliance membership. Cloud saving still works, but shared battle sessions require a current alliance.</p>}

      {currentAlliance && management === 'allowed' ? <div className="castle-command-cloud__manager">
        <h3>Create command session</h3>
        <div className="castle-command-cloud__form-grid">
          <label>Session name<input value={sessionTitle} maxLength={120} onChange={(event) => setSessionTitle(event.target.value)} /></label>
          <label>Target impact<input type="datetime-local" step="1" value={sessionImpact} onChange={(event) => setSessionImpact(event.target.value)} /></label>
          <label>Rally preparation<select value={sessionPrep} onChange={(event) => setSessionPrep(Number(event.target.value) as RallyPreparationSeconds)}><option value={60}>1 minute</option><option value={180}>3 minutes</option><option value={300}>5 minutes</option></select></label>
        </div>
        <button type="button" className="button" disabled={working} onClick={() => void handleCreateSession()}>Create session</button>
      </div> : null}

      {currentAlliance && sessions.length > 0 ? <div className="castle-command-cloud__sessions">
        <label>Battle session<select value={selectedSessionId} onChange={(event) => setSelectedSessionId(event.target.value)}>{sessions.map((session) => <option key={session.id} value={session.id}>{session.title} · {new Date(session.impactAt).toLocaleString('en-GB')}</option>)}</select></label>

        {selectedSession && management === 'allowed' ? <div className="castle-command-cloud__assignment-form">
          <label>Player<select value={assignmentPlayer} onChange={(event) => setAssignmentPlayer(event.target.value)}><option value="">Select shared profile…</option>{allianceProfiles.map((profile) => <option key={profile.id} value={profile.playerAccountId}>{profile.playerName} · {profile.playerId}</option>)}</select></label>
          <label>Target<select value={assignmentTarget} onChange={(event) => setAssignmentTarget(event.target.value as CastleCommandTarget)}>{CASTLE_COMMAND_TARGETS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
          <label className="castle-command-cloud__checkbox"><input type="checkbox" checked={assignmentHowler} onChange={(event) => setAssignmentHowler(event.target.checked)} /> Use Howler timing</label>
          <button type="button" className="button" disabled={working || !assignmentPlayer} onClick={() => void handleAssignment()}>Add / update player</button>
        </div> : null}

        {selectedSession ? <div className="castle-command-cloud__launch-order">
          <div className="castle-command-cloud__session-title"><div><span>{selectedSession.status}</span><h3>{selectedSession.title}</h3></div><strong>Impact {formatClockTime(new Date(selectedSession.impactAt))}</strong></div>
          {launchOrder.length === 0 ? <p>No players assigned yet.</p> : <ol>{launchOrder.map((row) => <li key={row.id}>
            <div><strong>{row.playerName}</strong><span>{targetLabel(row.target)} · {formatMarchDuration(row.marchSeconds)}{row.useHowler ? ` · Howler L${row.howlerSkillLevel}` : ''}</span>{row.needsHowlerCalibration ? <small>Normal fallback — Howler calibration required</small> : null}</div>
            <div className="castle-command-cloud__times"><span>Start rally <strong>{formatClockTime(row.timing.rallyStartAt)}</strong></span><span>March <strong>{formatClockTime(row.timing.marchDepartureAt)}</strong></span></div>
            {management === 'allowed' ? <button type="button" aria-label={`Remove ${row.playerName}`} disabled={working} onClick={() => void handleRemoveAssignment(row.id)}>×</button> : null}
          </li>)}</ol>}
        </div> : null}
      </div> : currentAlliance ? <p>No Castle Command battle sessions yet.</p> : null}
    </> : null}

    {message ? <p className="profile-panel__success">{message}</p> : null}
    {cloudState !== 'error' && error ? <p className="profile-panel__error">{error}</p> : null}
  </section>
}
