import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
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
      <div>
        <p className="eyebrow">Kingshot Companion · route planner</p>
        <h1>Oasis Island Chest Route</h1>
        <p>Plan all 55 community-mapped chest placements from HQ using a deterministic Manhattan-distance route. Use one reservoir for a single build order or two reservoirs for parallel rounds.</p>
      </div>
      <aside className="island-route-page__trust" aria-label="Route data confidence">
        <span>{islandRouteDatasetProvenance.confidenceBand}</span>
        <strong>{islandRouteDatasetProvenance.confidenceScore}% confidence</strong>
        <p>Community coordinates. Forge independently recalculates the route and uses no copied game-map artwork.</p>
      </aside>
    </header>

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
        <article><strong>{plan.totalDistance}</strong><span>total grid distance</span></article>
        <article><strong>{collectedCount} / {islandChestNodes.length}</strong><span>marked complete</span></article>
      </section>

      <div className="island-route-workspace">
        <section className="island-route-map-card" aria-labelledby="island-map-heading">
          <div className="island-route-map-card__heading">
            <div>
              <p className="eyebrow">Interactive map</p>
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
          <p className="island-route-map-card__help">Coordinates use a neutral 60 × 60 Forge grid. Tap a marker to jump to its round; drag or pinch the map to inspect it.</p>
        </section>

        <aside className="island-route-step-card" aria-labelledby="current-round-heading">
          <p className="eyebrow">Current instructions</p>
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
        <article><p className="eyebrow">How it works</p><h2>Nearest safe expansion</h2><p>Each placement connects the nearest unopened chest to HQ or a previously cleared chest using Manhattan distance. Two-reservoir mode chooses up to two distinct destinations from the same pre-round frontier.</p></article>
        <article><p className="eyebrow">Persistence</p><h2>Progress stays on this device</h2><p>Completed chests are stored only in this browser. No player account, Supabase record or personal information is created.</p></article>
        <article><p className="eyebrow">Honest limits</p><h2>A planning aid, not pathfinding</h2><p>The result is a deterministic placement tree. It does not model obstacles, construction timing, alliance bonuses or movement visible in the live game.</p></article>
      </section>

      <details className="island-route-list">
        <summary>View the complete accessible route list</summary>
        <ol>
          {plan.rounds.map((round) => <li key={round.index}>
            <strong>{mode === 'double' ? `Round ${round.index}` : `Step ${round.index}`}</strong>
            <ul>{round.placements.map((placement) => <li key={placement.chest.id}>{describeRoutePlacement(placement)}</li>)}</ul>
          </li>)}
        </ol>
      </details>

      <section className="island-route-source-note">
        <div><p className="eyebrow">Source and verification</p><h2>Community reference, governed by Forge</h2><p>{islandRouteDatasetProvenance.note}</p></div>
        <a className="button button--secondary" href={islandRouteDatasetProvenance.sourceUrl} target="_blank" rel="noreferrer">View coordinate reference</a>
      </section>
    </>}
  </main>
}
