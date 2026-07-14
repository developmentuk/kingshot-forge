import type {
  DatasetKey,
  DatasetSourceMetadata,
  NormalisedDataset,
  SourceFetchResult,
} from '../../shared/data-engine/types'

import {
  fetchJsonSource,
} from './sourceFetcher'

import {
  getDatasetImporter,
} from './registry'

export interface DatasetPreviewResult {
  dataset: DatasetKey
  sourceUrl: string
  fetchedAt: string
  httpStatus: number
  payloadHash: string
  metadata: DatasetSourceMetadata | null
  recordCount: number
  recordKeys: string[]
}

export async function previewDataset(
  key: DatasetKey,
): Promise<DatasetPreviewResult> {
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