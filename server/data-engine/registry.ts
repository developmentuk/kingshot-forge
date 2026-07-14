import type {
  DatasetImporter,
  DatasetKey,
} from '../../shared/data-engine/types'
import {
  heroesImporter,
} from './importers/heroes/index.js'

type RegisteredImporter =
  DatasetImporter<unknown, unknown>

const datasetRegistry =
  new Map<DatasetKey, RegisteredImporter>()

export function registerDataset<
  TPayload,
  TRecord,
>(
  importer: DatasetImporter<
    TPayload,
    TRecord
  >,
): void {
  if (datasetRegistry.has(importer.key)) {
    throw new Error(
      `Dataset "${importer.key}" is already registered.`,
    )
  }

  datasetRegistry.set(
    importer.key,
    importer as RegisteredImporter,
  )
}

export function getDatasetImporter(
  key: DatasetKey,
): RegisteredImporter {
  const importer =
    datasetRegistry.get(key)

  if (!importer) {
    throw new Error(
      `Dataset "${key}" is not registered.`,
    )
  }

  return importer
}

export function hasDatasetImporter(
  key: DatasetKey,
): boolean {
  return datasetRegistry.has(key)
}

export function listRegisteredDatasets(): DatasetKey[] {
  return [...datasetRegistry.keys()]
    .sort((first, second) =>
      first.localeCompare(second),
    )
}
registerDataset(heroesImporter)