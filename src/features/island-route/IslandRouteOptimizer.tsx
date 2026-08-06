import { useCallback, useEffect, useMemo, useState } from 'react'
import LeafletIslandMap from './LeafletIslandMap.js'
import { ISLAND_CHESTS, ISLAND_DATASET_NOTE, ISLAND_DATASET_VERSION } from './islandChestData.js'
import { calculateIslandRoute, visibleStepCount } from './islandRouteEngine.js'
import type { IslandRouteMode, IslandRouteStep, IslandRouteSummary } from './islandRouteTypes.js'

const STORAGE_KEY = 'forge-island-route-collected-chests'

function loadCollectedChests(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]')
    return new Set(Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : [])
  } catch {
    return new Set()
  }
}

function formatRunner(runner: string): string {
  if (runner === 'reservoir-1') return 'Reservoir 1'
  if (runner === 'reservoir-2') return 'Reservoir 2'
  return 'Single Reservoir'
}

function currentStepLabel(mode: IslandRouteMode, progressIndex: number, maxProgress: number): string {
  const noun = mode === 'single' ? 'Step' : 'Round'
  return `${noun} ${Math.min(progressIndex, maxProgress)} / ${maxProgress}`
}

function RouteStepCard({ step, active, collected, onToggle }: { step: IslandRouteStep; active: boolean; collected: boolean; onToggle: (id: string) => void }) {
  return <li className={active ? 'island-route-step island-route-step--active' : 'island-route-step'}>
    <button type="button" className="island-route-step__toggle" aria-pressed={collected} onClick={() => onToggle(step.node.id)}>
      <span>{collected ? '✓' : step.order}</span>
    </button>
    <div>
      <strong>{step.node.label}</strong>
      <p>{formatRunner(step.runner)} from {step.fromId.replace('chest-', 'Chest ')} · {step.distance} grid spaces · {step.node.x},{step.node.y}</p>
    </div>
  </li>
}

export default function IslandRouteOptimizer() {
  const [mode, setMode] = useState<IslandRouteMode>('single')
  const [collectedChestIds, setCollectedChestIds] = useState<Set<string>>(() => loadCollectedChests())
  const [progressIndex, setProgressIndex] = useState(1)

  const remainingChests = useMemo(
    () => ISLAND_CHESTS.filter((chest) => !collectedChestIds.has(chest.id)),
    [collectedChestIds],
  )
  const route = useMemo(() => calculateIslandRoute(mode, remainingChests), [mode, remainingChests])
  const maxProgress = Math.max(route.rounds.length, 1)
  const visibleSteps = visibleStepCount(route, progressIndex)
  const selectedChestId = route.steps[Math.max(visibleSteps - 1, 0)]?.node.id

  const summary: IslandRouteSummary = {
    totalChests: ISLAND_CHESTS.length,
    collectedChests: collectedChestIds.size,
    remainingChests: remainingChests.length,
    totalDistance: route.totalDistance,
    visibleSteps,
  }

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...collectedChestIds].sort()))
  }, [collectedChestIds])

  useEffect(() => {
    setProgressIndex(1)
  }, [mode, collectedChestIds])

  const toggleChest = useCallback((chestId: string) => {
    setCollectedChestIds((current) => {
      const next = new Set(current)
      if (next.has(chestId)) next.delete(chestId)
      else next.add(chestId)
      return next
    })
  }, [])

  function resetProgress(): void {
    setCollectedChestIds(new Set())
    setProgressIndex(1)
  }

  return <section className="island-route-optimizer">
    <header className="island-route-hero">
      <div>
        <p className="eyebrow">Kingshot Companion · route module</p>
        <h1>Oasis Island Chest Route Optimizer</h1>
        <p>Plan Reservoir placements that prioritise reaching treasure chests earlier. Forge calculates deterministic grid routes, lets you switch between one and two Reservoirs, and recalculates as you mark chests collected.</p>
      </div>
      <div className="island-route-hero__meta">
        <strong>55 chest seed map</strong>
        <span>60×60 grid · Manhattan distance · Leaflet renderer</span>
      </div>
    </header>

    <section className="island-route-panel" aria-label="Route controls">
      <div className="island-route-mode-switch" role="group" aria-label="Route mode">
        <button type="button" className={mode === 'single' ? 'button button--primary' : 'button button--secondary'} onClick={() => setMode('single')}>Single Reservoir</button>
        <button type="button" className={mode === 'double' ? 'button button--primary' : 'button button--secondary'} onClick={() => setMode('double')}>Double Reservoir</button>
      </div>

      <div className="island-route-progress-control">
        <label htmlFor="island-route-progress">{currentStepLabel(mode, progressIndex, maxProgress)}</label>
        <input
          id="island-route-progress"
          type="range"
          min="1"
          max={maxProgress}
          value={Math.min(progressIndex, maxProgress)}
          onChange={(event) => setProgressIndex(Number(event.target.value))}
          disabled={route.steps.length === 0}
        />
      </div>

      <div className="island-route-actions">
        <button type="button" className="button button--secondary" onClick={() => setProgressIndex((current) => Math.max(current - 1, 1))} disabled={progressIndex <= 1}>Previous</button>
        <button type="button" className="button button--secondary" onClick={() => setProgressIndex((current) => Math.min(current + 1, maxProgress))} disabled={progressIndex >= maxProgress}>Next</button>
        <button type="button" className="button button--secondary" onClick={resetProgress}>Reset Route</button>
      </div>
    </section>

    <section className="island-route-summary" aria-label="Route summary">
      <article><strong>{summary.totalChests}</strong><span>Total chests</span></article>
      <article><strong>{summary.collectedChests}</strong><span>Collected</span></article>
      <article><strong>{summary.remainingChests}</strong><span>Remaining</span></article>
      <article><strong>{summary.totalDistance}</strong><span>Grid distance</span></article>
      <article><strong>{summary.visibleSteps}</strong><span>Shown steps</span></article>
    </section>

    <div className="island-route-layout">
      <LeafletIslandMap
        chests={ISLAND_CHESTS}
        route={route}
        collectedChestIds={collectedChestIds}
        visibleSteps={visibleSteps}
        selectedChestId={selectedChestId}
        onToggleChest={toggleChest}
      />

      <aside className="island-route-checklist" aria-label="Route checklist">
        <div className="island-route-checklist__header">
          <div>
            <p className="eyebrow">Accessible fallback</p>
            <h2>Route checklist</h2>
          </div>
          <span>{mode === 'single' ? '55 steps' : '28 rounds'}</span>
        </div>

        {route.steps.length === 0 ? <p className="island-route-empty">All chests are marked collected. Reset the route to plan again.</p> : <ol>
          {route.steps.map((step) => (
            <RouteStepCard
              key={step.node.id}
              step={step}
              active={step.order <= visibleSteps}
              collected={collectedChestIds.has(step.node.id)}
              onToggle={toggleChest}
            />
          ))}
        </ol>}
      </aside>
    </div>

    <section className="island-route-guidance">
      <article>
        <p className="eyebrow">Algorithm</p>
        <h2>How the route is calculated</h2>
        <p>Single Reservoir mode uses Prim-style nearest frontier expansion. Double Reservoir mode alternates two frontiers so two active Reservoirs can push through the map in parallel.</p>
      </article>
      <article>
        <p className="eyebrow">Coordinate status</p>
        <h2>Review before canonical use</h2>
        <p>{ISLAND_DATASET_NOTE}</p>
        <small>Dataset contract: {ISLAND_DATASET_VERSION}</small>
      </article>
    </section>
  </section>
}
