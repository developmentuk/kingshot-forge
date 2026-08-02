import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import BuildingIllustration from '../components/buildings/BuildingIllustration'
import { fetchDataset, type DatasetSourceMetadata } from '../features/admin/dataEngineApi'
import { ForgeConnections } from '../features/search/SearchExperience'
import { formatDuration, formatNumber, formatPercent } from '../utils/formatters'
import { getBuildingProgressionLabel, sortBuildingProgression } from '../../shared/data-pipeline/buildingsProgressionOrdering'
import '../styles/buildingsBrowser.css'
import '../styles/buildingsProgressionPolish.css'

type ProgressionRow = Record<string, unknown>
type Building = {
  key: string
  name: string
  category: string
  description: string
  maxLevel: number | null
  truegold: boolean
  progression: ProgressionRow[]
  source?: string
  verificationNote?: string
}

type EffectMetric = {
  key: string
  label: string
  shortLabel: string
  format?: 'number' | 'percent' | 'seconds'
}

type PhaseFilter = 'standard' | 'truegold'

const EFFECT_METRICS: EffectMetric[] = [
  { key: 'max_hero_level', label: 'Maximum hero level', shortLabel: 'Hero level cap' },
  { key: 'training_capacity', label: 'Training capacity', shortLabel: 'Training capacity' },
  { key: 'training_speed_percent', label: 'Training speed', shortLabel: 'Training speed', format: 'percent' },
  { key: 'rally_capacity', label: 'Rally capacity', shortLabel: 'Rally capacity' },
  { key: 'troop_deploy_capacity', label: 'Troop deployment capacity', shortLabel: 'Troop deployment' },
  { key: 'reinforcement_capacity', label: 'Reinforcement capacity', shortLabel: 'Reinforcement capacity' },
  { key: 'ally_help_count', label: 'Alliance Help count', shortLabel: 'Alliance Helps' },
  { key: 'ally_help_seconds', label: 'Time reduced per Alliance Help', shortLabel: 'Help time reduction', format: 'seconds' },
  { key: 'protected_resource_capacity', label: 'Protected resource capacity', shortLabel: 'Protected resources' },
  { key: 'infirmary_capacity', label: 'Infirmary capacity', shortLabel: 'Infirmary capacity' },
]

const text = (value: unknown, fallback = '') => typeof value === 'string' ? value : fallback
const number = (value: unknown) => {
  if (value === null || value === undefined || value === '') return null
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}
const isPopulated = (value: unknown) => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value))
const titleCase = (value: string) => value.replace(/(^|[-_\s])\w/g, (match) => match.toUpperCase()).replace(/[-_]/g, ' ')

function normalise(records: unknown[]): Building[] {
  const map = new Map<string, Building>()
  records.forEach((raw) => {
    if (!raw || typeof raw !== 'object') return
    const r = raw as Record<string, unknown>
    const key = text(r.building_key, text(r.key))
    const name = text(r.building_name, text(r.name))
    if (!key || !name) return
    const current = map.get(key) ?? {
      key,
      name,
      category: text(r.category, 'Buildings'),
      description: text(r.description, 'Verified building progression and upgrade effects.'),
      maxLevel: number(r.standard_max_level ?? r.max_level),
      truegold: r.truegold_supported === true || r.truegold === true,
      progression: [],
      source: text(r.source_url, text(r.source)),
      verificationNote: text(r.verification_note, text(r.note)),
    }
    if (Array.isArray(r.progression)) current.progression.push(...r.progression.filter((row): row is ProgressionRow => Boolean(row) && typeof row === 'object'))
    else if (r.record_id || r.level_label || r.level || r.base_level) current.progression.push(r)
    map.set(key, current)
  })
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
}

function metricValue(metric: EffectMetric, row: ProgressionRow) {
  const value = row[metric.key]
  if (!isPopulated(value)) return '—'
  if (metric.format === 'percent') return formatPercent(value)
  if (metric.format === 'seconds') return formatDuration(value)
  return formatNumber(value)
}

function latestMetricValue(metric: EffectMetric, progression: ProgressionRow[]) {
  for (let index = progression.length - 1; index >= 0; index -= 1) {
    if (isPopulated(progression[index]?.[metric.key])) return metricValue(metric, progression[index]!)
  }
  return '—'
}

function latestVerifiedDate(progression: ProgressionRow[]) {
  const dates = progression.map((row) => text(row.verified_on)).filter(Boolean).sort()
  return dates.length ? dates[dates.length - 1] : ''
}

export default function BuildingsBrowserPage() {
  const { buildingKey } = useParams<{ buildingKey?: string }>()
  const [buildings, setBuildings] = useState<Building[]>([])
  const [metadata, setMetadata] = useState<DatasetSourceMetadata | null>(null)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    fetchDataset('buildings', controller.signal)
      .then((result) => {
        setBuildings(normalise(result.records))
        setMetadata(result.metadata)
        setError('')
      })
      .catch((value: unknown) => {
        if (value instanceof DOMException && value.name === 'AbortError') return
        setError(value instanceof Error ? value.message : 'Buildings are temporarily unavailable.')
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [])

  const categories = useMemo(() => [...new Set(buildings.map((building) => building.category))].sort(), [buildings])
  const visible = useMemo(() => buildings.filter((building) => {
    const matchesQuery = `${building.name} ${building.category} ${building.description}`.toLowerCase().includes(query.toLowerCase())
    return matchesQuery && (category === 'all' || building.category === category)
  }), [buildings, query, category])
  const current = buildingKey ? buildings.find((building) => building.key === buildingKey) : null

  if (buildingKey) return <BuildingDetail key={current?.key ?? buildingKey} building={current} error={error} loading={loading} metadata={metadata} />

  return <main className="buildings-browser">
    <section className="buildings-hero">
      <div>
        <p className="eyebrow">Kingshot Companion · published data</p>
        <h1>Buildings</h1>
        <p>Explore every published Forge building with its role, upgrade requirements, resource costs, Truegold stages, power and building-specific effects.</p>
      </div>
      <div className="buildings-hero__summary" aria-label="Buildings dataset summary">
        <span><strong>{formatNumber(buildings.length || null)}</strong> buildings</span>
        <span><strong>{formatNumber(buildings.reduce((total, building) => total + building.progression.length, 0) || null)}</strong> progression records</span>
        <span><strong>Published</strong> owner-approved data</span>
      </div>
      <div className="buildings-filters">
        <label><span>Search buildings</span><input aria-label="Search buildings" placeholder="Search by name, category or purpose" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        <label><span>Category</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All categories</option>{categories.map((value) => <option value={value} key={value}>{titleCase(value)}</option>)}</select></label>
      </div>
    </section>

    {error && <p className="buildings-state buildings-state--error">{error}</p>}
    {loading && <p className="buildings-state">Loading published Buildings…</p>}

    {!loading && !error && <section className="building-directory" aria-label="Published Kingshot buildings">
      {visible.map((building) => {
        const metrics = EFFECT_METRICS.filter((metric) => building.progression.some((row) => isPopulated(row[metric.key])))
        return <Link className="building-card" to={`/buildings/${building.key}`} key={building.key}>
          <div className="building-card__image"><BuildingIllustration buildingKey={building.key} name={building.name} compact decorative /></div>
          <div className="building-card__body">
            <span className="building-card__category">{titleCase(building.category)}</span>
            <h2>{building.name}</h2>
            <p>{building.description}</p>
            {metrics.length > 0 && <div className="building-card__effects" aria-label={`${building.name} tracked effects`}><span>{metrics.slice(0, 2).map((metric) => metric.shortLabel).join(' · ')}</span>{metrics.length > 2 && <small>+{metrics.length - 2} more</small>}</div>}
            <footer><span><strong>{formatNumber(building.progression.length || null)}</strong> records</span><span><strong>{formatNumber(building.maxLevel)}</strong> max level</span><em>{building.truegold ? 'Truegold' : 'Standard'}</em></footer>
          </div>
        </Link>
      })}
    </section>}

    {!loading && !error && visible.length === 0 && <p className="buildings-state">No published building matches those filters.</p>}
    {metadata?.updated && <p className="buildings-dataset-note">Published dataset updated {new Date(metadata.updated).toLocaleDateString('en-GB')}. Resource costs are raw base values before player, alliance or kingdom bonuses.</p>}
  </main>
}

function BuildingDetail({ building, error, loading, metadata }: { building: Building | null | undefined; error: string; loading: boolean; metadata: DatasetSourceMetadata | null }) {
  const [phase, setPhase] = useState<PhaseFilter>('standard')
  if (loading) return <main className="buildings-browser"><p className="buildings-state">Loading published building details…</p></main>
  if (!building) return <main className="buildings-browser"><p className="buildings-state">{error || 'Building not found in the published projection.'}</p><Link className="buildings-back" to="/buildings">← Back to Buildings</Link></main>

  const progression = sortBuildingProgression(building.progression)
  const standardRows = progression.filter((row) => row.progression_phase !== 'truegold')
  const truegoldRows = progression.filter((row) => row.progression_phase === 'truegold')
  const baseState = standardRows.filter((row) => number(row.base_level) === 0)
  const upgradeRows = progression.filter((row) => !baseState.includes(row))
  const availableEffects = EFFECT_METRICS.filter((metric) => progression.some((row) => isPopulated(row[metric.key])))
  const activeRows = phase === 'truegold' && truegoldRows.length ? truegoldRows : standardRows
  const activeEffects = availableEffects.filter((metric) => activeRows.some((row) => isPopulated(row[metric.key])))
  const showTruegold = activeRows.some((row) => isPopulated(row.truegold))
  const showTemperedTruegold = activeRows.some((row) => isPopulated(row.tempered_truegold))
  const verifiedDate = latestVerifiedDate(progression)

  return <main className="buildings-browser">
    <Link className="buildings-back" to="/buildings">← Buildings directory</Link>

    <section className="building-detail-hero">
      <div className="building-detail-hero__art"><BuildingIllustration buildingKey={building.key} name={building.name} /></div>
      <div className="building-detail-hero__content">
        <p className="eyebrow">{titleCase(building.category)} building</p>
        <h1>{building.name}</h1>
        <p>{building.description}</p>
        <div className="building-facts">
          <span><strong>{formatNumber(building.maxLevel)}</strong> standard max level</span>
          <span><strong>{building.truegold ? 'Supported' : 'Not supported'}</strong> Truegold</span>
          <span><strong>{formatNumber(progression.length)}</strong> published records</span>
          <span><strong>{verifiedDate ? new Date(verifiedDate).toLocaleDateString('en-GB') : 'Published'}</strong> last verified</span>
        </div>
      </div>
    </section>

    <section className="building-overview-grid">
      <article>
        <p className="eyebrow">Building purpose</p>
        <h2>What it does</h2>
        <p>{building.description}</p>
        <p className="building-overview-note">Forge shows only fields present in the current owner-approved publication. Missing effects are not guessed.</p>
      </article>
      <article>
        <p className="eyebrow">Latest published values</p>
        <h2>Key effects</h2>
        {availableEffects.length > 0 ? <dl className="building-effects-list">{availableEffects.map((metric) => <div key={metric.key}><dt>{metric.shortLabel}</dt><dd>{latestMetricValue(metric, progression)}</dd></div>)}</dl> : <p className="building-overview-note">No building-specific effect values are present in the current publication. Costs, time and prerequisites remain available below.</p>}
      </article>
      <article>
        <p className="eyebrow">Trust and provenance</p>
        <h2>Data quality</h2>
        <dl className="building-source-list">
          <div><dt>Status</dt><dd>Published and owner approved</dd></div>
          <div><dt>Verified</dt><dd>{verifiedDate ? new Date(verifiedDate).toLocaleDateString('en-GB') : 'See source record'}</dd></div>
          <div><dt>Source</dt><dd>{building.source ? <a href={building.source} target="_blank" rel="noreferrer">Open source reference ↗</a> : 'Recorded in publication'}</dd></div>
        </dl>
        {building.verificationNote && <p className="building-overview-note">{building.verificationNote}</p>}
      </article>
    </section>

    <section className="building-progression-panel">
      <div className="building-section-heading">
        <div><p className="eyebrow">Published progression</p><h2>Upgrade requirements and effects</h2></div>
        <span className="building-row-summary">{formatNumber(upgradeRows.length)} upgrade rows</span>
      </div>

      {truegoldRows.length > 0 && <div className="building-phase-tabs" role="tablist" aria-label="Progression phase">
        <button type="button" role="tab" aria-selected={phase === 'standard'} className={phase === 'standard' ? 'is-active' : undefined} onClick={() => setPhase('standard')}>Standard levels <span>{formatNumber(standardRows.length)}</span></button>
        <button type="button" role="tab" aria-selected={phase === 'truegold'} className={phase === 'truegold' ? 'is-active' : undefined} onClick={() => setPhase('truegold')}>Truegold stages <span>{formatNumber(truegoldRows.length)}</span></button>
      </div>}

      <div className="building-cost-warning"><strong>Raw base values:</strong> resource costs and times do not include personal, alliance or kingdom bonuses.</div>

      {activeRows.length ? <div className="building-table-scroll"><table className="building-progression-table"><caption className="sr-only">{building.name} {phase} published progression</caption><thead><tr><th scope="col">Level / Stage</th><th scope="col">Bread</th><th scope="col">Wood</th><th scope="col">Stone</th><th scope="col">Iron</th>{showTruegold && <th scope="col">Truegold</th>}{showTemperedTruegold && <th scope="col">Tempered Truegold</th>}<th scope="col">Time</th><th scope="col">Power</th>{activeEffects.map((metric) => <th scope="col" key={metric.key}>{metric.label}</th>)}<th scope="col">Requirements</th></tr></thead><tbody>{activeRows.map((row, index) => <tr id={`row-${index + 1}`} key={text(row.record_id, String(index))} className={row.progression_phase === 'truegold' ? 'is-truegold' : baseState.includes(row) ? 'is-base-state' : undefined}><th scope="row"><span className="building-row-label">{getBuildingProgressionLabel(row)}</span>{row.progression_phase === 'truegold' && <small>Truegold stage</small>}{baseState.includes(row) && <small>Base state</small>}</th><td data-label="Bread">{formatNumber(row.bread)}</td><td data-label="Wood">{formatNumber(row.wood)}</td><td data-label="Stone">{formatNumber(row.stone)}</td><td data-label="Iron">{formatNumber(row.iron)}</td>{showTruegold && <td data-label="Truegold">{formatNumber(row.truegold)}</td>}{showTemperedTruegold && <td data-label="Tempered Truegold">{formatNumber(row.tempered_truegold)}</td>}<td data-label="Time">{row.upgrade_time_display ? text(row.upgrade_time_display) : formatDuration(row.upgrade_time_seconds)}</td><td data-label="Power">{formatNumber(row.power)}</td>{activeEffects.map((metric) => <td data-label={metric.label} key={metric.key}>{metricValue(metric, row)}</td>)}<td data-label="Requirements">{text(row.requirements_text, '—')}</td></tr>)}</tbody></table></div> : <p className="buildings-state">Progression is not available in the published projection.</p>}
      <p className="building-readonly-note">This table is a read-only view of the current owner-approved Buildings publication. It does not consume drafts or staged import data.</p>
    </section>

    <section className="building-detail-footer">
      <article><p className="eyebrow">Publication summary</p><h2>Coverage</h2><dl><div><dt>Standard records</dt><dd>{formatNumber(standardRows.length)}</dd></div><div><dt>Truegold stages</dt><dd>{formatNumber(truegoldRows.length)}</dd></div><div><dt>Mapped prerequisites</dt><dd>{formatNumber(progression.filter((row) => text(row.requirements_text)).length)}</dd></div><div><dt>Tracked effects</dt><dd>{formatNumber(availableEffects.length)}</dd></div></dl></article>
      <article><p className="eyebrow">About the artwork</p><h2>Forge illustration</h2><p>The building artwork on this page is an original Kingshot Forge companion illustration. It helps identify the building and is not official Kingshot game art.</p>{metadata?.updated && <p className="building-overview-note">Dataset updated {new Date(metadata.updated).toLocaleDateString('en-GB')}.</p>}</article>
    </section>

    <ForgeConnections dataset="buildings" id={building.key} />
  </main>
}
