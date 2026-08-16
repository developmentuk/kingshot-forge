import { createHash } from 'node:crypto'

export const OASIS_PUBLIC_PROJECTION_SCHEMA_VERSION = 'oasis-public-projection-v2' as const
export const OASIS_MEDIA_MANIFEST_SCHEMA_VERSION = 'oasis-media-manifest-v2' as const
export const OASIS_SOURCE_FINGERPRINT_VERSION = 'oasis-source-fingerprint-v2' as const
export const OASIS_PUBLIC_RECORD_COUNT = 55
export const OASIS_PRIVATE_SOURCE_MEDIA_COUNT = 111

export const OASIS_PUBLIC_TRUST_BY_SOURCE_STATUS = Object.freeze({
  owner_direct_ingame_verified: 'Owner verified in-game',
  official_verified: 'Officially verified',
  community_table_plus_official_mechanics: 'Mixed official and community evidence',
  official_mechanics_partial_values: 'Official mechanics; values partial',
  official_mechanics_stats_incomplete: 'Official mechanics; values partial',
  attachment_extracted: 'Source attachment extracted',
  corroborated_web: 'Community corroborated',
  mentioned_only_partial: 'Partial source coverage',
  needs_ingame_verification: 'Needs in-game verification',
  conflict_needs_ingame_verification: 'Needs in-game verification',
} as const)

export type OasisSourceVerificationStatus = keyof typeof OASIS_PUBLIC_TRUST_BY_SOURCE_STATUS
export type OasisPublicTrustLabel = typeof OASIS_PUBLIC_TRUST_BY_SOURCE_STATUS[OasisSourceVerificationStatus]

export type OasisPublicMedia = Readonly<{
  url: string
  alt: string
  role: 'catalogue' | 'level' | 'placeholder'
  levelVariant: number | null
  width: number
  height: number
}>

export type OasisPublicBonus = Readonly<{
  label: string | null
  stat: string | null
  valuePct: number | null
  effect: string | null
}>

export type OasisPublicLevel = Readonly<{
  level: number | null
  prosperity: number | null
  prosperityRequired: number | null
  waterEssencePerHour: number | null
  bonuses: readonly OasisPublicBonus[]
  knownEffects: readonly string[]
  exactOutputKnown: boolean | null
}>

export type OasisPublicRecord = Readonly<{
  schemaVersion: typeof OASIS_PUBLIC_PROJECTION_SCHEMA_VERSION
  id: string
  name: string
  aliases: readonly string[]
  recordType: string
  rarity: string | null
  availabilityCategory: string | null
  footprint: Readonly<{ width: number | null; height: number | null; display: string | null }> | null
  typeLimit: number | null
  maxLevel: number | null
  function: string | null
  levels: readonly OasisPublicLevel[]
  maxEffects: readonly OasisPublicBonus[]
  unlock: Readonly<{ requirement: string | null; initialBlueprintPurchase: string | null }> | null
  upgrade: Readonly<{ currency: string | null; exchange: string | null; generalBlueprintRefresh: string | null; officiallyVerified: string | null }> | null
  maxProsperity: number | null
  trustLabel: OasisPublicTrustLabel
  media: readonly OasisPublicMedia[]
  publicationId: string
  publicationVersion: number
  publishedAt: string
  updatedAt: string
  canonicalRoute: string
  status: 'published'
}>

export type OasisMediaManifestEntry = Readonly<{
  recordId: string
  privateSourceFilename: string
  sourceChecksum: string
  publicDerivativePath: string
  privateDerivativePath: string
  derivativeChecksum: string
  sourceBytes: number
  derivativeBytes: number
  width: number
  height: number
  mediaRole: 'catalogue' | 'level'
  levelVariant: number | null
  altText: string
}>

export type OasisMediaManifest = Readonly<{
  schemaVersion: typeof OASIS_MEDIA_MANIFEST_SCHEMA_VERSION
  sourceFingerprintVersion: typeof OASIS_SOURCE_FINGERPRINT_VERSION
  sourceFingerprint: string
  sourceAssetCount: number
  derivativeAssetCount: number
  sourceAssetBytes: number
  derivativeAssetBytes: number
  entries: readonly OasisMediaManifestEntry[]
  missingArtworkRecordIds: readonly string[]
  placeholder: Readonly<{
    publicDerivativePath: string
    privateDerivativePath: string
    derivativeChecksum: string
    derivativeBytes: number
    width: number
    height: number
    altText: string
  }>
}>

export type OasisPublicationIdentity = Readonly<{
  publicationId: string
  publicationVersion: number
  publishedAt: string
  updatedAt: string
}>

export type OasisPublicDataset = Readonly<{
  schemaVersion: typeof OASIS_PUBLIC_PROJECTION_SCHEMA_VERSION
  dataset: 'oasis-island'
  status: 'current_published'
  publicationId: string
  publicationVersion: number
  publishedAt: string
  updatedAt: string
  sourceFingerprint: string
  manifestHash: string
  recordContentHash: string
  recordCount: number
  mediaCount: number
  records: readonly OasisPublicRecord[]
}>

export type OasisImmutablePublicationSnapshot = Readonly<{
  dataset: string
  publicationId: string
  sourceFingerprint: string
  manifestHash: string
  recordContentHash: string
  manifest: OasisMediaManifest
  records: readonly OasisPublicRecord[]
}>

export const OASIS_PUBLIC_RECORD_ALLOW_LIST = Object.freeze([
  'schemaVersion', 'id', 'name', 'aliases', 'recordType', 'rarity',
  'availabilityCategory', 'footprint', 'typeLimit', 'maxLevel', 'function',
  'levels', 'maxEffects', 'unlock', 'upgrade', 'maxProsperity', 'trustLabel',
  'media', 'publicationId', 'publicationVersion', 'publishedAt', 'updatedAt',
  'canonicalRoute', 'status',
] as const)

export const OASIS_FORBIDDEN_PUBLIC_FIELDS = Object.freeze([
  '_meta', 'source', 'sourceUrl', 'sourceText', 'sourceDocument', 'sourceTableIndex',
  'verification', 'verificationHistory', 'verificationNotes', 'provenance',
  'provenanceNotes', 'knownConflicts', 'privateSourceFilename', 'imageInventory',
  'imageFiles', 'imageVariantFiles', 'assetStem', 'repositoryPath', 'filesystemPath',
] as const)

const OASIS_PUBLIC_LEVEL_KEYS = Object.freeze([
  'level', 'prosperity', 'prosperityRequired', 'waterEssencePerHour',
  'bonuses', 'knownEffects', 'exactOutputKnown',
] as const)

const OASIS_PUBLIC_BONUS_KEYS = Object.freeze(['label', 'stat', 'valuePct', 'effect'] as const)
const OASIS_PUBLIC_FOOTPRINT_KEYS = Object.freeze(['width', 'height', 'display'] as const)
const OASIS_PUBLIC_UNLOCK_KEYS = Object.freeze(['requirement', 'initialBlueprintPurchase'] as const)
const OASIS_PUBLIC_UPGRADE_KEYS = Object.freeze([
  'currency', 'exchange', 'generalBlueprintRefresh', 'officiallyVerified',
] as const)
const OASIS_PUBLIC_MEDIA_KEYS = Object.freeze(['url', 'alt', 'role', 'levelVariant', 'width', 'height'] as const)

function object(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export function oasisPublicTrustLabel(value: unknown): OasisPublicTrustLabel {
  const record = object(value)
  const verification = object(record?.verification)
  const status = text(verification?.status)
  if (!status || !Object.hasOwn(OASIS_PUBLIC_TRUST_BY_SOURCE_STATUS, status)) {
    throw new Error(`Oasis record ${text(record?.id) ?? '<unknown>'} has an unsupported verification status.`)
  }
  return OASIS_PUBLIC_TRUST_BY_SOURCE_STATUS[status as OasisSourceVerificationStatus]
}

function number(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function boolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null
}

function assertExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
  path: string,
): void {
  const missing = expected.filter((key) => !Object.hasOwn(value, key))
  if (missing.length > 0) throw new Error(`${path} is missing required fields: ${missing.join(', ')}`)
  const extra = Object.keys(value).filter((key) => !expected.includes(key))
  if (extra.length > 0) throw new Error(`${path} contains unexpected fields: ${extra.join(', ')}`)
}

function assertTrimmedString(value: unknown, path: string): asserts value is string {
  if (typeof value !== 'string' || !value.trim() || value !== value.trim()) {
    throw new Error(`${path} must be a non-empty trimmed string.`)
  }
}

function assertNullableTrimmedString(value: unknown, path: string): asserts value is string | null {
  if (value !== null) assertTrimmedString(value, path)
}

function assertNullableFiniteNumber(value: unknown, path: string): asserts value is number | null {
  if (value !== null && (typeof value !== 'number' || !Number.isFinite(value))) {
    throw new Error(`${path} must be a finite number or null.`)
  }
}

function assertNullableNonNegativeNumber(value: unknown, path: string): asserts value is number | null {
  assertNullableFiniteNumber(value, path)
  if (typeof value === 'number' && value < 0) throw new Error(`${path} must be non-negative or null.`)
}

function assertNullablePositiveInteger(value: unknown, path: string): asserts value is number | null {
  assertNullableFiniteNumber(value, path)
  if (typeof value === 'number' && (!Number.isInteger(value) || value < 1)) {
    throw new Error(`${path} must be a positive integer or null.`)
  }
}

function assertPositiveInteger(value: unknown, path: string): asserts value is number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    throw new Error(`${path} must be a positive integer.`)
  }
}

function assertIsoTimestamp(value: unknown, path: string): asserts value is string {
  if (typeof value !== 'string'
    || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/u.test(value)
    || !Number.isFinite(Date.parse(value))) {
    throw new Error(`${path} must be a valid UTC timestamp.`)
  }
}

function assertPublicBonus(value: unknown, path: string): asserts value is OasisPublicBonus {
  const item = object(value)
  if (!item) throw new Error(`${path} must be a non-null object.`)
  assertExactKeys(item, OASIS_PUBLIC_BONUS_KEYS, path)
  assertNullableTrimmedString(item.label, `${path}.label`)
  assertNullableTrimmedString(item.stat, `${path}.stat`)
  assertNullableFiniteNumber(item.valuePct, `${path}.valuePct`)
  assertNullableTrimmedString(item.effect, `${path}.effect`)
}

function assertPublicBonusArray(value: unknown, path: string): asserts value is readonly OasisPublicBonus[] {
  if (!Array.isArray(value)) throw new Error(`${path} must be an array.`)
  value.forEach((item, index) => assertPublicBonus(item, `${path}[${index}]`))
}

function assertPublicLevel(value: unknown, path: string): asserts value is OasisPublicLevel {
  const item = object(value)
  if (!item) throw new Error(`${path} must be a non-null object.`)
  assertExactKeys(item, OASIS_PUBLIC_LEVEL_KEYS, path)
  assertNullablePositiveInteger(item.level, `${path}.level`)
  assertNullableNonNegativeNumber(item.prosperity, `${path}.prosperity`)
  assertNullableNonNegativeNumber(item.prosperityRequired, `${path}.prosperityRequired`)
  assertNullableNonNegativeNumber(item.waterEssencePerHour, `${path}.waterEssencePerHour`)
  assertPublicBonusArray(item.bonuses, `${path}.bonuses`)
  if (!Array.isArray(item.knownEffects)) throw new Error(`${path}.knownEffects must be an array.`)
  item.knownEffects.forEach((effect, index) => assertTrimmedString(effect, `${path}.knownEffects[${index}]`))
  if (item.exactOutputKnown !== null && typeof item.exactOutputKnown !== 'boolean') {
    throw new Error(`${path}.exactOutputKnown must be a boolean or null.`)
  }
}

function assertNullableExactObject(
  value: unknown,
  keys: readonly string[],
  path: string,
): Record<string, unknown> | null {
  if (value === null) return null
  const item = object(value)
  if (!item) throw new Error(`${path} must be an object or null.`)
  assertExactKeys(item, keys, path)
  return item
}

function assertPublicMedia(value: unknown, path: string): asserts value is OasisPublicMedia {
  const item = object(value)
  if (!item) throw new Error(`${path} must be a non-null object.`)
  assertExactKeys(item, OASIS_PUBLIC_MEDIA_KEYS, path)
  assertTrimmedString(item.url, `${path}.url`)
  if (!/^\/media\/oasis-island\/[a-z0-9-]+\/(?:catalogue|level-[0-9]+)(?:-variant-[0-9]+)?\.webp$/u.test(item.url)
    && item.url !== '/media/oasis-island/shared/artwork-unavailable.webp') {
    throw new Error(`${path}.url is outside the planned Oasis WebP boundary.`)
  }
  assertTrimmedString(item.alt, `${path}.alt`)
  if (item.role !== 'catalogue' && item.role !== 'level' && item.role !== 'placeholder') {
    throw new Error(`${path}.role is invalid.`)
  }
  if (item.role === 'level') assertPositiveInteger(item.levelVariant, `${path}.levelVariant`)
  else if (item.levelVariant !== null) throw new Error(`${path}.levelVariant must be null for ${item.role} media.`)
  assertPositiveInteger(item.width, `${path}.width`)
  assertPositiveInteger(item.height, `${path}.height`)
}

function stringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map(text).filter((item): item is string => item !== null)
    : []
}

function bonus(value: unknown): OasisPublicBonus | null {
  const item = object(value)
  if (!item) return null
  return Object.freeze({
    label: text(item.label),
    stat: text(item.stat),
    valuePct: number(item.valuePct),
    effect: text(item.effect),
  })
}

function bonuses(value: unknown): OasisPublicBonus[] {
  return Array.isArray(value)
    ? value.map(bonus).filter((item): item is OasisPublicBonus => item !== null)
    : []
}

function level(value: unknown): OasisPublicLevel | null {
  const item = object(value)
  if (!item) return null
  return Object.freeze({
    level: number(item.level),
    prosperity: number(item.prosperity),
    prosperityRequired: number(item.prosperityRequired),
    waterEssencePerHour: number(item.waterEssencePerHour),
    bonuses: Object.freeze([...bonuses(item.buffs), ...bonuses(item.buffsUnlocked)]),
    knownEffects: Object.freeze(stringList(item.knownEffects)),
    exactOutputKnown: boolean(item.exactOutputKnown),
  })
}

function publicMedia(recordId: string, manifest: OasisMediaManifest): OasisPublicMedia[] {
  const entries = manifest.entries.filter((entry) => entry.recordId === recordId)
  if (entries.length > 0) {
    return entries.map((entry) => Object.freeze({
      url: `/${entry.publicDerivativePath.replace(/^\/+/, '')}`,
      alt: entry.altText,
      role: entry.mediaRole,
      levelVariant: entry.levelVariant,
      width: entry.width,
      height: entry.height,
    }))
  }
  if (!manifest.missingArtworkRecordIds.includes(recordId)) return []
  return [Object.freeze({
    url: `/${manifest.placeholder.publicDerivativePath.replace(/^\/+/, '')}`,
    alt: manifest.placeholder.altText,
    role: 'placeholder' as const,
    levelVariant: null,
    width: manifest.placeholder.width,
    height: manifest.placeholder.height,
  })]
}

export function buildOasisPublicRecord(
  value: unknown,
  publication: OasisPublicationIdentity,
  manifest: OasisMediaManifest,
): OasisPublicRecord {
  const record = object(value)
  const id = text(record?.id)
  const name = text(record?.name)
  const recordType = text(record?.recordType)
  if (!record || !id || !name || !recordType) throw new Error('Oasis public records require stable id, name and recordType values.')
  const footprint = object(record.footprint)
  const unlock = object(record.unlock)
  const upgrade = object(record.upgradeMechanic)
  const publicRecord = Object.freeze({
    schemaVersion: OASIS_PUBLIC_PROJECTION_SCHEMA_VERSION,
    id,
    name,
    aliases: Object.freeze(stringList(record.aliases)),
    recordType,
    rarity: text(record.rarity),
    availabilityCategory: text(record.availabilityCategory),
    footprint: footprint ? Object.freeze({ width: number(footprint.width), height: number(footprint.height), display: text(footprint.display) }) : null,
    typeLimit: number(record.typeLimit),
    maxLevel: number(record.maxLevel),
    function: text(record.function),
    levels: Object.freeze(Array.isArray(record.levels) ? record.levels.map(level).filter((item): item is OasisPublicLevel => item !== null) : []),
    maxEffects: Object.freeze(bonuses(record.maxEffects)),
    unlock: unlock ? Object.freeze({ requirement: text(unlock.requirement), initialBlueprintPurchase: text(unlock.initialBlueprintPurchase) }) : null,
    upgrade: upgrade ? Object.freeze({ currency: text(upgrade.currency), exchange: text(upgrade.exchange), generalBlueprintRefresh: text(upgrade.generalBlueprintRefresh), officiallyVerified: text(upgrade.officiallyVerified) }) : null,
    maxProsperity: number(record.maxProsperity),
    trustLabel: oasisPublicTrustLabel(record),
    media: Object.freeze(publicMedia(id, manifest)),
    publicationId: publication.publicationId,
    publicationVersion: publication.publicationVersion,
    publishedAt: publication.publishedAt,
    updatedAt: publication.updatedAt,
    canonicalRoute: `/oasis-island/buildings/${id}`,
    status: 'published',
  })
  assertOasisPublicRecord(publicRecord)
  return publicRecord
}

export function buildOasisPublicDataset(input: {
  records: readonly unknown[]
  publication: OasisPublicationIdentity
  manifest: OasisMediaManifest
}): OasisPublicDataset {
  if (input.records.length !== OASIS_PUBLIC_RECORD_COUNT) throw new Error(`Oasis publication requires exactly ${OASIS_PUBLIC_RECORD_COUNT} records.`)
  if (input.manifest.sourceAssetCount !== OASIS_PRIVATE_SOURCE_MEDIA_COUNT || input.manifest.derivativeAssetCount !== OASIS_PRIVATE_SOURCE_MEDIA_COUNT) throw new Error(`Oasis publication requires exactly ${OASIS_PRIVATE_SOURCE_MEDIA_COUNT} mapped source and derivative assets.`)
  const records = input.records.map((record) => buildOasisPublicRecord(record, input.publication, input.manifest))
  if (new Set(records.map((record) => record.id)).size !== records.length) throw new Error('Oasis publication contains duplicate record IDs.')
  return Object.freeze({
    schemaVersion: OASIS_PUBLIC_PROJECTION_SCHEMA_VERSION,
    dataset: 'oasis-island',
    status: 'current_published',
    publicationId: input.publication.publicationId,
    publicationVersion: input.publication.publicationVersion,
    publishedAt: input.publication.publishedAt,
    updatedAt: input.publication.updatedAt,
    sourceFingerprint: input.manifest.sourceFingerprint,
    manifestHash: hashOasisManifest(input.manifest),
    recordContentHash: hashOasisRecordContent(records),
    recordCount: records.length,
    mediaCount: input.manifest.derivativeAssetCount,
    records: Object.freeze(records),
  })
}

export function stableOasisJson(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableOasisJson).join(',')}]`
  return `{${Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0).map(([key, item]) => `${JSON.stringify(key)}:${stableOasisJson(item)}`).join(',')}}`
}

export function hashOasisManifest(manifest: OasisMediaManifest): string {
  return createHash('sha256').update(stableOasisJson(manifest)).digest('hex')
}

const OASIS_ROLLBACK_IDENTITY_FIELDS = Object.freeze([
  'publicationId', 'publicationVersion', 'publishedAt', 'updatedAt',
] as const)

function withoutPublicationIdentity(value: unknown): unknown {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return value
  return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter(([key]) => !(OASIS_ROLLBACK_IDENTITY_FIELDS as readonly string[]).includes(key)))
}

function sortedRecordContent(records: readonly unknown[]): unknown[] {
  return records
    .map((record) => withoutPublicationIdentity(record) as Record<string, unknown>)
    .sort((left, right) => String(left.id) < String(right.id) ? -1 : String(left.id) > String(right.id) ? 1 : 0)
}

export function hashOasisRecordContent(records: readonly unknown[]): string {
  return createHash('sha256').update(stableOasisJson(sortedRecordContent(records))).digest('hex')
}

export function hashOasisSourceFingerprint(input: {
  records: readonly unknown[]
  media: readonly Pick<OasisMediaManifestEntry, 'recordId' | 'privateSourceFilename' | 'sourceChecksum' | 'mediaRole' | 'levelVariant'>[]
}): string {
  const media = [...input.media]
    .map((entry) => ({
      recordId: entry.recordId,
      privateSourceFilename: entry.privateSourceFilename,
      sourceChecksum: entry.sourceChecksum,
      mediaRole: entry.mediaRole,
      levelVariant: entry.levelVariant,
    }))
    .sort((left, right) => stableOasisJson(left) < stableOasisJson(right) ? -1 : stableOasisJson(left) > stableOasisJson(right) ? 1 : 0)
  return createHash('sha256').update(stableOasisJson({
    version: OASIS_SOURCE_FINGERPRINT_VERSION,
    records: sortedRecordContent(input.records),
    media,
  })).digest('hex')
}

export function assertOasisRollbackCandidateMatchesSnapshot(
  candidate: OasisImmutablePublicationSnapshot,
  source: OasisImmutablePublicationSnapshot | null | undefined,
): void {
  if (!source) throw new Error('Oasis rollback source publication does not exist.')
  if (candidate.dataset !== 'oasis-island' || source.dataset !== 'oasis-island') throw new Error('Oasis rollback source belongs to another dataset.')
  if (source.records.length !== OASIS_PUBLIC_RECORD_COUNT || candidate.records.length !== OASIS_PUBLIC_RECORD_COUNT) throw new Error('Oasis rollback requires complete immutable snapshots.')
  if (hashOasisManifest(source.manifest) !== source.manifestHash) throw new Error('Oasis rollback source manifest integrity failed.')
  if (hashOasisRecordContent(source.records) !== source.recordContentHash) throw new Error('Oasis rollback source record-content integrity failed.')
  if (candidate.sourceFingerprint !== source.sourceFingerprint
    || candidate.manifestHash !== source.manifestHash
    || candidate.recordContentHash !== source.recordContentHash
    || stableOasisJson(candidate.manifest) !== stableOasisJson(source.manifest)
    || hashOasisRecordContent(candidate.records) !== source.recordContentHash) {
    throw new Error('Oasis rollback candidate does not match the referenced immutable publication.')
  }
}

export function deriveOasisRollbackRecords(
  source: OasisImmutablePublicationSnapshot,
  publication: OasisPublicationIdentity,
): readonly OasisPublicRecord[] {
  if (source.dataset !== 'oasis-island') throw new Error('Oasis rollback source belongs to another dataset.')
  return Object.freeze(source.records.map((record) => {
    const derived = Object.freeze({ ...record, ...publication })
    assertOasisPublicRecord(derived)
    return derived
  }))
}

export function assertOasisPublicRecord(value: unknown): asserts value is OasisPublicRecord {
  const record = object(value)
  if (!record) throw new Error('Oasis public record is not an object.')
  const missing = (OASIS_PUBLIC_RECORD_ALLOW_LIST as readonly string[]).filter((key) => !Object.hasOwn(record, key))
  if (missing.length > 0) throw new Error(`Oasis public record is missing required fields: ${missing.join(', ')}`)
  const extra = Object.keys(record).filter((key) => !(OASIS_PUBLIC_RECORD_ALLOW_LIST as readonly string[]).includes(key))
  if (extra.length > 0) throw new Error(`Oasis public record contains non-allow-listed fields: ${extra.join(', ')}`)
  const serialized = JSON.stringify(record)
  for (const field of OASIS_FORBIDDEN_PUBLIC_FIELDS) {
    if (new RegExp(`"${field}"\\s*:`).test(serialized)) throw new Error(`Oasis public record contains forbidden field: ${field}`)
  }
  if (record.schemaVersion !== OASIS_PUBLIC_PROJECTION_SCHEMA_VERSION || record.status !== 'published') throw new Error('Oasis public record is not a published v2 projection.')
  if (typeof record.id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(record.id)) throw new Error('Oasis public record has an invalid stable ID.')
  assertTrimmedString(record.name, `Oasis public record ${record.id}.name`)
  assertTrimmedString(record.recordType, `Oasis public record ${record.id}.recordType`)
  if (!Array.isArray(record.aliases)) throw new Error(`Oasis public record ${record.id}.aliases must be an array.`)
  record.aliases.forEach((alias, index) => assertTrimmedString(alias, `Oasis public record ${record.id}.aliases[${index}]`))
  if (new Set(record.aliases).size !== record.aliases.length) throw new Error(`Oasis public record ${record.id}.aliases must be unique.`)
  assertNullableTrimmedString(record.rarity, `Oasis public record ${record.id}.rarity`)
  assertNullableTrimmedString(record.availabilityCategory, `Oasis public record ${record.id}.availabilityCategory`)
  assertNullableTrimmedString(record.function, `Oasis public record ${record.id}.function`)
  assertNullablePositiveInteger(record.typeLimit, `Oasis public record ${record.id}.typeLimit`)
  assertNullablePositiveInteger(record.maxLevel, `Oasis public record ${record.id}.maxLevel`)
  assertNullableNonNegativeNumber(record.maxProsperity, `Oasis public record ${record.id}.maxProsperity`)
  const footprint = assertNullableExactObject(record.footprint, OASIS_PUBLIC_FOOTPRINT_KEYS, `Oasis public record ${record.id}.footprint`)
  if (footprint) {
    assertNullablePositiveInteger(footprint.width, `Oasis public record ${record.id}.footprint.width`)
    assertNullablePositiveInteger(footprint.height, `Oasis public record ${record.id}.footprint.height`)
    assertNullableTrimmedString(footprint.display, `Oasis public record ${record.id}.footprint.display`)
  }
  if (!Array.isArray(record.levels)) throw new Error(`Oasis public record ${record.id}.levels must be an array.`)
  record.levels.forEach((item, index) => assertPublicLevel(item, `Oasis public record ${record.id}.levels[${index}]`))
  assertPublicBonusArray(record.maxEffects, `Oasis public record ${record.id}.maxEffects`)
  const unlock = assertNullableExactObject(record.unlock, OASIS_PUBLIC_UNLOCK_KEYS, `Oasis public record ${record.id}.unlock`)
  if (unlock) {
    assertNullableTrimmedString(unlock.requirement, `Oasis public record ${record.id}.unlock.requirement`)
    assertNullableTrimmedString(unlock.initialBlueprintPurchase, `Oasis public record ${record.id}.unlock.initialBlueprintPurchase`)
  }
  const upgrade = assertNullableExactObject(record.upgrade, OASIS_PUBLIC_UPGRADE_KEYS, `Oasis public record ${record.id}.upgrade`)
  if (upgrade) {
    assertNullableTrimmedString(upgrade.currency, `Oasis public record ${record.id}.upgrade.currency`)
    assertNullableTrimmedString(upgrade.exchange, `Oasis public record ${record.id}.upgrade.exchange`)
    assertNullableTrimmedString(upgrade.generalBlueprintRefresh, `Oasis public record ${record.id}.upgrade.generalBlueprintRefresh`)
    assertNullableTrimmedString(upgrade.officiallyVerified, `Oasis public record ${record.id}.upgrade.officiallyVerified`)
  }
  if (record.canonicalRoute !== `/oasis-island/buildings/${record.id}`) throw new Error('Oasis public record has an invalid canonical route.')
  if (typeof record.publicationId !== 'string' || !record.publicationId.trim() || record.publicationId !== record.publicationId.trim() || typeof record.publicationVersion !== 'number' || !Number.isInteger(record.publicationVersion) || record.publicationVersion < 1) throw new Error('Oasis public record has an invalid publication identity.')
  assertIsoTimestamp(record.publishedAt, `Oasis public record ${record.id}.publishedAt`)
  assertIsoTimestamp(record.updatedAt, `Oasis public record ${record.id}.updatedAt`)
  if (!(Object.values(OASIS_PUBLIC_TRUST_BY_SOURCE_STATUS) as readonly unknown[]).includes(record.trustLabel)) throw new Error('Oasis public record has an invalid trust label.')
  if (!Array.isArray(record.media)) throw new Error(`Oasis public record ${record.id}.media must be an array.`)
  record.media.forEach((item, index) => assertPublicMedia(item, `Oasis public record ${record.id}.media[${index}]`))
}

const OASIS_MISSING_ARTWORK_RECORD_IDS = Object.freeze([
  'construction-hut', 'fountain-of-life', 'golden-sunset', 'purifier', 'reservoir', 'skating-rink',
])

function mediaIdentity(recordId: string, media: OasisPublicMedia): string {
  return [recordId, media.url, media.alt, media.role, media.levelVariant ?? 'null', media.width, media.height].join('|')
}

export function assertOasisPublicationPayload(input: {
  publicationId: string
  sourceFingerprint: string
  manifestHash: string
  manifest: OasisMediaManifest
  records: readonly unknown[]
}): void {
  const manifest = object(input.manifest)
  if (!manifest || manifest.schemaVersion !== OASIS_MEDIA_MANIFEST_SCHEMA_VERSION
    || manifest.sourceFingerprintVersion !== OASIS_SOURCE_FINGERPRINT_VERSION) throw new Error('Oasis manifest must use the v2 fingerprint contract.')
  if (!/^[0-9a-f]{64}$/u.test(input.sourceFingerprint) || manifest.sourceFingerprint !== input.sourceFingerprint) throw new Error('Oasis source fingerprint does not match the manifest.')
  if (!/^[0-9a-f]{64}$/u.test(input.manifestHash) || hashOasisManifest(input.manifest) !== input.manifestHash) throw new Error('Oasis manifest hash does not match canonical content.')
  if (manifest.sourceAssetCount !== OASIS_PRIVATE_SOURCE_MEDIA_COUNT || manifest.derivativeAssetCount !== OASIS_PRIVATE_SOURCE_MEDIA_COUNT) throw new Error('Oasis manifest counts are incomplete.')
  if (!Array.isArray(manifest.entries) || manifest.entries.length !== OASIS_PRIVATE_SOURCE_MEDIA_COUNT) throw new Error('Oasis manifest requires exactly 111 entries.')
  const entries = manifest.entries.map((value) => object(value))
  if (entries.some((entry) => !entry)) throw new Error('Oasis manifest entries must be objects.')
  if (new Set(entries.map((entry) => entry?.privateSourceFilename)).size !== OASIS_PRIVATE_SOURCE_MEDIA_COUNT) throw new Error('Oasis private-source identities must be unique.')
  if (new Set(entries.map((entry) => entry?.publicDerivativePath)).size !== OASIS_PRIVATE_SOURCE_MEDIA_COUNT) throw new Error('Oasis derivative paths must be unique.')
  for (const entry of entries as Record<string, unknown>[]) {
    if (typeof entry.recordId !== 'string' || typeof entry.privateSourceFilename !== 'string'
      || typeof entry.publicDerivativePath !== 'string' || typeof entry.privateDerivativePath !== 'string'
      || !entry.publicDerivativePath.startsWith(`media/oasis-island/${entry.recordId}/`)
      || entry.privateDerivativePath !== `fixtures/oasis-001a-publication/${entry.publicDerivativePath}`
      || typeof entry.sourceChecksum !== 'string' || !/^[0-9a-f]{64}$/u.test(entry.sourceChecksum)
      || typeof entry.derivativeChecksum !== 'string' || !/^[0-9a-f]{64}$/u.test(entry.derivativeChecksum)
      || (entry.mediaRole !== 'catalogue' && entry.mediaRole !== 'level')
      || typeof entry.width !== 'number' || entry.width <= 0 || typeof entry.height !== 'number' || entry.height <= 0) {
      throw new Error('Oasis manifest entry metadata is incomplete or invalid.')
    }
  }
  if (!Array.isArray(manifest.missingArtworkRecordIds)
    || [...manifest.missingArtworkRecordIds].sort().join('|') !== OASIS_MISSING_ARTWORK_RECORD_IDS.join('|')) throw new Error('Oasis missing-artwork IDs are invalid.')
  const placeholder = object(manifest.placeholder)
  if (!placeholder || placeholder.publicDerivativePath !== 'media/oasis-island/shared/artwork-unavailable.webp'
    || placeholder.privateDerivativePath !== `fixtures/oasis-001a-publication/${placeholder.publicDerivativePath}`
    || typeof placeholder.derivativeChecksum !== 'string' || !/^[0-9a-f]{64}$/u.test(placeholder.derivativeChecksum)
    || typeof placeholder.width !== 'number' || placeholder.width <= 0 || typeof placeholder.height !== 'number' || placeholder.height <= 0
    || typeof placeholder.altText !== 'string' || !placeholder.altText) throw new Error('Oasis placeholder metadata is incomplete or invalid.')
  if (!Array.isArray(input.records) || input.records.length !== OASIS_PUBLIC_RECORD_COUNT) throw new Error('Oasis publication requires exactly 55 records.')
  for (const record of input.records) assertOasisPublicRecord(record)
  const records = input.records as OasisPublicRecord[]
  if (new Set(records.map((record) => record.id)).size !== OASIS_PUBLIC_RECORD_COUNT) throw new Error('Oasis record IDs must be unique.')
  if (records.some((record) => record.publicationId !== input.publicationId)) throw new Error('Oasis record publication identity conflicts with the publication.')
  const expectedMedia = new Set((input.manifest.entries as OasisMediaManifestEntry[]).map((entry) => mediaIdentity(entry.recordId, {
    url: `/${entry.publicDerivativePath}`, alt: entry.altText, role: entry.mediaRole, levelVariant: entry.levelVariant, width: entry.width, height: entry.height,
  })))
  for (const recordId of OASIS_MISSING_ARTWORK_RECORD_IDS) expectedMedia.add(mediaIdentity(recordId, {
    url: `/${input.manifest.placeholder.publicDerivativePath}`, alt: input.manifest.placeholder.altText, role: 'placeholder', levelVariant: null,
    width: input.manifest.placeholder.width, height: input.manifest.placeholder.height,
  }))
  const actualMediaIdentities = records.flatMap((record) => record.media.map((media) => mediaIdentity(record.id, media)))
  const actualMedia = new Set(actualMediaIdentities)
  if (actualMediaIdentities.length !== expectedMedia.size || actualMedia.size !== expectedMedia.size
    || [...actualMedia].some((identity) => !expectedMedia.has(identity))) throw new Error('Oasis public media does not match the approved manifest.')
}
