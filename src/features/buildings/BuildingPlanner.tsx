import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatDuration, formatNumber } from '../../utils/formatters'
import BuildingArtwork from '../../components/buildings/BuildingArtwork'
import {
  calculateBuildingPlan,
  createBuildingPlannerModel,
  nextTargetPositionId,
} from './buildingPlanner'
import type { BuildingCompanionRecord } from './buildingData'
import './buildingPlanner.css'

type BuildingPlannerProps = {
  buildings: BuildingCompanionRecord[]
  initialBuildingKey?: string
  embedded?: boolean
}

type ResourceCardProps = {
  label: string
  value: number
  className?: string
}

function ResourceCard({ label, value, className = '' }: ResourceCardProps) {
  return <article className={`building-planner-resource ${className}`.trim()}>
    <span>{label}</span>
    <strong>{formatNumber(value)}</strong>
  </article>
}

function initialBuilding(
  buildings: BuildingCompanionRecord[],
  preferredKey?: string,
): BuildingCompanionRecord | undefined {
  return buildings.find((building) => building.key === preferredKey) ?? buildings[0]
}

export default function BuildingPlanner({
  buildings,
  initialBuildingKey,
  embedded = false,
}: BuildingPlannerProps) {
  const preferred = initialBuilding(buildings, initialBuildingKey)
  const [buildingKey, setBuildingKey] = useState(preferred?.key ?? '')
  const selectedBuilding = buildings.find((building) => building.key === buildingKey) ?? preferred
  const model = useMemo(
    () => selectedBuilding ? createBuildingPlannerModel(selectedBuilding) : null,
    [selectedBuilding],
  )
  const [currentPositionId, setCurrentPositionId] = useState('start')
  const [targetPositionId, setTargetPositionId] = useState('')
  const [constructionSpeed, setConstructionSpeed] = useState(0)
  const [resourceReduction, setResourceReduction] = useState(0)

  useEffect(() => {
    const next = initialBuilding(buildings, initialBuildingKey)
    if (next && !buildings.some((building) => building.key === buildingKey)) {
      setBuildingKey(next.key)
    }
  }, [buildingKey, buildings, initialBuildingKey])

  useEffect(() => {
    if (!model) return
    setCurrentPositionId('start')
    setTargetPositionId(nextTargetPositionId(model, 'start'))
  }, [model])

  if (!selectedBuilding || !model || model.steps.length === 0) {
    return <section className="building-planner building-planner--empty">
      <p>No published progression is available for this building.</p>
    </section>
  }

  const currentPosition = model.positions.find((position) => position.id === currentPositionId)
    ?? model.positions[0]
  const availableTargets = model.positions.filter(
    (position) => position.completedIndex > currentPosition.completedIndex,
  )
  const resolvedTargetId = availableTargets.some((position) => position.id === targetPositionId)
    ? targetPositionId
    : availableTargets[0]?.id ?? currentPosition.id
  const plan = calculateBuildingPlan(
    model,
    currentPosition.id,
    resolvedTargetId,
    constructionSpeed,
    resourceReduction,
  )
  const hasPremiumResources = plan.truegold > 0 || plan.temperedTruegold > 0
  const isAtMaximum = availableTargets.length === 0

  function changeCurrentPosition(nextId: string) {
    setCurrentPositionId(nextId)
    setTargetPositionId(nextTargetPositionId(model, nextId))
  }

  return <section className={embedded ? 'building-planner building-planner--embedded' : 'building-planner'} id="upgrade-planner">
    <header className="building-planner__header">
      <div>
        <p className="eyebrow">Building calculator</p>
        <h2>Upgrade planner</h2>
        <p>Choose where you are now and where you want to reach. Forge totals every published upgrade step between them.</p>
      </div>
      {!embedded && <div className="building-planner__building-art" aria-hidden="true">
        <BuildingArtwork building={selectedBuilding} compact decorative />
      </div>}
    </header>

    <div className="building-planner__controls">
      {!embedded && <label>
        <span>Building</span>
        <select value={selectedBuilding.key} onChange={(event) => setBuildingKey(event.target.value)}>
          {buildings.map((building) => <option value={building.key} key={building.key}>{building.name}</option>)}
        </select>
      </label>}

      <label>
        <span>Current position</span>
        <select value={currentPosition.id} onChange={(event) => changeCurrentPosition(event.target.value)}>
          {model.positions.map((position) => <option value={position.id} key={position.id}>{position.label}</option>)}
        </select>
      </label>

      <label>
        <span>Target position</span>
        <select
          value={resolvedTargetId}
          disabled={isAtMaximum}
          onChange={(event) => setTargetPositionId(event.target.value)}
        >
          {isAtMaximum
            ? <option value={currentPosition.id}>Maximum published stage reached</option>
            : availableTargets.map((position) => <option value={position.id} key={position.id}>{position.label}</option>)}
        </select>
      </label>

      <label>
        <span>Construction speed bonus</span>
        <div className="building-planner__number-input"><input type="number" min="0" max="5000" step="0.1" value={constructionSpeed} onChange={(event) => setConstructionSpeed(Math.max(0, Number(event.target.value) || 0))} /><b>%</b></div>
      </label>

      <label>
        <span>Basic resource reduction</span>
        <div className="building-planner__number-input"><input type="number" min="0" max="95" step="0.1" value={resourceReduction} onChange={(event) => setResourceReduction(Math.min(95, Math.max(0, Number(event.target.value) || 0)))} /><b>%</b></div>
      </label>
    </div>

    {isAtMaximum ? <p className="building-planner__maximum">This building is already at its final published stage.</p> : <>
      <div className="building-planner__journey" aria-label="Selected upgrade journey">
        <div><span>From</span><strong>{currentPosition.label}</strong></div>
        <i aria-hidden="true">→</i>
        <div><span>To</span><strong>{model.positions.find((position) => position.id === resolvedTargetId)?.label}</strong></div>
        <div className="building-planner__step-count"><strong>{formatNumber(plan.steps.length)}</strong><span>upgrade steps</span></div>
      </div>

      <div className="building-planner__results">
        <section>
          <h3>Resources required</h3>
          <div className="building-planner__resource-grid">
            <ResourceCard label="Bread" value={plan.bread} />
            <ResourceCard label="Wood" value={plan.wood} />
            <ResourceCard label="Stone" value={plan.stone} />
            <ResourceCard label="Iron" value={plan.iron} />
            {hasPremiumResources && <ResourceCard label="Truegold" value={plan.truegold} className="is-premium" />}
            {hasPremiumResources && <ResourceCard label="Tempered Truegold" value={plan.temperedTruegold} className="is-tempered" />}
          </div>
          {plan.basicResourceReductionPercent > 0 && <p className="building-planner__result-note">Bread, Wood, Stone and Iron include your {formatNumber(plan.basicResourceReductionPercent)}% reduction. Truegold materials are unchanged.</p>}
        </section>

        <section>
          <h3>Time and power</h3>
          <dl className="building-planner__summary-list">
            <div><dt>Published base time</dt><dd>{formatDuration(plan.baseTimeSeconds)}</dd></div>
            <div><dt>Estimated time with bonus</dt><dd>{formatDuration(plan.adjustedTimeSeconds)}</dd></div>
            <div><dt>Known power gain</dt><dd>{plan.powerGain === null ? 'Not fully published' : `+${formatNumber(plan.powerGain)}`}</dd></div>
          </dl>
          <p className="building-planner__result-note">Time is estimated from the published base duration using the construction-speed bonus entered above. Other game effects are not assumed.</p>
          {plan.missingPowerCoverage && <p className="building-planner__warning">Some selected stages do not have published power values, so Forge does not invent a complete power total.</p>}
        </section>
      </div>

      <details className="building-planner__breakdown">
        <summary><span>Show per-step breakdown</span><small>{formatNumber(plan.steps.length)} rows</small></summary>
        <div className="building-planner__table-scroll">
          <table>
            <thead><tr><th>Upgrade</th><th>Bread</th><th>Wood</th><th>Stone</th><th>Iron</th><th>Truegold</th><th>Tempered</th><th>Base time</th><th>Prerequisites</th></tr></thead>
            <tbody>{plan.steps.map((step) => <tr key={step.id} className={`is-${step.phase}`}>
              <th scope="row">{step.label}</th>
              <td>{formatNumber(step.bread)}</td>
              <td>{formatNumber(step.wood)}</td>
              <td>{formatNumber(step.stone)}</td>
              <td>{formatNumber(step.iron)}</td>
              <td>{formatNumber(step.truegold)}</td>
              <td>{formatNumber(step.temperedTruegold)}</td>
              <td>{formatDuration(step.upgradeTimeSeconds)}</td>
              <td>{step.requirements}</td>
            </tr>)}</tbody>
          </table>
        </div>
      </details>
    </>}

    <footer className="building-planner__footer">
      <p>Calculated from the current owner-approved Buildings publication. Transition steps between Level 30 and TG1 are included where published.</p>
      {embedded
        ? <Link to={`/calculators/buildings?building=${selectedBuilding.key}`} className="button button--secondary">Open full Building Planner</Link>
        : <Link to={`/buildings/${selectedBuilding.key}`} className="button button--secondary">View {selectedBuilding.name} details</Link>}
    </footer>
  </section>
}
