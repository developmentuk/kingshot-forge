import { useEffect, useMemo, useRef, useState } from 'react'
import type { CastleCommandSessionRecord } from './castleCommandCloudService'
import { buildCastleCommandCountdown } from './castleCommandLiveDomain'
import {
  buildCastleCommandDiscordBrief,
  buildCastleCommandGameBrief,
  buildCastleCommandTacticalPlan,
  createDefaultCastleCommandWaves,
  MAX_CASTLE_COMMAND_COUNTER_OFFSET_SECONDS,
  MAX_CASTLE_COMMAND_STAGGER_SECONDS,
  MAX_CASTLE_COMMAND_WAVES,
  MAX_CASTLE_COMMAND_WAVE_OFFSET_SECONDS,
  nextCastleCommandCue,
  type CastleCommandTacticalMode,
  type CastleCommandTacticalWave,
} from './castleCommandTacticsDomain'
import {
  loadCastleCommandSessionDeputies,
  setCastleCommandSessionDeputy,
  type CastleCommandDeputyRecord,
  type CastleCommandSessionAuthority,
} from './castleCommandTacticsService'
import {
  loadCastleCommandBattleSummary,
  loadCastleCommandSharedTacticalPlan,
  loadCastleCommandTacticalPlanHistory,
  saveCastleCommandSharedTacticalPlan,
  type CastleCommandBattleSummary,
  type CastleCommandSharedPlan,
  type CastleCommandSharedPlanHistory,
} from './castleCommandSharedService'
import './castleCommandTactics.css'
import './castleCommandShared.css'

type Props = {
  session: CastleCommandSessionRecord
  playerAccountId: string
  serverNowMs: number
  stale: boolean
  authority: CastleCommandSessionAuthority
  canGrantDeputies: boolean
  realtimeRevision: number
  onAuthorityChange: () => unknown
}

type StoredTactics = {
  mode: CastleCommandTacticalMode
  staggerSeconds: number
  counterAnchor: string
  counterOffsetSeconds: number
  waves: CastleCommandTacticalWave[]
}

type SharedState = 'loading' | 'ready' | 'unavailable' | 'error'

function storageKey(sessionId: string) {
  return `kingshot-forge:castle-command:001d:${sessionId}`
}

function toLocalInput(value: Date) {
  const shifted = new Date(value.getTime() - value.getTimezoneOffset() * 60_000)
  return shifted.toISOString().slice(0, 19)
}

function defaultStoredTactics(): StoredTactics {
  return {
    mode: 'simultaneous',
    staggerSeconds: 1,
    counterAnchor: '',
    counterOffsetSeconds: 1,
    waves: createDefaultCastleCommandWaves(),
  }
}

function storedFromSharedPlan(plan: CastleCommandSharedPlan | CastleCommandSharedPlanHistory): StoredTactics {
  return {
    mode: plan.mode,
    staggerSeconds: plan.staggerSeconds,
    counterAnchor: plan.counterAnchorAt ? toLocalInput(new Date(plan.counterAnchorAt)) : '',
    counterOffsetSeconds: plan.counterOffsetSeconds,
    waves: plan.waves.map((wave) => ({ ...wave })),
  }
}

function loadStoredTactics(sessionId: string): StoredTactics {
  try {
    const raw = JSON.parse(localStorage.getItem(storageKey(sessionId)) ?? 'null') as Partial<StoredTactics> | null
    if (!raw) return defaultStoredTactics()
    const mode = raw.mode === 'staggered' || raw.mode === 'counter' || raw.mode === 'simultaneous'
      ? raw.mode
      : 'simultaneous'
    const staggerSeconds = Number.isInteger(raw.staggerSeconds)
      ? Math.max(0, Math.min(MAX_CASTLE_COMMAND_STAGGER_SECONDS, raw.staggerSeconds as number))
      : 1
    const counterOffsetSeconds = Number.isInteger(raw.counterOffsetSeconds)
      ? Math.max(0, Math.min(MAX_CASTLE_COMMAND_COUNTER_OFFSET_SECONDS, raw.counterOffsetSeconds as number))
      : 1
    const waves = Array.isArray(raw.waves) && raw.waves.length > 0
      ? raw.waves.slice(0, MAX_CASTLE_COMMAND_WAVES).map((wave, index) => ({
        id: typeof wave?.id === 'string' && wave.id ? wave.id : `wave-${index + 1}`,
        label: typeof wave?.label === 'string' && wave.label.trim() ? wave.label.slice(0, 40) : `Wave ${index + 1}`,
        offsetSeconds: Number.isInteger(wave?.offsetSeconds)
          ? Math.max(0, Math.min(MAX_CASTLE_COMMAND_WAVE_OFFSET_SECONDS, wave.offsetSeconds))
          : 0,
      }))
      : createDefaultCastleCommandWaves()

    return {
      mode,
      staggerSeconds,
      counterAnchor: typeof raw.counterAnchor === 'string' ? raw.counterAnchor : '',
      counterOffsetSeconds,
      waves,
    }
  } catch {
    return defaultStoredTactics()
  }
}

async function copyText(text: string) {
  await navigator.clipboard.writeText(text)
}

function playBeep() {
  const AudioContextCtor = window.AudioContext
  if (!AudioContextCtor) return
  const context = new AudioContextCtor()
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.connect(gain)
  gain.connect(context.destination)
  gain.gain.setValueAtTime(0.08, context.currentTime)
  oscillator.frequency.setValueAtTime(880, context.currentTime)
  oscillator.start()
  oscillator.stop(context.currentTime + 0.16)
  oscillator.addEventListener('ended', () => void context.close(), { once: true })
}

function speakCall(playerName: string, target: string, waveLabel: string) {
  if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return
  const utterance = new SpeechSynthesisUtterance(`${waveLabel}. ${playerName}. Launch ${target} now.`)
  utterance.rate = 1.08
  window.speechSynthesis.speak(utterance)
}

function shortDate(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export default function CastleCommandTacticsPanel({
  session,
  playerAccountId,
  serverNowMs,
  stale,
  authority,
  canGrantDeputies,
  realtimeRevision,
  onAuthorityChange,
}: Props) {
  const [stored, setStored] = useState<StoredTactics>(() => loadStoredTactics(session.id))
  const [deputies, setDeputies] = useState<CastleCommandDeputyRecord[]>([])
  const [deputyState, setDeputyState] = useState<'loading' | 'ready' | 'unavailable' | 'error'>('loading')
  const [sharedState, setSharedState] = useState<SharedState>('loading')
  const [sharedPlan, setSharedPlan] = useState<CastleCommandSharedPlan | null>(null)
  const [history, setHistory] = useState<CastleCommandSharedPlanHistory[]>([])
  const [summary, setSummary] = useState<CastleCommandBattleSummary | null>(null)
  const [draftBaseVersion, setDraftBaseVersion] = useState(0)
  const [dirty, setDirty] = useState(false)
  const [remoteUpdateAvailable, setRemoteUpdateAvailable] = useState(false)
  const [savingShared, setSavingShared] = useState(false)
  const [cuesEnabled, setCuesEnabled] = useState(false)
  const [cueScope, setCueScope] = useState<'mine' | 'all'>('mine')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [workingDeputy, setWorkingDeputy] = useState('')
  const announcedRef = useRef(new Set<string>())

  const canCommand = authority === 'manager' || authority === 'deputy'
  const canEditTactics = session.status !== 'closed'
    && (sharedState === 'unavailable' || (sharedState === 'ready' && canCommand))

  function applyCanonicalPlan(plan: CastleCommandSharedPlan) {
    setStored(storedFromSharedPlan(plan))
    setDraftBaseVersion(plan.version)
    setDirty(false)
    setRemoteUpdateAvailable(false)
    announcedRef.current.clear()
  }

  async function refreshShared(forceApply: boolean) {
    try {
      const [planResult, historyResult, summaryResult] = await Promise.all([
        loadCastleCommandSharedTacticalPlan(session.id),
        loadCastleCommandTacticalPlanHistory(session.id, 20),
        loadCastleCommandBattleSummary(session.id),
      ])

      if (
        planResult.status === 'unavailable'
        || historyResult.status === 'unavailable'
        || summaryResult.status === 'unavailable'
      ) {
        setSharedState('unavailable')
        setSharedPlan(null)
        setHistory([])
        setSummary(null)
        return
      }

      const nextPlan = planResult.data
      setSharedPlan(nextPlan)
      setHistory(historyResult.data)
      setSummary(summaryResult.data)
      setSharedState('ready')

      if (!nextPlan) {
        if (forceApply || !dirty) setDraftBaseVersion(0)
        return
      }

      if (forceApply || !canCommand || !dirty) {
        applyCanonicalPlan(nextPlan)
        return
      }

      if (nextPlan.version !== draftBaseVersion) {
        setRemoteUpdateAvailable(true)
      }
    } catch (caught) {
      setSharedState('error')
      setError(caught instanceof Error ? caught.message : 'Shared tactical operations could not be loaded.')
    }
  }

  useEffect(() => {
    setStored(loadStoredTactics(session.id))
    setSharedState('loading')
    setSharedPlan(null)
    setHistory([])
    setSummary(null)
    setDraftBaseVersion(0)
    setDirty(false)
    setRemoteUpdateAvailable(false)
    announcedRef.current.clear()
    void refreshShared(true)
    // Session identity is the shared tactical authority boundary.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.id])

  useEffect(() => {
    if (realtimeRevision < 1) return
    void refreshShared(false)
    // Realtime revision is deliberately the refresh trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realtimeRevision])

  useEffect(() => {
    localStorage.setItem(storageKey(session.id), JSON.stringify(stored))
  }, [session.id, stored])

  async function refreshDeputies() {
    setDeputyState('loading')
    try {
      const result = await loadCastleCommandSessionDeputies(session.id)
      if (result.status === 'unavailable') {
        setDeputyState('unavailable')
        setDeputies([])
        return
      }
      setDeputies(result.data)
      setDeputyState('ready')
    } catch (caught) {
      setDeputyState('error')
      setError(caught instanceof Error ? caught.message : 'Deputy authority could not be loaded.')
    }
  }

  useEffect(() => {
    void refreshDeputies()
    // Session identity is the deputy authority boundary.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.id])

  const usingCanonicalSnapshot = sharedState === 'ready' && Boolean(sharedPlan) && !dirty
  const effectiveAssignments = usingCanonicalSnapshot && sharedPlan
    ? sharedPlan.assignments
    : session.assignments
  const effectiveImpactAt = usingCanonicalSnapshot && sharedPlan
    ? new Date(sharedPlan.sessionImpactAt)
    : new Date(session.impactAt)
  const effectivePreparation = usingCanonicalSnapshot && sharedPlan
    ? sharedPlan.rallyPreparationSeconds
    : session.rallyPreparationSeconds

  const plan = useMemo(() => {
    if (sharedState === 'ready' && !sharedPlan && !canCommand) return null
    return buildCastleCommandTacticalPlan({
      mode: stored.mode,
      sessionImpactAt: effectiveImpactAt,
      counterAnchorAt: stored.counterAnchor ? new Date(stored.counterAnchor) : null,
      counterOffsetSeconds: stored.counterOffsetSeconds,
      staggerSeconds: stored.staggerSeconds,
      waves: stored.waves,
      rallyPreparationSeconds: effectivePreparation,
      assignments: effectiveAssignments,
    })
  }, [canCommand, effectiveAssignments, effectiveImpactAt, effectivePreparation, sharedPlan, sharedState, stored])

  useEffect(() => {
    announcedRef.current.clear()
  }, [stored.mode, stored.counterAnchor, stored.counterOffsetSeconds, stored.staggerSeconds, stored.waves])

  useEffect(() => {
    if (!cuesEnabled || stale || !plan) return
    const cue = nextCastleCommandCue({
      rows: plan.rows,
      nowMs: serverNowMs,
      playerAccountId,
      includeAllPlayers: cueScope === 'all' && canCommand,
    })
    if (!cue) return

    const key = `${cue.waveId}:${cue.id}:${cue.rallyStartAt.getTime()}`
    if (announcedRef.current.has(key)) return
    announcedRef.current.add(key)
    playBeep()
    speakCall(cue.playerName, cue.target, cue.waveLabel)
  }, [canCommand, cueScope, cuesEnabled, plan, playerAccountId, serverNowMs, stale])

  function changeStored(updater: (current: StoredTactics) => StoredTactics) {
    if (!canEditTactics) return
    setStored((current) => updater(current))
    if (sharedState === 'ready' && canCommand) setDirty(true)
  }

  function updateWave(index: number, patch: Partial<CastleCommandTacticalWave>) {
    changeStored((current) => ({
      ...current,
      waves: current.waves.map((wave, waveIndex) => waveIndex === index ? { ...wave, ...patch } : wave),
    }))
  }

  function addWave() {
    changeStored((current) => {
      if (current.waves.length >= MAX_CASTLE_COMMAND_WAVES) return current
      const number = current.waves.length + 1
      const previous = current.waves.at(-1)?.offsetSeconds ?? 0
      return {
        ...current,
        waves: [...current.waves, {
          id: `wave-${number}-${Date.now()}`,
          label: `Wave ${number}`,
          offsetSeconds: Math.min(MAX_CASTLE_COMMAND_WAVE_OFFSET_SECONDS, previous + 5),
        }],
      }
    })
  }

  function removeWave(index: number) {
    changeStored((current) => current.waves.length === 1
      ? current
      : { ...current, waves: current.waves.filter((_, waveIndex) => waveIndex !== index) })
  }

  async function toggleDeputy(targetPlayerAccountId: string, enabled: boolean) {
    setWorkingDeputy(targetPlayerAccountId)
    setMessage('')
    setError('')
    try {
      const result = await setCastleCommandSessionDeputy({
        sessionId: session.id,
        playerAccountId: targetPlayerAccountId,
        enabled,
      })
      if (result.status === 'unavailable') {
        setDeputyState('unavailable')
        return
      }
      await Promise.all([refreshDeputies(), Promise.resolve(onAuthorityChange())])
      setMessage(enabled ? 'Deputy command authority granted.' : 'Deputy command authority removed.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Deputy authority could not be changed.')
    } finally {
      setWorkingDeputy('')
    }
  }

  async function handleSaveShared() {
    if (!canCommand || session.status === 'closed' || !plan) return
    if (stored.mode === 'counter' && !stored.counterAnchor) {
      setError('Counter mode needs an operator-observed capture anchor before it can be shared.')
      return
    }

    setSavingShared(true)
    setMessage('')
    setError('')
    try {
      const counterAnchorAt = stored.mode === 'counter'
        ? new Date(stored.counterAnchor).toISOString()
        : null
      const result = await saveCastleCommandSharedTacticalPlan({
        sessionId: session.id,
        expectedVersion: draftBaseVersion,
        mode: stored.mode,
        staggerSeconds: stored.staggerSeconds,
        counterAnchorAt,
        counterOffsetSeconds: stored.counterOffsetSeconds,
        waves: stored.waves,
      })

      if (result.status === 'unavailable') {
        setSharedState('unavailable')
        return
      }
      if (result.status === 'conflict') {
        setRemoteUpdateAvailable(true)
        setError('Another commander published a newer tactical version. Load the latest shared plan before saving your draft.')
        await refreshShared(false)
        return
      }

      setMessage(`Shared tactical plan v${result.data} published.`)
      setDirty(false)
      await refreshShared(true)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Shared tactical plan could not be saved.')
    } finally {
      setSavingShared(false)
    }
  }

  async function handleCopy(kind: 'game' | 'discord') {
    if (!plan) return
    setMessage('')
    setError('')
    try {
      await copyText(kind === 'game' ? buildCastleCommandGameBrief(plan) : buildCastleCommandDiscordBrief(plan))
      setMessage(kind === 'game' ? 'Game-chat battle brief copied.' : 'Discord battle brief copied.')
    } catch {
      setError('Clipboard access was blocked by the browser.')
    }
  }

  function restoreHistoryVersion(version: CastleCommandSharedPlanHistory) {
    if (!canCommand || session.status === 'closed') return
    setStored(storedFromSharedPlan(version))
    setDraftBaseVersion(sharedPlan?.version ?? 0)
    setDirty(true)
    setRemoteUpdateAvailable(false)
    announcedRef.current.clear()
    setMessage(`Version ${version.version} loaded as a draft. Saving will create a new version; history is never overwritten.`)
  }

  const deputyIds = new Set(deputies.map((deputy) => deputy.playerAccountId))
  const sharedLabel = sharedState === 'loading'
    ? 'Shared state loading…'
    : sharedState === 'unavailable'
      ? 'Local 001D fallback'
      : sharedState === 'error'
        ? 'Shared state error'
        : sharedPlan
          ? `Shared v${sharedPlan.version}${dirty ? ' · draft changed' : ''}`
          : 'No shared plan yet'

  return <section className="castle-command-tactics">
    <div className="castle-command-tactics__heading">
      <div><p className="eyebrow">6 · Battle tactics</p><h3>Waves, counters & command cues</h3><p>Plan coordinated impacts without inventing game mechanics Forge cannot observe.</p></div>
      <div className="castle-command-shared__badges"><span className={`castle-command-tactics__authority is-${authority}`}>{authority}</span><span className={`castle-command-shared__state is-${sharedState}`}>{sharedLabel}</span></div>
    </div>

    {sharedState === 'loading' ? <div className="castle-command-shared__notice"><strong>Loading shared tactical operations…</strong><p>Controls stay locked until Forge knows whether the shared 001E service is active.</p></div> : null}
    {sharedState === 'unavailable' ? <div className="castle-command-shared__notice"><strong>001E activation pending.</strong><p>Battle tactics remain browser-local exactly as in 001D. No shared plan, version history or battle summary has been activated in Supabase.</p></div> : null}
    {sharedState === 'error' ? <div className="castle-command-shared__notice is-error"><strong>Shared tactical operations unavailable.</strong><p>Forge has not replaced the current browser draft because the canonical shared state could not be verified.</p></div> : null}

    {sharedState === 'ready' ? <div className="castle-command-shared__toolbar">
      <div><strong>{sharedPlan ? `Canonical tactical plan v${sharedPlan.version}` : 'No canonical tactical plan published'}</strong><span>{sharedPlan ? `Saved ${shortDate(sharedPlan.savedAt)} · ${sharedPlan.assignments.length} snapshotted assignments` : 'A commander or deputy can publish the first shared version.'}</span></div>
      {canCommand && session.status !== 'closed' ? <button type="button" className="button" disabled={savingShared || !plan || (!dirty && Boolean(sharedPlan))} onClick={() => void handleSaveShared()}>{savingShared ? 'Publishing…' : sharedPlan ? 'Publish new version' : 'Publish shared plan'}</button> : null}
    </div> : null}

    {sharedState === 'ready' && sharedPlan && !sharedPlan.assignmentSnapshotCurrent ? <div className="castle-command-shared__notice is-warning"><strong>Shared plan assignments are stale.</strong><p>The canonical version still uses its immutable assignment snapshot. A commander or deputy should review the current roster and publish a new version before relying on changed assignments.</p></div> : null}
    {remoteUpdateAvailable && sharedPlan ? <div className="castle-command-shared__notice is-warning"><strong>A newer shared plan exists.</strong><p>Your unsaved draft has not been overwritten.</p><button type="button" className="button button--secondary" onClick={() => applyCanonicalPlan(sharedPlan)}>Discard draft and load v{sharedPlan.version}</button></div> : null}

    <div className="castle-command-tactics__modes" role="group" aria-label="Tactical timing mode">
      {(['simultaneous', 'staggered', 'counter'] as const).map((mode) => <button key={mode} type="button" disabled={!canEditTactics} className={stored.mode === mode ? 'is-active' : ''} onClick={() => changeStored((current) => ({ ...current, mode }))}>{mode}</button>)}
    </div>

    {stored.mode === 'staggered' ? <label className="castle-command-tactics__field">Impact stagger
      <span><input disabled={!canEditTactics} type="number" min={0} max={MAX_CASTLE_COMMAND_STAGGER_SECONDS} value={stored.staggerSeconds} onChange={(event) => changeStored((current) => ({ ...current, staggerSeconds: Math.max(0, Math.min(MAX_CASTLE_COMMAND_STAGGER_SECONDS, Number(event.target.value) || 0)) }))} /> seconds between assigned players</span>
    </label> : null}

    {stored.mode === 'counter' ? <div className="castle-command-tactics__counter">
      <label>Enemy capture observed at<input disabled={!canEditTactics} type="datetime-local" step="1" value={stored.counterAnchor} onChange={(event) => changeStored((current) => ({ ...current, counterAnchor: event.target.value }))} /></label>
      <button type="button" className="button button--secondary" disabled={!canEditTactics || stale} onClick={() => changeStored((current) => ({ ...current, counterAnchor: toLocalInput(new Date(serverNowMs)) }))}>Mark capture now</button>
      <label>Desired impact after capture<span><input disabled={!canEditTactics} type="number" min={0} max={MAX_CASTLE_COMMAND_COUNTER_OFFSET_SECONDS} value={stored.counterOffsetSeconds} onChange={(event) => changeStored((current) => ({ ...current, counterOffsetSeconds: Math.max(0, Math.min(MAX_CASTLE_COMMAND_COUNTER_OFFSET_SECONDS, Number(event.target.value) || 0)) }))} /> seconds</span></label>
      <p className="castle-command-tactics__warning">Forge does not detect enemy ownership. “Mark capture now” records the commander’s server-calibrated observation; the offset is a tactical choice, not a guaranteed game mechanic.</p>
    </div> : null}

    <div className="castle-command-tactics__waves">
      <div className="castle-command-tactics__section-heading"><div><strong>Impact waves</strong><span>{usingCanonicalSnapshot ? 'This view uses the immutable assignment and session-timing snapshot saved with the shared version.' : 'Draft calculations use the current session assignments.'}</span></div><button type="button" className="button button--secondary" disabled={!canEditTactics || stored.waves.length >= MAX_CASTLE_COMMAND_WAVES} onClick={addWave}>Add wave</button></div>
      {stored.waves.map((wave, index) => <div className="castle-command-tactics__wave" key={wave.id}>
        <span>{index + 1}</span>
        <input disabled={!canEditTactics} aria-label={`Wave ${index + 1} label`} maxLength={40} value={wave.label} onChange={(event) => updateWave(index, { label: event.target.value })} />
        <label>+ <input disabled={!canEditTactics} aria-label={`${wave.label} impact offset`} type="number" min={0} max={MAX_CASTLE_COMMAND_WAVE_OFFSET_SECONDS} value={wave.offsetSeconds} onChange={(event) => updateWave(index, { offsetSeconds: Math.max(0, Math.min(MAX_CASTLE_COMMAND_WAVE_OFFSET_SECONDS, Number(event.target.value) || 0)) })} /> sec</label>
        <button type="button" aria-label={`Remove ${wave.label}`} disabled={!canEditTactics || stored.waves.length === 1} onClick={() => removeWave(index)}>×</button>
      </div>)}
    </div>

    <div className="castle-command-tactics__cues">
      <label><input type="checkbox" checked={cuesEnabled} onChange={(event) => setCuesEnabled(event.target.checked)} /> Audio + spoken launch cues</label>
      <label>Cue scope<select value={cueScope} onChange={(event) => setCueScope(event.target.value as 'mine' | 'all')}><option value="mine">My rally calls</option>{canCommand ? <option value="all">All rally calls</option> : null}</select></label>
      <button type="button" className="button button--secondary" onClick={() => { playBeep(); speakCall('Test player', 'castle', 'Test cue') }}>Test cue</button>
      {stale && cuesEnabled ? <span className="castle-command-tactics__warning">Cues paused while server sync is stale.</span> : null}
    </div>

    {!plan ? <p className="castle-command-tactics__warning">{sharedState === 'ready' && !sharedPlan && !canCommand ? 'No shared tactical plan has been published yet.' : 'Enter a valid counter anchor and tactical values to build the plan.'}</p> : <>
      <div className="castle-command-tactics__brief-actions"><button type="button" className="button" onClick={() => void handleCopy('game')}>Copy game brief</button><button type="button" className="button button--secondary" onClick={() => void handleCopy('discord')}>Copy Discord brief</button></div>
      <div className="castle-command-tactics__preview">
        <div className="castle-command-tactics__section-heading"><div><strong>Tactical launch preview</strong><span>{plan.rows.length} calls · {plan.waves.length} wave{plan.waves.length === 1 ? '' : 's'}{usingCanonicalSnapshot && sharedPlan ? ` · shared v${sharedPlan.version}` : ' · draft'}</span></div></div>
        {plan.rows.length === 0 ? <p>No assigned players in this plan.</p> : <ol>{plan.rows.map((row) => {
          const countdown = buildCastleCommandCountdown(row.rallyStartAt, serverNowMs)
          return <li key={`${row.waveId}:${row.id}`} className={`is-${countdown.phase}`}><div><strong>{row.waveLabel} · {row.playerName}</strong><span>{row.target} · impact {row.impactAt.toISOString().slice(11, 19)} UTC</span></div><div><span>{row.rallyStartAt.toISOString().slice(11, 19)} UTC</span><strong>{countdown.display}</strong></div></li>
        })}</ol>}
      </div>
    </>}

    {sharedState === 'ready' ? <div className="castle-command-shared__history">
      <div className="castle-command-tactics__section-heading"><div><strong>Tactical version history</strong><span>Every publish is immutable. Restoring an older plan creates a new version.</span></div></div>
      {history.length === 0 ? <p>No tactical versions have been published yet.</p> : <ol>{history.map((version) => <li key={version.version}><div><strong>v{version.version} · {version.mode}</strong><span>{shortDate(version.savedAt)} · {version.waves.length} wave{version.waves.length === 1 ? '' : 's'} · {version.assignments.length} assignments</span></div>{canCommand && session.status !== 'closed' ? <button type="button" className="button button--secondary" onClick={() => restoreHistoryVersion(version)}>Load as draft</button> : null}</li>)}</ol>}
    </div> : null}

    {sharedState === 'ready' && summary ? <div className="castle-command-shared__summary">
      <div className="castle-command-tactics__section-heading"><div><strong>{summary.sessionStatus === 'closed' ? 'Post-battle coordination summary' : 'Coordination summary'}</strong><span>Forge records command coordination only — not combat outcome, damage, ownership or whether a rally landed successfully.</span></div></div>
      <div className="castle-command-shared__metrics"><span><strong>{summary.assignmentCount}</strong> assigned</span><span><strong>{summary.sentCount}</strong> sent</span><span><strong>{summary.readyCount}</strong> ready</span><span><strong>{summary.waitingCount}</strong> unconfirmed</span><span><strong>{summary.planVersionCount}</strong> plan versions</span><span><strong>{summary.howlerAssignmentCount}</strong> Howler assignments</span></div>
      <p>Latest plan: {summary.latestPlanVersion ? `v${summary.latestPlanVersion} · ${shortDate(summary.latestPlanSavedAt)}` : 'none'}{summary.latestPlanMatchesAssignments === false ? ' · assignment snapshot is no longer current' : ''}{summary.closedAt ? ` · closed ${shortDate(summary.closedAt)}` : ''}</p>
    </div> : null}

    <div className="castle-command-tactics__deputies">
      <div className="castle-command-tactics__section-heading"><div><strong>Session deputies</strong><span>Deputies can run live command controls and publish shared tactical versions, but cannot appoint deputies or edit the alliance roster.</span></div></div>
      {deputyState === 'loading' ? <p>Checking deputy authority…</p> : null}
      {deputyState === 'unavailable' ? <p className="castle-command-tactics__warning">001D deputy authority activation is pending. Tactical planning, briefs and local cues remain usable.</p> : null}
      {deputyState === 'error' ? <p className="profile-panel__error">Deputy authority could not be loaded.</p> : null}
      {deputyState === 'ready' ? <div className="castle-command-tactics__deputy-list">{session.assignments.map((assignment) => {
        const enabled = deputyIds.has(assignment.playerAccountId)
        return <label key={assignment.playerAccountId}><span><strong>{assignment.playerName}</strong><small>{enabled ? 'Deputy commander' : 'Participant'}</small></span>{canGrantDeputies ? <input type="checkbox" checked={enabled} disabled={Boolean(workingDeputy) || session.status === 'closed'} onChange={(event) => void toggleDeputy(assignment.playerAccountId, event.target.checked)} /> : <span>{enabled ? 'Deputy' : '—'}</span>}</label>
      })}</div> : null}
    </div>

    {message ? <p className="profile-panel__success">{message}</p> : null}
    {error ? <p className="profile-panel__error">{error}</p> : null}
  </section>
}
