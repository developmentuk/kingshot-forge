import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { usePlayerIdentity } from '../../context/PlayerIdentityContext'
import { loadPetDataset } from '../companion/pets/petData'
import { getHowlerDefinition, type HowlerDefinition } from './howlerData'
import {
  buildLaunchTiming,
  CASTLE_COMMAND_TARGETS,
  createEmptyMarchTimeProfile,
  formatClockTime,
  formatMarchDuration,
  parseMarchDuration,
  resolveMarchTime,
  type CastleCommandTarget,
  type RallyPreparationSeconds,
} from './castleCommandDomain'
import './castleCommand.css'

type Inputs = Record<CastleCommandTarget, { normal: string; howler: string }>

const emptyInputs = (): Inputs => ({
  castle: { normal: '', howler: '' },
  north: { normal: '', howler: '' },
  east: { normal: '', howler: '' },
  south: { normal: '', howler: '' },
  west: { normal: '', howler: '' },
})

function storageKey(playerId: string) {
  return `kingshot-forge:castle-command:001a:${playerId}`
}

function loadInputs(playerId: string): Inputs {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey(playerId)) ?? 'null') as Partial<Inputs> | null
    if (!value) return emptyInputs()
    return Object.fromEntries(CASTLE_COMMAND_TARGETS.map(({ id }) => {
      const stored = value[id]
      return [id, {
        normal: typeof stored?.normal === 'string' ? stored.normal : '',
        howler: typeof stored?.howler === 'string' ? stored.howler : '',
      }]
    })) as Inputs
  } catch {
    return emptyInputs()
  }
}

function defaultImpact() {
  const date = new Date(Date.now() + 10 * 60_000)
  date.setSeconds(0, 0)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

export default function CastleCommandPage() {
  const { user, loading: authLoading, signInWithGoogle } = useAuth()
  const { playerAccount, loadingPlayerAccount, playerIdentityError } = usePlayerIdentity()
  const [inputs, setInputs] = useState<Inputs>(emptyInputs)
  const [target, setTarget] = useState<CastleCommandTarget>('castle')
  const [howlerActive, setHowlerActive] = useState(false)
  const [howlerLevel, setHowlerLevel] = useState(8)
  const [howler, setHowler] = useState<HowlerDefinition | null>(null)
  const [prep, setPrep] = useState<RallyPreparationSeconds>(300)
  const [impact, setImpact] = useState(defaultImpact)

  useEffect(() => {
    void loadPetDataset().then((dataset) => {
      const definition = getHowlerDefinition(dataset)
      setHowler(definition)
      setHowlerLevel(definition?.levels.at(-1)?.level ?? 1)
    }).catch(() => setHowler(null))
  }, [])

  useEffect(() => {
    if (playerAccount?.player_id) setInputs(loadInputs(playerAccount.player_id))
  }, [playerAccount?.player_id])

  useEffect(() => {
    if (playerAccount?.player_id) localStorage.setItem(storageKey(playerAccount.player_id), JSON.stringify(inputs))
  }, [inputs, playerAccount?.player_id])

  const profile = useMemo(() => {
    const next = createEmptyMarchTimeProfile()
    for (const item of CASTLE_COMMAND_TARGETS) {
      next[item.id] = {
        normalSeconds: parseMarchDuration(inputs[item.id].normal),
        howlerSeconds: parseMarchDuration(inputs[item.id].howler),
      }
    }
    return next
  }, [inputs])

  const march = resolveMarchTime(profile[target], howlerActive)
  const timing = march.seconds !== null && impact
    ? buildLaunchTiming({ impactAt: new Date(impact), marchSeconds: march.seconds, rallyPreparationSeconds: prep })
    : null
  const level = howler?.levels.find((item) => item.level === howlerLevel)

  if (authLoading || loadingPlayerAccount) return <main className="castle-command"><h1>Preparing Forge Castle Command…</h1></main>
  if (!user) return <main className="castle-command"><section className="castle-command__notice"><p className="eyebrow">Sign in required</p><h1>Forge Castle Command</h1><p>This Kingshot timing tool is available only to signed-in Forge users.</p><button className="button" type="button" onClick={() => void signInWithGoogle()}>Sign in with Google</button></section></main>
  if (playerIdentityError) return <main className="castle-command"><section className="castle-command__notice"><h1>Player Passport unavailable</h1><p>{playerIdentityError}</p></section></main>
  if (!playerAccount) return <main className="castle-command"><section className="castle-command__notice"><p className="eyebrow">Player Passport required</p><h1>Link your Kingshot player first</h1><p>Your linked player supplies the Player Name and ID for this private tool.</p><Link className="button" to="/my-forge">Open My Forge</Link></section></main>

  return <main className="castle-command">
    <header className="castle-command__hero">
      <div><p className="eyebrow">My Forge · Kingshot Operations</p><h1>Forge Castle Command</h1><p>Coordinate your Castle and four turret timings around one exact in-game impact time.</p></div>
      <div className="castle-command__player"><strong>{playerAccount.player_name}</strong><span>ID {playerAccount.player_id}</span><span>Kingdom {playerAccount.kingdom_id}</span></div>
    </header>

    <section className="castle-command__panel">
      <p className="eyebrow">1 · Your march profile</p><h2>Castle and turret times</h2>
      <div className="castle-command__time-grid">
        <div className="castle-command__time-head"><span>Target</span><span>Normal</span><span>Howler observed</span></div>
        {CASTLE_COMMAND_TARGETS.map((item) => <div className="castle-command__time-row" key={item.id}>
          <button type="button" className={target === item.id ? 'is-active' : ''} onClick={() => setTarget(item.id)}>{item.label}</button>
          <input inputMode="numeric" aria-label={`${item.label} normal march time`} placeholder="1:05" value={inputs[item.id].normal} onChange={(event) => setInputs((current) => ({ ...current, [item.id]: { ...current[item.id], normal: event.target.value } }))} />
          <input inputMode="numeric" aria-label={`${item.label} Howler march time`} placeholder="0:55" value={inputs[item.id].howler} onChange={(event) => setInputs((current) => ({ ...current, [item.id]: { ...current[item.id], howler: event.target.value } }))} />
        </div>)}
      </div>
      <p className="castle-command__hint">Use the exact times shown by Kingshot. Moving your city can make saved times stale.</p>
    </section>

    <section className="castle-command__panel castle-command__howler">
      <div><p className="eyebrow">2 · Grizzly Bear</p><h2>The Howler</h2><p>{howler?.description ?? 'Governed pet data is unavailable; normal timing remains usable.'}</p></div>
      <div><label><input type="checkbox" checked={howlerActive} onChange={(event) => setHowlerActive(event.target.checked)} /> Howler active</label><label>Skill level <select value={howlerLevel} disabled={!howler} onChange={(event) => setHowlerLevel(Number(event.target.value))}>{howler?.levels.map((item) => <option value={item.level} key={item.level}>Level {item.level} · +{item.marchSpeedPercent}%</option>)}</select></label>{level ? <strong>+{level.marchSpeedPercent}% March Speed</strong> : null}</div>
    </section>

    {howlerActive && march.needsHowlerCalibration ? <p className="castle-command__warning"><strong>Exact Howler time needed.</strong> Forge is temporarily using your normal observed time for this target rather than guessing a reduced duration from the pet percentage.</p> : null}

    <section className="castle-command__panel">
      <p className="eyebrow">3 · In-game timing</p><h2>{CASTLE_COMMAND_TARGETS.find((item) => item.id === target)?.label}</h2>
      <div className="castle-command__planner">
        <label>Target impact <input type="datetime-local" step="1" value={impact} onChange={(event) => setImpact(event.target.value)} /></label>
        <label>Rally preparation <select value={prep} onChange={(event) => setPrep(Number(event.target.value) as RallyPreparationSeconds)}><option value={60}>1 minute</option><option value={180}>3 minutes</option><option value={300}>5 minutes</option></select></label>
        <div><span>March used</span><strong>{formatMarchDuration(march.seconds)}</strong></div>
      </div>
      {timing ? <div className="castle-command__result"><div><span>Start Kingshot rally</span><strong>{formatClockTime(timing.rallyStartAt)}</strong></div><div><span>March begins</span><strong>{formatClockTime(timing.marchDepartureAt)}</strong></div><div><span>Impact</span><strong>{formatClockTime(timing.impactAt)}</strong></div></div> : <p>Enter a valid march time to calculate the schedule.</p>}
    </section>

    <footer className="castle-command__footer"><Link to="/my-forge">← Back to My Forge</Link><span>CASTLE-COMMAND-001A · personal timing foundation</span></footer>
  </main>
}
