import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const readJson = (path) => JSON.parse(readFileSync(resolve(root, path), 'utf8'))
const meta = readJson('public/data/vip/meta.json')
const levels = readJson('public/data/vip/levels.json')
const schema = readJson('public/data/vip/schema.json')
const progressionSource = readJson('server/data-engine/source-assets/vip/vip-progression-baseline.json')

const governedTrust = {
  benefits: 'source_governed_except_explicit_conflicts',
  dailyBundles: 'owner_supplied_source',
  specialPacks: 'owner_supplied_source_except_explicit_conflicts',
  estimatedF2pTime: 'community_guidance',
  currency: 'not_explicit_in_detailed_pack_rows',
  cumulativeVipXp: 'not_published_pending_reconciliation',
}

const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
const assertRecord = (value, label) => assert.equal(isRecord(value), true, `${label} must be an object`)
const assertExactKeys = (value, keys, label) => {
  assertRecord(value, label)
  assert.deepEqual(Object.keys(value).sort(), [...keys].sort(), `${label} must contain only governed keys`)
}
const assertString = (value, label) => assert.equal(typeof value === 'string' && value.length > 0, true, `${label} must be a non-empty string`)
const assertInteger = (value, label, minimum = 0) => assert.equal(Number.isInteger(value) && value >= minimum, true, `${label} must be an integer >= ${minimum}`)
const assertNullableInteger = (value, label, minimum = 0) => { if (value !== null) assertInteger(value, label, minimum) }
const assertNullableNumber = (value, label, minimum = 0) => {
  if (value !== null) assert.equal(typeof value === 'number' && Number.isFinite(value) && value >= minimum, true, `${label} must be null or a finite number >= ${minimum}`)
}

const validateBenefit = (benefit, label) => {
  assertExactKeys(benefit, ['key', 'label', 'value', 'unit', 'status'], label)
  assert.match(benefit.key, /^[a-z0-9_]+$/, `${label}.key must use governed snake_case syntax`)
  assertString(benefit.label, `${label}.label`)
  assert.ok(['percent', 'resources', 'additional_slots', 'hours'].includes(benefit.unit), `${label}.unit is unsupported`)
  assert.ok(['source_supported', 'conflicted'].includes(benefit.status), `${label}.status is unsupported`)
  if (benefit.status === 'conflicted') assert.equal(benefit.value, null, `${label} conflicted value must remain null`)
  if (benefit.status === 'source_supported') assert.equal(typeof benefit.value === 'number' && Number.isFinite(benefit.value), true, `${label} source-supported value must be numeric`)
}

const validateBundleItem = (item, label) => {
  assertExactKeys(item, ['itemKey', 'label', 'quantity', 'rarity'], label)
  assert.match(item.itemKey, /^[a-z0-9-]+$/, `${label}.itemKey must use governed kebab-case syntax`)
  assertString(item.label, `${label}.label`)
  assertInteger(item.quantity, `${label}.quantity`, 1)
  assert.ok(item.rarity === null || ['rare', 'epic', 'mythic'].includes(item.rarity), `${label}.rarity is unsupported`)
}

const validateXpBundle = (bundle, label) => {
  assertExactKeys(bundle, ['quantity', 'unitXp', 'totalXp'], label)
  assertInteger(bundle.quantity, `${label}.quantity`, 1)
  assertInteger(bundle.unitXp, `${label}.unitXp`, 1)
  assertInteger(bundle.totalXp, `${label}.totalXp`, 1)
  assert.equal(bundle.totalXp, bundle.quantity * bundle.unitXp, `${label}.totalXp must equal quantity × unitXp`)
}

const validateSpeedups = (speedups, label) => {
  assertExactKeys(speedups, ['construction', 'research', 'training'], label)
  for (const key of ['construction', 'research', 'training']) assertInteger(speedups[key], `${label}.${key}`)
}

const validateSpecialPack = (pack, level, label) => {
  assertExactKeys(pack, ['gems', 'heroShards', 'vipXp', 'heroXp', 'speedupsHours', 'allianceGiftTier', 'priceAmount', 'priceCurrency', 'savingPercent', 'topupPoints'], label)
  assertInteger(pack.gems, `${label}.gems`)
  assertExactKeys(pack.heroShards, ['hero', 'quantity'], `${label}.heroShards`)
  assert.equal(pack.heroShards.hero, level <= 6 ? 'Helga' : 'Amadeus', `${label}.heroShards.hero must match the governed VIP band`)
  assertInteger(pack.heroShards.quantity, `${label}.heroShards.quantity`, 1)
  validateXpBundle(pack.vipXp, `${label}.vipXp`)
  validateXpBundle(pack.heroXp, `${label}.heroXp`)
  validateSpeedups(pack.speedupsHours, `${label}.speedupsHours`)
  assertInteger(pack.allianceGiftTier, `${label}.allianceGiftTier`, 1)
  assert.ok(pack.allianceGiftTier <= 5, `${label}.allianceGiftTier must be <= 5`)
  assertNullableNumber(pack.priceAmount, `${label}.priceAmount`)
  assert.ok(pack.priceCurrency === null || (typeof pack.priceCurrency === 'string' && pack.priceCurrency.length === 3), `${label}.priceCurrency must be null or a 3-character code`)
  assertNullableInteger(pack.savingPercent, `${label}.savingPercent`)
  assertNullableInteger(pack.topupPoints, `${label}.topupPoints`)
}

const validateVipLevel = (row, expectedLevel) => {
  const label = `VIP ${expectedLevel}`
  assertExactKeys(row, ['level', 'xpToReach', 'gemsEquivalent', 'estimatedF2pTime', 'benefits', 'dailyFreeBundle', 'specialPack'], label)
  assert.equal(row.level, expectedLevel, `${label}.level must remain sequential`)
  assertInteger(row.xpToReach, `${label}.xpToReach`)
  assertInteger(row.gemsEquivalent, `${label}.gemsEquivalent`)
  assert.equal(row.gemsEquivalent, row.xpToReach * 2, `${label} Gem equivalent must remain 2x VIP XP`)
  if (row.estimatedF2pTime !== null) {
    assertExactKeys(row.estimatedF2pTime, ['text', 'confidence'], `${label}.estimatedF2pTime`)
    assertString(row.estimatedF2pTime.text, `${label}.estimatedF2pTime.text`)
    assert.equal(row.estimatedF2pTime.confidence, 'community_guidance')
  }
  assert.equal(Array.isArray(row.benefits) && row.benefits.length >= 2, true, `${label}.benefits must contain at least two records`)
  row.benefits.forEach((benefit, index) => validateBenefit(benefit, `${label}.benefits[${index}]`))
  assert.equal(Array.isArray(row.dailyFreeBundle) && row.dailyFreeBundle.length >= 2, true, `${label}.dailyFreeBundle must contain at least two records`)
  row.dailyFreeBundle.forEach((item, index) => validateBundleItem(item, `${label}.dailyFreeBundle[${index}]`))
  validateSpecialPack(row.specialPack, expectedLevel, `${label}.specialPack`)
}

const validateMeta = (document) => {
  assertExactKeys(document, ['_meta', 'verificationIssues'], 'VIP metadata document')
  assertExactKeys(document._meta, ['schemaVersion', 'datasetId', 'title', 'description', 'sources', 'coverage', 'trust'], 'VIP metadata core')
  assert.equal(document._meta.schemaVersion, '1.0.0')
  assert.equal(document._meta.datasetId, 'kingshot-vip')
  assertString(document._meta.title, 'VIP metadata title')
  assertString(document._meta.description, 'VIP metadata description')
  assert.equal(Array.isArray(document._meta.sources) && document._meta.sources.length === 2, true, 'VIP metadata must contain exactly two governed sources')
  assertExactKeys(document._meta.sources[0], ['kind', 'filename', 'received', 'role'], 'Owner source')
  assert.equal(document._meta.sources[0].kind, 'owner_supplied')
  assert.equal(document._meta.sources[0].filename, 'VIP dataset.docx')
  assert.equal(document._meta.sources[0].received, '2026-08-21')
  assertString(document._meta.sources[0].role, 'Owner source role')
  assertExactKeys(document._meta.sources[1], ['kind', 'filename', 'originalFilename', 'path', 'datasetId', 'role', 'provenance', 'verified', 'license', 'canonical'], 'Supporting source')
  assert.equal(document._meta.sources[1].kind, 'supporting_dataset')
  assert.equal(document._meta.sources[1].filename, 'vip-progression-baseline.json')
  assert.equal(document._meta.sources[1].originalFilename, 'vip(1).json')
  assert.equal(document._meta.sources[1].path, 'server/data-engine/source-assets/vip/vip-progression-baseline.json')
  assert.equal(document._meta.sources[1].datasetId, 'kingshot-vip')
  for (const key of ['role', 'provenance', 'license', 'canonical']) assertString(document._meta.sources[1][key], `Supporting source ${key}`)
  assert.equal(document._meta.sources[1].verified, '2026-06-18')
  assertExactKeys(document._meta.coverage, ['levels', 'minLevel', 'maxLevel', 'dailyBundleLevels', 'specialPackLevels'], 'VIP coverage')
  assert.deepEqual(document._meta.coverage, { levels: 12, minLevel: 1, maxLevel: 12, dailyBundleLevels: 12, specialPackLevels: 12 })
  assertExactKeys(document._meta.trust, ['benefits', 'dailyBundles', 'specialPacks', 'estimatedF2pTime', 'currency', 'cumulativeVipXp'], 'VIP trust boundary')
  assert.deepEqual(document._meta.trust, governedTrust, 'VIP trust boundary must match the published schema constants')
  assert.equal(Array.isArray(document.verificationIssues) && document.verificationIssues.length >= 1, true, 'VIP metadata must retain verification issues')
  document.verificationIssues.forEach((issue, index) => {
    const label = `verificationIssues[${index}]`
    assertExactKeys(issue, ['id', 'status', 'field', 'summary', 'sourceClaims', 'canonicalAction'], label)
    assert.match(issue.id, /^[a-z0-9-]+$/)
    assert.equal(issue.status, 'open')
    for (const key of ['field', 'summary', 'canonicalAction']) assertString(issue[key], `${label}.${key}`)
    assert.equal(Array.isArray(issue.sourceClaims) && issue.sourceClaims.length >= 2, true, `${label}.sourceClaims must retain both sides of the conflict`)
    issue.sourceClaims.forEach((claim, claimIndex) => assertRecord(claim, `${label}.sourceClaims[${claimIndex}]`))
  })
}

validateMeta(meta)
assert.equal(levels.length, 12)
levels.forEach((row, index) => validateVipLevel(row, index + 1))

assert.equal(progressionSource._meta.dataset, 'kingshot-vip')
assert.equal(progressionSource._meta.provenance.verified, '2026-06-18')
assert.deepEqual(
  levels.map((row) => ({ level: row.level, xpToReach: row.xpToReach, gemsEquivalent: row.gemsEquivalent })),
  progressionSource.vipLevels,
  'Public VIP progression must remain identical to the preserved supporting source baseline',
)

assert.equal(levels.slice(0, 6).reduce((sum, row) => sum + row.specialPack.heroShards.quantity, 0), 1055)
assert.equal(levels.slice(6).reduce((sum, row) => sum + row.specialPack.heroShards.quantity, 0), 975)
assert.equal(levels[7].specialPack.priceAmount, null, 'VIP 8 price must remain unresolved while source claims conflict')
const vip12Attack = levels[11].benefits.find((benefit) => benefit.key === 'squad_attack')
const vip12Health = levels[11].benefits.find((benefit) => benefit.key === 'squad_health')
assert.deepEqual([vip12Attack?.value, vip12Attack?.status], [null, 'conflicted'])
assert.deepEqual([vip12Health?.value, vip12Health?.status], [null, 'conflicted'])
assert.equal(levels[11].benefits.find((benefit) => benefit.key === 'squad_lethality')?.value, 16)

const issueIds = new Set(meta.verificationIssues.map((issue) => issue.id))
for (const id of ['vip8-special-pack-price', 'vip12-squad-attack-health', 'vip12-cumulative-xp-wording', 'amadeus-shard-aggregate']) assert(issueIds.has(id), `Missing verification issue ${id}`)
for (const level of [1, 2, 3, 4, 5]) {
  assert.equal(levels[level - 1].specialPack.savingPercent, null)
  assert.equal(levels[level - 1].specialPack.topupPoints, null)
}
for (const level of [7, 11, 12]) assert.equal(levels[level - 1].specialPack.topupPoints, null)

assert.deepEqual(schema.oneOf?.map((entry) => entry.$ref), ['#/$defs/metaDocument', '#/$defs/levelsDocument'])
assert.equal(schema.$defs?.benefit?.properties?.key?.pattern, '^[a-z0-9_]+$', 'Published schema must allow governed snake_case benefit keys')
assert.equal(schema.$defs?.vipLevel?.additionalProperties, false)
assert.equal(schema.$defs?.specialPack?.additionalProperties, false)
assert.equal(schema.$defs?.ownerSource?.additionalProperties, false)
assert.equal(schema.$defs?.supportingSource?.additionalProperties, false)
assert.equal(schema.$defs?.coverage?.additionalProperties, false)
assert.equal(schema.$defs?.trust?.additionalProperties, false)
assert.deepEqual(
  Object.fromEntries(Object.entries(schema.$defs?.trust?.properties ?? {}).map(([key, definition]) => [key, definition.const])),
  governedTrust,
  'Validator trust constants must remain identical to the published schema constants',
)
assert.equal(schema.$defs?.benefit?.allOf?.[0]?.oneOf?.length, 2, 'Published schema must bind benefit status to canonical/null value state')
assert.equal(schema.$defs?.vipLevel?.allOf?.[0]?.oneOf?.length, 2, 'Published schema must bind Helga/Amadeus shard tracks to VIP level bands')
assert.deepEqual(schema.$defs?.levelsDocument?.prefixItems?.map((entry) => entry.allOf?.[1]?.properties?.level?.const), Array.from({ length: 12 }, (_, index) => index + 1))

const extraFieldMutation = structuredClone(levels[0])
extraFieldMutation.unexpected = true
assert.throws(() => validateVipLevel(extraFieldMutation, 1), /governed keys/, 'Validator must reject undeclared level properties')
const wrongTypeMutation = structuredClone(levels[1])
wrongTypeMutation.xpToReach = '2500'
assert.throws(() => validateVipLevel(wrongTypeMutation, 2), /integer/, 'Validator must reject primitive-type coercion')
const conflictedValueMutation = structuredClone(levels[11])
conflictedValueMutation.benefits.find((benefit) => benefit.key === 'squad_attack').value = 12
assert.throws(() => validateVipLevel(conflictedValueMutation, 12), /conflicted value must remain null/, 'Validator must reject canonical values on conflicted benefits')
const metaExtraFieldMutation = structuredClone(meta)
metaExtraFieldMutation._meta.unexpected = true
assert.throws(() => validateMeta(metaExtraFieldMutation), /governed keys/, 'Validator must reject undeclared metadata properties')
const invalidTrustMutation = structuredClone(meta)
invalidTrustMutation._meta.trust.benefits = 'totally_invalid_contract_value'
assert.throws(() => validateMeta(invalidTrustMutation), /published schema constants/, 'Validator must reject trust classifications that violate the published schema')

console.log('VIP-001A contract passed: 12 governed levels, strict primitive/object shape checks, exact schema trust constants, progression source binding, benefit/bundle/pack structure and explicit conflict containment verified.')
