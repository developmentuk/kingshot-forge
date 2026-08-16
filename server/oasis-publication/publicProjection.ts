import { createHash } from 'node:crypto'

export const OASIS_PUBLIC_PROJECTION_SCHEMA_VERSION = 'oasis-public-projection-v1' as const
export const OASIS_PUBLIC_RECORD_COUNT = 55
export const OASIS_PRIVATE_SOURCE_MEDIA_COUNT = 111

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
  trustLabel: 'Owner verified in-game'
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
  schemaVersion: 'oasis-media-manifest-v1'
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
  recordCount: number
  mediaCount: number
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

function object(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function number(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function boolean(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null
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
  return Object.freeze({
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
    trustLabel: 'Owner verified in-game',
    media: Object.freeze(publicMedia(id, manifest)),
    publicationId: publication.publicationId,
    publicationVersion: publication.publicationVersion,
    publishedAt: publication.publishedAt,
    updatedAt: publication.updatedAt,
    canonicalRoute: `/oasis-island/buildings/${id}`,
    status: 'published',
  })
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

export function assertOasisPublicRecord(value: unknown): asserts value is OasisPublicRecord {
  const record = object(value)
  if (!record) throw new Error('Oasis public record is not an object.')
  const extra = Object.keys(record).filter((key) => !(OASIS_PUBLIC_RECORD_ALLOW_LIST as readonly string[]).includes(key))
  if (extra.length > 0) throw new Error(`Oasis public record contains non-allow-listed fields: ${extra.join(', ')}`)
  const serialized = JSON.stringify(record)
  for (const field of OASIS_FORBIDDEN_PUBLIC_FIELDS) {
    if (new RegExp(`"${field}"\\s*:`).test(serialized)) throw new Error(`Oasis public record contains forbidden field: ${field}`)
  }
  if (record.schemaVersion !== OASIS_PUBLIC_PROJECTION_SCHEMA_VERSION || record.status !== 'published') throw new Error('Oasis public record is not a published v1 projection.')
  if (typeof record.id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(record.id)) throw new Error('Oasis public record has an invalid stable ID.')
  if (record.canonicalRoute !== `/oasis-island/buildings/${record.id}`) throw new Error('Oasis public record has an invalid canonical route.')
  if (typeof record.publicationId !== 'string' || !record.publicationId || typeof record.publicationVersion !== 'number' || !Number.isInteger(record.publicationVersion) || record.publicationVersion < 1) throw new Error('Oasis public record has an invalid publication identity.')
  if (record.trustLabel !== 'Owner verified in-game') throw new Error('Oasis public record has an invalid trust label.')
  if (!Array.isArray(record.levels) || !Array.isArray(record.maxEffects) || !Array.isArray(record.media)) throw new Error('Oasis public record has invalid projection collections.')
}

const OASIS_MISSING_ARTWORK_RECORD_IDS = Object.freeze([
  'construction-hut', 'fountain-of-life', 'golden-sunset', 'purifier', 'reservoir', 'skating-rink',
])

function mediaIdentity(recordId: string, media: OasisPublicMedia): string {
  return [recordId, media.url, media.role, media.levelVariant ?? 'null', media.width, media.height].join('|')
}

export function assertOasisPublicationPayload(input: {
  publicationId: string
  sourceFingerprint: string
  manifestHash: string
  manifest: OasisMediaManifest
  records: readonly unknown[]
}): void {
  const manifest = object(input.manifest)
  if (!manifest || manifest.schemaVersion !== 'oasis-media-manifest-v1') throw new Error('Oasis manifest must be a v1 JSON object.')
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
  const actualMedia = new Set(records.flatMap((record) => record.media.map((media) => mediaIdentity(record.id, media))))
  if (actualMedia.size !== expectedMedia.size || [...actualMedia].some((identity) => !expectedMedia.has(identity))) throw new Error('Oasis public media does not match the approved manifest.')
}
