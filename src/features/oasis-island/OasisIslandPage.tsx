import { useMemo, type ReactNode } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { imageForPublishedBuilding, formatFootprint, searchTextForPublishedBuilding, formatPercent, type OasisAcceptanceDataset, type OasisPublishedBuilding } from './oasisIslandData'
import './oasisIsland.css'
import './oasisContrast.css'

function BuildingImage({ building, compact = false }: { building: OasisPublishedBuilding; compact?: boolean }) {
  const image = imageForPublishedBuilding(building)
  const alt = building.media[0]?.alt ?? `${building.name} Oasis Island artwork`
  return image ? <img className={compact ? 'oasis-building-card__image' : 'oasis-detail__image'} src={image} alt={alt} loading={compact ? 'lazy' : undefined} width={building.media[0]?.width} height={building.media[0]?.height} /> : <div className="oasis-building-card__placeholder" aria-hidden="true">◈</div>
}

function statusClass(status?: string): string {
  return status?.includes('official') ? 'oasis-badge oasis-badge--official' : 'oasis-badge'
}

function GuideSection({ title, children }: { title: string; children: ReactNode }) {
  return <article className="oasis-guide-card"><h3>{title}</h3>{children}</article>
}

function formatBonus(effect: { label?: string | null; stat?: string | null; valuePct?: number | null }): string {
  const label = effect.label ?? effect.stat ?? 'Bonus'
  return typeof effect.valuePct === 'number' ? `${label} +${formatPercent(effect.valuePct)}` : label
}

function levelBonuses(level: OasisPublishedBuilding['levels'][number]): string[] {
  return level.bonuses.length ? level.bonuses.map(formatBonus) : level.knownEffects
}

function OasisGuide() {
  return <section className="oasis-guide" aria-labelledby="oasis-guide-title">
    <div className="oasis-section-heading"><div><p className="eyebrow">Plain-English guide</p><h2 id="oasis-guide-title">How Oasis Island works</h2></div><p>Published non-null values are owner-verified in-game. Unknown or unavailable values remain visibly unknown.</p></div>
    <div className="oasis-guide-grid">
      <GuideSection title="Unlock and core loop"><p>Oasis Island opens when your Town Center reaches Level 19. Enter through the Dock or Island icon, then collect Water Essence, place or upgrade structures, build Prosperity and upgrade the Fountain of Life.</p><p className="oasis-note">The island grants permanent account-wide advantages. It is not a player-owned showcase or a Forge progression tracker.</p></GuideSection>
      <GuideSection title="Water Essence and Prosperity"><p>Water Essence pays for island activity. The Fountain stores up to 12 hours, while Reservoir workers clear cacti and reveal chests. Prosperity is a milestone score: upgrading the Fountain does not spend it.</p><ul><li>Collect before the Fountain storage cap is full.</li><li>Only copies within a decoration's Type Limit contribute.</li><li>Different decoration types can stack their buffs.</li></ul></GuideSection>
      <GuideSection title="Reservoirs, workers and the Purifier"><p>Rush the first Reservoir to Level 4 for the second worker, then apply the same priority to the second Reservoir. Workers favour nearby cacti, so move Reservoirs toward your next clearing target.</p><p>After all cacti are cleared, Reservoirs become decorations and a Purifier replaces their Water Essence role.</p></GuideSection>
      <GuideSection title="Treasure chests and route planning"><p>Chests are one-time Water Essence rewards hidden under cactus and fog. Community route advice is useful but is not an official density map.</p><Link className="button button--primary" to="/calculators/island-chest-route-optimizer">Open the Island Chest Route Optimizer →</Link></GuideSection>
      <GuideSection title="Upgrade priorities"><ol><li>Upgrade the Fountain whenever its Prosperity threshold is met.</li><li>Reach Reservoir Level 4 and clear high-value areas.</li><li>Prioritise useful growth buildings early.</li><li>Shift toward combat or high-ceiling event structures once the economy is established.</li></ol></GuideSection>
      <GuideSection title="Known limits"><p>Do not rely on a fixed “300 Water Essence per help” amount. Official guidance says caretaker income scales with Fountain level. Some building effects and cosmetic details still need checking in-game.</p></GuideSection>
    </div>
  </section>
}

function BuildingDetail({ building }: { building: OasisPublishedBuilding }) {
  const isFountain = building.id === 'fountain-of-life'
  const isReservoir = building.id === 'reservoir'
  const isWonder = building.recordType === 'wonder'
  const hasUnrecordedLevels = building.levels.length === 0 && !building.maxEffects?.length
  return <main className="oasis-page oasis-page--detail">
    <Link className="oasis-back" to="/oasis-island">← Oasis Island catalogue</Link>
    <header className="oasis-detail__hero"><BuildingImage building={building} /><div><p className="eyebrow">Oasis Island · {building.recordType.replaceAll('_', ' ')}</p><h1>{building.name}</h1><p>{building.function ?? 'Explore this building’s levels, bonuses and place in your island plan.'}</p><span className={statusClass('owner')}>{building.trustLabel}</span></div></header>
    <section className="oasis-fact-grid" aria-label={`${building.name} facts`}><div><span>Rarity</span><strong>{building.rarity ?? 'Not available'}</strong></div><div><span>Maximum level</span><strong>{building.maxLevel ?? 'Not available'}</strong></div><div><span>Type Limit</span><strong>{building.typeLimit ?? 'Not available'}</strong></div><div><span>Footprint</span><strong>{formatFootprint(building.footprint)}</strong></div></section>
    {isWonder && building.unlock ? <section className="oasis-panel"><p className="eyebrow">Unlock and upgrade</p><p><strong>Unlock:</strong> {building.unlock.requirement ?? 'See the building details above.'}</p><p><strong>Blueprints:</strong> {building.upgrade?.exchange ?? 'More level details have not been recorded yet.'}</p></section> : null}
    {building.maxEffects?.length && !building.levels.length ? <section className="oasis-panel"><p className="eyebrow">Known bonus</p>{building.maxEffects.map((effect) => <p key={`${effect.stat}-${effect.valuePct}`}>{formatBonus(effect)}</p>)}</section> : null}
    {building.levels.length ? <section className="oasis-panel"><div className="oasis-section-heading"><div><p className="eyebrow">Upgrade guide</p><h2>Levels and bonuses</h2></div><span>{building.levels.length} levels available</span></div><div className="oasis-level-table-wrap"><table className="oasis-level-table"><thead><tr><th>Level</th>{isFountain ? <><th>Prosperity needed</th><th>Water Essence / hour</th><th>Bonus unlocked</th></> : isReservoir ? <th>Milestone and mechanics</th> : <><th>Bonus / bonuses</th><th>Prosperity</th></>}</tr></thead><tbody>{building.levels.map((level, index) => <tr key={`${building.id}-${level.level ?? index}`}><th>{level.level ?? index + 1}</th>{isFountain ? <><td>{level.prosperityRequired ?? '—'}</td><td>{level.waterEssencePerHour ?? '—'}</td><td>{levelBonuses(level).map((bonus) => <div key={bonus}>{bonus}{level.bonuses.some((effect) => effect.effect?.includes('replaces')) ? ' (replaces the earlier value)' : ''}</div>)}</td></> : isReservoir ? <td>{levelBonuses(level).length ? levelBonuses(level).map((bonus) => <div key={bonus}>{bonus}</div>) : 'No additional milestone recorded'}</td> : <><td>{levelBonuses(level).length ? levelBonuses(level).map((bonus) => <div key={bonus}>{bonus}</div>) : 'No bonus recorded for this level'}</td><td>{level.prosperity ?? level.prosperityRequired ?? '—'}</td></>}</tr>)}</tbody></table></div></section> : hasUnrecordedLevels ? <section className="oasis-panel"><p className="oasis-note">More level details have not been recorded yet.</p></section> : null}
  </main>
}

export default function OasisIslandPage({ acceptanceDataset }: { acceptanceDataset?: OasisAcceptanceDataset }) {
  const { buildingId } = useParams<{ buildingId?: string }>()
  const [params, setParams] = useSearchParams()
  const buildings = useMemo(() => acceptanceDataset?.records ?? [], [acceptanceDataset])
  const loading = false
  const error = ''
  const query = params.get('q') ?? ''
  const rarity = params.get('rarity') ?? 'all'
  const published = acceptanceDataset?.status === 'current_published' && acceptanceDataset.recordCount === buildings.length
  const current = buildingId ? buildings.find((building) => building.id === buildingId) : undefined
  const rarities = useMemo(() => [...new Set(buildings.map((building) => building.rarity).filter((value): value is string => Boolean(value)))].sort(), [buildings])
  const visible = useMemo(() => buildings.filter((building) => { const haystack = searchTextForPublishedBuilding(building); return haystack.includes(query.toLocaleLowerCase()) && (rarity === 'all' || building.rarity === rarity) }), [buildings, query, rarity])
  if (!published) return <main className="oasis-page oasis-page--unavailable"><header className="oasis-hero"><div><p className="eyebrow">Kingshot Forge · Companion / Oasis Island</p><h1>Oasis Island is not published yet</h1><p>The catalogue is retained as reviewed source evidence, but public pages only use an approved published projection. This route will open after that projection is created and reviewed.</p><Link className="button button--primary" to="/companion">Return to Companion</Link></div></header></main>
  if (current) return <BuildingDetail building={current} />
  return <main className="oasis-page"><header className="oasis-hero"><div><p className="eyebrow">Kingshot Forge · Companion / Oasis Island</p><h1>Oasis Island, made understandable</h1><p>Explore every known Oasis Island building, see what each level gives you, and find the upgrades that matter for your account.</p><div className="oasis-hero__actions"><Link className="button button--primary" to="/calculators/island-chest-route-optimizer">Plan chest routes</Link><a className="button button--secondary" href="#guide">Read the guide</a></div></div><div className="oasis-hero__facts"><strong>{loading ? '…' : error ? '—' : buildings.length}</strong><span>buildings and structures</span><small>Chest Route Optimizer included</small></div></header>
    <section className="oasis-catalogue" aria-labelledby="oasis-catalogue-title"><div className="oasis-section-heading"><div><p className="eyebrow">Building guide</p><h2 id="oasis-catalogue-title">Find a structure</h2></div><span>{loading ? 'Loading buildings…' : error ? 'Buildings unavailable' : `${visible.length} of ${buildings.length} buildings`}</span></div><div className="oasis-controls"><label><span>Search</span><input type="search" value={query} onChange={(event) => { const next = new URLSearchParams(params); if (event.target.value) next.set('q', event.target.value); else next.delete('q'); setParams(next, { replace: true }) }} placeholder="Search buildings, bonuses or aliases…" /></label><label><span>Rarity</span><select value={rarity} onChange={(event) => { const next = new URLSearchParams(params); if (event.target.value === 'all') next.delete('rarity'); else next.set('rarity', event.target.value); setParams(next, { replace: true }) }}><option value="all">All rarities</option>{rarities.map((value) => <option key={value} value={value}>{value}</option>)}</select></label></div>{error ? <div className="oasis-state oasis-state--error" role="alert"><p>{error}</p></div> : null}{loading ? <p className="oasis-state" role="status">Loading Oasis buildings…</p> : null}{!loading && !error ? <div className="oasis-building-grid">{visible.map((building) => <Link className="oasis-building-card" to={`/oasis-island/buildings/${building.id}`} key={building.id}><BuildingImage building={building} compact /><div><span className="oasis-building-card__meta">{building.rarity ?? 'Structure'} · {building.trustLabel}</span><h3>{building.name}</h3><p>{building.function ?? 'See levels, bonuses and planning details for this building.'}</p><small>{building.levels.length ? `${building.levels.length} levels` : 'More details have not been recorded yet.'} · View details →</small></div></Link>)}</div> : null}</section>
    <div id="guide"><OasisGuide /></div>
    <footer className="oasis-footer"><strong>Development acceptance fixture only.</strong><span>This sanitised projection is not registered as a production route or live publication.</span></footer>
  </main>
}
