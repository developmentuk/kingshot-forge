import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const readJson = (path) => JSON.parse(readFileSync(resolve(root, path), 'utf8'))
const meta = readJson('public/data/voyage-of-light/meta.json')
const event = readJson('public/data/voyage-of-light/event.json')
const strategy = readJson('public/data/voyage-of-light/strategy.json')
const schema = readJson('public/data/voyage-of-light/schema.json')
const evidence = readJson('server/data-engine/source-assets/voyage-of-light/source-evidence.json')

const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
const assertRecord = (value, label) => assert.equal(isRecord(value), true, `${label} must be an object`)
const assertExactKeys = (value, keys, label) => {
  assertRecord(value, label)
  assert.deepEqual(Object.keys(value).sort(), [...keys].sort(), `${label} must contain only governed keys`)
}
const assertAllowedKeys = (value, keys, label) => {
  assertRecord(value, label)
  for (const key of Object.keys(value)) assert.ok(keys.includes(key), `${label} contains undeclared key ${key}`)
}
const assertString = (value, label) => assert.equal(typeof value === 'string' && value.length > 0, true, `${label} must be a non-empty string`)
const assertIntegerRange = (value, label, minimum, maximum = Number.MAX_SAFE_INTEGER) => {
  assert.equal(Number.isInteger(value) && value >= minimum && value <= maximum, true, `${label} must be an integer from ${minimum} to ${maximum}`)
}

const trust = {
  coreTiming: 'owner_supplied_source',
  milestoneRewards: 'owner_supplied_source',
  teamUnlockCosts: 'source_claimed_unverified',
  treasureMergeCommonToPremium: 'owner_supplied_source',
  treasureMergePremiumOutcome: 'not_published_pending_reconciliation',
  strategy: 'community_guidance',
}
const verificationIssueIds = [
  'premium-merge-outcome',
  'daily-free-compass-wording',
  'auto-voyage-speedup-wording',
]
const milestones = [
  [1, 'gear-boost-custom-chest', 'Gear Boost Custom Chest', 1],
  [5, 'forgehammer', 'Forgehammer', 12],
  [20, 'forgehammer', 'Forgehammer', 24],
  [60, 'gear-boost-custom-chest', 'Gear Boost Custom Chest', 2],
  [120, 'gear-boost-custom-chest', 'Gear Boost Custom Chest', 5],
  [200, 'gear-boost-custom-chest', 'Gear Boost Custom Chest', 6],
  [350, 'gear-boost-custom-chest', 'Gear Boost Custom Chest', 10],
]
const teams = [
  [1, 'free', 0, null, 'source_supported'],
  [2, 'gems', 2000, 'gems', 'source_claimed_unverified'],
  [3, 'gems', 10000, 'gems', 'source_claimed_unverified'],
  [4, 'paid_bundle', 5, '$', 'source_claimed_unverified'],
]
const tiers = [
  ['common', 'Common Tidal Treasure', false],
  ['premium', 'Premium Tidal Treasure', false],
  ['exquisite', 'Exquisite Tidal Treasure', true],
  ['majestic', 'Majestic Tidal Treasure', true],
]
const bundles = [
  ['common', 'Common Sails Aloft Pack', 100],
  ['uncommon', 'Uncommon Sails Aloft Pack', 160],
  ['rare', 'Rare Sails Aloft Pack', 300],
  ['epic', 'Epic Sails Aloft Pack', 600],
  ['team-4-backpack', 'Team 4 Backpack', 60],
]

const validateSourceClaim = (claim, label) => {
  const allowedKeys = ['location', 'meaning', 'exquisitePercent', 'majesticPercent', 'outcomes', 'text', 'hoursReducedPerCompass', 'resource']
  assertAllowedKeys(claim, allowedKeys, label)
  assertString(claim.location, `${label}.location`)
  assertString(claim.meaning, `${label}.meaning`)
  if ('exquisitePercent' in claim) assertIntegerRange(claim.exquisitePercent, `${label}.exquisitePercent`, 0, 100)
  if ('majesticPercent' in claim) assertIntegerRange(claim.majesticPercent, `${label}.majesticPercent`, 0, 100)
  if ('outcomes' in claim) {
    assert.equal(Array.isArray(claim.outcomes) && claim.outcomes.length === 2, true, `${label}.outcomes must contain exactly two governed entries`)
    for (const [index, outcome] of claim.outcomes.entries()) assert.ok(['exquisite', 'majestic'].includes(outcome), `${label}.outcomes[${index}] is unsupported`)
  }
  if ('text' in claim) assertString(claim.text, `${label}.text`)
  if ('hoursReducedPerCompass' in claim) assertIntegerRange(claim.hoursReducedPerCompass, `${label}.hoursReducedPerCompass`, 1)
  if ('resource' in claim) assertString(claim.resource, `${label}.resource`)
}

const validateMeta = (doc) => {
  assertExactKeys(doc, ['_meta', 'verificationIssues'], 'Voyage metadata document')
  assertExactKeys(doc._meta, ['schemaVersion', 'datasetId', 'title', 'description', 'sources', 'coverage', 'trust'], 'Voyage metadata core')
  assert.equal(doc._meta.schemaVersion, '1.0.0')
  assert.equal(doc._meta.datasetId, 'kingshot-voyage-of-light')
  assertString(doc._meta.title, 'Voyage metadata title')
  assertString(doc._meta.description, 'Voyage metadata description')
  assert.equal(Array.isArray(doc._meta.sources) && doc._meta.sources.length === 1, true, 'Voyage metadata must contain exactly one governed source')
  assertExactKeys(doc._meta.sources[0], ['kind', 'filename', 'received', 'role'], 'Voyage owner source')
  assert.equal(doc._meta.sources[0].kind, 'owner_supplied')
  assert.equal(doc._meta.sources[0].filename, 'Voyage of Light Guide.docx')
  assert.equal(doc._meta.sources[0].received, '2026-08-21')
  assertString(doc._meta.sources[0].role, 'Voyage owner source role')
  assertExactKeys(doc._meta.coverage, ['teams', 'treasureTiers', 'milestones', 'compassBundles'], 'Voyage coverage')
  assert.deepEqual(doc._meta.coverage, { teams: 4, treasureTiers: 4, milestones: 7, compassBundles: 5 })
  assertExactKeys(doc._meta.trust, Object.keys(trust), 'Voyage trust boundary')
  assert.deepEqual(doc._meta.trust, trust, 'Voyage trust boundary must match governed constants')
  assert.equal(Array.isArray(doc.verificationIssues) && doc.verificationIssues.length === 3, true, 'Voyage metadata must retain exactly three governed verification issues')
  for (const [index, issue] of doc.verificationIssues.entries()) {
    const label = `verificationIssues[${index}]`
    assertExactKeys(issue, ['id', 'status', 'field', 'summary', 'sourceClaims', 'canonicalAction'], label)
    assert.match(issue.id, /^[a-z0-9-]+$/)
    assert.equal(issue.status, 'open')
    for (const key of ['field', 'summary', 'canonicalAction']) assertString(issue[key], `${label}.${key}`)
    assert.equal(Array.isArray(issue.sourceClaims) && issue.sourceClaims.length >= 2, true, `${label}.sourceClaims must preserve competing evidence`)
    issue.sourceClaims.forEach((claim, claimIndex) => validateSourceClaim(claim, `${label}.sourceClaims[${claimIndex}]`))
  }
  assert.deepEqual(doc.verificationIssues.map((issue) => issue.id), verificationIssueIds)
}

const validateEvent = (doc) => {
  assertExactKeys(doc, ['eventKey', 'name', 'eventType', 'phases', 'voyage', 'compass', 'teams', 'treasureTiers', 'mergeRules', 'milestones', 'compassBundles'], 'Voyage event')
  assert.equal(doc.eventKey, 'voyage-of-light')
  assert.equal(doc.name, 'Voyage of Light')
  assert.equal(doc.eventType, 'individual_passive')
  assertExactKeys(doc.phases, ['activeVoyaging', 'collectionWindow'], 'Voyage phases')
  assertExactKeys(doc.phases.activeVoyaging, ['durationDaysApprox', 'dispatchAllowed'], 'Active voyaging phase')
  assert.deepEqual(doc.phases.activeVoyaging, { durationDaysApprox: 5, dispatchAllowed: true })
  assertExactKeys(doc.phases.collectionWindow, ['durationDays', 'dispatchAllowed', 'treasureOpenAllowed', 'treasureMergeAllowed', 'autoOpenUnopenedAtEnd'], 'Collection phase')
  assert.deepEqual(doc.phases.collectionWindow, { durationDays: 1, dispatchAllowed: false, treasureOpenAllowed: true, treasureMergeAllowed: true, autoOpenUnopenedAtEnd: true })
  assertExactKeys(doc.voyage, ['durationHours', 'treasuresPerCompletedVoyage'], 'Voyage timing')
  assert.deepEqual(doc.voyage, { durationHours: 8, treasuresPerCompletedVoyage: 1 })
  assertExactKeys(doc.compass, ['hoursReducedPerCompass', 'completeAllAvailable'], 'Compass mechanic')
  assert.deepEqual(doc.compass, { hoursReducedPerCompass: 1, completeAllAvailable: true })
  assert.equal(Array.isArray(doc.teams) && doc.teams.length === 4, true, 'Voyage must govern four teams')
  doc.teams.forEach((row, index) => {
    assertExactKeys(row, ['team', 'unlock', 'status'], `Team ${index + 1}`)
    assertExactKeys(row.unlock, ['kind', 'amount', 'currency'], `Team ${index + 1}.unlock`)
    const [team, kind, amount, currency, status] = teams[index]
    assert.deepEqual(row, { team, unlock: { kind, amount, currency }, status })
  })
  assert.equal(Array.isArray(doc.treasureTiers) && doc.treasureTiers.length === 4, true, 'Voyage must govern four treasure tiers')
  doc.treasureTiers.forEach((row, index) => {
    assertExactKeys(row, ['key', 'name', 'terminal'], `Treasure tier ${index}`)
    const [key, name, terminal] = tiers[index]
    assert.deepEqual(row, { key, name, terminal })
  })
  assert.equal(Array.isArray(doc.mergeRules) && doc.mergeRules.length === 2, true, 'Voyage must govern two merge-rule boundaries')
  assertExactKeys(doc.mergeRules[0], ['from', 'count', 'outcome', 'status'], 'Common merge rule')
  assert.deepEqual(doc.mergeRules[0], { from: 'common', count: 3, outcome: { kind: 'fixed', to: 'premium' }, status: 'source_supported' })
  assertExactKeys(doc.mergeRules[0].outcome, ['kind', 'to'], 'Common merge outcome')
  assertExactKeys(doc.mergeRules[1], ['from', 'count', 'outcome', 'status', 'verificationIssueId'], 'Premium merge rule')
  assert.deepEqual(doc.mergeRules[1], { from: 'premium', count: 3, outcome: null, status: 'conflicted', verificationIssueId: 'premium-merge-outcome' })
  assert.equal(Array.isArray(doc.milestones) && doc.milestones.length === 7, true, 'Voyage must govern seven milestones')
  doc.milestones.forEach((row, index) => {
    assertExactKeys(row, ['voyages', 'rewards'], `Milestone ${index}`)
    assert.equal(Array.isArray(row.rewards) && row.rewards.length === 1, true, `Milestone ${index} must contain one governed reward`)
    assertExactKeys(row.rewards[0], ['itemKey', 'label', 'quantity'], `Milestone ${index}.reward`)
    const [voyages, itemKey, label, quantity] = milestones[index]
    assert.deepEqual(row, { voyages, rewards: [{ itemKey, label, quantity }] })
  })
  assert.equal(Array.isArray(doc.compassBundles) && doc.compassBundles.length === 5, true, 'Voyage must govern five Compass bundle counts')
  doc.compassBundles.forEach((row, index) => {
    assertExactKeys(row, ['packKey', 'label', 'compasses'], `Compass bundle ${index}`)
    const [packKey, label, compasses] = bundles[index]
    assert.deepEqual(row, { packKey, label, compasses })
  })
}

const validateStrategy = (doc) => {
  assertExactKeys(doc, ['confidence', 'principles', 'playerProfiles', 'dailyRoutine'], 'Voyage strategy')
  assert.equal(doc.confidence, 'community_guidance')
  assert.equal(Array.isArray(doc.principles) && doc.principles.length === 4, true, 'Voyage strategy must contain four governed principles')
  for (const [index, principle] of doc.principles.entries()) {
    assertExactKeys(principle, ['key', 'text'], `Strategy principle ${index}`)
    assert.match(principle.key, /^[a-z0-9-]+$/)
    assertString(principle.text, `Strategy principle ${index}.text`)
  }
  assert.deepEqual(doc.playerProfiles.map((row) => row.profile), ['f2p', 'low_spender', 'heavy_spender'])
  for (const [index, profile] of doc.playerProfiles.entries()) {
    assertExactKeys(profile, ['profile', 'guidance'], `Player profile ${index}`)
    assert.equal(Array.isArray(profile.guidance) && profile.guidance.length > 0, true, `Player profile ${index}.guidance must not be empty`)
    profile.guidance.forEach((value, guidanceIndex) => assertString(value, `Player profile ${index}.guidance[${guidanceIndex}]`))
  }
  assertExactKeys(doc.dailyRoutine, ['morning', 'midday', 'beforeBed'], 'Voyage daily routine')
  for (const [key, values] of Object.entries(doc.dailyRoutine)) {
    assert.equal(Array.isArray(values) && values.length > 0, true, `Voyage daily routine ${key} must not be empty`)
    values.forEach((value, index) => assertString(value, `Voyage daily routine ${key}[${index}]`))
  }
}

validateMeta(meta)
validateEvent(event)
validateStrategy(strategy)
assert.equal(evidence._meta.source, 'Voyage of Light Guide.docx')
assert.equal(evidence._meta.received, '2026-08-21')
assert.equal(Array.isArray(evidence.claims) && evidence.claims.length >= 10, true, 'Voyage source evidence must retain the extracted claim map')
const evidenceIds = new Set(evidence.claims.map((claim) => claim.id))
for (const id of ['event-active-days', 'collection-window', 'voyage-duration', 'compass-hour', 'team-2-cost', 'team-3-cost', 'team-4-cost', 'common-merge', 'premium-merge-random', 'premium-merge-choice', 'milestones', 'compass-packs']) assert(evidenceIds.has(id), `Missing source evidence claim ${id}`)
assert.deepEqual(schema.oneOf?.map((entry) => entry.$ref), ['#/$defs/metaDocument', '#/$defs/eventDocument', '#/$defs/strategyDocument'])
for (const key of ['metaDocument', 'metaCore', 'ownerSource', 'coverage', 'trust', 'verificationIssue', 'sourceClaim', 'eventDocument', 'activePhase', 'collectionPhase', 'unlock', 'team', 'treasureTier', 'fixedMergeOutcome', 'mergeRule', 'milestone', 'reward', 'compassBundle', 'strategyDocument', 'strategyPrinciple', 'playerProfile', 'dailyRoutine']) {
  assert.equal(schema.$defs?.[key]?.additionalProperties, false, `Published schema definition ${key} must remain closed`)
}
assert.equal(schema.$defs?.eventDocument?.properties?.phases?.additionalProperties, false, 'Published event phases contract must remain closed')
assert.equal(schema.$defs?.eventDocument?.properties?.voyage?.additionalProperties, false, 'Published voyage timing contract must remain closed')
assert.equal(schema.$defs?.eventDocument?.properties?.compass?.additionalProperties, false, 'Published Compass contract must remain closed')
assert.deepEqual(Object.fromEntries(Object.entries(schema.$defs?.trust?.properties ?? {}).map(([key, definition]) => [key, definition.const])), trust, 'Validator trust constants must remain identical to published schema constants')
assert.deepEqual(schema.$defs?.metaDocument?.properties?.verificationIssues?.prefixItems?.map((entry) => entry.allOf?.[1]?.properties?.id?.const), verificationIssueIds, 'Published schema must pin verification issue IDs and order')
assert.deepEqual(schema.$defs?.milestones?.prefixItems?.map((entry) => entry.allOf?.[1]?.properties?.voyages?.const), milestones.map(([voyages]) => voyages), 'Published schema must pin milestone order and thresholds')
assert.deepEqual(schema.$defs?.teams?.prefixItems?.map((entry) => entry.allOf?.[1]?.properties?.team?.const), [1, 2, 3, 4], 'Published schema must pin team order')
assert.deepEqual(schema.$defs?.mergeRules?.prefixItems?.[0]?.allOf?.[1]?.not?.required, ['verificationIssueId'], 'Published schema must forbid verificationIssueId on the source-supported Common merge rule')
assert.equal(schema.$defs?.teams?.prefixItems?.[3]?.allOf?.[1]?.properties?.unlock?.properties?.currency?.const, '$', 'Published schema must preserve the literal source currency marker for Team 4')
const invalidPremiumOutcome = structuredClone(event)
invalidPremiumOutcome.mergeRules[1].outcome = { kind: 'fixed', to: 'majestic' }
assert.throws(() => validateEvent(invalidPremiumOutcome), /deepStrictEqual|Expected values to be strictly deep-equal/, 'Validator must reject canonicalisation of the conflicted Premium merge outcome')
const invalidCompass = structuredClone(event)
invalidCompass.compass.hoursReducedPerCompass = 8
assert.throws(() => validateEvent(invalidCompass), /deepStrictEqual|Expected values to be strictly deep-equal/, 'Validator must reject the ambiguous eight-hour Compass interpretation')
const invalidTrust = structuredClone(meta)
invalidTrust._meta.trust.strategy = 'verified_mechanic'
assert.throws(() => validateMeta(invalidTrust), /governed constants/, 'Validator must reject ungoverned trust classifications')
const invalidExtraField = structuredClone(event)
invalidExtraField.unexpected = true
assert.throws(() => validateEvent(invalidExtraField), /governed keys/, 'Validator must reject undeclared event properties')
const invalidSourceClaim = structuredClone(meta)
invalidSourceClaim.verificationIssues[0].sourceClaims[0].unexpected = true
assert.throws(() => validateMeta(invalidSourceClaim), /undeclared key/, 'Validator must reject undeclared source-claim properties')
const invalidStrategyConfidence = structuredClone(strategy)
invalidStrategyConfidence.confidence = 'verified'
assert.throws(() => validateStrategy(invalidStrategyConfidence), 'Validator must reject promoted strategy confidence')
console.log('VOYAGE-001A contract passed: source-grounded timing, teams, milestones, Compass bundles, literal currency marker, strict metadata/schema parity, merge discrimination, conflict containment and community-guidance separation verified.')