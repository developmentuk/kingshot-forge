import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { fetchDataset } from '../features/admin/dataEngineApi'
import BuildingPlanner from '../features/buildings/BuildingPlanner'
import {
  normaliseBuildings,
  type BuildingCompanionRecord,
} from '../features/buildings/buildingData'
import '../styles/buildingCalculatorsPage.css'

export default function BuildingCalculatorsPage() {
  const [searchParams] = useSearchParams()
  const requestedBuilding = searchParams.get('building') ?? undefined
  const [buildings, setBuildings] = useState<BuildingCompanionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    setLoading(true)
    fetchDataset('buildings', controller.signal)
      .then((result) => {
        setBuildings(normaliseBuildings(result.records))
        setError('')
      })
      .catch((value: unknown) => {
        if (value instanceof DOMException && value.name === 'AbortError') return
        setError(value instanceof Error ? value.message : 'The Building Planner is temporarily unavailable.')
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [])

  return <main className="building-calculators-page">
    <Link className="buildings-back" to="/buildings">← Buildings compendium</Link>

    <section className="building-calculators-page__hero">
      <div>
        <p className="eyebrow">Kingshot Companion · calculators</p>
        <h1>Building Planner</h1>
        <p>Plan any published building journey from your current level or stage to a target. Forge totals the upgrade resources, Truegold materials, base time, estimated boosted time, known power gain and prerequisites.</p>
      </div>
      <div className="building-calculators-page__trust">
        <strong>One trusted data source</strong>
        <span>The planner uses the same owner-approved Buildings publication as every building page.</span>
      </div>
    </section>

    {loading && <p className="buildings-state">Loading the published Building Planner…</p>}
    {error && <p className="buildings-state buildings-state--error">{error}</p>}
    {!loading && !error && <BuildingPlanner buildings={buildings} initialBuildingKey={requestedBuilding} />}

    <section className="building-calculators-page__guidance">
      <article>
        <p className="eyebrow">Included</p>
        <h2>What Forge calculates</h2>
        <p>Every selected published upgrade step, including standard levels, Level 30 transition steps, Truegold sub-stages and Tempered Truegold where available.</p>
      </article>
      <article>
        <p className="eyebrow">Your bonuses</p>
        <h2>Adjust the estimate</h2>
        <p>Enter your construction-speed bonus and basic-resource reduction. Forge keeps premium materials separate and never assumes unrecorded bonuses.</p>
      </article>
      <article>
        <p className="eyebrow">Data limits</p>
        <h2>Missing values stay visible</h2>
        <p>When power or another field is absent from the publication, Forge labels the result incomplete instead of manufacturing a total.</p>
      </article>
    </section>
  </main>
}
