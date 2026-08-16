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
  return `{${Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => `${JSON.stringify(key)}:${stableOasisJson(item)}`).join(',')}}`
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
}
