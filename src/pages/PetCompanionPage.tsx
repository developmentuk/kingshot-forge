import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import './PetCompanionPage.css'

type PetMedia = {
  status: 'available' | 'pending'
  path: string | null
  filename: string | null
  originalFilename: string | null
  rights: string | null
}

type PetSkillProgressionRow = {
  level: number
  effect: string
  description?: string
}

type PetLevelRow = {
  level: number
  petFood: number
  growthManual: number | null
  nutrientPotion: number | null
  promotionMedallion: number | null
}

type Pet = {
  key: string
  name: string
  generation: number
  maxLevel: number
  unlock: {
    label: string
    approxDays: number | null
    confidence: string
  }
  summary: string | null
  skill: {
    name: string
    description: string
    cooldown: string | null
    effect: string | null
    progression: PetSkillProgressionRow[]
  }
  progressionCurve: string
  notes: string[]
  media: PetMedia
}

type ProgressionCurve = {
  key: string
  maxLevel: number
  levelProgression: PetLevelRow[]
  advancementMilestones: PetLevelRow[]
  sourceAdvancementSummary: Record<string, string | null>[]
  sourceRepresentative: string
}

type RefinementThreshold = {
  pets: string[]
  gray: string
  green: string
  blue: string
  purple: string
  gold: string
  confidence: string
}

type PetDataset = {
  _meta: {
    schemaVersion: string
    datasetId: string
    title: string
    description: string
    source: {
      filename: string
      basis: string
      received: string
      terminology: string
    }
    media: {
      archive: string
      received: string
      available: number
      pending: string[]
      rightsStatement: string
    }
    coverage: {
      petCount: number
      generations: number[]
      minMaxLevel: number
      maxMaxLevel: number
    }
  }
  progressionCurves: Record<string, ProgressionCurve>
  pets: Pet[]
  refinement: {
    stats: string[]
    rarityOrder: string[]
    thresholds: RefinementThreshold[]
    guidance: string[]
    confidence: string
  }
  strategy: {
    f2pPriority: string[]
    spenderPriority: string[]
    sourceNotes: string[]
    confidence: string
  }
}

function isPetDataset(value: unknown): value is PetDataset {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<PetDataset>
  return candidate._meta?.datasetId === 'kingshot-pets'
    && candidate._meta?.schemaVersion === '1.0.0'
    && Array.isArray(candidate.pets)
    && candidate.pets.length === 14
    && typeof candidate.progressionCurves === 'object'
    && candidate.progressionCurves !== null
}

function formatNumber(value: number | null) {
  return value === null ? '—' : new Intl.NumberFormat('en-GB').format(value)
}

function PetArtwork({ pet, compact = false }: { pet: Pet; compact?: boolean }) {
  return (
    <div className={`pet-companion-art${compact ? ' pet-companion-art--compact' : ''}`}>
      {pet.media.path
        ? <img src={pet.media.path} alt={`${pet.name} pet artwork`} />
        : <div className="pet-companion-art__placeholder"><span aria-hidden="true">🐾</span><small>Artwork pending</small></div>}
    </div>
  )
}

function PetCatalogue({ dataset }: { dataset: PetDataset }) {
  const [query, setQuery] = useState('')
  const [generation, setGeneration] = useState('all')

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase()
    return dataset.pets.filter((pet) => {
      if (generation !== 'all' && pet.generation !== Number(generation)) return false
      if (!normalized) return true
      return [
        pet.name,
        pet.skill.name,
        pet.skill.effect ?? '',
        pet.summary ?? '',
        `generation ${pet.generation}`,
      ].join(' ').toLocaleLowerCase().includes(normalized)
    })
  }, [dataset.pets, generation, query])

  return (
    <main className="pet-companion-page">
      <section className="pet-companion-heading">
        <div>
          <p className="eyebrow">Kingshot Forge Companion</p>
          <h1>Pets</h1>
          <p>Browse all 14 pets in the supplied Generations 1–7 source, with owner-cleared artwork, skills, level costs and advancement milestones.</p>
        </div>
        <div className="pet-companion-count">
          <strong>{dataset.pets.length}</strong>
          <span>published pet identities</span>
        </div>
      </section>

      <section className="pet-companion-source-banner">
        <div>
          <strong>Source-governed foundation</strong>
          <p>Progression values and terminology come from the supplied <em>{dataset._meta.source.filename}</em>. Unlock timings remain approximate community observations, not fixed official timers.</p>
        </div>
        <Link to="/guides/kingshot-pet-system-refinement-guide">Read the Pet System guide</Link>
      </section>

      <section className="pet-companion-toolbar" aria-label="Pet catalogue filters">
        <label>
          <span>Search pets</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Lion, Rally Capacity, Stamina…" />
        </label>
        <label>
          <span>Generation</span>
          <select value={generation} onChange={(event) => setGeneration(event.target.value)}>
            <option value="all">All generations</option>
            {dataset._meta.coverage.generations.map((value) => <option key={value} value={value}>Generation {value}</option>)}
          </select>
        </label>
        <span>{filtered.length} shown</span>
      </section>

      <section className="pet-companion-grid" aria-label="Pet catalogue">
        {filtered.map((pet) => (
          <Link key={pet.key} to={`/companion/pets/${pet.key}`} className="pet-companion-card">
            <PetArtwork pet={pet} compact />
            <div className="pet-companion-card__body">
              <div className="pet-companion-card__meta">
                <span>Generation {pet.generation}</span>
                <span>Max Lv.{pet.maxLevel}</span>
              </div>
              <h2>{pet.name}</h2>
              <p className="pet-companion-card__skill">{pet.skill.name}</p>
              <p>{pet.skill.effect ?? pet.skill.description}</p>
              <div className="pet-companion-card__footer">
                <span>{pet.unlock.label}</span>
                <span>{pet.media.status === 'available' ? 'Artwork available' : 'Artwork pending'}</span>
              </div>
            </div>
          </Link>
        ))}
      </section>
    </main>
  )
}

function PetDetail({ dataset, pet }: { dataset: PetDataset; pet: Pet }) {
  const curve = dataset.progressionCurves[pet.progressionCurve]
  const threshold = dataset.refinement.thresholds.find((entry) => entry.pets.includes(pet.name))
  const f2pRank = dataset.strategy.f2pPriority.indexOf(pet.name)
  const spenderRank = dataset.strategy.spenderPriority.indexOf(pet.name)

  if (!curve) {
    return <main className="pet-companion-page"><div className="pet-companion-state pet-companion-state--error">Published progression curve unavailable.</div></main>
  }

  return (
    <main className="pet-companion-page pet-companion-page--detail">
      <nav className="pet-companion-breadcrumbs" aria-label="Breadcrumb">
        <Link to="/companion">Companion</Link><span aria-hidden="true">›</span>
        <Link to="/companion/pets">Pets</Link><span aria-hidden="true">›</span>
        <span>{pet.name}</span>
      </nav>

      <section className="pet-companion-hero">
        <div className="pet-companion-hero__art">
          <PetArtwork pet={pet} />
          <span className="pet-companion-generation">Generation {pet.generation}</span>
        </div>
        <div className="pet-companion-hero__content">
          <p className="eyebrow">Kingshot Pet Companion</p>
          <h1>{pet.name}</h1>
          <p className="pet-companion-role">{pet.skill.name}</p>
          <p className="pet-companion-lead">{pet.summary ?? pet.skill.description}</p>
          <div className="pet-companion-tags">
            <span>Generation {pet.generation}</span>
            <span>Max Lv.{pet.maxLevel}</span>
            <span>{pet.unlock.label}</span>
            <span>{pet.media.status === 'available' ? 'Owner-cleared artwork' : 'Artwork pending'}</span>
          </div>
        </div>
      </section>

      <section className="pet-companion-summary">
        <article className="pet-companion-summary__primary">
          <p className="eyebrow">Pet skill</p>
          <h2>{pet.skill.name}</h2>
          <p>{pet.skill.effect ?? pet.skill.description}</p>
        </article>
        <article><span>Cooldown</span><strong>{pet.skill.cooldown ?? 'Not recorded'}</strong></article>
        <article><span>Max level</span><strong>Lv.{pet.maxLevel}</strong></article>
        <article><span>Unlock observation</span><strong>{pet.unlock.label}</strong></article>
      </section>

      <section className="pet-companion-layout">
        <div className="pet-companion-main-column">
          <section className="pet-companion-panel">
            <div className="pet-companion-section-heading">
              <div><p className="eyebrow">Skill progression</p><h2>{pet.skill.name}</h2></div>
              <p>{pet.skill.description}</p>
            </div>
            <div className="pet-companion-table-wrap">
              <table className="pet-companion-table">
                <thead><tr><th>Skill level</th><th>Effect</th><th>Description</th></tr></thead>
                <tbody>{pet.skill.progression.map((row) => <tr key={row.level}><td>{row.level}</td><td>{row.effect}</td><td>{row.description ?? '—'}</td></tr>)}</tbody>
              </table>
            </div>
          </section>

          <section className="pet-companion-panel">
            <div className="pet-companion-section-heading">
              <div><p className="eyebrow">Advancement milestones</p><h2>Every 10 levels</h2></div>
              <p>These milestone requirements are resolved from the exact per-level source rows for the shared Lv.{curve.maxLevel} progression curve.</p>
            </div>
            <div className="pet-companion-table-wrap">
              <table className="pet-companion-table">
                <thead><tr><th>Level</th><th>Pet Food</th><th>Growth Manual</th><th>Nutrient Potion</th><th>Promotion Medallion</th></tr></thead>
                <tbody>{curve.advancementMilestones.map((row) => <tr key={row.level}><td>Lv.{row.level}</td><td>{formatNumber(row.petFood)}</td><td>{formatNumber(row.growthManual)}</td><td>{formatNumber(row.nutrientPotion)}</td><td>{formatNumber(row.promotionMedallion)}</td></tr>)}</tbody>
              </table>
            </div>
          </section>

          <section className="pet-companion-panel">
            <details className="pet-companion-level-details">
              <summary>Show complete Lv.2–{pet.maxLevel} progression table</summary>
              <p>All values below are reproduced from the supplied source. A dash means the source did not require that material at that level.</p>
              <div className="pet-companion-table-wrap">
                <table className="pet-companion-table pet-companion-table--dense">
                  <thead><tr><th>Level</th><th>Pet Food</th><th>Growth Manual</th><th>Nutrient Potion</th><th>Promotion Medallion</th></tr></thead>
                  <tbody>{curve.levelProgression.map((row) => <tr key={row.level}><td>Lv.{row.level}</td><td>{formatNumber(row.petFood)}</td><td>{formatNumber(row.growthManual)}</td><td>{formatNumber(row.nutrientPotion)}</td><td>{formatNumber(row.promotionMedallion)}</td></tr>)}</tbody>
                </table>
              </div>
            </details>
          </section>

          <section className="pet-companion-panel">
            <div className="pet-companion-section-heading">
              <div><p className="eyebrow">Refinement</p><h2>Supplied threshold coverage</h2></div>
              <p>The uploaded source publishes threshold rows only for pets through Giant Rhino / Mighty Bison. Forge does not extrapolate missing Gen 5–7 thresholds.</p>
            </div>
            {threshold ? (
              <div className="pet-companion-table-wrap">
                <table className="pet-companion-table">
                  <thead><tr><th>Gray</th><th>Green</th><th>Blue</th><th>Purple</th><th>Gold</th></tr></thead>
                  <tbody><tr><td>{threshold.gray}</td><td>{threshold.green}</td><td>{threshold.blue}</td><td>{threshold.purple}</td><td>{threshold.gold}</td></tr></tbody>
                </table>
              </div>
            ) : <p className="pet-companion-callout"><strong>No threshold row supplied for {pet.name}.</strong> The Companion leaves this blank instead of copying a value from another Pet generation.</p>}
          </section>
        </div>

        <aside className="pet-companion-sidebar">
          <section className="pet-companion-panel">
            <p className="eyebrow">Source strategy</p>
            <h2>Priority position</h2>
            <dl className="pet-companion-facts">
              <div><dt>F2P list</dt><dd>{f2pRank >= 0 ? `#${f2pRank + 1}` : 'Not listed'}</dd></div>
              <div><dt>Spender list</dt><dd>{spenderRank >= 0 ? `#${spenderRank + 1}` : 'Not listed'}</dd></div>
            </dl>
            <p className="pet-companion-muted">These rankings are strategy guidance from the supplied document, not canonical game rules.</p>
          </section>

          <section className="pet-companion-panel">
            <p className="eyebrow">Trust boundary</p>
            <h2>What is being shown</h2>
            <dl className="pet-companion-facts">
              <div><dt>Progression rows</dt><dd>Supplied source</dd></div>
              <div><dt>Unlock timing</dt><dd>Approximate observation</dd></div>
              <div><dt>Artwork</dt><dd>{pet.media.status === 'available' ? 'Owner-cleared capture' : 'Pending'}</dd></div>
              <div><dt>Schema</dt><dd>{dataset._meta.schemaVersion}</dd></div>
            </dl>
          </section>

          <section className="pet-companion-panel">
            <p className="eyebrow">Connected Forge content</p>
            <h2>Keep planning</h2>
            <div className="pet-companion-links">
              <Link to="/guides/kingshot-pet-system-refinement-guide">Pet System guide</Link>
              <Link to="/guides/kingshot-kvk-preparation-scoring-guide">KvK Prep scoring</Link>
              <Link to="/companion">Items & resources</Link>
            </div>
          </section>

          {pet.notes.length > 0 && <section className="pet-companion-panel"><p className="eyebrow">Source notes</p><h2>Recorded notes</h2><ul className="pet-companion-notes">{pet.notes.map((note) => <li key={note}>{note}</li>)}</ul></section>}
        </aside>
      </section>
    </main>
  )
}

export default function PetCompanionPage() {
  const { petKey } = useParams()
  const [dataset, setDataset] = useState<PetDataset | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/data/pets.json')
      .then(async (response) => {
        if (!response.ok) throw new Error(`Pet dataset request failed (${response.status})`)
        const payload: unknown = await response.json()
        if (!isPetDataset(payload)) throw new Error('Pet dataset failed its published schema boundary')
        return payload
      })
      .then((payload) => { if (!cancelled) setDataset(payload) })
      .catch((reason: unknown) => { if (!cancelled) setError(reason instanceof Error ? reason.message : 'Pet dataset unavailable') })
    return () => { cancelled = true }
  }, [])

  if (error) return <main className="pet-companion-page"><div className="pet-companion-state pet-companion-state--error"><strong>Pet Companion unavailable</strong><p>{error}</p></div></main>
  if (!dataset) return <main className="pet-companion-page"><div className="pet-companion-state" role="status">Loading Pet Companion…</div></main>

  if (!petKey) return <PetCatalogue dataset={dataset} />

  const pet = dataset.pets.find((candidate) => candidate.key === petKey)
  if (!pet) return <main className="pet-companion-page"><div className="pet-companion-state"><strong>Pet not found.</strong><p><Link to="/companion/pets">Return to the Pet Companion</Link></p></div></main>
  return <PetDetail dataset={dataset} pet={pet} />
}
