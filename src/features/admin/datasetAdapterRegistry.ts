import type {
  DatasetKey,
} from "./dataEngineApi";

import type {
  DatasetAdapter,
} from "./datasetAdapters";

import {
  buildingsDatasetAdapter,
} from "./buildingsDatasetAdapter";

import {
  eventsDatasetAdapter,
} from "./eventsDatasetAdapter";

import {
  heroesDatasetAdapter,
} from "./heroesDatasetAdapter";

import {
  heroSkillsDatasetAdapter,
} from "./heroSkillsDatasetAdapter";

import {
  hasAdminDatasetRegistration,
  requireAdminDatasetRegistration,
} from "./datasetDefinitions";

const registeredAdapters: DatasetAdapter[] = [
  heroesDatasetAdapter,
  heroSkillsDatasetAdapter,
  eventsDatasetAdapter,
  buildingsDatasetAdapter,
];

const datasetAdapters = new Map<
  DatasetKey,
  DatasetAdapter
>();

for (const adapter of registeredAdapters) {
  const registration =
    requireAdminDatasetRegistration(
      adapter.datasetId,
    );

  if (
    registration.capabilities?.editing !== true
  ) {
    throw new Error(
      `Dataset "${adapter.datasetId}" has an editor adapter but does not declare the editing capability.`,
    );
  }

  if (
    datasetAdapters.has(adapter.datasetId)
  ) {
    throw new Error(
      `Dataset adapter "${adapter.datasetId}" is already registered.`,
    );
  }

  datasetAdapters.set(
    adapter.datasetId,
    adapter,
  );
}

export function getDatasetAdapter(
  datasetId: string,
): DatasetAdapter | undefined {
  if (
    !hasAdminDatasetRegistration(datasetId)
  ) {
    return undefined;
  }

  return datasetAdapters.get(
    datasetId as DatasetKey,
  );
}

export function hasDatasetAdapter(
  datasetId: string,
): boolean {
  return (
    hasAdminDatasetRegistration(datasetId) &&
    datasetAdapters.has(
      datasetId as DatasetKey,
    )
  );
}

export function listDatasetAdapters():
DatasetKey[] {
  return [
    ...datasetAdapters.keys(),
  ].sort(
    (first, second) =>
      first.localeCompare(
        second,
      ),
  );
}
