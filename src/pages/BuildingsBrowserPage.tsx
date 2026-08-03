import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import BuildingArtwork from '../components/buildings/BuildingArtwork'
import { fetchDataset, type DatasetSourceMetadata } from '../features/admin/dataEngineApi'
import BuildingPlanner from '../features/buildings/BuildingPlanner.tsx'
import {
  BUILDING_EFFECT_METRICS,
  isPopulatedNumber,
  normaliseBuildings,
  numberValue,
  textValue,
  titleCase,
  type BuildingCompanionRecord,
  type BuildingEffectMetric,
  type BuildingProgressionRow,
} from '../features/buildings/buildingData'
import { ForgeConnections } from '../features/search/SearchExperience'
import { formatDuration, formatNumber, formatPercent } from '../utils/formatters'
import {
  getBuildingProgressionLabel,
  sortBuildingProgression,
} from '../../shared/data-pipeline/buildingsProgressionOrdering'
import '../styles/buildingsBrowser.css'
import '../styles/buildingsProgressionPolish.css'

type PhaseFilter = 'standard' | 'truegold'

function metricValue(
  metric: BuildingEffectMetric,
  row: BuildingProgressionRow,
): string {
  const value = row[metric.key]
  if (!isPopulatedNumber(value)) return '—'
  if (metric.format === 'percent') return formatPercent(value)
  if (metric.format === 'seconds') return formatDuration(value)
  return formatNumber(value)
}

function latestMetricValue(
  metric: BuildingEffectMetric,
  progression: BuildingProgressionRow[],
): string {
  for (let index = progression.length - 1; index >= 0; index -= 1) {
    const row = progression[index]
    if (row && isPopulatedNumber(row[metric.key])) return metricValue(metric, row)
  }
  return '—'
}

function latestVerifiedDate(progression: BuildingProgressionRow[]): string {
  const dates = progression
    .map((row) => textValue(row.verified_on))
    .filter(Boolean)
    .sort()
  return dates.at(-1) ?? ''
}

function BuildingDirectoryCard({ building }: { building: BuildingCompanionRecord }) {
  const progression = sortBuildingProgression(building.progression)
  const effectMetrics = BUILDING_EFFECT_METRICS.filter((metric) =>
    progression.some((row) => isPopulatedNumber(row[metric.key])),
  )
  const truegoldRows = progression.filter((row) => row.progression_phase === 'truegold')
  const transitionRows = progression.filter((row) => row.progression_phase === 'pre_truegold')

  return <article className="building-compendium-card">
    <Link className="building-compendium-card__art" to={`/buildings/${building.key}`} aria-label={`Open ${building.name}`}>
      <BuildingArtwork building={building} compact decorative />
    </Link>

    <div className="building-compendium-card__content">
      <div className="building-compendium-card__heading">
        <div>
          <span>{titleCase(building.category)}</span>
          <h2><Link to={`/buildings/${building.key}`}>{building.name}</Link></h2>
        </div>
        {building.truegold && <em>Truegold</em>}
      </div>

      <p>{building.description}</p>

      <dl className="building-compendium-card__facts">
        <div><dt>Standard max</dt><dd>{formatNumber(building.maxLevel)}</dd></div>
        <div><dt>Transition steps</dt><dd>{formatNumber(transitionRows.length)}</dd></div>
        <div><dt>Truegold stages</dt><dd>{formatNumber(truegoldRows.length)}</dd></div>
      </dl>

      {effectMetrics.length > 0 && <p className="building-compendium-card__effects">
        <strong>Tracked effects:</strong> {effectMetrics.slice(0, 3).map((metric) => metric.shortLabel).join(' · ')}
        {effectMetrics.length > 3 ? ` · +${effectMetrics.length - 3} more` : ''}
      </p>}

      <div className="building-compendium-card__actions">
        <Link className="button button--secondary" to={`/buildings/${building.key}`}>View details</Link>
        <Link className="button button--primary" to={`/calculators/buildings?building=${building.key}`}>Plan upgrades</Link>
      </div>
    </div>
  </article>
}

export default function BuildingsBrowserPage() {
  const { buildingKey } = useParams<{ buildingKey?: string }>()
  const [buildings, setBuildings] = useState<BuildingCompanionRecord[]>([])
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
        setBuildings(normaliseBuildings(result.records))
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

  const categories = useMemo(
    () => [...new Set(buildings.map((building) => building.category))].sort(),
    [buildings],
  )
  const visible = useMemo(
    () => buildings.filter((building) => {
      const matchesQuery = `${building.name} ${building.category} ${building.description}`
        .toLowerCase()
        .includes(query.trim().toLowerCase())
      return matchesQuery && (category === 'all' || building.category === category)
    }),
    [buildings, category, query],
  )
  const current = buildingKey
    ? buildings.find((building) => building.key === buildingKey)
    : null

  if (buildingKey) {
    return <BuildingDetail
      key={current?.key ?? buildingKey}
      building={current}
      buildings={buildings}
      error={error}
      loading={loading}
      metadata={metadata}
    />
  }

  return <main className="buildings-browser">
    <header className="buildings-compendium-hero">
      <div>
        <p className="eyebrow">Kingshot Companion · published data</p>
        <h1>Buildings compendium</h1>
        <p>Understand each building, plan upgrades and inspect the owner-approved progression behind every total.</p>
      </div>
      <div className="buildings-compendium-hero__actions">
        <Link className="button button--primary" to="/calculators/buildings">Open Building Planner</Link>
        <span>{formatNumber(buildings.length || null)} buildings · {formatNumber(buildings.reduce((total, building) => total + building.progression.length, 0) || null)} published rows</span>
      </div>
    </header>

    <section className="buildings-compendium-controls" aria-label="Filter Buildings directory">
      <label>
        <span>Search</span>
        <input
          aria-label="Search buildings"
          placeholder="Search by building, purpose or category"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <div className="buildings-category-chips" aria-label="Building categories">
        <button type="button" className={category === 'all' ? 'is-active' : undefined} onClick={() => setCategory('all')}>All</button>
        {categories.map((value) => <button type="button" className={category === value ? 'is-active' : undefined} onClick={() => setCategory(value)} key={value}>{titleCase(value)}</button>)}
      </div>
    </section>

    {error && <p className="buildings-state buildings-state--error">{error}</p>}
    {loading && <p className="buildings-state">Loading published Buildings…</p>}

    {!loading && !error && <section className="building-compendium-list" aria-label="Published Kingshot buildings">
      {visible.map((building) => <BuildingDirectoryCard building={building} key={building.key} />)}
    </section>}

    {!loading && !error && visible.length === 0 && <p className="buildings-state">No published building matches those filters.</p>}

    {metadata?.updated && <p className="buildings-dataset-note">Published dataset updated {new Date(metadata.updated).toLocaleDateString('en-GB')}. Resource costs and times are raw published values before bonuses entered in the planner.</p>}
  </main>
}

function BuildingDetail({
  building,
  buildings,
  error,
  loading,
  metadata,
}: {
  building: BuildingCompanionRecord | null | undefined
  buildings: BuildingCompanionRecord[]
  error: string
  loading: boolean
  metadata: DatasetSourceMetadata | null
}) {
  const [phase, setPhase] = useState<PhaseFilter>('standard')

  if (loading) {
    return <main className="buildings-browser"><p className="buildings-state">Loading published building details…</p></main>
  }

  if (!building) {
    return <main className="buildings-browser">
      <p className="buildings-state">{error || 'Building not found in the published projection.'}</p>
      <Link className="buildings-back" to="/buildings">← Back to Buildings</Link>
    </main>
  }

  const progression = sortBuildingProgression(building.progression)
  const standardRows = progression.filter((row) => row.progression_phase !== 'truegold')
  const truegoldRows = progression.filter((row) => row.progression_phase === 'truegold')
  const transitionRows = progression.filter((row) => row.progression_phase === 'pre_truegold')
  const baseState = standardRows.filter((row) => numberValue(row.base_level) === 0)
  const upgradeRows = progression.filter((row) => !baseState.includes(row))
  const availableEffects = BUILDING_EFFECT_METRICS.filter((metric) =>
    progression.some((row) => isPopulatedNumber(row[metric.key])),
  )
  const activeRows = phase === 'truegold' && truegoldRows.length > 0
    ? truegoldRows
    : standardRows
  const activeEffects = availableEffects.filter((metric) =>
    activeRows.some((row) => isPopulatedNumber(row[metric.key])),
  )
  const showTruegold = activeRows.some((row) => isPopulatedNumber(row.truegold))
  const showTemperedTruegold = activeRows.some((row) => isPopulatedNumber(row.tempered_truegold))
  const verifiedDate = latestVerifiedDate(progression)

  return <main className="buildings-browser">
    <Link className="buildings-back" to="/buildings">← Buildings compendium</Link>

    <header className="building-profile-hero">
      <div className="building-profile-hero__art"><BuildingArtwork building={building} /></div>
      <div className="building-profile-hero__content">
        <p className="eyebrow">{titleCase(building.category)} building</p>
        <h1>{building.name}</h1>
        <p>{building.description}</p>
        <div className="building-profile-hero__facts">
          <span><strong>{formatNumber(building.maxLevel)}</strong> standard max</span>
          <span><strong>{formatNumber(transitionRows.length)}</strong> transition steps</span>
          <span><strong>{formatNumber(truegoldRows.length)}</strong> Truegold stages</span>
        </div>
        <div className="building-profile-hero__actions">
          <a className="button button--primary" href="#upgrade-planner">Plan this upgrade</a>
          <a className="button button--secondary" href="#progression">View progression</a>
        </div>
      </div>
    </header>

    <nav className="building-profile-nav" aria-label={`${building.name} page sections`}>
      <a href="#overview">Overview</a>
      <a href="#upgrade-planner">Calculator</a>
      <a href="#progression">Progression</a>
      <a href="#sources">Sources</a>
    </nav>

    <section className="building-profile-overview" id="overview">
      <article>
        <p className="eyebrow">At a glance</p>
        <h2>Building effects</h2>
        {availableEffects.length > 0
          ? <dl className="building-effects-list">{availableEffects.map((metric) => <div key={metric.key}><dt>{metric.shortLabel}</dt><dd>{latestMetricValue(metric, progression)}</dd></div>)}</dl>
          : <p className="building-overview-note">No building-specific effect values are present in the current publication. Upgrade costs, time and Prerequisites remain available.</p>}
      </article>

      <article>
        <p className="eyebrow">Progression coverage</p>
        <h2>What Forge holds</h2>
        <dl className="building-effects-list">
          <div><dt>Published upgrade rows</dt><dd>{formatNumber(upgradeRows.length)}</dd></div>
          <div><dt>Standard and transition</dt><dd>{formatNumber(standardRows.length)}</dd></div>
          <div><dt>Truegold stages</dt><dd>{formatNumber(truegoldRows.length)}</dd></div>
          <div><dt>Mapped Prerequisites</dt><dd>{formatNumber(progression.filter((row) => textValue(row.requirements_text)).length)}</dd></div>
        </dl>
      </article>
    </section>

    <BuildingPlanner buildings={buildings} initialBuildingKey={building.key} embedded />

    <section className="building-progression-panel" id="progression">
      <div className="building-section-heading">
        <div><p className="eyebrow">Published Progression</p><h2>Level-by-level reference</h2></div>
        <span className="building-row-summary">{formatNumber(upgradeRows.length)} upgrade rows</span>
      </div>

      <p className="building-progression-intro">Use the calculator above for totals. This reference table shows the exact published values and Prerequisites behind each step.</p>

      {truegoldRows.length > 0 && <div className="building-phase-tabs" role="tablist" aria-label="Progression phase">
        <button type="button" role="tab" aria-selected={phase === 'standard'} className={phase === 'standard' ? 'is-active' : undefined} onClick={() => setPhase('standard')}>Standard & transition <span>{formatNumber(standardRows.length)}</span></button>
        <button type="button" role="tab" aria-selected={phase === 'truegold'} className={phase === 'truegold' ? 'is-active' : undefined} onClick={() => setPhase('truegold')}>Truegold stages <span>{formatNumber(truegoldRows.length)}</span></button>
      </div>}

      <div className="building-cost-warning"><strong>Raw base values:</strong> use the planner to apply your construction speed and basic-resource reduction.</div>

      {activeRows.length > 0
        ? <div className="building-table-scroll"><table className="building-progression-table">
          <caption className="sr-only">{building.name} {phase} published Progression</caption>
          <thead><tr><th scope="col">Level / Stage</th><th scope="col">Bread</th><th scope="col">Wood</th><th scope="col">Stone</th><th scope="col">Iron</th>{showTruegold && <th scope="col">Truegold</th>}{showTemperedTruegold && <th scope="col">Tempered Truegold</th>}<th scope="col">Time</th><th scope="col">Power</th>{activeEffects.map((metric) => <th scope="col" key={metric.key}>{metric.label}</th>)}<th scope="col">Prerequisites</th></tr></thead>
          <tbody>{activeRows.map((row, index) => <tr id={`row-${index + 1}`} key={textValue(row.record_id, String(index))} className={row.progression_phase === 'truegold' ? 'is-truegold' : row.progression_phase === 'pre_truegold' ? 'is-transition' : baseState.includes(row) ? 'is-base-state' : undefined}>
            <th scope="row"><span className="building-row-label">{getBuildingProgressionLabel(row)}</span>{row.progression_phase === 'truegold' && <small>Truegold stage</small>}{row.progression_phase === 'pre_truegold' && <small>Transition step</small>}{baseState.includes(row) && <small>Base state</small>}</th>
            <td data-label="Bread">{formatNumber(row.bread)}</td>
            <td data-label="Wood">{formatNumber(row.wood)}</td>
            <td data-label="Stone">{formatNumber(row.stone)}</td>
            <td data-label="Iron">{formatNumber(row.iron)}</td>
            {showTruegold && <td data-label="Truegold">{formatNumber(row.truegold)}</td>}
            {showTemperedTruegold && <td data-label="Tempered Truegold">{formatNumber(row.tempered_truegold)}</td>}
            <td data-label="Time">{row.upgrade_time_display ? textValue(row.upgrade_time_display) : formatDuration(row.upgrade_time_seconds)}</td>
            <td data-label="Power">{formatNumber(row.power)}</td>
            {activeEffects.map((metric) => <td data-label={metric.label} key={metric.key}>{metricValue(metric, row)}</td>)}
            <td data-label="Prerequisites">{textValue(row.requirements_text, '—')}</td>
          </tr>)}</tbody>
        </table></div>
        : <p className="buildings-state">Progression is not available in the published projection.</p>}
    </section>

    <section className="building-profile-sources" id="sources">
      <div>
        <p className="eyebrow">Trust and provenance</p>
        <h2>Published source record</h2>
        <dl>
          <div><dt>Status</dt><dd>Published and owner approved</dd></div>
          <div><dt>Last verified</dt><dd>{verifiedDate ? new Date(verifiedDate).toLocaleDateString('en-GB') : 'See source record'}</dd></div>
          <div><dt>Data source</dt><dd>{building.source ? <a href={building.source} target="_blank" rel="noreferrer">Open source reference ↗</a> : 'Recorded in publication'}</dd></div>
          {building.imageUrl && <div><dt>Image credit</dt><dd>{building.imageCredit || 'Not required'}</dd></div>}
          {building.imageUrl && <div><dt>Image permission</dt><dd>{building.imageLicense || 'Not recorded'}</dd></div>}
        </dl>
      </div>
      <div>
        <p className="eyebrow">Publication notes</p>
        <h2>Data boundaries</h2>
        <p>{building.verificationNote || 'Forge displays only values present in the current owner-approved publication. Missing effects are not guessed.'}</p>
        {metadata?.updated && <p className="building-overview-note">Dataset updated {new Date(metadata.updated).toLocaleDateString('en-GB')}.</p>}
      </div>
    </section>

    <ForgeConnections dataset="buildings" id={building.key} />
  </main>
}
