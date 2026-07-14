import type {
  DatasetKey,
} from "./dataEngineApi";

import type {
  DatasetAdapter,
} from "./datasetAdapters";

import {
  heroesDatasetAdapter,
} from "./heroesDatasetAdapter";

import {
  eventsDatasetAdapter,
} from "./eventsDatasetAdapter";

const datasetAdapters = new Map<
  DatasetKey,
  DatasetAdapter
>([
  [
    heroesDatasetAdapter.datasetId,
    heroesDatasetAdapter,
  ],
  [
    eventsDatasetAdapter.datasetId,
    eventsDatasetAdapter,
  ],
]);

export function getDatasetAdapter(
  datasetId: string,
): DatasetAdapter | undefined {
  return datasetAdapters.get(
    datasetId as DatasetKey,
  );
}

export function hasDatasetAdapter(
  datasetId: string,
): boolean {
  return datasetAdapters.has(
    datasetId as DatasetKey,
  );
}

export function listDatasetAdapters():
  DatasetKey[] {
  return [...datasetAdapters.keys()].sort(
    (first, second) =>
      first.localeCompare(second),
  );
}