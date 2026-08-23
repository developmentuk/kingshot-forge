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
import './castleCommandTactics.css'

type Props = {
  session: CastleCommandSessionRecord
  playerAccountId: string
  serverNowMs: number
  stale: boolean
  authority: CastleCommandSessionAuthority
  canGrantDeputies: boolean
  onAuthorityChange: () => unknown
}

type StoredTactics = {
  mode: CastleCommandTacticalMode
  staggerSeconds: number
  counterAnchor: string
  counterOffsetSeconds: number
  waves: CastleCommandTacticalWave[]
}

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

export default function CastleCommandTacticsPanel({
  session,
  playerAccountId,
  serverNowMs,
  stale,
  authority,
  canGrantDeputies,
  onAuthorityChange,
}: Props) {
  const [stored, setStored] = useState<StoredTactics>(() => loadStoredTactics(session.id))
  const [deputies, setDeputies] = useState<CastleCommandDeputyRecord[]>([])
  const [deputyState, setDeputyState] = useState<'loading' | 'ready' | 'unavailable' | 'error'>('loading')
  const [cuesEnabled, setCuesEnabled] = useState(false)
  const [cueScope, setCueScope] = useState<'mine' | 'all'>('mine')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [workingDeputy, setWorkingDeputy] = useState('')
  const announcedRef = useRef(new Set<string>())

  useEffect(() => {
    setStored(loadStoredTactics(session.id))
    announcedRef.current.clear()
  }, [session.id])

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

  const plan = useMemo(() => buildCastleCommandTacticalPlan({
    mode: stored.mode,
    sessionImpactAt: new Date(session.impactAt),
    counterAnchorAt: stored.counterAnchor ? new Date(stored.counterAnchor) : null,
    counterOffsetSeconds: stored.counterOffsetSeconds,
    staggerSeconds: stored.staggerSeconds,
    waves: stored.waves,
    rallyPreparationSeconds: session.rallyPreparationSeconds,
    assignments: session.assignments,
  }), [session, stored])

  useEffect(() => {
    announcedRef.current.clear()
  }, [stored.mode, stored.counterAnchor, stored.counterOffsetSeconds, stored.staggerSeconds, stored.waves])

  useEffect(() => {
    if (!cuesEnabled || stale || !plan) return
    const cue = nextCastleCommandCue({
      rows: plan.rows,
      nowMs: serverNowMs,
      playerAccountId,
      includeAllPlayers: cueScope === 'all' && (authority === 'manager' || authority === 'deputy'),
    })
    if (!cue) return

    const key = `${cue.waveId}:${cue.id}:${cue.rallyStartAt.getTime()}`
    if (announcedRef.current.has(key)) return
    announcedRef.current.add(key)
    playBeep()
    speakCall(cue.playerName, cue.target, cue.waveLabel)
  }, [authority, cueScope, cuesEnabled, plan, playerAccountId, serverNowMs, stale])

  function updateWave(index: number, patch: Partial<CastleCommandTacticalWave>) {
    setStored((current) => ({
      ...current,
      waves: current.waves.map((wave, waveIndex) => waveIndex === index ? { ...wave, ...patch } : wave),
    }))
  }

  function addWave() {
    setStored((current) => {
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
    setStored((current) => current.waves.length === 1
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

  const canCommand = authority === 'manager' || authority === 'deputy'
  const deputyIds = new Set(deputies.map((deputy) => deputy.playerAccountId))

  return <section className="castle-command-tactics">
    <div className="castle-command-tactics__heading">
      <div><p className="eyebrow">6 · Battle tactics</p><h3>Waves, counters & command cues</h3><p>Plan coordinated impacts without inventing game mechanics Forge cannot observe.</p></div>
      <span className={`castle-command-tactics__authority is-${authority}`}>{authority}</span>
    </div>

    <div className="castle-command-tactics__modes" role="group" aria-label="Tactical timing mode">
      {(['simultaneous', 'staggered', 'counter'] as const).map((mode) => <button key={mode} type="button" className={stored.mode === mode ? 'is-active' : ''} onClick={() => setStored((current) => ({ ...current, mode }))}>{mode}</button>)}
    </div>

    {stored.mode === 'staggered' ? <label className="castle-command-tactics__field">Impact stagger
      <span><input type="number" min={0} max={MAX_CASTLE_COMMAND_STAGGER_SECONDS} value={stored.staggerSeconds} onChange={(event) => setStored((current) => ({ ...current, staggerSeconds: Math.max(0, Math.min(MAX_CASTLE_COMMAND_STAGGER_SECONDS, Number(event.target.value) || 0)) }))} /> seconds between assigned players</span>
    </label> : null}

    {stored.mode === 'counter' ? <div className="castle-command-tactics__counter">
      <label>Enemy capture observed at<input type="datetime-local" step="1" value={stored.counterAnchor} onChange={(event) => setStored((current) => ({ ...current, counterAnchor: event.target.value }))} /></label>
      <button type="button" className="button button--secondary" disabled={stale} onClick={() => setStored((current) => ({ ...current, counterAnchor: toLocalInput(new Date(serverNowMs)) }))}>Mark capture now</button>
      <label>Desired impact after capture<span><input type="number" min={0} max={MAX_CASTLE_COMMAND_COUNTER_OFFSET_SECONDS} value={stored.counterOffsetSeconds} onChange={(event) => setStored((current) => ({ ...current, counterOffsetSeconds: Math.max(0, Math.min(MAX_CASTLE_COMMAND_COUNTER_OFFSET_SECONDS, Number(event.target.value) || 0)) }))} /> seconds</span></label>
      <p className="castle-command-tactics__warning">Forge does not detect enemy ownership. “Mark capture now” records the commander’s server-calibrated observation; the offset is a tactical choice, not a guaranteed game mechanic.</p>
    </div> : null}

    <div className="castle-command-tactics__waves">
      <div className="castle-command-tactics__section-heading"><div><strong>Impact waves</strong><span>Each wave reuses the session’s immutable assignment snapshots.</span></div><button type="button" className="button button--secondary" disabled={stored.waves.length >= MAX_CASTLE_COMMAND_WAVES} onClick={addWave}>Add wave</button></div>
      {stored.waves.map((wave, index) => <div className="castle-command-tactics__wave" key={wave.id}>
        <span>{index + 1}</span>
        <input aria-label={`Wave ${index + 1} label`} maxLength={40} value={wave.label} onChange={(event) => updateWave(index, { label: event.target.value })} />
        <label>+ <input aria-label={`${wave.label} impact offset`} type="number" min={0} max={MAX_CASTLE_COMMAND_WAVE_OFFSET_SECONDS} value={wave.offsetSeconds} onChange={(event) => updateWave(index, { offsetSeconds: Math.max(0, Math.min(MAX_CASTLE_COMMAND_WAVE_OFFSET_SECONDS, Number(event.target.value) || 0)) })} /> sec</label>
        <button type="button" aria-label={`Remove ${wave.label}`} disabled={stored.waves.length === 1} onClick={() => removeWave(index)}>×</button>
      </div>)}
    </div>

    <div className="castle-command-tactics__cues">
      <label><input type="checkbox" checked={cuesEnabled} onChange={(event) => setCuesEnabled(event.target.checked)} /> Audio + spoken launch cues</label>
      <label>Cue scope<select value={cueScope} onChange={(event) => setCueScope(event.target.value as 'mine' | 'all')}><option value="mine">My rally calls</option>{canCommand ? <option value="all">All rally calls</option> : null}</select></label>
      <button type="button" className="button button--secondary" onClick={() => { playBeep(); speakCall('Test player', 'castle', 'Test cue') }}>Test cue</button>
      {stale && cuesEnabled ? <span className="castle-command-tactics__warning">Cues paused while server sync is stale.</span> : null}
    </div>

    {!plan ? <p className="castle-command-tactics__warning">Enter a valid counter anchor and tactical values to build the plan.</p> : <>
      <div className="castle-command-tactics__brief-actions"><button type="button" className="button" onClick={() => void handleCopy('game')}>Copy game brief</button><button type="button" className="button button--secondary" onClick={() => void handleCopy('discord')}>Copy Discord brief</button></div>
      <div className="castle-command-tactics__preview">
        <div className="castle-command-tactics__section-heading"><div><strong>Tactical launch preview</strong><span>{plan.rows.length} calls · {plan.waves.length} wave{plan.waves.length === 1 ? '' : 's'}</span></div></div>
        {plan.rows.length === 0 ? <p>No assigned players in this session.</p> : <ol>{plan.rows.map((row) => {
          const countdown = buildCastleCommandCountdown(row.rallyStartAt, serverNowMs)
          return <li key={`${row.waveId}:${row.id}`} className={`is-${countdown.phase}`}><div><strong>{row.waveLabel} · {row.playerName}</strong><span>{row.target} · impact {row.impactAt.toISOString().slice(11, 19)} UTC</span></div><div><span>{row.rallyStartAt.toISOString().slice(11, 19)} UTC</span><strong>{countdown.display}</strong></div></li>
        })}</ol>}
      </div>
    </>}

    <div className="castle-command-tactics__deputies">
      <div className="castle-command-tactics__section-heading"><div><strong>Session deputies</strong><span>Deputies can run live command controls, but cannot appoint deputies or edit the alliance roster.</span></div></div>
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
