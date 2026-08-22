export type VipBenefitStatus = 'source_supported' | 'conflicted'
export type VipBenefit = {
  key: string
  label: string
  value: number | null
  unit: 'percent' | 'resources' | 'additional_slots' | 'hours'
  status: VipBenefitStatus
}
export type VipBundleItem = {
  itemKey: string
  label: string
  quantity: number
  rarity: 'rare' | 'epic' | 'mythic' | null
}
export type VipSpecialPack = {
  gems: number
  heroShards: { hero: 'Helga' | 'Amadeus'; quantity: number }
  vipXp: { quantity: number; unitXp: number; totalXp: number }
  heroXp: { quantity: number; unitXp: number; totalXp: number }
  speedupsHours: { construction: number; research: number; training: number }
  allianceGiftTier: number
  priceAmount: number | null
  priceCurrency: null
  savingPercent: number | null
  topupPoints: number | null
}
export type VipLevel = {
  level: number
  xpToReach: number
  gemsEquivalent: number
  estimatedF2pTime: { text: string; confidence: 'community_guidance' } | null
  benefits: VipBenefit[]
  dailyFreeBundle: VipBundleItem[]
  specialPack: VipSpecialPack
}
export type VipVerificationIssue = {
  id: string
  summary: string
  canonicalAction: string
}
export type VipGuideMeta = {
  _meta: {
    datasetId: 'kingshot-vip'
    trust: {
      benefits: 'source_governed_except_explicit_conflicts'
      dailyBundles: 'owner_supplied_source'
      specialPacks: 'owner_supplied_source_except_explicit_conflicts'
      estimatedF2pTime: 'community_guidance'
      currency: 'not_explicit_in_detailed_pack_rows'
      cumulativeVipXp: 'not_published_pending_reconciliation'
    }
  }
  verificationIssues: VipVerificationIssue[]
}
export type VipGuideData = { levels: VipLevel[]; meta: VipGuideMeta }

const issueIds = [
  'vip8-special-pack-price',
  'vip12-squad-attack-health',
  'vip12-cumulative-xp-wording',
  'amadeus-shard-aggregate',
] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (!isRecord(value)) throw new Error(`${label} must be an object.`)
  return value
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value) throw new Error(`${label} must be a non-empty string.`)
  return value
}

function requireInteger(value: unknown, label: string): number {
  if (!Number.isInteger(value) || Number(value) < 0) throw new Error(`${label} must be a non-negative integer.`)
  return Number(value)
}

function requirePositiveInteger(value: unknown, label: string): number {
  if (!Number.isInteger(value) || Number(value) < 1) throw new Error(`${label} must be a positive integer.`)
  return Number(value)
}

function requireNullableNumber(value: unknown, label: string): number | null {
  if (value === null) return null
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) throw new Error(`${label} must be null or a non-negative number.`)
  return value
}

function requireNullableInteger(value: unknown, label: string): number | null {
  if (value === null) return null
  return requireInteger(value, label)
}

function validateBenefit(value: unknown, label: string): VipBenefit {
  const benefit = requireRecord(value, label)
  const key = requireString(benefit.key, `${label}.key`)
  const benefitLabel = requireString(benefit.label, `${label}.label`)
  const unit = benefit.unit
  if (!['percent', 'resources', 'additional_slots', 'hours'].includes(String(unit))) throw new Error(`${label}.unit is invalid.`)
  if (benefit.status !== 'source_supported' && benefit.status !== 'conflicted') throw new Error(`${label}.status is invalid.`)
  const numericValue = requireNullableNumber(benefit.value, `${label}.value`)
  if (benefit.status === 'conflicted' && numericValue !== null) throw new Error(`${label} must remain null while conflicted.`)
  if (benefit.status === 'source_supported' && numericValue === null) throw new Error(`${label} must have a value when source-supported.`)
  return { key, label: benefitLabel, value: numericValue, unit: unit as VipBenefit['unit'], status: benefit.status }
}

function validateBundleItem(value: unknown, label: string): VipBundleItem {
  const item = requireRecord(value, label)
  const rarity = item.rarity
  if (rarity !== null && rarity !== 'rare' && rarity !== 'epic' && rarity !== 'mythic') throw new Error(`${label}.rarity is invalid.`)
  return {
    itemKey: requireString(item.itemKey, `${label}.itemKey`),
    label: requireString(item.label, `${label}.label`),
    quantity: requirePositiveInteger(item.quantity, `${label}.quantity`),
    rarity,
  }
}

function validateXpBlock(value: unknown, label: string): VipSpecialPack['vipXp'] {
  const block = requireRecord(value, label)
  const quantity = requirePositiveInteger(block.quantity, `${label}.quantity`)
  const unitXp = requirePositiveInteger(block.unitXp, `${label}.unitXp`)
  const totalXp = requirePositiveInteger(block.totalXp, `${label}.totalXp`)
  if (quantity * unitXp !== totalXp) throw new Error(`${label}.totalXp must equal quantity × unitXp.`)
  return { quantity, unitXp, totalXp }
}

function validateSpecialPack(value: unknown, level: number): VipSpecialPack {
  const label = `VIP ${level} special pack`
  const pack = requireRecord(value, label)
  const heroShards = requireRecord(pack.heroShards, `${label}.heroShards`)
  const expectedHero = level <= 6 ? 'Helga' : 'Amadeus'
  if (heroShards.hero !== expectedHero) throw new Error(`${label} must use ${expectedHero} shards.`)
  const speedups = requireRecord(pack.speedupsHours, `${label}.speedupsHours`)
  if (pack.priceCurrency !== null) throw new Error(`${label}.priceCurrency must remain null because the source does not state a currency.`)
  const allianceGiftTier = requirePositiveInteger(pack.allianceGiftTier, `${label}.allianceGiftTier`)
  if (allianceGiftTier > 5) throw new Error(`${label}.allianceGiftTier must remain between 1 and 5.`)
  return {
    gems: requireInteger(pack.gems, `${label}.gems`),
    heroShards: { hero: expectedHero, quantity: requirePositiveInteger(heroShards.quantity, `${label}.heroShards.quantity`) },
    vipXp: validateXpBlock(pack.vipXp, `${label}.vipXp`),
    heroXp: validateXpBlock(pack.heroXp, `${label}.heroXp`),
    speedupsHours: {
      construction: requireInteger(speedups.construction, `${label}.speedupsHours.construction`),
      research: requireInteger(speedups.research, `${label}.speedupsHours.research`),
      training: requireInteger(speedups.training, `${label}.speedupsHours.training`),
    },
    allianceGiftTier,
    priceAmount: requireNullableNumber(pack.priceAmount, `${label}.priceAmount`),
    priceCurrency: null,
    savingPercent: requireNullableInteger(pack.savingPercent, `${label}.savingPercent`),
    topupPoints: requireNullableInteger(pack.topupPoints, `${label}.topupPoints`),
  }
}

function validateLevel(value: unknown, expectedLevel: number): VipLevel {
  const row = requireRecord(value, `VIP ${expectedLevel}`)
  if (row.level !== expectedLevel) throw new Error(`VIP rows must remain sequential; expected level ${expectedLevel}.`)
  const xpToReach = requireInteger(row.xpToReach, `VIP ${expectedLevel}.xpToReach`)
  const gemsEquivalent = requireInteger(row.gemsEquivalent, `VIP ${expectedLevel}.gemsEquivalent`)
  if (gemsEquivalent !== xpToReach * 2) throw new Error(`VIP ${expectedLevel} must preserve the exact 1:2 XP-to-Gem relationship.`)

  let estimatedF2pTime: VipLevel['estimatedF2pTime'] = null
  if (row.estimatedF2pTime !== null) {
    const estimate = requireRecord(row.estimatedF2pTime, `VIP ${expectedLevel}.estimatedF2pTime`)
    if (estimate.confidence !== 'community_guidance') throw new Error(`VIP ${expectedLevel} F2P timing must remain community_guidance.`)
    estimatedF2pTime = { text: requireString(estimate.text, `VIP ${expectedLevel}.estimatedF2pTime.text`), confidence: 'community_guidance' }
  }

  if (!Array.isArray(row.benefits) || row.benefits.length < 2) throw new Error(`VIP ${expectedLevel}.benefits must contain at least two entries.`)
  if (!Array.isArray(row.dailyFreeBundle) || row.dailyFreeBundle.length < 2) throw new Error(`VIP ${expectedLevel}.dailyFreeBundle must contain at least two entries.`)

  return {
    level: expectedLevel,
    xpToReach,
    gemsEquivalent,
    estimatedF2pTime,
    benefits: row.benefits.map((benefit, index) => validateBenefit(benefit, `VIP ${expectedLevel}.benefits[${index}]`)),
    dailyFreeBundle: row.dailyFreeBundle.map((item, index) => validateBundleItem(item, `VIP ${expectedLevel}.dailyFreeBundle[${index}]`)),
    specialPack: validateSpecialPack(row.specialPack, expectedLevel),
  }
}

function validateMeta(value: unknown): VipGuideMeta {
  const meta = requireRecord(value, 'VIP metadata')
  const metaBlock = requireRecord(meta._meta, 'VIP metadata._meta')
  if (metaBlock.datasetId !== 'kingshot-vip') throw new Error('VIP metadata dataset identity is invalid.')
  const trust = requireRecord(metaBlock.trust, 'VIP metadata trust')
  const expectedTrust = {
    benefits: 'source_governed_except_explicit_conflicts',
    dailyBundles: 'owner_supplied_source',
    specialPacks: 'owner_supplied_source_except_explicit_conflicts',
    estimatedF2pTime: 'community_guidance',
    currency: 'not_explicit_in_detailed_pack_rows',
    cumulativeVipXp: 'not_published_pending_reconciliation',
  } as const
  for (const [key, expected] of Object.entries(expectedTrust)) {
    if (trust[key] !== expected) throw new Error(`VIP metadata trust.${key} must remain ${expected}.`)
  }
  if (!Array.isArray(meta.verificationIssues) || meta.verificationIssues.length !== issueIds.length) throw new Error('VIP verification issue coverage is incomplete.')
  const verificationIssues = meta.verificationIssues.map((valueItem, index) => {
    const issue = requireRecord(valueItem, `VIP verificationIssues[${index}]`)
    if (issue.id !== issueIds[index]) throw new Error(`VIP verification issue ${index + 1} must remain ${issueIds[index]}.`)
    if (issue.status !== 'open') throw new Error(`VIP verification issue ${issueIds[index]} must remain open.`)
    return {
      id: issueIds[index],
      summary: requireString(issue.summary, `VIP verificationIssues[${index}].summary`),
      canonicalAction: requireString(issue.canonicalAction, `VIP verificationIssues[${index}].canonicalAction`),
    }
  })
  return { _meta: { datasetId: 'kingshot-vip', trust: expectedTrust }, verificationIssues }
}

export function parseVipGuideData(levelsValue: unknown, metaValue: unknown): VipGuideData {
  if (!Array.isArray(levelsValue) || levelsValue.length !== 12) throw new Error('VIP level coverage must remain exactly 12 rows.')
  const levels = levelsValue.map((row, index) => validateLevel(row, index + 1))
  if (levels[7].specialPack.priceAmount !== null) throw new Error('VIP 8 special pack price must remain unresolved/null.')

  const vip12Attack = levels[11].benefits.find((benefit) => benefit.key === 'squad_attack')
  const vip12Health = levels[11].benefits.find((benefit) => benefit.key === 'squad_health')
  if (!vip12Attack || vip12Attack.status !== 'conflicted' || vip12Attack.value !== null) throw new Error('VIP 12 Squad Attack must remain null/conflicted.')
  if (!vip12Health || vip12Health.status !== 'conflicted' || vip12Health.value !== null) throw new Error('VIP 12 Squad Health must remain null/conflicted.')

  return { levels, meta: validateMeta(metaValue) }
}
