import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { usePlayerIdentity } from '../context/PlayerIdentityContext'
import { useDataset } from '../lib/dataEngine/useDataset'
import { addProgressionSnapshot, getMyProgression, type PlayerProgressionInput, type PlayerProgressionSnapshot } from '../services/playerProgressionService'

type DatasetRecord = Record<string, unknown>
type SelectOption = { value: number; label: string }

const emptyInput: PlayerProgressionInput = {
  currentPower: null,
  highestPower: null,
  townCenterLevel: null,
  truegoldLevel: null,
  vipLevel: null,
  infantryTier: null,
  lancerTier: null,
  marksmanTier: null,
  governorGearScore: null,
  governorCharmScore: null,
  notes: null,
  isPublic: false,
}

const numberValue = (value: string) => value === '' ? null : Number(value)
const formatNumber = (value: number | null) => value === null ? '—' : value.toLocaleString('en-GB')

function asRecord(value: unknown): DatasetRecord | null {
  return typeof value === 'object' && value !== null ? value as DatasetRecord : null
}

function numberFrom(value: unknown): number | null {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function getTroopOptions(data: unknown, troopKey: string): SelectOption[] {
  if (Array.isArray(data)) {
    return data
      .map((value) => asRecord(value))
      .filter((record): record is DatasetRecord => record?.troop_type === troopKey)
      .map((record) => {
        const tier = numberFrom(record.tier)
        return tier === null ? null : { value: tier, label: typeof record.label === 'string' ? record.label : `T${tier} ${troopKey}` }
      })
      .filter((option): option is SelectOption => option !== null)
      .sort((left, right) => left.value - right.value)
  }
  const root = asRecord(data)
  const troops = asRecord(root?.troops)
  const troop = asRecord(troops?.[troopKey])
  const tiers = asRecord(troop?.tiers)
  if (!tiers) return []

  return Object.entries(tiers)
    .map(([key, value]) => {
      const tier = asRecord(value)
      const number = numberFrom(key.replace(/^t/i, ''))
      return number === null ? null : { value: number, label: typeof tier?.label === 'string' ? tier.label : `T${number} ${troopKey}` }
    })
    .filter((option): option is SelectOption => option !== null)
    .sort((left, right) => left.value - right.value)
}

function getTruegoldOptions(data: unknown): SelectOption[] {
  if (Array.isArray(data)) {
    const levels = new Set<number>()
    data.forEach((value) => {
      const record = asRecord(value)
      Object.keys(record ?? {}).forEach((key) => {
        const level = numberFrom(key.replace(/^truegold_tg/i, ''))
        if (level !== null) levels.add(level)
      })
    })
    return [...levels].sort((left, right) => left - right).map((value) => ({ value, label: `TG${value}` }))
  }
  const root = asRecord(data)
  const buildings = Array.isArray(root?.buildings) ? root.buildings : []
  const levels = new Set<number>()
  buildings.forEach((building) => {
    const truegold = asRecord(asRecord(building)?.truegold)
    Object.keys(truegold ?? {}).forEach((key) => {
      const level = numberFrom(key.replace(/^tg/i, ''))
      if (level !== null) levels.add(level)
    })
  })
  return [...levels].sort((left, right) => left - right).map((value) => ({ value, label: `TG${value}` }))
}

function getVipOptions(data: unknown): SelectOption[] {
  if (Array.isArray(data)) {
    return data
      .map((value) => numberFrom(asRecord(value)?.level))
      .filter((level): level is number => level !== null)
      .sort((left, right) => left - right)
      .map((value) => ({ value, label: `VIP ${value}` }))
  }
  const root = asRecord(data)
  const levels = Array.isArray(root?.vipLevels) ? root.vipLevels : []
  return levels
    .map((level) => numberFrom(asRecord(level)?.level))
    .filter((level): level is number => level !== null)
    .sort((left, right) => left - right)
    .map((value) => ({ value, label: `VIP ${value}` }))
}

function withLegacyOption(options: SelectOption[], value: number | null, label: string) {
  if (value === null || options.some((option) => option.value === value)) return options
  return [{ value, label: `${label} ${value} (legacy — review)` }, ...options]
}

function SelectField({ id, label, value, options, onChange }: { id: string; label: string; value: number | null; options: SelectOption[]; onChange: (value: number | null) => void }) {
  return <label htmlFor={id}>{label}<select id={id} value={value ?? ''} onChange={(event) => onChange(numberValue(event.target.value))}><option value="">Not recorded</option>{options.map((option) => <option key={`${id}-${option.value}`} value={option.value}>{option.label}</option>)}</select></label>
}

export default function PlayerProgressionPage() {
  const { user, loading: authLoading, signInWithGoogle } = useAuth()
  const { playerAccount, loadingPlayerAccount, playerIdentityError, refreshPlayerIdentity } = usePlayerIdentity()
  const troops = useDataset<unknown>('troops')
  const truegold = useDataset<unknown>('truegold')
  const vip = useDataset<unknown>('vip')
  const gear = useDataset<unknown>('gear')
  const charm = useDataset<unknown>('charm')
  const [snapshots, setSnapshots] = useState<PlayerProgressionSnapshot[]>([])
  const [form, setForm] = useState<PlayerProgressionInput>(emptyInput)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const infantryOptions = useMemo(() => getTroopOptions(troops.data, 'infantry'), [troops.data])
  const lancerOptions = useMemo(() => getTroopOptions(troops.data, 'lancer'), [troops.data])
  const marksmanOptions = useMemo(() => getTroopOptions(troops.data, 'marksman'), [troops.data])
  const truegoldOptions = useMemo(() => getTruegoldOptions(truegold.data), [truegold.data])
  const vipOptions = useMemo(() => getVipOptions(vip.data), [vip.data])
  const datasetError = troops.error || truegold.error || vip.error
  const datasetsLoading = troops.loading || truegold.loading || vip.loading || gear.loading || charm.loading
  const datasetOptionsReady = infantryOptions.length > 0 && lancerOptions.length > 0 && marksmanOptions.length > 0 && truegoldOptions.length > 0 && vipOptions.length > 0
  const canonicalTownCenterLevel = playerAccount?.player_level ?? null
  const townCenterDisplay = playerAccount?.level_rendered_detailed || playerAccount?.level_rendered || (canonicalTownCenterLevel === null ? 'Not available' : `Level ${canonicalTownCenterLevel}`)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (authLoading || loadingPlayerAccount) return
      if (!user || !playerAccount) { setLoading(false); return }
      setLoading(true)
      setError('')
      try {
        const history = await getMyProgression(playerAccount.id)
        if (!cancelled) {
          setSnapshots(history)
          const latest = history[0]
          if (latest) {
            setForm({
              currentPower: latest.currentPower,
              highestPower: latest.highestPower,
              townCenterLevel: canonicalTownCenterLevel,
              truegoldLevel: latest.truegoldLevel,
              vipLevel: latest.vipLevel,
              infantryTier: latest.infantryTier,
              lancerTier: latest.lancerTier,
              marksmanTier: latest.marksmanTier,
              governorGearScore: latest.governorGearScore,
              governorCharmScore: latest.governorCharmScore,
              notes: null,
              isPublic: latest.isPublic,
            })
          }
        }
      } catch (caught) {
        if (!cancelled) setError(caught instanceof Error ? caught.message : 'Progression could not be loaded.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [authLoading, canonicalTownCenterLevel, loadingPlayerAccount, playerAccount, user])

  const powerGain = useMemo(() => {
    if (snapshots.length < 2) return null
    const newest = snapshots[0].currentPower
    const previous = snapshots[1].currentPower
    return newest !== null && previous !== null ? newest - previous : null
  }, [snapshots])

  function updateNumber(field: keyof PlayerProgressionInput, value: number | null) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    if (!playerAccount) return
    if (canonicalTownCenterLevel === null) { setError('Town Center is not available from the linked player yet. Refresh the linked player before saving.'); return }
    if (!datasetOptionsReady) { setError('Published progression datasets are not available. Try again when the dataset status is healthy.'); return }
    setSaving(true)
    setError('')
    setMessage('')
    const input = { ...form, townCenterLevel: canonicalTownCenterLevel }
    try {
      await addProgressionSnapshot(playerAccount.id, input, {
        infantryTiers: new Set(infantryOptions.map((option) => option.value)),
        lancerTiers: new Set(lancerOptions.map((option) => option.value)),
        marksmanTiers: new Set(marksmanOptions.map((option) => option.value)),
        truegoldLevels: new Set(truegoldOptions.map((option) => option.value)),
        vipLevels: new Set(vipOptions.map((option) => option.value)),
      })
      setSnapshots(await getMyProgression(playerAccount.id))
      window.dispatchEvent(new Event('kingshot-player-updated'))
      setMessage('Progression snapshot saved.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Progression could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loadingPlayerAccount || loading || datasetsLoading) return <main className="player-domain-state"><h1>Loading progression…</h1><p>Loading linked player context and published progression data.</p></main>
  if (!user) return <main className="player-domain-state"><h1>Sign in to track progression</h1><p>Your snapshots are owned by your Forge account.</p><button className="button button--primary" onClick={() => void signInWithGoogle()}>Sign in with Google</button></main>
  if (playerIdentityError) return <main className="player-domain-state"><h1>Progression is temporarily unavailable</h1><p>{playerIdentityError}</p><button className="button button--primary" onClick={() => void refreshPlayerIdentity()}>Retry identity load</button></main>
  if (!playerAccount) return <main className="player-domain-state"><h1>Link a player first</h1><p>A primary Kingshot player account is required.</p><Link className="button button--primary" to="/my-forge/player-identity">Link player</Link></main>

  return <main className="player-progression-page">
    <header className="player-domain-hero"><div><p className="eyebrow">Player Domain</p><h1>Personal progression</h1><p>Record player-maintained snapshots beside the latest API-owned linked-player context.</p></div><div className="player-domain-actions"><Link className="button button--secondary" to="/my-forge/profile">Edit profile</Link><Link className="button button--secondary" to="/my-forge/hero-collection">Hero collection</Link></div></header>
    <section className="player-progress-summary"><article><span>Latest power</span><strong>{formatNumber(snapshots[0]?.currentPower ?? null)}</strong></article><article><span>Change</span><strong>{powerGain === null ? '—' : `${powerGain >= 0 ? '+' : ''}${powerGain.toLocaleString('en-GB')}`}</strong></article><article><span>Snapshots</span><strong>{snapshots.length}</strong></article><article><span>Town Center</span><strong>{townCenterDisplay}</strong></article></section>
    <section className="player-domain-card player-progression-context"><p className="eyebrow">API-owned linked-player context</p><h2>{playerAccount.player_name}</h2><p>Player ID {playerAccount.player_id} · Kingdom {playerAccount.kingdom_id ?? 'Not available'}</p><p>Town Center: <strong>{townCenterDisplay}</strong> · Last refreshed {new Date(playerAccount.last_refreshed_at).toLocaleString('en-GB')}</p>{canonicalTownCenterLevel === null ? <p className="profile-panel__error" role="alert">Town Center is not available from the linked-player API. New snapshots are disabled until it refreshes.</p> : null}</section>
    <div className="player-progression-layout"><form className="player-domain-card player-progression-form" onSubmit={save}><div><p className="eyebrow">New snapshot</p><h2>Record player-maintained values</h2></div><div className="player-domain-form-grid"><label htmlFor="current-power">Current power<input id="current-power" type="number" min="0" value={form.currentPower ?? ''} onChange={(event) => updateNumber('currentPower', numberValue(event.target.value))} /></label><label htmlFor="highest-power">Highest power<input id="highest-power" type="number" min="0" value={form.highestPower ?? ''} onChange={(event) => updateNumber('highestPower', numberValue(event.target.value))} /></label><SelectField id="truegold-level" label="Truegold" value={form.truegoldLevel} options={withLegacyOption(truegoldOptions, form.truegoldLevel, 'TG')} onChange={(value) => updateNumber('truegoldLevel', value)} /><SelectField id="vip-level" label="VIP level" value={form.vipLevel} options={withLegacyOption(vipOptions, form.vipLevel, 'VIP')} onChange={(value) => updateNumber('vipLevel', value)} /><SelectField id="infantry-tier" label="Infantry tier" value={form.infantryTier} options={withLegacyOption(infantryOptions, form.infantryTier, 'Infantry tier')} onChange={(value) => updateNumber('infantryTier', value)} /><SelectField id="lancer-tier" label="Lancer tier" value={form.lancerTier} options={withLegacyOption(lancerOptions, form.lancerTier, 'Lancer tier')} onChange={(value) => updateNumber('lancerTier', value)} /><SelectField id="marksman-tier" label="Marksman tier" value={form.marksmanTier} options={withLegacyOption(marksmanOptions, form.marksmanTier, 'Marksman tier')} onChange={(value) => updateNumber('marksmanTier', value)} /><label htmlFor="governor-gear-score">Governor Gear score<input id="governor-gear-score" type="number" min="0" value={form.governorGearScore ?? ''} onChange={(event) => updateNumber('governorGearScore', numberValue(event.target.value))} /></label><label htmlFor="governor-charm-score">Governor Charm score<input id="governor-charm-score" type="number" min="0" value={form.governorCharmScore ?? ''} onChange={(event) => updateNumber('governorCharmScore', numberValue(event.target.value))} /></label></div><p className="player-progression-note">Governor Gear and Governor Charm datasets expose per-step or per-level values, not a reliable whole-governor score. These two fields remain controlled numeric scores with non-negative validation.</p><label htmlFor="progression-notes">Notes<textarea id="progression-notes" rows={3} value={form.notes ?? ''} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder="What changed since your last snapshot?" /></label><label className="player-domain-checkbox"><input type="checkbox" checked={form.isPublic} onChange={(event) => setForm((current) => ({ ...current, isPublic: event.target.checked }))} /><span>Show this snapshot on my public profile</span></label>{datasetError ? <p className="profile-panel__error" role="alert">{datasetError}</p> : null}{error ? <p className="profile-panel__error" role="alert">{error}</p> : null}{message ? <p className="profile-panel__success" role="status">{message}</p> : null}<button className="button button--primary" disabled={saving || !datasetOptionsReady || canonicalTownCenterLevel === null}>{saving ? 'Saving…' : 'Save snapshot'}</button></form>
      <section className="player-domain-card"><div><p className="eyebrow">History</p><h2>Recent snapshots</h2></div>{snapshots.length === 0 ? <p>No snapshots yet. Record your first position to begin tracking.</p> : <div className="player-snapshot-list">{snapshots.map((snapshot) => <article key={snapshot.id}><div><strong>{new Date(snapshot.recordedAt).toLocaleDateString('en-GB')}</strong><span>{snapshot.isPublic ? 'Public' : 'Private'}</span></div><p>{formatNumber(snapshot.currentPower)} power · Town Center {snapshot.townCenterLevel ?? townCenterDisplay} · {snapshot.truegoldLevel === null ? 'Truegold —' : `TG${snapshot.truegoldLevel}`} · VIP {snapshot.vipLevel ?? '—'}</p>{snapshot.notes ? <small>{snapshot.notes}</small> : null}</article>)}</div>}</section></div>
  </main>
}
