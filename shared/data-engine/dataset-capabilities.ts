import {
  isDatasetKey,
  type DatasetKey,
} from './datasets.js'

export interface RegisteredDatasetCapabilities {
  browsing: boolean
  creation: boolean
  editing: boolean
  importing: boolean
  publishing: boolean
  search: boolean
  validation: boolean
  versionHistory: boolean
  archive: boolean
  restore: boolean
  rollback: boolean
}

const browseOnlyCapabilities = {
  browsing: true,
  creation: false,
  editing: false,
  importing: true,
  publishing: false,
  search: true,
  validation: false,
  versionHistory: false,
  archive: false,
  restore: false,
  rollback: false,
} as const satisfies RegisteredDatasetCapabilities

export const DATASET_CAPABILITY_REGISTRY: Readonly<
  Record<DatasetKey, RegisteredDatasetCapabilities>
> = {
  heroes: {
    ...browseOnlyCapabilities,
    editing: true,
    publishing: true,
    validation: true,
    versionHistory: true,
  },
  'hero-skills': {
    ...browseOnlyCapabilities,
    creation: true,
    editing: true,
    importing: false,
    publishing: true,
    validation: true,
    versionHistory: true,
  },
  'hero-xp': browseOnlyCapabilities,
  shards: browseOnlyCapabilities,
  gear: browseOnlyCapabilities,
  charm: browseOnlyCapabilities,
  troops: browseOnlyCapabilities,
  buildings: {
    ...browseOnlyCapabilities,
    editing: true,
    validation: true,
    versionHistory: true,
  },
  truegold: browseOnlyCapabilities,
  'war-academy': browseOnlyCapabilities,
  vip: browseOnlyCapabilities,
  events: browseOnlyCapabilities,
  masters: browseOnlyCapabilities,
  kvk: browseOnlyCapabilities,
}

export function getRegisteredDatasetCapabilities(
  datasetId: string,
): RegisteredDatasetCapabilities | undefined {
  return isDatasetKey(datasetId)
    ? DATASET_CAPABILITY_REGISTRY[datasetId]
    : undefined
}

export function requireRegisteredDatasetCapabilities(
  datasetId: string,
): RegisteredDatasetCapabilities {
  const capabilities =
    getRegisteredDatasetCapabilities(datasetId)

  if (!capabilities) {
    throw new Error(
      `Dataset "${datasetId}" is not registered.`,
    )
  }

  return capabilities
}

export function getDatasetCapabilityFlags(
  datasetId: DatasetKey,
) {
  const capabilities =
    DATASET_CAPABILITY_REGISTRY[datasetId]

  return {
    browsing: capabilities.browsing,
    creation: capabilities.creation,
    editing: capabilities.editing,
    importing: capabilities.importing,
    publishing: capabilities.publishing,
    search: capabilities.search,
    versionHistory: capabilities.versionHistory,
  }
}
