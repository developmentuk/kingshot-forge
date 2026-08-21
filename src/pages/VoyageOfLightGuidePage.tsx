import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { calculateVoyagePlan } from '../features/guides/voyagePlanner'
import './VoyageOfLightGuidePage.css'

type Reward = { itemKey: string; label: string; quantity: number }
type Milestone = { voyages: number; rewards: Reward[] }
type Team = {
  team: number
  unlock: { kind: string; amount: number; currency: string | null }
  status: 'source_supported' | 'source_claimed_unverified'
}
type TreasureTier = { key: string; name: string; terminal: boolean }
type MergeRule = {
  from: string
  count: number
  outcome: { kind: 'fixed'; to: string } | null
  status: 'source_supported' | 'conflicted'
  verificationIssueId?: string
}
type VoyageEvent = {
  eventKey: string
  phases: {
    activeVoyaging: { durationDaysApprox: number; dispatchAllowed: boolean }
    collectionWindow: { durationDays: number; dispatchAllowed: boolean; treasureOpenAllowed: boolean; treasureMergeAllowed: boolean; autoOpenUnopenedAtEnd: boolean }
  }
  voyage: { durationHours: number; treasuresPerCompletedVoyage: number }
  compass: { hoursReducedPerCompass: number; completeAllAvailable: boolean }
  teams: Team[]
  treasureTiers: TreasureTier[]
  mergeRules: MergeRule[]
  milestones: Milestone[]
  compassBundles: { packKey: string; label: string; compasses: number }[]
}
type VerificationIssue = { id: string; summary: string; canonicalAction: string }
type VoyageMeta = {
  _meta: { datasetId: string; trust: { strategy: string; treasureMergePremiumOutcome: string } }
  verificationIssues: VerificationIssue[]
}
type VoyageStrategy = {
  confidence: 'community_guidance'
  principles: { key: string; text: string }[]
  playerProfiles: { profile: 'f2p' | 'low_spender' | 'heavy_spender'; guidance: string[] }[]
  dailyRoutine: { morning: string[]; midday: string[]; beforeBed: string[] }
}
type VoyageGuideData = { event: VoyageEvent; meta: VoyageMeta; strategy: VoyageStrategy }

async function fetchJson(path: string): Promise<unknown> {
  const response = await fetch(path, { headers: { accept: 'application/json' } })
  if (!response.ok) throw new Error(`Unable to load governed Voyage data (${response.status}).`)
  return response.json()
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function parseVoyageGuideData(eventValue: unknown, metaValue: unknown, strategyValue: unknown): VoyageGuideData {
  if (!isRecord(eventValue) || eventValue.eventKey !== 'voyage-of-light') throw new Error('Voyage event data failed its identity check.')
  if (!isRecord(eventValue.voyage) || eventValue.voyage.durationHours !== 8) throw new Error('Voyage duration is outside the governed contract.')
  if (!isRecord(eventValue.compass) || eventValue.compass.hoursReducedPerCompass !== 1) throw new Error('Compass timing is outside the governed contract.')
  if (!Array.isArray(eventValue.teams) || eventValue.teams.length !== 4) throw new Error('Voyage team coverage is incomplete.')
  if (!Array.isArray(eventValue.milestones) || eventValue.milestones.length !== 7) throw new Error('Voyage milestone coverage is incomplete.')
  if (!Array.isArray(eventValue.mergeRules) || eventValue.mergeRules.length !== 2) throw new Error('Voyage merge rules are incomplete.')
  const premiumRule = eventValue.mergeRules[1]
  if (!isRecord(premiumRule) || premiumRule.status !== 'conflicted' || premiumRule.outcome !== null) throw new Error('The unresolved Premium merge outcome was unexpectedly canonicalised.')

  if (!isRecord(metaValue) || !isRecord(metaValue._meta) || metaValue._meta.datasetId !== 'kingshot-voyage-of-light') throw new Error('Voyage metadata failed its identity check.')
  if (!Array.isArray(metaValue.verificationIssues) || metaValue.verificationIssues.length !== 3) throw new Error('Voyage verification issues are incomplete.')
  if (!isRecord(strategyValue) || strategyValue.confidence !== 'community_guidance') throw new Error('Voyage strategy trust classification is invalid.')

  return {
    event: eventValue as VoyageEvent,
    meta: metaValue as VoyageMeta,
    strategy: strategyValue as VoyageStrategy,
  }
}

function formatProfile(value: VoyageStrategy['playerProfiles'][number]['profile']): string {
  if (value === 'f2p') return 'F2P'
  if (value === 'low_spender') return 'Low spender'
  return 'Heavy spender'
}

function formatUnlock(team: Team): string {
  if (team.unlock.kind === 'free') return 'Free'
  if (team.unlock.currency === 'gems') return `${team.unlock.amount.toLocaleString('en-GB')} Gems`
  return `${team.unlock.currency ?? ''}${team.unlock.amount}`
}

export default function VoyageOfLightGuidePage() {
  const [data, setData] = useState<VoyageGuideData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentVoyages, setCurrentVoyages] = useState(0)
  const [targetVoyages, setTargetVoyages] = useState(60)
  const [activeTeams, setActiveTeams] = useState(1)
  const [compasses, setCompasses] = useState(0)

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Kingshot Voyage of Light Guide & Planner | Kingshot Forge'
    return () => { document.title = previousTitle }
  }, [])

  useEffect(() => {
    let active = true
    Promise.all([
      fetchJson('/data/voyage-of-light/event.json'),
      fetchJson('/data/voyage-of-light/meta.json'),
      fetchJson('/data/voyage-of-light/strategy.json'),
    ])
      .then(([eventValue, metaValue, strategyValue]) => parseVoyageGuideData(eventValue, metaValue, strategyValue))
      .then((next) => { if (active) setData(next) })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'Voyage data is unavailable.') })
    return () => { active = false }
  }, [])

  const plan = useMemo(() => calculateVoyagePlan({
    currentVoyages,
    targetVoyages,
    activeTeams,
    compasses,
    voyageHours: data?.event.voyage.durationHours ?? 8,
    hoursReducedPerCompass: data?.event.compass.hoursReducedPerCompass ?? 1,
  }), [activeTeams, compasses, currentVoyages, data, targetVoyages])

  if (error) {
    return <main className="voyage-guide"><div className="voyage-guide__status" role="alert"><strong>Voyage guide unavailable</strong><p>{error}</p><Link to="/guides">Return to Guides</Link></div></main>
  }

  if (!data) return <main className="voyage-guide"><p className="voyage-guide__status" role="status">Loading governed Voyage of Light data…</p></main>

  const { event, meta, strategy } = data
  const commonMerge = event.mergeRules[0]
  const premiumMerge = event.mergeRules[1]

  return (
    <main className="voyage-guide">
      <nav className="voyage-guide__breadcrumbs" aria-label="Breadcrumb"><Link to="/companion">Companion</Link><span aria-hidden="true">›</span><Link to="/guides">Guides</Link><span aria-hidden="true">›</span><span>Voyage of Light</span></nav>

      <article>
        <header className="voyage-guide__hero">
          <p className="eyebrow">Event guide · Voyage of Light</p>
          <h1>Voyage of Light guide & milestone planner</h1>
          <p>Plan Voyager Team uptime, Compass use and milestone progress from Forge’s governed Voyage dataset. Source conflicts stay visible instead of being turned into fake certainty.</p>
          <div className="voyage-guide__tags"><span>~{event.phases.activeVoyaging.durationDaysApprox} active days</span><span>{event.voyage.durationHours}-hour voyages</span><span>4 teams</span><span>1 Compass = 1 hour</span><span>350-voyage final milestone</span></div>
        </header>

        <div className="voyage-guide__source" role="note"><strong>Trust boundary:</strong> repeatable mechanics and milestone rewards come from the governed VOYAGE-001A source. Team 2–4 unlock prices remain source-claimed/unverified, and strategy is community guidance.</div>

        <section className="voyage-guide__panel" id="planner">
          <p className="eyebrow">Milestone planner</p><h2>How far are you from your next target?</h2>
          <div className="voyage-guide__planner-grid">
            <label><span>Current completed voyages</span><input type="number" min="0" max="350" value={currentVoyages} onChange={(eventValue) => setCurrentVoyages(Number(eventValue.target.value))} /></label>
            <label><span>Target milestone</span><select value={targetVoyages} onChange={(eventValue) => setTargetVoyages(Number(eventValue.target.value))}>{event.milestones.map((milestone) => <option key={milestone.voyages} value={milestone.voyages}>{milestone.voyages} voyages</option>)}</select></label>
            <label><span>Active Voyager Teams</span><select value={activeTeams} onChange={(eventValue) => setActiveTeams(Number(eventValue.target.value))}>{[1, 2, 3, 4].map((team) => <option key={team} value={team}>{team}</option>)}</select></label>
            <label><span>Compasses available</span><input type="number" min="0" value={compasses} onChange={(eventValue) => setCompasses(Number(eventValue.target.value))} /></label>
          </div>
          <div className="voyage-guide__result-grid" aria-live="polite">
            <article><strong>{plan.remainingVoyages}</strong><span>voyages remaining</span></article>
            <article><strong>{plan.dispatchRounds}</strong><span>ideal dispatch rounds</span></article>
            <article><strong>{plan.baselineHours}h</strong><span>baseline elapsed time</span></article>
            <article><strong>{plan.compassHoursAvailable}h</strong><span>voyage-time reduction covered</span></article>
          </div>
          <p className="voyage-guide__planner-note">Baseline time is an idealised planning estimate: it assumes all selected teams are continuously available, dispatched together and experience no downtime. Compass coverage is shown as voyage-hours because Compasses reduce individual voyage timers; it is not presented as a guaranteed real-world completion time.</p>
          {plan.remainingVoyages > 0 && <p className="voyage-guide__planner-note"><strong>Acceleration reference:</strong> your current Compasses can fully cover {plan.fullyAcceleratedVoyages} complete {event.voyage.durationHours}-hour voyage{plan.fullyAcceleratedVoyages === 1 ? '' : 's'}{plan.partialVoyageHoursReduced ? ` plus ${plan.partialVoyageHoursReduced} hour${plan.partialVoyageHoursReduced === 1 ? '' : 's'} of another` : ''}. Finishing every remaining target voyage instantly from a fresh {event.voyage.durationHours}-hour timer would require {plan.compassesForImmediateCompletion.toLocaleString('en-GB')} Compasses.</p>}
        </section>

        <section className="voyage-guide__panel" id="milestones">
          <p className="eyebrow">Governed rewards</p><h2>Voyage milestones</h2>
          <div className="voyage-guide__table-wrap"><table><thead><tr><th>Voyages</th><th>Reward</th></tr></thead><tbody>{event.milestones.map((milestone) => <tr key={milestone.voyages}><td><strong>{milestone.voyages}</strong></td><td>{milestone.rewards.map((reward) => `${reward.label} ×${reward.quantity}`).join(', ')}</td></tr>)}</tbody></table></div>
        </section>

        <section className="voyage-guide__panel" id="teams">
          <p className="eyebrow">Voyager Teams</p><h2>More teams increase passive throughput</h2>
          <div className="voyage-guide__cards">{event.teams.map((team) => <article key={team.team}><span className="voyage-guide__team-number">Team {team.team}</span><h3>{formatUnlock(team)}</h3><p>{team.status === 'source_supported' ? 'Source-supported unlock.' : 'Price retained from the supplied guide, but explicitly not independently verified.'}</p></article>)}</div>
        </section>

        <section className="voyage-guide__panel" id="treasure">
          <p className="eyebrow">Tidal Treasure</p><h2>Merge only what Forge can support</h2>
          <div className="voyage-guide__tiers">{event.treasureTiers.map((tier) => <span key={tier.key}>{tier.name}{tier.terminal ? ' · terminal tier' : ''}</span>)}</div>
          <p><strong>Governed merge:</strong> {commonMerge.count} Common Tidal Treasures merge into 1 {commonMerge.outcome?.to === 'premium' ? 'Premium Tidal Treasure' : 'Premium treasure'}.</p>
          <div className="voyage-guide__warning"><strong>Premium outcome unresolved.</strong> The supplied source conflicts over what happens when {premiumMerge.count} Premium treasures are merged. Forge therefore publishes no Exquisite/Majestic probability or player-choice mechanic yet.</div>
        </section>

        <section className="voyage-guide__panel" id="compasses">
          <p className="eyebrow">Compass planning</p><h2>Compasses skip hours, not voyages</h2>
          <p>One Compass reduces one voyage by exactly {event.compass.hoursReducedPerCompass} hour. The source also supports the event’s Complete All control, which consumes enough Compasses to finish ongoing voyages.</p>
          <div className="voyage-guide__table-wrap"><table><thead><tr><th>Source-listed pack</th><th>Compasses</th></tr></thead><tbody>{event.compassBundles.map((bundle) => <tr key={bundle.packKey}><td>{bundle.label}</td><td>{bundle.compasses.toLocaleString('en-GB')}</td></tr>)}</tbody></table></div>
        </section>

        <section className="voyage-guide__panel" id="strategy">
          <p className="eyebrow">Community guidance</p><h2>Practical strategy without pretending it is a mechanic</h2>
          <div className="voyage-guide__cards">{strategy.principles.map((principle) => <article key={principle.key}><p>{principle.text}</p></article>)}</div>
          <div className="voyage-guide__profiles">{strategy.playerProfiles.map((profile) => <article key={profile.profile}><h3>{formatProfile(profile.profile)}</h3><ul>{profile.guidance.map((item) => <li key={item}>{item}</li>)}</ul></article>)}</div>
        </section>

        <section className="voyage-guide__panel" id="verification">
          <p className="eyebrow">Open verification</p><h2>What Forge is deliberately not claiming yet</h2>
          <div className="voyage-guide__issues">{meta.verificationIssues.map((issue) => <article key={issue.id}><h3>{issue.summary}</h3><p>{issue.canonicalAction}</p></article>)}</div>
          <p className="voyage-guide__planner-note">Current strategy classification: <strong>{strategy.confidence.replace('_', ' ')}</strong>. Premium merge trust remains <strong>{meta._meta.trust.treasureMergePremiumOutcome.replaceAll('_', ' ')}</strong>.</p>
        </section>
      </article>
    </main>
  )
}
