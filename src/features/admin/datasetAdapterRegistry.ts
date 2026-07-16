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
  listAdminDatasetRegistrations,
  requireAdminDatasetRegistration,
} from "./datasetDefinitions";

import {
  getRecordEditorSchema,
} from "./recordEditor/recordEditorSchemaRegistry";

import {
  readOnlyDatasetAdapters,
} from "./readOnlyDatasetAdapters";

const registeredAdapters: DatasetAdapter[] = [
  heroesDatasetAdapter,
  heroSkillsDatasetAdapter,
  eventsDatasetAdapter,
  buildingsDatasetAdapter,
  ...readOnlyDatasetAdapters,
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

  if (registration.capabilities?.browsing !== true) {
    throw new Error(
      `Dataset "${adapter.datasetId}" has a browser adapter but does not declare the browsing capability.`,
    );
  }

  if (
    adapter.createEditorRecord &&
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

for (const registration of listAdminDatasetRegistrations()) {
  const adapter = datasetAdapters.get(registration.id);
  const editorSchema =
    getRecordEditorSchema(registration.id);

  if (
    registration.capabilities?.browsing === true &&
    !adapter
  ) {
    throw new Error(
      `Dataset "${registration.id}" declares browsing support but has no browser adapter.`,
    );
  }

  const hasCompleteRecordEditor = Boolean(
    adapter?.createEditorRecord &&
    editorSchema,
  );

  if (
    (registration.capabilities?.editing === true) !==
    hasCompleteRecordEditor
  ) {
    throw new Error(
      `Dataset "${registration.id}" editing capability does not match its Record Editor adapter and schema.`,
    );
  }

  const hasCompleteCreationFlow = Boolean(
    adapter?.createEditorRecord &&
    editorSchema?.allowCreate &&
    editorSchema.createEmptyRecord,
  );

  if (
    (registration.capabilities?.creation === true) !==
    hasCompleteCreationFlow
  ) {
    throw new Error(
      `Dataset "${registration.id}" creation capability does not match its Record Editor integration.`,
    );
  }
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
