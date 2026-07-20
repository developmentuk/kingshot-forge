import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchDataset } from '../features/admin/dataEngineApi'
import '../styles/buildingsBrowser.css'

type Building = { key: string; name: string; category: string; description: string; maxLevel: number | null; truegold: boolean; progression: Record<string, unknown>[]; source?: string }
const text = (value: unknown, fallback = '') => typeof value === 'string' ? value : fallback
const number = (value: unknown) => typeof value === 'number' ? value : Number.isFinite(Number(value)) ? Number(value) : null
function normalise(records: unknown[]): Building[] {
  const map = new Map<string, Building>()
  records.forEach((raw) => { if (!raw || typeof raw !== 'object') return; const r = raw as Record<string, unknown>; const key = text(r.building_key, text(r.key)); if (!key || !text(r.building_name, text(r.name))) return; const current = map.get(key) ?? { key, name: text(r.building_name, text(r.name)), category: text(r.category, 'Buildings'), description: text(r.description, 'Verified building progression and upgrade effects.'), maxLevel: number(r.standard_max_level ?? r.max_level), truegold: Boolean(r.truegold_supported ?? r.truegold), progression: [], source: text(r.source_url, text(r.source)) }; if (Array.isArray(r.progression)) current.progression.push(...r.progression.filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === 'object')); else if (r.record_id || r.level_label || r.level || r.base_level) current.progression.push(r); map.set(key, current) })
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name))
}

export default function BuildingsBrowserPage() {
  const { buildingKey } = useParams<{ buildingKey?: string }>()
  const [buildings, setBuildings] = useState<Building[]>([])
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  useEffect(() => { fetchDataset('buildings').then((result) => setBuildings(normalise(result.records))).catch((value: unknown) => setError(value instanceof Error ? value.message : 'Buildings are temporarily unavailable.')) }, [])
  const visible = useMemo(() => buildings.filter((building) => `${building.name} ${building.category}`.toLowerCase().includes(query.toLowerCase())), [buildings, query])
  const current = buildingKey ? buildings.find((building) => building.key === buildingKey) : null
  if (buildingKey) return <BuildingDetail building={current} error={error} />
  return <main className="buildings-browser"><section className="buildings-hero"><p className="eyebrow">Kingshot Forge · published data</p><h1>Buildings directory</h1><p>Explore verified upgrade requirements, Truegold, resources, power, effects and prerequisites.</p><input aria-label="Search buildings" placeholder="Search buildings" value={query} onChange={(event) => setQuery(event.target.value)} /></section>{error && <p className="buildings-state">{error}</p>}<section className="building-directory">{visible.map((building) => <Link className="building-card" to={`/buildings/${building.key}`} key={building.key}><span>{building.category}</span><h2>{building.name}</h2><p>{building.description}</p><footer><strong>{building.progression.length || '—'}</strong><small> progression rows</small><em>{building.truegold ? 'Truegold' : 'Standard'}</em></footer></Link>)}</section>{!error && visible.length === 0 && <p className="buildings-state">Loading published Buildings…</p>}</main>
}

function BuildingDetail({ building, error }: { building: Building | null | undefined; error: string }) {
  if (!building) return <main className="buildings-browser"><p className="buildings-state">{error || 'Building not found in the published projection.'}</p><Link to="/buildings">Back to Buildings</Link></main>
  const progression = [...building.progression].sort((a, b) => (number(a.stage ?? a.base_level ?? a.level) ?? 0) - (number(b.stage ?? b.base_level ?? b.level) ?? 0))
  return <main className="buildings-browser"><Link className="buildings-back" to="/buildings">← Buildings directory</Link><section className="building-detail-hero"><p className="eyebrow">{building.category}</p><h1>{building.name}</h1><p>{building.description}</p><div className="building-facts"><span><strong>{building.maxLevel ?? '—'}</strong> max level</span><span><strong>{building.truegold ? 'Yes' : 'No'}</strong> Truegold</span><span><strong>{progression.length}</strong> progression records</span></div></section><section className="building-detail-grid"><article><h2>Progression</h2>{progression.length ? <div className="progression-table">{progression.map((row, index) => <Link to={`/buildings/${building.key}/progression#row-${index + 1}`} key={text(row.record_id, String(index))}><strong>{text(row.level_label, text(row.level, `Level ${number(row.stage ?? row.base_level) ?? index + 1}`))}</strong><span>{text(row.upgrade_time_display, 'Upgrade time —')}</span><span>{number(row.power) !== null ? `${number(row.power)} power` : 'Power —'}</span></Link>)}</div> : <p className="buildings-state">Progression is staged for editorial review and is not yet in the published projection.</p>}</article><aside><h2>Editorial facts</h2><dl><div><dt>Resources</dt><dd>Raw/base costs retained</dd></div><div><dt>Prerequisites</dt><dd>{progression.filter((row) => text(row.requirements_text)).length} mapped rows</dd></div><div><dt>Effects</dt><dd>Published per-level effects</dd></div><div><dt>Forge Connections</dt><dd>Related guides and creators refresh after publication</dd></div></dl><Link className="button button--primary" to={`/buildings/${building.key}/progression`}>Open progression</Link></aside></section></main>
}
