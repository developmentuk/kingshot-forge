import type { SupabaseClient } from '@supabase/supabase-js'

import { getSupabaseAdmin } from '../database/supabaseAdmin.js'
import {
  assertOasisPublicRecord,
  hashOasisManifest,
  hashOasisRecordContent,
  OASIS_MEDIA_MANIFEST_SCHEMA_VERSION,
  OASIS_SOURCE_FINGERPRINT_VERSION,
  OASIS_PRIVATE_SOURCE_MEDIA_COUNT,
  OASIS_PUBLIC_PROJECTION_SCHEMA_VERSION,
  OASIS_PUBLIC_RECORD_COUNT,
  type OasisMediaManifest,
  type OasisPublicDataset,
  type OasisPublicRecord,
} from '../oasis-publication/publicProjection.js'

type Row = Record<string, unknown>

function asRow(value: unknown): Row | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Row
    : null
}

function requiredString(row: Row, field: string): string {
  const value = row[field]
  if (typeof value !== 'string' || !value.trim()) throw new Error(`Oasis publication has invalid ${field}.`)
  return value
}

function requiredInteger(row: Row, field: string): number {
  const value = row[field]
  if (typeof value !== 'number' || !Number.isInteger(value)) throw new Error(`Oasis publication has invalid ${field}.`)
  return value
}

function sameTimestamp(left: unknown, right: unknown): boolean {
  return typeof left === 'string' && typeof right === 'string'
    && Number.isFinite(Date.parse(left)) && Date.parse(left) === Date.parse(right)
}

function isMissingPublicationSchema(error: { code?: string; message?: string } | null): boolean {
  return error?.code === '42P01' || error?.code === 'PGRST205' || Boolean(error?.message?.includes('schema cache'))
}

function assertCompleteManifest(value: unknown, expectedFingerprint: string): asserts value is OasisMediaManifest {
  const manifest = asRow(value)
  if (!manifest || manifest.schemaVersion !== OASIS_MEDIA_MANIFEST_SCHEMA_VERSION
    || manifest.sourceFingerprintVersion !== OASIS_SOURCE_FINGERPRINT_VERSION) throw new Error('Oasis publication manifest is invalid.')
  if (manifest.sourceFingerprint !== expectedFingerprint) throw new Error('Oasis publication source fingerprint does not match its manifest.')
  if (manifest.sourceAssetCount !== OASIS_PRIVATE_SOURCE_MEDIA_COUNT || manifest.derivativeAssetCount !== OASIS_PRIVATE_SOURCE_MEDIA_COUNT) {
    throw new Error('Oasis publication manifest media counts are incomplete.')
  }
  if (!Array.isArray(manifest.entries) || manifest.entries.length !== OASIS_PRIVATE_SOURCE_MEDIA_COUNT) {
    throw new Error('Oasis publication manifest media mappings are incomplete.')
  }
  const derivativePaths = manifest.entries.map((entry) => asRow(entry)?.publicDerivativePath)
  const privateFilenames = manifest.entries.map((entry) => asRow(entry)?.privateSourceFilename)
  if (derivativePaths.some((path) => typeof path !== 'string') || new Set(derivativePaths).size !== OASIS_PRIVATE_SOURCE_MEDIA_COUNT) {
    throw new Error('Oasis publication manifest derivative paths are invalid or duplicated.')
  }
  if (privateFilenames.some((name) => typeof name !== 'string') || new Set(privateFilenames).size !== OASIS_PRIVATE_SOURCE_MEDIA_COUNT) {
    throw new Error('Oasis publication manifest private mappings are invalid or duplicated.')
  }
}

export async function loadPublishedOasisIslandDataset(
  client: SupabaseClient = getSupabaseAdmin(),
): Promise<OasisPublicDataset> {
  const pointerResult = await client
    .from('oasis_publication_current')
    .select('publication_id')
    .eq('singleton', true)
    .maybeSingle()

  if (isMissingPublicationSchema(pointerResult.error)) throw new Error('Oasis publication schema is not installed.')
  if (pointerResult.error) throw new Error(`Unable to read the current Oasis publication: ${pointerResult.error.message}`)
  const pointer = asRow(pointerResult.data)
  if (!pointer) throw new Error('Oasis has no current published version.')

  const publicationId = requiredString(pointer, 'publication_id')
  const publicationResult = await client
    .from('oasis_publication_versions')
    .select('publication_id, publication_version, schema_version, status, manifest, manifest_hash, source_fingerprint, record_content_hash, record_count, media_count, published_at, updated_at')
    .eq('publication_id', publicationId)
    .maybeSingle()

  if (isMissingPublicationSchema(publicationResult.error)) throw new Error('Oasis publication schema is not installed.')
  if (publicationResult.error) throw new Error(`Unable to read the current Oasis publication version: ${publicationResult.error.message}`)
  const publication = asRow(publicationResult.data)
  if (!publication || publication.status !== 'published' || publication.schema_version !== OASIS_PUBLIC_PROJECTION_SCHEMA_VERSION) {
    throw new Error('Oasis publication is not current and published.')
  }

  const recordCount = requiredInteger(publication, 'record_count')
  const mediaCount = requiredInteger(publication, 'media_count')
  if (recordCount !== OASIS_PUBLIC_RECORD_COUNT || mediaCount !== OASIS_PRIVATE_SOURCE_MEDIA_COUNT) {
    throw new Error('Oasis publication counts are incomplete.')
  }
  const sourceFingerprint = requiredString(publication, 'source_fingerprint')
  const manifest = publication.manifest
  assertCompleteManifest(manifest, sourceFingerprint)
  if (requiredString(publication, 'manifest_hash') !== hashOasisManifest(manifest)) {
    throw new Error('Oasis publication manifest verification failed.')
  }

  const recordsResult = await client
    .from('oasis_publication_records')
    .select('record_id, public_record')
    .eq('publication_id', publicationId)
    .order('record_id')
  if (isMissingPublicationSchema(recordsResult.error)) throw new Error('Oasis publication schema is not installed.')
  if (recordsResult.error) throw new Error(`Unable to read published Oasis records: ${recordsResult.error.message}`)

  const records = (recordsResult.data ?? []).map((row) => asRow(row)?.public_record)
  if (records.length !== recordCount) throw new Error('Oasis publication record set is incomplete.')
  const publicationVersion = requiredInteger(publication, 'publication_version')
  for (const record of records) {
    assertOasisPublicRecord(record)
    if (record.publicationId !== publicationId || record.publicationVersion !== publicationVersion) throw new Error('Oasis publication record identity mismatch.')
    if (!sameTimestamp(record.publishedAt, publication.published_at) || !sameTimestamp(record.updatedAt, publication.updated_at)) throw new Error('Oasis publication record timestamp mismatch.')
  }
  const publicRecords = records as OasisPublicRecord[]
  const recordContentHash = requiredString(publication, 'record_content_hash')
  if (recordContentHash !== hashOasisRecordContent(publicRecords)) throw new Error('Oasis publication record-content verification failed.')
  const placeholderUrl = `/${manifest.placeholder.publicDerivativePath.replace(/^\/+/, '')}`
  const mappedMedia = new Set(publicRecords.flatMap((record) => record.media.map((media) => media.url)).filter((url) => url !== placeholderUrl))
  if (mappedMedia.size !== mediaCount) throw new Error('Oasis publication public media set is incomplete.')

  return Object.freeze({
    schemaVersion: OASIS_PUBLIC_PROJECTION_SCHEMA_VERSION,
    dataset: 'oasis-island',
    status: 'current_published',
    publicationId,
    publicationVersion,
    publishedAt: requiredString(publication, 'published_at'),
    updatedAt: requiredString(publication, 'updated_at'),
    sourceFingerprint,
    manifestHash: requiredString(publication, 'manifest_hash'),
    recordContentHash,
    recordCount,
    mediaCount,
    records: Object.freeze(publicRecords),
  })
}
