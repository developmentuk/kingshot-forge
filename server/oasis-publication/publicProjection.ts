import { createHash } from 'node:crypto'

export const OASIS_PUBLIC_PROJECTION_SCHEMA_VERSION = 'oasis-public-projection-v2' as const
export const OASIS_MEDIA_MANIFEST_SCHEMA_VERSION = 'oasis-media-manifest-v2' as const
export const OASIS_SOURCE_FINGERPRINT_VERSION = 'oasis-source-fingerprint-v2' as const
export const OASIS_CANONICAL_JSON_VERSION = 'oasis-canonical-json-v1' as const
export const OASIS_RECORD_CONTENT_HASH_VERSION = 'oasis-record-content-sha256-v2' as const
export const OASIS_CANONICAL_NUMBER_MAX_ABS = 100_000_000
export const OASIS_CANONICAL_NUMBER_DECIMAL_PLACES = 7
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

export type OasisPublicationCandidateIdentity = Readonly<{
  publicationId: string
  publicationVersion: null
  publishedAt: null
  updatedAt: null
}>

export type OasisPublicationCandidateRecord = Readonly<
  Omit<OasisPublicRecord, 'publicationVersion' | 'publishedAt' | 'updatedAt'> & {
    publicationVersion: null
    publishedAt: null
    updatedAt: null
  }
>

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

export type OasisPublicationCandidateSnapshot = Readonly<
  Omit<OasisImmutablePublicationSnapshot, 'records'> & {
    records: readonly OasisPublicationCandidateRecord[]
  }
>

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
  if (typeof value === 'number') canonicalOasisNumber(value)
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
  canonicalOasisNumber(value)
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

type OasisStagedSourceBonus = Readonly<{
  label?: string | null
  stat: string | null
  valuePct: number | null
  effect?: string | null
}>

type OasisStagedSourceLevel = Readonly<{
  level: number
  prosperity?: number | null
  prosperityRequired?: number | null
  waterEssencePerHour?: number | null
  buffs?: readonly OasisStagedSourceBonus[]
  buffsUnlocked?: readonly OasisStagedSourceBonus[]
  knownEffects?: readonly string[]
  exactOutputKnown?: boolean | null
}>

type OasisStagedSourceRecord = Readonly<{
  id: string
  name: string
  aliases: readonly string[]
  recordType: string
  rarity: string | null
  availabilityCategory?: string | null
  footprint: Readonly<{ width: number; height: number; display: string }> | null
  typeLimit: number | null
  maxLevel: number | null
  function?: string | null
  levels: readonly OasisStagedSourceLevel[]
  maxEffects?: readonly OasisStagedSourceBonus[]
  unlock?: Readonly<{ requirement: string | null; initialBlueprintPurchase: string | null }> | null
  upgradeMechanic?: Readonly<{
    currency: string | null
    exchange?: string | null
    generalBlueprintRefresh?: string | null
    officiallyVerified?: string | null
  }> | null
  maxProsperity?: number | null
  verification: Readonly<{ status: OasisSourceVerificationStatus }>
  images: Readonly<{
    files: readonly string[]
    levelVariants?: Readonly<Record<string, string | readonly string[]>>
    missing: boolean
  }>
}>

function assertRequiredField(value: Record<string, unknown>, key: string, path: string): void {
  if (!Object.hasOwn(value, key)) throw new Error(`${path}.${key} is required.`)
}

function assertOptionalNullableTrimmedString(value: Record<string, unknown>, key: string, path: string): void {
  if (Object.hasOwn(value, key)) assertNullableTrimmedString(value[key], `${path}.${key}`)
}

function assertOptionalNullableNonNegativeNumber(value: Record<string, unknown>, key: string, path: string): void {
  if (Object.hasOwn(value, key)) assertNullableNonNegativeNumber(value[key], `${path}.${key}`)
}

function assertStagedSourceBonus(value: unknown, path: string): asserts value is OasisStagedSourceBonus {
  const item = object(value)
  if (!item) throw new Error(`${path} must be a non-null object.`)
  assertRequiredField(item, 'stat', path)
  assertRequiredField(item, 'valuePct', path)
  assertOptionalNullableTrimmedString(item, 'label', path)
  assertNullableTrimmedString(item.stat, `${path}.stat`)
  assertNullableFiniteNumber(item.valuePct, `${path}.valuePct`)
  assertOptionalNullableTrimmedString(item, 'effect', path)
}

function assertStagedSourceBonusArray(value: Record<string, unknown>, key: string, path: string): void {
  if (!Object.hasOwn(value, key)) return
  const items = value[key]
  if (!Array.isArray(items)) throw new Error(`${path}.${key} must be an array when present.`)
  items.forEach((item, index) => assertStagedSourceBonus(item, `${path}.${key}[${index}]`))
}

function assertStagedSourceImages(value: unknown, path: string): void {
  const images = object(value)
  if (!images) throw new Error(`${path} must be a non-null object.`)
  assertRequiredField(images, 'files', path)
  assertRequiredField(images, 'missing', path)
  if (!Array.isArray(images.files)) throw new Error(`${path}.files must be an array.`)
  images.files.forEach((name, index) => assertTrimmedString(name, `${path}.files[${index}]`))
  if (typeof images.missing !== 'boolean') throw new Error(`${path}.missing must be a boolean.`)
  if (Object.hasOwn(images, 'levelVariants')) {
    const variants = object(images.levelVariants)
    if (!variants) throw new Error(`${path}.levelVariants must be an object when present.`)
    for (const [levelKey, names] of Object.entries(variants)) {
      if (!/^[1-9][0-9]*$/u.test(levelKey)) throw new Error(`${path}.levelVariants has an invalid level key.`)
      const list = Array.isArray(names) ? names : [names]
      if (list.length === 0) throw new Error(`${path}.levelVariants.${levelKey} must not be empty.`)
      list.forEach((name, index) => assertTrimmedString(name, `${path}.levelVariants.${levelKey}[${index}]`))
    }
  }
}

export function assertOasisStagedSourceRecord(value: unknown, path = 'Oasis staged source record'): asserts value is OasisStagedSourceRecord {
  const record = object(value)
  if (!record) throw new Error(`${path} must be a non-null object.`)
  for (const key of ['id', 'name', 'aliases', 'recordType', 'rarity', 'footprint', 'typeLimit', 'maxLevel', 'levels', 'verification', 'images']) {
    assertRequiredField(record, key, path)
  }
  assertTrimmedString(record.id, `${path}.id`)
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(record.id)) throw new Error(`${path}.id must be a stable slug.`)
  assertTrimmedString(record.name, `${path}.name`)
  assertTrimmedString(record.recordType, `${path}.recordType`)
  if (!Array.isArray(record.aliases)) throw new Error(`${path}.aliases must be an array.`)
  record.aliases.forEach((alias, index) => assertTrimmedString(alias, `${path}.aliases[${index}]`))
  if (new Set(record.aliases).size !== record.aliases.length) throw new Error(`${path}.aliases must be unique.`)
  assertNullableTrimmedString(record.rarity, `${path}.rarity`)
  assertOptionalNullableTrimmedString(record, 'availabilityCategory', path)
  assertOptionalNullableTrimmedString(record, 'function', path)
  assertNullablePositiveInteger(record.typeLimit, `${path}.typeLimit`)
  assertNullablePositiveInteger(record.maxLevel, `${path}.maxLevel`)
  assertOptionalNullableNonNegativeNumber(record, 'maxProsperity', path)

  if (record.footprint !== null) {
    const footprint = object(record.footprint)
    if (!footprint) throw new Error(`${path}.footprint must be an object or null.`)
    for (const key of OASIS_PUBLIC_FOOTPRINT_KEYS) assertRequiredField(footprint, key, `${path}.footprint`)
    assertPositiveInteger(footprint.width, `${path}.footprint.width`)
    assertPositiveInteger(footprint.height, `${path}.footprint.height`)
    assertTrimmedString(footprint.display, `${path}.footprint.display`)
  }

  if (!Array.isArray(record.levels)) throw new Error(`${path}.levels must be an array.`)
  record.levels.forEach((value, index) => {
    const level = object(value)
    const levelPath = `${path}.levels[${index}]`
    if (!level) throw new Error(`${levelPath} must be a non-null object.`)
    assertRequiredField(level, 'level', levelPath)
    assertPositiveInteger(level.level, `${levelPath}.level`)
    for (const key of ['prosperity', 'prosperityRequired', 'waterEssencePerHour']) {
      assertOptionalNullableNonNegativeNumber(level, key, levelPath)
    }
    assertStagedSourceBonusArray(level, 'buffs', levelPath)
    assertStagedSourceBonusArray(level, 'buffsUnlocked', levelPath)
    if (Object.hasOwn(level, 'knownEffects')) {
      if (!Array.isArray(level.knownEffects)) throw new Error(`${levelPath}.knownEffects must be an array when present.`)
      level.knownEffects.forEach((effect, effectIndex) => assertTrimmedString(effect, `${levelPath}.knownEffects[${effectIndex}]`))
    }
    if (Object.hasOwn(level, 'exactOutputKnown') && level.exactOutputKnown !== null && typeof level.exactOutputKnown !== 'boolean') {
      throw new Error(`${levelPath}.exactOutputKnown must be a boolean or null when present.`)
    }
  })
  assertStagedSourceBonusArray(record, 'maxEffects', path)

  if (Object.hasOwn(record, 'unlock') && record.unlock !== null) {
    const unlock = object(record.unlock)
    if (!unlock) throw new Error(`${path}.unlock must be an object or null when present.`)
    for (const key of OASIS_PUBLIC_UNLOCK_KEYS) assertRequiredField(unlock, key, `${path}.unlock`)
    assertNullableTrimmedString(unlock.requirement, `${path}.unlock.requirement`)
    assertNullableTrimmedString(unlock.initialBlueprintPurchase, `${path}.unlock.initialBlueprintPurchase`)
  }
  if (Object.hasOwn(record, 'upgradeMechanic') && record.upgradeMechanic !== null) {
    const upgrade = object(record.upgradeMechanic)
    if (!upgrade) throw new Error(`${path}.upgradeMechanic must be an object or null when present.`)
    assertRequiredField(upgrade, 'currency', `${path}.upgradeMechanic`)
    assertNullableTrimmedString(upgrade.currency, `${path}.upgradeMechanic.currency`)
    for (const key of ['exchange', 'generalBlueprintRefresh', 'officiallyVerified']) {
      assertOptionalNullableTrimmedString(upgrade, key, `${path}.upgradeMechanic`)
    }
  }
  const verification = object(record.verification)
  if (!verification) throw new Error(`${path}.verification must be a non-null object.`)
  assertRequiredField(verification, 'status', `${path}.verification`)
  assertTrimmedString(verification.status, `${path}.verification.status`)
  if (!Object.hasOwn(OASIS_PUBLIC_TRUST_BY_SOURCE_STATUS, verification.status)) throw new Error(`${path}.verification.status is unsupported.`)
  assertStagedSourceImages(record.images, `${path}.images`)
}

export function assertOasisStagedSourceRecords(value: readonly unknown[]): asserts value is readonly OasisStagedSourceRecord[] {
  if (!Array.isArray(value)) throw new Error('Oasis staged source records must be an array.')
  value.forEach((record, index) => assertOasisStagedSourceRecord(record, `Oasis staged source records[${index}]`))
}

function projectBonus(value: OasisStagedSourceBonus): OasisPublicBonus {
  return Object.freeze({
    label: value.label ?? null,
    stat: value.stat,
    valuePct: value.valuePct,
    effect: value.effect ?? null,
  })
}

function projectBonuses(value: readonly OasisStagedSourceBonus[] | undefined): OasisPublicBonus[] {
  return (value ?? []).map(projectBonus)
}

function projectLevel(value: OasisStagedSourceLevel): OasisPublicLevel {
  return Object.freeze({
    level: value.level,
    prosperity: value.prosperity ?? null,
    prosperityRequired: value.prosperityRequired ?? null,
    waterEssencePerHour: value.waterEssencePerHour ?? null,
    bonuses: Object.freeze([...projectBonuses(value.buffs), ...projectBonuses(value.buffsUnlocked)]),
    knownEffects: Object.freeze([...(value.knownEffects ?? [])]),
    exactOutputKnown: value.exactOutputKnown ?? null,
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

function projectOasisRecord(
  value: unknown,
  publication: OasisPublicationIdentity | OasisPublicationCandidateIdentity,
  manifest: OasisMediaManifest,
): OasisPublicRecord | OasisPublicationCandidateRecord {
  assertOasisStagedSourceRecord(value)
  const record = value
  const id = record.id
  const publicRecord = Object.freeze({
    schemaVersion: OASIS_PUBLIC_PROJECTION_SCHEMA_VERSION,
    id,
    name: record.name,
    aliases: Object.freeze([...record.aliases]),
    recordType: record.recordType,
    rarity: record.rarity,
    availabilityCategory: record.availabilityCategory ?? null,
    footprint: record.footprint ? Object.freeze({ ...record.footprint }) : null,
    typeLimit: record.typeLimit,
    maxLevel: record.maxLevel,
    function: record.function ?? null,
    levels: Object.freeze(record.levels.map(projectLevel)),
    maxEffects: Object.freeze(projectBonuses(record.maxEffects)),
    unlock: record.unlock ? Object.freeze({ ...record.unlock }) : null,
    upgrade: record.upgradeMechanic ? Object.freeze({
      currency: record.upgradeMechanic.currency,
      exchange: record.upgradeMechanic.exchange ?? null,
      generalBlueprintRefresh: record.upgradeMechanic.generalBlueprintRefresh ?? null,
      officiallyVerified: record.upgradeMechanic.officiallyVerified ?? null,
    }) : null,
    maxProsperity: record.maxProsperity ?? null,
    trustLabel: oasisPublicTrustLabel(record),
    media: Object.freeze(publicMedia(id, manifest)),
    publicationId: publication.publicationId,
    publicationVersion: publication.publicationVersion,
    publishedAt: publication.publishedAt,
    updatedAt: publication.updatedAt,
    canonicalRoute: `/oasis-island/buildings/${id}`,
    status: 'published',
  })
  if (publication.publicationVersion === null) assertOasisPublicationCandidateRecord(publicRecord)
  else assertOasisPublicRecord(publicRecord)
  return publicRecord
}

export function buildOasisPublicRecord(
  value: unknown,
  publication: OasisPublicationIdentity,
  manifest: OasisMediaManifest,
): OasisPublicRecord {
  return projectOasisRecord(value, publication, manifest) as OasisPublicRecord
}

export function buildOasisPublicationCandidateRecords(input: {
  records: readonly unknown[]
  publicationId: string
  manifest: OasisMediaManifest
}): readonly OasisPublicationCandidateRecord[] {
  assertTrimmedString(input.publicationId, 'Oasis candidate publicationId')
  assertOasisStagedSourceRecords(input.records)
  if (input.records.length !== OASIS_PUBLIC_RECORD_COUNT) throw new Error(`Oasis publication requires exactly ${OASIS_PUBLIC_RECORD_COUNT} records.`)
  const identity: OasisPublicationCandidateIdentity = Object.freeze({
    publicationId: input.publicationId,
    publicationVersion: null,
    publishedAt: null,
    updatedAt: null,
  })
  const records = input.records.map((record) => projectOasisRecord(record, identity, input.manifest) as OasisPublicationCandidateRecord)
  if (new Set(records.map((record) => record.id)).size !== records.length) throw new Error('Oasis publication contains duplicate record IDs.')
  return Object.freeze(records)
}

export function buildOasisPublicDataset(input: {
  records: readonly unknown[]
  publication: OasisPublicationIdentity
  manifest: OasisMediaManifest
}): OasisPublicDataset {
  assertOasisStagedSourceRecords(input.records)
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

export function canonicalOasisNumber(value: number): string {
  if (!Number.isFinite(value)) throw new Error('Oasis canonical numbers must be finite.')
  if (Math.abs(value) > OASIS_CANONICAL_NUMBER_MAX_ABS) {
    throw new Error(`Oasis canonical numbers must not exceed ${OASIS_CANONICAL_NUMBER_MAX_ABS} in absolute value.`)
  }
  const factor = 10 ** OASIS_CANONICAL_NUMBER_DECIMAL_PLACES
  const scaled = Math.round(value * factor)
  if (!Number.isSafeInteger(scaled) || value !== scaled / factor) {
    throw new Error(`Oasis canonical numbers support at most ${OASIS_CANONICAL_NUMBER_DECIMAL_PLACES} decimal places.`)
  }
  if (scaled === 0) return '0'
  const negative = scaled < 0
  const digits = String(Math.abs(scaled)).padStart(OASIS_CANONICAL_NUMBER_DECIMAL_PLACES + 1, '0')
  const whole = digits.slice(0, -OASIS_CANONICAL_NUMBER_DECIMAL_PLACES)
  const fraction = digits.slice(-OASIS_CANONICAL_NUMBER_DECIMAL_PLACES).replace(/0+$/u, '')
  return `${negative ? '-' : ''}${whole}${fraction ? `.${fraction}` : ''}`
}

export function stableOasisJson(value: unknown): string {
  if (value === null) return 'null'
  if (typeof value === 'number') return canonicalOasisNumber(value)
  if (typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableOasisJson).join(',')}]`
  if (typeof value === 'object') return `{${Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0).map(([key, item]) => `${JSON.stringify(key)}:${stableOasisJson(item)}`).join(',')}}`
  throw new Error(`Oasis canonical JSON does not support ${typeof value} values.`)
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
  return createHash('sha256')
    .update(`${OASIS_RECORD_CONTENT_HASH_VERSION}\n${stableOasisJson(sortedRecordContent(records))}`)
    .digest('hex')
}

export function hashOasisSourceFingerprint(input: {
  records: readonly unknown[]
  media: readonly Pick<OasisMediaManifestEntry, 'recordId' | 'privateSourceFilename' | 'sourceChecksum' | 'mediaRole' | 'levelVariant'>[]
}): string {
  assertOasisStagedSourceRecords(input.records)
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
  candidate: OasisPublicationCandidateSnapshot,
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
  publication: OasisPublicationCandidateIdentity,
): readonly OasisPublicationCandidateRecord[] {
  if (source.dataset !== 'oasis-island') throw new Error('Oasis rollback source belongs to another dataset.')
  return Object.freeze(source.records.map((record) => {
    const derived = Object.freeze({ ...record, ...publication })
    assertOasisPublicationCandidateRecord(derived)
    return derived
  }))
}

function assertExactEnumerableDataKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
  path: string,
): void {
  const keys = Object.keys(value)
  const missing = expected.filter((key) => !keys.includes(key))
  if (missing.length > 0) {
    if (path === 'Oasis public record') throw new Error(`Oasis public record is missing required fields: ${missing.join(', ')}`)
    throw new Error(`${path} is missing required fields: ${missing.join(', ')}`)
  }
  const extra = keys.filter((key) => !expected.includes(key))
  if (extra.length > 0) {
    if (path === 'Oasis public record') throw new Error(`Oasis public record contains non-allow-listed fields: ${extra.join(', ')}`)
    throw new Error(`${path} contains unexpected fields: ${extra.join(', ')}`)
  }
  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key)
    if (!descriptor || !Object.hasOwn(descriptor, 'value')) {
      throw new Error(`${path}.${key} must be an own enumerable data property.`)
    }
  }
}

function assertNoForbiddenPublicKeys(value: unknown, seen = new Set<object>()): void {
  if (value === null || typeof value !== 'object') return
  if (seen.has(value)) return
  seen.add(value)
  for (const key of Object.keys(value)) {
    if ((OASIS_FORBIDDEN_PUBLIC_FIELDS as readonly string[]).includes(key)) {
      throw new Error(`Oasis public record contains forbidden field: ${key}`)
    }
    const descriptor = Object.getOwnPropertyDescriptor(value, key)
    if (!descriptor || !Object.hasOwn(descriptor, 'value')) {
      throw new Error(`Oasis public record.${key} must be an own enumerable data property.`)
    }
    assertNoForbiddenPublicKeys(descriptor.value, seen)
  }
}

function assertOasisPublicRecordStructure(record: Record<string, unknown>): void {
  assertExactEnumerableDataKeys(record, OASIS_PUBLIC_RECORD_ALLOW_LIST, 'Oasis public record')
  assertNoForbiddenPublicKeys(record)
  if (!Array.isArray(record.aliases)) throw new Error('Oasis public record.aliases must be an array.')
  const footprint = record.footprint === null ? null : object(record.footprint)
  if (record.footprint !== null && !footprint) throw new Error('Oasis public record.footprint must be an object or null.')
  if (footprint) assertExactEnumerableDataKeys(footprint, OASIS_PUBLIC_FOOTPRINT_KEYS, 'Oasis public record.footprint')
  if (!Array.isArray(record.levels)) throw new Error('Oasis public record.levels must be an array.')
  record.levels.forEach((value, levelIndex) => {
    const level = object(value)
    if (!level) throw new Error(`Oasis public record.levels[${levelIndex}] must be a non-null object.`)
    assertExactEnumerableDataKeys(level, OASIS_PUBLIC_LEVEL_KEYS, `Oasis public record.levels[${levelIndex}]`)
    if (!Array.isArray(level.bonuses)) throw new Error(`Oasis public record.levels[${levelIndex}].bonuses must be an array.`)
    level.bonuses.forEach((bonusValue, bonusIndex) => {
      const bonus = object(bonusValue)
      if (!bonus) throw new Error(`Oasis public record.levels[${levelIndex}].bonuses[${bonusIndex}] must be a non-null object.`)
      assertExactEnumerableDataKeys(bonus, OASIS_PUBLIC_BONUS_KEYS, `Oasis public record.levels[${levelIndex}].bonuses[${bonusIndex}]`)
    })
    if (!Array.isArray(level.knownEffects)) throw new Error(`Oasis public record.levels[${levelIndex}].knownEffects must be an array.`)
  })
  if (!Array.isArray(record.maxEffects)) throw new Error('Oasis public record.maxEffects must be an array.')
  record.maxEffects.forEach((value, index) => {
    const bonus = object(value)
    if (!bonus) throw new Error(`Oasis public record.maxEffects[${index}] must be a non-null object.`)
    assertExactEnumerableDataKeys(bonus, OASIS_PUBLIC_BONUS_KEYS, `Oasis public record.maxEffects[${index}]`)
  })
  const unlock = record.unlock === null ? null : object(record.unlock)
  if (record.unlock !== null && !unlock) throw new Error('Oasis public record.unlock must be an object or null.')
  if (unlock) assertExactEnumerableDataKeys(unlock, OASIS_PUBLIC_UNLOCK_KEYS, 'Oasis public record.unlock')
  const upgrade = record.upgrade === null ? null : object(record.upgrade)
  if (record.upgrade !== null && !upgrade) throw new Error('Oasis public record.upgrade must be an object or null.')
  if (upgrade) assertExactEnumerableDataKeys(upgrade, OASIS_PUBLIC_UPGRADE_KEYS, 'Oasis public record.upgrade')
  if (!Array.isArray(record.media)) throw new Error('Oasis public record.media must be an array.')
  record.media.forEach((value, index) => {
    const media = object(value)
    if (!media) throw new Error(`Oasis public record.media[${index}] must be a non-null object.`)
    assertExactEnumerableDataKeys(media, OASIS_PUBLIC_MEDIA_KEYS, `Oasis public record.media[${index}]`)
  })
}

function assertRawString(value: unknown, path: string): asserts value is string {
  if (typeof value !== 'string') throw new Error(`${path} must be a non-empty trimmed string.`)
}

function assertRawNullableString(value: unknown, path: string): asserts value is string | null {
  if (value !== null) assertRawString(value, path)
}

function assertRawNullableNumber(value: unknown, path: string): asserts value is number | null {
  if (value !== null && typeof value !== 'number') throw new Error(`${path} must be a finite number or null.`)
}

function assertRawNumber(value: unknown, path: string): asserts value is number {
  if (typeof value !== 'number') throw new Error(`${path} must be a positive integer.`)
}

function assertRawTimestamp(value: unknown, path: string): asserts value is string {
  if (typeof value !== 'string') throw new Error(`${path} must be a valid UTC timestamp.`)
}

function assertRawPublicBonus(value: unknown, path: string): void {
  const bonus = value as Record<string, unknown>
  assertRawNullableString(bonus.label, `${path}.label`)
  assertRawNullableString(bonus.stat, `${path}.stat`)
  assertRawNullableNumber(bonus.valuePct, `${path}.valuePct`)
  assertRawNullableString(bonus.effect, `${path}.effect`)
}

function assertOasisPublicRecordRawValues(record: Record<string, unknown>, candidate: boolean): void {
  assertRawString(record.schemaVersion, 'Oasis public record.schemaVersion')
  assertRawString(record.id, 'Oasis public record.id')
  assertRawString(record.name, 'Oasis public record.name')
  ;(record.aliases as unknown[]).forEach((alias, index) => assertRawString(alias, `Oasis public record.aliases[${index}]`))
  assertRawString(record.recordType, 'Oasis public record.recordType')
  assertRawNullableString(record.rarity, 'Oasis public record.rarity')
  assertRawNullableString(record.availabilityCategory, 'Oasis public record.availabilityCategory')
  if (record.footprint !== null) {
    const footprint = record.footprint as Record<string, unknown>
    assertRawNullableNumber(footprint.width, 'Oasis public record.footprint.width')
    assertRawNullableNumber(footprint.height, 'Oasis public record.footprint.height')
    assertRawNullableString(footprint.display, 'Oasis public record.footprint.display')
  }
  assertRawNullableNumber(record.typeLimit, 'Oasis public record.typeLimit')
  assertRawNullableNumber(record.maxLevel, 'Oasis public record.maxLevel')
  assertRawNullableString(record.function, 'Oasis public record.function')
  ;(record.levels as Record<string, unknown>[]).forEach((level, levelIndex) => {
    const path = `Oasis public record.levels[${levelIndex}]`
    assertRawNullableNumber(level.level, `${path}.level`)
    assertRawNullableNumber(level.prosperity, `${path}.prosperity`)
    assertRawNullableNumber(level.prosperityRequired, `${path}.prosperityRequired`)
    assertRawNullableNumber(level.waterEssencePerHour, `${path}.waterEssencePerHour`)
    ;(level.bonuses as unknown[]).forEach((bonus, bonusIndex) => assertRawPublicBonus(bonus, `${path}.bonuses[${bonusIndex}]`))
    ;(level.knownEffects as unknown[]).forEach((effect, effectIndex) => assertRawString(effect, `${path}.knownEffects[${effectIndex}]`))
    if (level.exactOutputKnown !== null && typeof level.exactOutputKnown !== 'boolean') {
      throw new Error(`${path}.exactOutputKnown must be a boolean or null.`)
    }
  })
  ;(record.maxEffects as unknown[]).forEach((bonus, index) => assertRawPublicBonus(bonus, `Oasis public record.maxEffects[${index}]`))
  if (record.unlock !== null) {
    const unlock = record.unlock as Record<string, unknown>
    assertRawNullableString(unlock.requirement, 'Oasis public record.unlock.requirement')
    assertRawNullableString(unlock.initialBlueprintPurchase, 'Oasis public record.unlock.initialBlueprintPurchase')
  }
  if (record.upgrade !== null) {
    const upgrade = record.upgrade as Record<string, unknown>
    assertRawNullableString(upgrade.currency, 'Oasis public record.upgrade.currency')
    assertRawNullableString(upgrade.exchange, 'Oasis public record.upgrade.exchange')
    assertRawNullableString(upgrade.generalBlueprintRefresh, 'Oasis public record.upgrade.generalBlueprintRefresh')
    assertRawNullableString(upgrade.officiallyVerified, 'Oasis public record.upgrade.officiallyVerified')
  }
  assertRawNullableNumber(record.maxProsperity, 'Oasis public record.maxProsperity')
  assertRawString(record.trustLabel, 'Oasis public record.trustLabel')
  ;(record.media as Record<string, unknown>[]).forEach((media, index) => {
    const path = `Oasis public record.media[${index}]`
    assertRawString(media.url, `${path}.url`)
    assertRawString(media.alt, `${path}.alt`)
    assertRawString(media.role, `${path}.role`)
    assertRawNullableNumber(media.levelVariant, `${path}.levelVariant`)
    assertRawNumber(media.width, `${path}.width`)
    assertRawNumber(media.height, `${path}.height`)
  })
  assertRawString(record.publicationId, 'Oasis public record.publicationId')
  if (candidate) {
    if (record.publicationVersion !== null || record.publishedAt !== null || record.updatedAt !== null) {
      throw new Error('Oasis publication candidates must leave database-owned version and timestamps null.')
    }
  } else {
    if (typeof record.publicationVersion !== 'number') throw new Error('Oasis public record has an invalid publication identity.')
    assertRawTimestamp(record.publishedAt, 'Oasis public record.publishedAt')
    assertRawTimestamp(record.updatedAt, 'Oasis public record.updatedAt')
  }
  assertRawString(record.canonicalRoute, 'Oasis public record.canonicalRoute')
  assertRawString(record.status, 'Oasis public record.status')
}

export function assertOasisPublicRecord(value: unknown): asserts value is OasisPublicRecord {
  const record = object(value)
  if (!record) throw new Error('Oasis public record is not an object.')
  assertOasisPublicRecordStructure(record)
  assertOasisPublicRecordRawValues(record, false)
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
  canonicalOasisNumber(record.publicationVersion)
  assertIsoTimestamp(record.publishedAt, `Oasis public record ${record.id}.publishedAt`)
  assertIsoTimestamp(record.updatedAt, `Oasis public record ${record.id}.updatedAt`)
  if (!(Object.values(OASIS_PUBLIC_TRUST_BY_SOURCE_STATUS) as readonly unknown[]).includes(record.trustLabel)) throw new Error('Oasis public record has an invalid trust label.')
  if (!Array.isArray(record.media)) throw new Error(`Oasis public record ${record.id}.media must be an array.`)
  record.media.forEach((item, index) => assertPublicMedia(item, `Oasis public record ${record.id}.media[${index}]`))
}

export function assertOasisPublicationCandidateRecord(value: unknown): asserts value is OasisPublicationCandidateRecord {
  const record = object(value)
  if (!record) throw new Error('Oasis publication candidate record is not an object.')
  assertOasisPublicRecordStructure(record)
  assertOasisPublicRecordRawValues(record, true)
  assertOasisPublicRecord({
    ...record,
    publicationVersion: 1,
    publishedAt: '2000-01-01T00:00:00.000Z',
    updatedAt: '2000-01-01T00:00:00.000Z',
  })
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
  if (!manifest) throw new Error('Oasis manifest must use the v2 fingerprint contract.')
  if (!Array.isArray(manifest.entries)) throw new Error('Oasis manifest requires exactly 111 entries.')
  const entries = manifest.entries.map((value) => object(value))
  if (entries.some((entry) => !entry)) throw new Error('Oasis manifest entries must be objects.')
  if (!Array.isArray(manifest.missingArtworkRecordIds)) throw new Error('Oasis missing-artwork IDs are invalid.')
  const placeholder = object(manifest.placeholder)
  if (!placeholder) throw new Error('Oasis placeholder metadata is incomplete or invalid.')

  // Phase 1: prove every raw textual input is a primitive string before semantic processing.
  if (typeof input.publicationId !== 'string') throw new Error('Oasis publication input text metadata must use primitive strings.')
  if (typeof manifest.schemaVersion !== 'string' || typeof manifest.sourceFingerprintVersion !== 'string') {
    throw new Error('Oasis manifest must use the v2 fingerprint contract.')
  }
  if (typeof input.sourceFingerprint !== 'string' || typeof manifest.sourceFingerprint !== 'string') {
    throw new Error('Oasis source fingerprint does not match the manifest.')
  }
  if (typeof input.manifestHash !== 'string') throw new Error('Oasis manifest hash does not match canonical content.')
  if (entries.some((entry) => entry && (
    typeof entry.recordId !== 'string' || typeof entry.privateSourceFilename !== 'string'
    || typeof entry.sourceChecksum !== 'string' || typeof entry.publicDerivativePath !== 'string'
    || typeof entry.privateDerivativePath !== 'string' || typeof entry.derivativeChecksum !== 'string'
    || typeof entry.mediaRole !== 'string' || typeof entry.altText !== 'string'
  ))) throw new Error('Oasis manifest entry metadata is incomplete or invalid.')
  if (manifest.missingArtworkRecordIds.some((recordId) => typeof recordId !== 'string')) {
    throw new Error('Oasis missing-artwork IDs are invalid.')
  }
  if (typeof placeholder.publicDerivativePath !== 'string' || typeof placeholder.privateDerivativePath !== 'string'
    || typeof placeholder.derivativeChecksum !== 'string' || typeof placeholder.altText !== 'string') {
    throw new Error('Oasis placeholder metadata is incomplete or invalid.')
  }

  // Phase 2: semantic validation may now compare, match, deduplicate, interpolate and hash text.
  if (manifest.schemaVersion !== OASIS_MEDIA_MANIFEST_SCHEMA_VERSION
    || manifest.sourceFingerprintVersion !== OASIS_SOURCE_FINGERPRINT_VERSION) throw new Error('Oasis manifest must use the v2 fingerprint contract.')
  if (!/^[0-9a-f]{64}$/u.test(input.sourceFingerprint) || manifest.sourceFingerprint !== input.sourceFingerprint) throw new Error('Oasis source fingerprint does not match the manifest.')
  if (manifest.sourceAssetCount !== OASIS_PRIVATE_SOURCE_MEDIA_COUNT || manifest.derivativeAssetCount !== OASIS_PRIVATE_SOURCE_MEDIA_COUNT) throw new Error('Oasis manifest counts are incomplete.')
  assertPositiveInteger(manifest.sourceAssetBytes, 'Oasis manifest.sourceAssetBytes')
  assertPositiveInteger(manifest.derivativeAssetBytes, 'Oasis manifest.derivativeAssetBytes')
  if (manifest.entries.length !== OASIS_PRIVATE_SOURCE_MEDIA_COUNT) throw new Error('Oasis manifest requires exactly 111 entries.')
  if (new Set(entries.map((entry) => entry?.privateSourceFilename)).size !== OASIS_PRIVATE_SOURCE_MEDIA_COUNT) throw new Error('Oasis private-source identities must be unique.')
  if (new Set(entries.map((entry) => entry?.publicDerivativePath)).size !== OASIS_PRIVATE_SOURCE_MEDIA_COUNT) throw new Error('Oasis derivative paths must be unique.')
  for (const entry of entries as Record<string, unknown>[]) {
    assertTrimmedString(entry.altText, 'Oasis manifest entry.altText')
    if (typeof entry.recordId !== 'string' || typeof entry.privateSourceFilename !== 'string'
      || typeof entry.publicDerivativePath !== 'string' || typeof entry.privateDerivativePath !== 'string'
      || !entry.publicDerivativePath.startsWith(`media/oasis-island/${entry.recordId}/`)
      || entry.privateDerivativePath !== `fixtures/oasis-001a-publication/${entry.publicDerivativePath}`
      || typeof entry.sourceChecksum !== 'string' || !/^[0-9a-f]{64}$/u.test(entry.sourceChecksum)
      || typeof entry.derivativeChecksum !== 'string' || !/^[0-9a-f]{64}$/u.test(entry.derivativeChecksum)
      || typeof entry.altText !== 'string'
      || (entry.mediaRole !== 'catalogue' && entry.mediaRole !== 'level')
      || typeof entry.sourceBytes !== 'number' || !Number.isInteger(entry.sourceBytes) || entry.sourceBytes <= 0
      || typeof entry.derivativeBytes !== 'number' || !Number.isInteger(entry.derivativeBytes) || entry.derivativeBytes <= 0
      || typeof entry.width !== 'number' || !Number.isInteger(entry.width) || entry.width <= 0
      || typeof entry.height !== 'number' || !Number.isInteger(entry.height) || entry.height <= 0) {
      throw new Error('Oasis manifest entry metadata is incomplete or invalid.')
    }
  }
  const sourceAssetBytes = (entries as Record<string, unknown>[]).reduce((total, entry) => total + Number(entry.sourceBytes), 0)
  const derivativeAssetBytes = (entries as Record<string, unknown>[]).reduce((total, entry) => total + Number(entry.derivativeBytes), 0)
  if (manifest.sourceAssetBytes !== sourceAssetBytes || manifest.derivativeAssetBytes !== derivativeAssetBytes) {
    throw new Error('Oasis manifest byte totals do not match its entries.')
  }
  if ([...manifest.missingArtworkRecordIds].sort().join('|') !== OASIS_MISSING_ARTWORK_RECORD_IDS.join('|')) throw new Error('Oasis missing-artwork IDs are invalid.')
  const mappedArtworkRecordIds = new Set((entries as Record<string, unknown>[]).map((entry) => entry.recordId as string))
  if (manifest.missingArtworkRecordIds.some((recordId) => mappedArtworkRecordIds.has(recordId))) {
    throw new Error('Oasis mapped-artwork and missing-artwork record IDs must be disjoint.')
  }
  assertTrimmedString(placeholder.altText, 'Oasis manifest.placeholder.altText')
  if (placeholder.publicDerivativePath !== 'media/oasis-island/shared/artwork-unavailable.webp'
    || placeholder.privateDerivativePath !== `fixtures/oasis-001a-publication/${placeholder.publicDerivativePath}`
    || typeof placeholder.derivativeChecksum !== 'string' || !/^[0-9a-f]{64}$/u.test(placeholder.derivativeChecksum)
    || typeof placeholder.derivativeBytes !== 'number' || !Number.isInteger(placeholder.derivativeBytes) || placeholder.derivativeBytes <= 0
    || typeof placeholder.width !== 'number' || !Number.isInteger(placeholder.width) || placeholder.width <= 0
    || typeof placeholder.height !== 'number' || !Number.isInteger(placeholder.height) || placeholder.height <= 0
    || typeof placeholder.altText !== 'string' || !placeholder.altText) throw new Error('Oasis placeholder metadata is incomplete or invalid.')
  if (!Array.isArray(input.records) || input.records.length !== OASIS_PUBLIC_RECORD_COUNT) throw new Error('Oasis publication requires exactly 55 records.')
  for (const record of input.records) assertOasisPublicationCandidateRecord(record)
  const records = input.records as OasisPublicationCandidateRecord[]
  if (new Set(records.map((record) => record.id)).size !== OASIS_PUBLIC_RECORD_COUNT) throw new Error('Oasis record IDs must be unique.')
  if (records.some((record) => record.publicationId !== input.publicationId)) throw new Error('Oasis record publication identity conflicts with the publication.')
  const expectedPlaceholderIdentity = (recordId: string) => mediaIdentity(recordId, {
    url: `/${input.manifest.placeholder.publicDerivativePath}`, alt: input.manifest.placeholder.altText, role: 'placeholder', levelVariant: null,
    width: input.manifest.placeholder.width, height: input.manifest.placeholder.height,
  })
  for (const recordId of OASIS_MISSING_ARTWORK_RECORD_IDS) {
    const record = records.find((candidate) => candidate.id === recordId)
    if (!record || record.media.length !== 1 || mediaIdentity(recordId, record.media[0]) !== expectedPlaceholderIdentity(recordId)) {
      throw new Error('Each Oasis missing-artwork record must contain exactly the approved placeholder and no mapped artwork.')
    }
  }
  if (!/^[0-9a-f]{64}$/u.test(input.manifestHash) || hashOasisManifest(input.manifest) !== input.manifestHash) throw new Error('Oasis manifest hash does not match canonical content.')
  const expectedMedia = new Set((input.manifest.entries as OasisMediaManifestEntry[]).map((entry) => mediaIdentity(entry.recordId, {
    url: `/${entry.publicDerivativePath}`, alt: entry.altText, role: entry.mediaRole, levelVariant: entry.levelVariant, width: entry.width, height: entry.height,
  })))
  for (const recordId of OASIS_MISSING_ARTWORK_RECORD_IDS) expectedMedia.add(expectedPlaceholderIdentity(recordId))
  const actualMediaIdentities = records.flatMap((record) => record.media.map((media) => mediaIdentity(record.id, media)))
  const actualMedia = new Set(actualMediaIdentities)
  if (actualMediaIdentities.length !== expectedMedia.size || actualMedia.size !== expectedMedia.size
    || [...actualMedia].some((identity) => !expectedMedia.has(identity))) throw new Error('Oasis public media does not match the approved manifest.')
}
