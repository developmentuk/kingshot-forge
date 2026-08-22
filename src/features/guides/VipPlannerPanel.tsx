import { useEffect, useMemo, useState } from 'react'
import { parseVipGuideData, type VipBenefit, type VipGuideData, type VipSpecialPack } from './vipGuideData'
import { calculateVipPlan } from './vipPlanner'
import './VipPlannerPanel.css'

async function fetchJson(path: string): Promise<unknown> {
  const response = await fetch(path, { headers: { accept: 'application/json' } })
  if (!response.ok) throw new Error(`Unable to load governed VIP data (${response.status}).`)
  return response.json()
}

function formatBenefitValue(benefit: Pick<VipBenefit, 'value' | 'unit' | 'status'>): string {
  if (benefit.status === 'conflicted' || benefit.value === null) return 'Unresolved'
  if (benefit.unit === 'percent') return `+${benefit.value}%`
  if (benefit.unit === 'resources') return `+${benefit.value.toLocaleString('en-GB')}`
  if (benefit.unit === 'additional_slots') return `+${benefit.value}`
  return `${benefit.value}h`
}

function formatChange(fromValue: number | null, benefit: VipBenefit): string {
  if (benefit.status === 'conflicted' || benefit.value === null) return 'Target value unresolved'
  if (fromValue === null) return `New at target: ${formatBenefitValue(benefit)}`
  const from = formatBenefitValue({ value: fromValue, unit: benefit.unit, status: 'source_supported' })
  return `${from} → ${formatBenefitValue(benefit)}`
}

function formatPrice(pack: VipSpecialPack): string {
  if (pack.priceAmount === null) return 'Unresolved'
  return `${pack.priceAmount.toFixed(2)} · currency not stated`
}

export default function VipPlannerPanel() {
  const [data, setData] = useState<VipGuideData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentLevel, setCurrentLevel] = useState(1)
  const [targetLevel, setTargetLevel] = useState(8)

  useEffect(() => {
    let active = true
    Promise.all([fetchJson('/data/vip/levels.json'), fetchJson('/data/vip/meta.json')])
      .then(([levels, meta]) => parseVipGuideData(levels, meta))
      .then((next) => { if (active) setData(next) })
      .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : 'VIP data is unavailable.') })
    return () => { active = false }
  }, [])

  const plan = useMemo(() => data ? calculateVipPlan(data.levels, currentLevel, targetLevel) : null, [currentLevel, data, targetLevel])

  if (error) return <div className="vip-planner__status" role="alert"><strong>VIP planner unavailable</strong><p>{error}</p></div>
  if (!data || !plan) return <p className="vip-planner__status" role="status">Loading governed VIP data…</p>

  const pack = plan.target.specialPack
  const targetBenefitMap = new Map(plan.target.benefits.map((benefit) => [benefit.key, benefit]))

  return (
    <div className="vip-planner">
      <div className="vip-planner__controls">
        <label><span>Current VIP level</span><select value={currentLevel} onChange={(event) => setCurrentLevel(Number(event.target.value))}>{data.levels.map((row) => <option key={row.level} value={row.level}>VIP {row.level}</option>)}</select></label>
        <label><span>Target VIP level</span><select value={targetLevel} onChange={(event) => setTargetLevel(Number(event.target.value))}>{data.levels.map((row) => <option key={row.level} value={row.level}>VIP {row.level}</option>)}</select></label>
      </div>

      <div className="vip-planner__summary" aria-live="polite">
        <article><strong>{plan.requiredVipXp.toLocaleString('en-GB')}</strong><span>derived VIP XP across published rows</span></article>
        <article><strong>{plan.gemEquivalent.toLocaleString('en-GB')}</strong><span>derived Gem equivalent at 1 VIP point = 2 Gems</span></article>
        <article><strong>{plan.levelsCrossed.length}</strong><span>level requirements crossed</span></article>
        <article><strong>{plan.target.estimatedF2pTime?.text ?? 'Not published'}</strong><span>target F2P timing · community guidance only</span></article>
      </div>

      <p className="vip-planner__note"><strong>Important:</strong> these totals are a derived sum of the published per-level requirements between your selections. Forge does not publish a canonical cumulative VIP XP field because the VIP 12 source wording is unresolved.</p>

      <div className="vip-planner__columns">
        <section>
          <h3>What changes by VIP {plan.targetLevel}</h3>
          {plan.benefitChanges.length ? <ul className="vip-planner__list">{plan.benefitChanges.map((change) => {
            const targetBenefit = targetBenefitMap.get(change.key)
            if (!targetBenefit) return null
            return <li key={change.key}><strong>{change.label}</strong><span>{formatChange(change.fromValue, targetBenefit)}</span>{change.status === 'conflicted' && <em>Source conflict retained</em>}</li>
          })}</ul> : <p>No higher target is selected, so there are no progression changes to compare.</p>}
        </section>

        <section>
          <h3>VIP {plan.targetLevel} active benefits</h3>
          <ul className="vip-planner__list">{plan.target.benefits.map((benefit) => <li key={benefit.key}><strong>{benefit.label}</strong><span>{formatBenefitValue(benefit)}</span>{benefit.status === 'conflicted' && <em>Unresolved source conflict</em>}</li>)}</ul>
        </section>
      </div>

      <div className="vip-planner__columns">
        <section>
          <h3>VIP {plan.targetLevel} daily free bundle</h3>
          <ul className="vip-planner__list">{plan.target.dailyFreeBundle.map((item) => <li key={item.itemKey}><strong>{item.label}</strong><span>×{item.quantity} · {item.rarity}</span></li>)}</ul>
        </section>

        <section>
          <h3>VIP {plan.targetLevel} Special Pack</h3>
          <dl className="vip-planner__pack">
            <div><dt>Listed price</dt><dd>{formatPrice(pack)}</dd></div>
            <div><dt>Gems</dt><dd>{pack.gems.toLocaleString('en-GB')}</dd></div>
            <div><dt>{pack.heroShards.hero} Shards</dt><dd>{pack.heroShards.quantity.toLocaleString('en-GB')}</dd></div>
            <div><dt>VIP XP</dt><dd>{pack.vipXp.totalXp.toLocaleString('en-GB')}</dd></div>
            <div><dt>Hero XP</dt><dd>{pack.heroXp.totalXp.toLocaleString('en-GB')}</dd></div>
            <div><dt>Speedups</dt><dd>{pack.speedupsHours.construction}h construction · {pack.speedupsHours.research}h research · {pack.speedupsHours.training}h training</dd></div>
            <div><dt>Alliance Gift</dt><dd>Tier {pack.allianceGiftTier}</dd></div>
            {pack.savingPercent !== null && <div><dt>Source-listed saving</dt><dd>{pack.savingPercent}%</dd></div>}
            {pack.topupPoints !== null && <div><dt>Top-up points</dt><dd>{pack.topupPoints.toLocaleString('en-GB')}</dd></div>}
          </dl>
          <p className="vip-planner__note">Pack currency is deliberately not inferred. VIP 8 price remains unresolved because the supplied source conflicts.</p>
        </section>
      </div>

      <section className="vip-planner__issues">
        <h3>Open VIP verification issues</h3>
        {data.meta.verificationIssues.map((issue) => <article key={issue.id}><strong>{issue.summary}</strong><p>{issue.canonicalAction}</p></article>)}
      </section>
    </div>
  )
}
