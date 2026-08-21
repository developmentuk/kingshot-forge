export type Reward = { itemKey: string; label: string; quantity: number }
export type Milestone = { voyages: number; rewards: Reward[] }
export type Team = {
  team: number
  unlock: { kind: string; amount: number; currency: string | null }
  status: 'source_supported' | 'source_claimed_unverified'
}
export type TreasureTier = { key: string; name: string; terminal: boolean }
export type MergeRule = {
  from: string
  count: number
  outcome: { kind: 'fixed'; to: string } | null
  status: 'source_supported' | 'conflicted'
  verificationIssueId?: string
}
export type VoyageEvent = {
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
export type VerificationIssue = { id: string; summary: string; canonicalAction: string }
export type VoyageMeta = {
  _meta: { datasetId: string; trust: { strategy: string; treasureMergePremiumOutcome: string } }
  verificationIssues: VerificationIssue[]
}
export type VoyageStrategy = {
  confidence: 'community_guidance'
  principles: { key: string; text: string }[]
  playerProfiles: { profile: 'f2p' | 'low_spender' | 'heavy_spender'; guidance: string[] }[]
  dailyRoutine: { morning: string[]; midday: string[]; beforeBed: string[] }
}
export type VoyageGuideData = { event: VoyageEvent; meta: VoyageMeta; strategy: VoyageStrategy }

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isInteger(value: unknown, minimum = 0): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= minimum
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isStringOrNull(value: unknown): value is string | null {
  return value === null || typeof value === 'string'
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isNonEmptyString)
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

const expectedMilestones = [1, 5, 20, 60, 120, 200, 350]
const expectedProfiles = ['f2p', 'low_spender', 'heavy_spender']
const expectedVerificationIssues = ['premium-merge-outcome', 'daily-free-compass-wording', 'auto-voyage-speedup-wording']

export function parseVoyageGuideData(eventValue: unknown, metaValue: unknown, strategyValue: unknown): VoyageGuideData {
  assert(isRecord(eventValue) && eventValue.eventKey === 'voyage-of-light', 'Voyage event data failed its identity check.')

  assert(isRecord(eventValue.phases), 'Voyage phase data is invalid.')
  const activeVoyaging = eventValue.phases.activeVoyaging
  const collectionWindow = eventValue.phases.collectionWindow
  assert(isRecord(activeVoyaging) && isInteger(activeVoyaging.durationDaysApprox, 1) && typeof activeVoyaging.dispatchAllowed === 'boolean', 'Active Voyage phase data is invalid.')
  assert(isRecord(collectionWindow)
    && isInteger(collectionWindow.durationDays, 1)
    && typeof collectionWindow.dispatchAllowed === 'boolean'
    && typeof collectionWindow.treasureOpenAllowed === 'boolean'
    && typeof collectionWindow.treasureMergeAllowed === 'boolean'
    && typeof collectionWindow.autoOpenUnopenedAtEnd === 'boolean', 'Voyage collection-window data is invalid.')

  assert(isRecord(eventValue.voyage)
    && eventValue.voyage.durationHours === 8
    && eventValue.voyage.treasuresPerCompletedVoyage === 1, 'Voyage duration is outside the governed contract.')
  assert(isRecord(eventValue.compass)
    && eventValue.compass.hoursReducedPerCompass === 1
    && typeof eventValue.compass.completeAllAvailable === 'boolean', 'Compass timing is outside the governed contract.')

  assert(Array.isArray(eventValue.teams) && eventValue.teams.length === 4, 'Voyage team coverage is incomplete.')
  eventValue.teams.forEach((team, index) => {
    assert(isRecord(team) && team.team === index + 1, `Voyage Team ${index + 1} identity is invalid.`)
    assert(team.status === 'source_supported' || team.status === 'source_claimed_unverified', `Voyage Team ${index + 1} trust state is invalid.`)
    assert(isRecord(team.unlock)
      && isNonEmptyString(team.unlock.kind)
      && isInteger(team.unlock.amount)
      && isStringOrNull(team.unlock.currency), `Voyage Team ${index + 1} unlock data is invalid.`)
  })

  assert(Array.isArray(eventValue.treasureTiers) && eventValue.treasureTiers.length === 4, 'Voyage treasure-tier coverage is incomplete.')
  eventValue.treasureTiers.forEach((tier, index) => {
    assert(isRecord(tier)
      && isNonEmptyString(tier.key)
      && isNonEmptyString(tier.name)
      && typeof tier.terminal === 'boolean', `Voyage treasure tier ${index + 1} is invalid.`)
  })

  assert(Array.isArray(eventValue.mergeRules) && eventValue.mergeRules.length === 2, 'Voyage merge rules are incomplete.')
  const commonRule = eventValue.mergeRules[0]
  const premiumRule = eventValue.mergeRules[1]
  assert(isRecord(commonRule)
    && commonRule.from === 'common'
    && commonRule.count === 3
    && commonRule.status === 'source_supported'
    && isRecord(commonRule.outcome)
    && commonRule.outcome.kind === 'fixed'
    && commonRule.outcome.to === 'premium', 'The Common-to-Premium merge rule is outside the governed contract.')
  assert(isRecord(premiumRule)
    && premiumRule.from === 'premium'
    && premiumRule.count === 3
    && premiumRule.status === 'conflicted'
    && premiumRule.outcome === null
    && premiumRule.verificationIssueId === 'premium-merge-outcome', 'The unresolved Premium merge outcome was unexpectedly canonicalised.')

  assert(Array.isArray(eventValue.milestones) && eventValue.milestones.length === expectedMilestones.length, 'Voyage milestone coverage is incomplete.')
  eventValue.milestones.forEach((milestone, index) => {
    assert(isRecord(milestone) && milestone.voyages === expectedMilestones[index], `Voyage milestone ${index + 1} is invalid.`)
    assert(Array.isArray(milestone.rewards) && milestone.rewards.length > 0, `Voyage milestone ${milestone.voyages} rewards are invalid.`)
    milestone.rewards.forEach((reward, rewardIndex) => {
      assert(isRecord(reward)
        && isNonEmptyString(reward.itemKey)
        && isNonEmptyString(reward.label)
        && isInteger(reward.quantity, 1), `Voyage milestone ${milestone.voyages} reward ${rewardIndex + 1} is invalid.`)
    })
  })

  assert(Array.isArray(eventValue.compassBundles) && eventValue.compassBundles.length === 5, 'Voyage Compass bundle coverage is incomplete.')
  eventValue.compassBundles.forEach((bundle, index) => {
    assert(isRecord(bundle)
      && isNonEmptyString(bundle.packKey)
      && isNonEmptyString(bundle.label)
      && isInteger(bundle.compasses, 1), `Voyage Compass bundle ${index + 1} is invalid.`)
  })

  assert(isRecord(metaValue) && isRecord(metaValue._meta) && metaValue._meta.datasetId === 'kingshot-voyage-of-light', 'Voyage metadata failed its identity check.')
  assert(isRecord(metaValue._meta.trust)
    && metaValue._meta.trust.strategy === 'community_guidance'
    && metaValue._meta.trust.treasureMergePremiumOutcome === 'not_published_pending_reconciliation', 'Voyage metadata trust boundary is invalid.')
  assert(Array.isArray(metaValue.verificationIssues) && metaValue.verificationIssues.length === expectedVerificationIssues.length, 'Voyage verification issues are incomplete.')
  metaValue.verificationIssues.forEach((issue, index) => {
    assert(isRecord(issue)
      && issue.id === expectedVerificationIssues[index]
      && isNonEmptyString(issue.summary)
      && isNonEmptyString(issue.canonicalAction), `Voyage verification issue ${index + 1} is invalid.`)
  })

  assert(isRecord(strategyValue) && strategyValue.confidence === 'community_guidance', 'Voyage strategy trust classification is invalid.')
  assert(Array.isArray(strategyValue.principles) && strategyValue.principles.length > 0, 'Voyage strategy principles are invalid.')
  strategyValue.principles.forEach((principle, index) => {
    assert(isRecord(principle) && isNonEmptyString(principle.key) && isNonEmptyString(principle.text), `Voyage strategy principle ${index + 1} is invalid.`)
  })
  assert(Array.isArray(strategyValue.playerProfiles) && strategyValue.playerProfiles.length === expectedProfiles.length, 'Voyage player-profile guidance is incomplete.')
  strategyValue.playerProfiles.forEach((profile, index) => {
    assert(isRecord(profile)
      && profile.profile === expectedProfiles[index]
      && isStringArray(profile.guidance)
      && profile.guidance.length > 0, `Voyage player profile ${index + 1} is invalid.`)
  })
  assert(isRecord(strategyValue.dailyRoutine)
    && isStringArray(strategyValue.dailyRoutine.morning)
    && isStringArray(strategyValue.dailyRoutine.midday)
    && isStringArray(strategyValue.dailyRoutine.beforeBed), 'Voyage daily-routine guidance is invalid.')

  return {
    event: eventValue as VoyageEvent,
    meta: metaValue as VoyageMeta,
    strategy: strategyValue as VoyageStrategy,
  }
}
