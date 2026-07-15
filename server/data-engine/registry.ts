import type {
  DatasetImporter,
  DatasetKey,
} from '../../shared/data-engine/types'

import {
  heroesImporter,
} from './importers/heroes/index.js'

import {
  eventsImporter,
} from './importers/events/index.js'

import {
  buildingsImporter,
} from './importers/buildings/index.js'

import {
  troopsImporter,
} from './importers/troops/index.js'

import {
  gearImporter,
} from './importers/gear/index.js'

import {
  truegoldImporter,
} from './importers/truegold/index.js'

import {
  vipImporter,
} from './importers/vip/index.js'

import {
  warAcademyImporter,
} from './importers/war-academy/index.js'

import {
  charmImporter,
} from './importers/charm/index.js'

import {
  heroXpImporter,
} from './importers/hero-xp/index.js'

import {
  shardsImporter,
} from './importers/shards/index.js'

import {
  mastersImporter,
} from './importers/masters/index.js'

import {
  kvkImporter,
} from './importers/kvk/index.js'

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
  return [...datasetRegistry.keys()].sort(
    (first, second) =>
      first.localeCompare(second),
  )
}

registerDataset(heroesImporter)
registerDataset(eventsImporter)
registerDataset(buildingsImporter)
registerDataset(troopsImporter)
registerDataset(gearImporter)
registerDataset(truegoldImporter)
registerDataset(vipImporter)
registerDataset(warAcademyImporter)
registerDataset(charmImporter)
registerDataset(heroXpImporter)
registerDataset(shardsImporter)
registerDataset(mastersImporter)
registerDataset(kvkImporter)