import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import oasisIslandHeaderUrl from '../../assets/island-route/oasis-island-header.png'
import IslandRouteMap from './IslandRouteMap.tsx'
import {
  islandChestNodes,
  islandRouteDatasetProvenance,
  validateIslandRouteDataset,
} from './islandRouteData.ts'
import {
  buildIslandRoutePlan,
  describeRoutePlacement,
  type IslandRouteMode,
} from './routeEngine.ts'
import './islandRouteOptimizer.css'

const STORAGE_KEY = 'forge:island-route-optimizer:collected:v1'

function parseMode(value: string | null): IslandRouteMode {
  return value === 'double' ? 'double' : 'single'
}

function parseRound(value: string | null, maximum: number): number {
  const parsed = Number.parseInt(value ?? '1', 10)
  if (!Number.isFinite(parsed)) return 1
  return Math.min(Math.max(parsed, 1), maximum)
}

function loadCollectedChestIds(): Set<string> {
  if (typeof window === 'undefined') return new Set()

  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]')
    if (!Array.isArray(parsed)) return new Set()
    const allowedIds = new Set(islandChestNodes.map((node) => node.id))
    return new Set(parsed.filter((value): value is string => typeof value === 'string' && allowedIds.has(value)))
  } catch {
    return new Set()
  }
}

export default function IslandRouteOptimizerPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const mode = parseMode(searchParams.get('mode'))
  const plan = useMemo(() => buildIslandRoutePlan(mode), [mode])
  const currentRound = parseRound(searchParams.get('round'), plan.rounds.length)
  const [collectedChestIds, setCollectedChestIds] = useState<Set<string>>(loadCollectedChestIds)
  const [showFullRoute, setShowFullRoute] = useState(false)
  const [mapStatus, setMapStatus] = useState('Preparing the interactive Island map…')
  const datasetValidation = useMemo(() => validateIslandRouteDataset(), [])

  const selectedRound = plan.rounds[currentRound - 1]
  const roundChestIds = selectedRound?.placements.map((placement) => placement.chest.id) ?? []
  const roundComplete = roundChestIds.length > 0 && roundChestIds.every((id) => collectedChestIds.has(id))
  const collectedCount = islandChestNodes.filter((node) => collectedChestIds.has(node.id)).length
  const progress = Math.round((collectedCount / islandChestNodes.length) * 100)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...collectedChestIds].sort()))
  }, [collectedChestIds])

  const selectRound = useCallback((round: number) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      next.set('round', String(Math.min(Math.max(round, 1), plan.rounds.length)))
      next.set('mode', mode)
      return next
    }, { replace: true })
  }, [mode, plan.rounds.length, setSearchParams])

  const selectMode = useCallback((nextMode: IslandRouteMode) => {
    setSearchParams({ mode: nextMode, round: '1' }, { replace: true })
    setShowFullRoute(false)
  }, [setSearchParams])

  function toggleRoundComplete(): void {
    if (!selectedRound) return

    setCollectedChestIds((current) => {
      const next = new Set(current)
      if (roundComplete) {
        selectedRound.placements.forEach((placement) => next.delete(placement.chest.id))
      } else {
        selectedRound.placements.forEach((placement) => next.add(placement.chest.id))
      }
      return next
    })

    if (!roundComplete && currentRound < plan.rounds.length) selectRound(currentRound + 1)
  }

  function resetProgress(): void {
    setCollectedChestIds(new Set())
    selectRound(1)
  }

  return <main className="island-route-page">
    <Link className="island-route-page__back" to="/companion">← Companion Index</Link>

    <header className="island-route-page__hero">
      <div className="island-route-page__hero-media">
        <img src={oasisIslandHeaderUrl} alt="Illustrated Oasis Island with a central landmark, trees, water and treasure chest." />
      </div>
      <div className="island-route-page__hero-content">
        <p className="eyebrow">Kingshot Companion · route planner</p>
        <h1>Oasis Island Chest Route Planner</h1>
        <p>Plan your chest route across Oasis Island. Follow each step, switch between solo and two-route views, and track the chests you have cleared.</p>
      </div>
      <aside className="island-route-page__trust" aria-label="Route data confidence">
        <span>{islandRouteDatasetProvenance.confidenceBand}</span>
        <strong>{islandRouteDatasetProvenance.confidenceScore}% confidence</strong>
        <p>These coordinates come from a community reference. Forge builds the route here.</p>
      </aside>
    </header>

    <section className="island-route-content-panel" aria-labelledby="island-route-content-heading">
      <div className="island-route-content-panel__main">
        <p className="eyebrow">Oasis Island</p>
        <h2 id="island-route-content-heading">What this planner does</h2>
        <p>Use this page to work through the island chests in a clear order and keep track of your progress as you play.</p>
        <div className="island-route-content-panel__sections">
          <article>
            <h3>How to use this planner</h3>
            <ul>
              <li>Tap a chest to jump to that step.</li>
              <li>Use the step controls to move through the route.</li>
              <li>Switch route mode for a solo or two-route view.</li>
            </ul>
          </article>
          <article>
            <h3>What this route shows</h3>
            <p>The route gives you a practical chest order based on the distance between points. Use it as a guide while you move around the island.</p>
          </article>
        </div>
      </div>
      <aside className="island-route-content-panel__tags" aria-labelledby="island-route-tags-heading">
        <p className="eyebrow">Related content</p>
        <h2 id="island-route-tags-heading">Tags</h2>
        <div className="island-route-tag-list" aria-label="Oasis Island tags">
          {['oasis-island', 'island-route', 'chest-route', 'route-planner', 'exploration', 'island-event', 'rewards', 'strategy', 'guide', 'calculator'].map((tag) => <span key={tag}>{tag}</span>)}
        </div>
        <p>These tags are ready to connect this planner to related Forge content later.</p>
      </aside>
    </section>

    {!datasetValidation.valid && <section className="island-route-state island-route-state--error" role="alert">
      <h2>Route data unavailable</h2>
      <p>Forge stopped the optimiser because the coordinate dataset failed validation.</p>
      <ul>{datasetValidation.errors.map((error) => <li key={error}>{error}</li>)}</ul>
    </section>}

    {datasetValidation.valid && <>
      <section className="island-route-controls" aria-label="Route settings">
        <div>
          <span className="island-route-controls__label">Build mode</span>
          <div className="island-route-segmented" role="group" aria-label="Number of reservoirs">
            <button type="button" className={mode === 'single' ? 'island-route-segmented__button island-route-segmented__button--active' : 'island-route-segmented__button'} onClick={() => selectMode('single')} aria-pressed={mode === 'single'}>1 reservoir</button>
            <button type="button" className={mode === 'double' ? 'island-route-segmented__button island-route-segmented__button--active' : 'island-route-segmented__button'} onClick={() => selectMode('double')} aria-pressed={mode === 'double'}>2 reservoirs</button>
          </div>
        </div>
        <label className="island-route-toggle">
          <input type="checkbox" checked={showFullRoute} onChange={(event) => setShowFullRoute(event.target.checked)} />
          <span>Show the complete route</span>
        </label>
      </section>

      <section className="island-route-summary" aria-label="Route summary">
        <article><strong>{plan.totalPlacements}</strong><span>chests</span></article>
        <article><strong>{plan.rounds.length}</strong><span>{mode === 'double' ? 'parallel rounds' : 'steps'}</span></article>
        <article><strong>{plan.totalDistance}</strong><span>route distance</span></article>
        <article><strong>{collectedCount} / {islandChestNodes.length}</strong><span>completed</span></article>
      </section>

      <div className="island-route-workspace">
        <section className="island-route-map-card" aria-labelledby="island-map-heading">
          <div className="island-route-map-card__heading">
            <div>
              <p className="eyebrow">Board view</p>
              <h2 id="island-map-heading">Round {currentRound} of {plan.rounds.length}</h2>
            </div>
            <span>{progress}% complete</span>
          </div>
          <div className="island-route-progress" aria-label={`${progress}% of chests marked complete`}><span style={{ width: `${progress}%` }} /></div>
          <IslandRouteMap
            plan={plan}
            currentRound={currentRound}
            collectedChestIds={collectedChestIds}
            showFullRoute={showFullRoute}
            onSelectRound={selectRound}
            onStatusChange={setMapStatus}
          />
          <p className="island-route-map-card__status" aria-live="polite">{mapStatus}</p>
          <p className="island-route-map-card__help">This planner uses Forge route data. Tap a marker to jump to that step. Drag or pinch to move around the board.</p>
        </section>

        <aside className="island-route-step-card" aria-labelledby="current-round-heading">
          <p className="eyebrow">Next step</p>
          <h2 id="current-round-heading">{mode === 'double' ? `Parallel round ${currentRound}` : `Step ${currentRound}`}</h2>
          <div className="island-route-step-card__placements">
            {selectedRound?.placements.map((placement) => <article key={placement.chest.id} className={`island-route-placement island-route-placement--reservoir-${placement.reservoir}`}>
              <div><span>Reservoir {placement.reservoir}</span>{collectedChestIds.has(placement.chest.id) && <strong>Complete</strong>}</div>
              <h3>{placement.chest.label}</h3>
              <p>X {placement.chest.x} · Y {placement.chest.y}</p>
              <small>{placement.distance} grid steps from {placement.from.label}</small>
            </article>)}
          </div>

          <button type="button" className="button button--primary island-route-step-card__complete" onClick={toggleRoundComplete}>{roundComplete ? 'Mark this round incomplete' : 'Mark complete and continue'}</button>

          <div className="island-route-step-navigation">
            <button type="button" className="button button--secondary" disabled={currentRound <= 1} onClick={() => selectRound(currentRound - 1)}>← Previous</button>
            <button type="button" className="button button--secondary" disabled={currentRound >= plan.rounds.length} onClick={() => selectRound(currentRound + 1)}>Next →</button>
          </div>

          <label className="island-route-round-slider">
            <span>Jump to {mode === 'double' ? 'round' : 'step'}</span>
            <input type="range" min="1" max={plan.rounds.length} value={currentRound} onChange={(event) => selectRound(Number(event.target.value))} />
          </label>

          <button type="button" className="island-route-reset" onClick={resetProgress} disabled={collectedCount === 0}>Reset saved progress</button>
        </aside>
      </div>

      <section className="island-route-guidance">
        <article><p className="eyebrow">Route guide</p><h2>How the route works</h2><p>The planner puts the nearest available chest next in the route. Two-route mode gives you two destinations to work on in the same round.</p></article>
        <article><p className="eyebrow">Saved on this device</p><h2>Your progress stays here</h2><p>Your completed steps are saved in this browser only. They are not shared with your Forge account.</p></article>
        <article><p className="eyebrow">Good to know</p><h2>Use it as a guide</h2><p>This is a planning tool. It does not show every obstacle or timing detail from the live game.</p></article>
      </section>

      <details className="island-route-list">
        <summary>View the full route list</summary>
        <ol>
          {plan.rounds.map((round) => <li key={round.index}>
            <strong>{mode === 'double' ? `Round ${round.index}` : `Step ${round.index}`}</strong>
            <ul>{round.placements.map((placement) => <li key={placement.chest.id}>{describeRoutePlacement(placement)}</li>)}</ul>
          </li>)}
        </ol>
      </details>

      <section className="island-route-source-note">
        <div><p className="eyebrow">Coordinate source</p><h2>Community coordinates, checked by Forge</h2><p>{islandRouteDatasetProvenance.note}</p></div>
        <a className="button button--secondary" href={islandRouteDatasetProvenance.sourceUrl} target="_blank" rel="noreferrer">View coordinate reference</a>
      </section>
    </>}
  </main>
}
