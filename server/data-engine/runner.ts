import type {
  DatasetSourceMetadata,
  NormalisedDataset,
  PublishedDatasetKey,
  SourceFetchResult,
} from '../../shared/data-engine/types.js'

import {
  fetchJsonSource,
} from './sourceFetcher.js'

import {
  getDatasetImporter,
} from './registry.js'

import { loadPublishedBuildingsDataset } from './loadPublishedBuildingsDataset.js'
import { loadPublishedCompanionItemsDataset } from './loadPublishedCompanionItemsDataset.js'
import { loadSourceStagedOasisIslandDataset } from './loadSourceStagedOasisIslandDataset.js'

export interface DatasetPreviewResult {
  dataset: PublishedDatasetKey
  sourceUrl: string
  fetchedAt: string
  httpStatus: number
  payloadHash: string
  metadata: DatasetSourceMetadata | null
  recordCount: number
  recordKeys: string[]
}
export interface DatasetLoadResult {
  dataset: PublishedDatasetKey
  sourceUrl: string
  fetchedAt: string
  httpStatus: number
  payloadHash: string
  metadata: DatasetSourceMetadata | null
  recordCount: number
  records: unknown[]
}

function companionItemRecordKey(record: unknown): string | null {
  if (!record || typeof record !== 'object') return null
  const value = (record as Record<string, unknown>).key
  return typeof value === 'string' && value.trim()
    ? value.trim()
    : null
}

export async function previewDataset(
  key: PublishedDatasetKey,
): Promise<DatasetPreviewResult> {
  if (key === 'oasis-island') {
    const loaded = await loadSourceStagedOasisIslandDataset()
    return {
      dataset: loaded.dataset,
      sourceUrl: loaded.sourceUrl,
      fetchedAt: loaded.fetchedAt,
      httpStatus: loaded.httpStatus,
      payloadHash: loaded.payloadHash,
      metadata: loaded.metadata,
      recordCount: loaded.recordCount,
      recordKeys: loaded.records.map((record) => {
        const value = (record as Record<string, unknown>).id
        return typeof value === 'string' ? value : ''
      }).filter(Boolean),
    }
  }

  if (key === 'items') {
    const loaded = await loadPublishedCompanionItemsDataset()
    const recordKeys = loaded.records
      .map(companionItemRecordKey)
      .filter((recordKey): recordKey is string => Boolean(recordKey))

    return {
      dataset: loaded.dataset,
      sourceUrl: loaded.sourceUrl,
      fetchedAt: loaded.fetchedAt,
      httpStatus: loaded.httpStatus,
      payloadHash: loaded.payloadHash,
      metadata: loaded.metadata,
      recordCount: loaded.recordCount,
      recordKeys,
    }
  }

  const importer =
    getDatasetImporter(key)

  const fetched:
    SourceFetchResult<unknown> =
    await fetchJsonSource(
      importer.sourceUrl,
    )

  const parsed =
    importer.parsePayload(
      fetched.payload,
    )

  const normalised:
    NormalisedDataset<unknown> =
    importer.normalisePayload(parsed)

  const recordKeys =
    normalised.records.map((record) =>
      importer.getRecordKey(record),
    )

  const duplicateKeys =
    recordKeys.filter(
      (keyValue, index) =>
        recordKeys.indexOf(keyValue) !== index,
    )

  if (duplicateKeys.length > 0) {
    const uniqueDuplicates =
      [...new Set(duplicateKeys)]

    throw new Error(
      `Dataset "${key}" contains duplicate record keys: ${uniqueDuplicates.join(', ')}.`,
    )
  }

  return {
    dataset: key,
    sourceUrl: fetched.sourceUrl,
    fetchedAt: fetched.fetchedAt,
    httpStatus: fetched.httpStatus,
    payloadHash: fetched.payloadHash,
    metadata: normalised.metadata,
    recordCount: normalised.records.length,
    recordKeys,
  }
}

export async function loadDataset(
  key: PublishedDatasetKey,
): Promise<DatasetLoadResult> {
  if (key === 'oasis-island') {
    return loadSourceStagedOasisIslandDataset()
  }

  if (key === 'items') {
    return loadPublishedCompanionItemsDataset()
  }

  if (key === 'buildings' && process.env.SUPABASE_URL && (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)) {
    return loadPublishedBuildingsDataset()
  }

  const importer =
    getDatasetImporter(key)

  const fetched:
    SourceFetchResult<unknown> =
    await fetchJsonSource(
      importer.sourceUrl,
    )

  const parsed =
    importer.parsePayload(
      fetched.payload,
    )

  const normalised:
    NormalisedDataset<unknown> =
    importer.normalisePayload(parsed)

  const recordKeys =
    normalised.records.map((record) =>
      importer.getRecordKey(record),
    )

  const duplicateKeys =
    recordKeys.filter(
      (keyValue, index) =>
        recordKeys.indexOf(keyValue) !== index,
    )

  if (duplicateKeys.length > 0) {
    const uniqueDuplicates =
      [...new Set(duplicateKeys)]

    throw new Error(
      `Dataset "${key}" contains duplicate record keys: ${uniqueDuplicates.join(", ")}.`,
    )
  }

  return {
    dataset: key,
    sourceUrl: fetched.sourceUrl,
    fetchedAt: fetched.fetchedAt,
    httpStatus: fetched.httpStatus,
    payloadHash: fetched.payloadHash,
    metadata: normalised.metadata,
    recordCount: normalised.records.length,
    records: normalised.records,
  }
}
