import type {
  PublishedDatasetKey,
} from "./dataEngineApi";

import {
  getPublishedDatasetCapabilities,
  requireRegisteredDatasetCapabilities,
} from "../../../shared/data-engine/dataset-capabilities";

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
  itemsDatasetAdapter,
} from "./itemsDatasetAdapter";

import {
  coreDatasetAdapters,
} from "./coreDatasetAdapters";

import {
  hasAdminDatasetRegistration,
  listAdminDatasetRegistrations,
  requireAdminDatasetRegistration,
} from "./datasetDefinitions";

import {
  getRecordEditorSchema,
} from "./recordEditor/recordEditorSchemaRegistry";

const registeredAdapters: DatasetAdapter[] = [
  itemsDatasetAdapter,
  heroesDatasetAdapter,
  heroSkillsDatasetAdapter,
  eventsDatasetAdapter,
  buildingsDatasetAdapter,
  ...coreDatasetAdapters,
];

const datasetAdapters = new Map<
  PublishedDatasetKey,
  DatasetAdapter
>();

for (const adapter of registeredAdapters) {
  const registration =
    requireAdminDatasetRegistration(
      adapter.datasetId,
    );

  if (
    registration.capabilities?.browsing !== true
  ) {
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
  const sharedCapabilities =
    registration.id === "items"
      ? getPublishedDatasetCapabilities(registration.id)
      : requireRegisteredDatasetCapabilities(
          registration.id,
        );
  const adapter = datasetAdapters.get(registration.id);
  const editorSchema =
    getRecordEditorSchema(registration.id);

  const hasBrowserAdapter = Boolean(adapter);

  const declaredChecks = [
    ["browsing", registration.capabilities?.browsing === true],
    ["creation", registration.capabilities?.creation === true],
    ["editing", registration.capabilities?.editing === true],
    ["importing", registration.capabilities?.importing === true],
    ["publishing", registration.capabilities?.publishing === true],
    ["search", registration.capabilities?.search === true],
    ["versionHistory", registration.capabilities?.versionHistory === true],
  ] as const;

  for (const [capability, declared] of declaredChecks) {
    if (sharedCapabilities[capability] !== declared) {
      throw new Error(
        `Dataset "${registration.id}" ${capability} declaration does not match the shared capability registry.`,
      );
    }
  }

  if (
    (registration.capabilities?.browsing === true) !==
    hasBrowserAdapter
  ) {
    throw new Error(
      `Dataset "${registration.id}" browsing capability does not match its browser adapter registration.`,
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
    hasCompleteRecordEditor &&
    editorSchema?.allowCreate &&
    editorSchema.createEmptyRecord,
  );

  if (
    (registration.capabilities?.creation === true) !==
    hasCompleteCreationFlow
  ) {
    throw new Error(
      `Dataset "${registration.id}" creation capability does not match its Record Editor schema.`,
    );
  }

  if (
    registration.capabilities?.publishing === true &&
    !hasCompleteRecordEditor
  ) {
    throw new Error(
      `Dataset "${registration.id}" cannot declare publishing without a complete Record Editor integration.`,
    );
  }

  if (
    registration.capabilities?.versionHistory === true &&
    !hasCompleteRecordEditor
  ) {
    throw new Error(
      `Dataset "${registration.id}" cannot declare version history without a complete Record Editor integration.`,
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
    datasetId as PublishedDatasetKey,
  );
}

export function hasDatasetAdapter(
  datasetId: string,
): boolean {
  return (
    hasAdminDatasetRegistration(datasetId) &&
    datasetAdapters.has(
      datasetId as PublishedDatasetKey,
    )
  );
}

export function listDatasetAdapters():
PublishedDatasetKey[] {
  return [
    ...datasetAdapters.keys(),
  ].sort(
    (first, second) =>
      first.localeCompare(
        second,
      ),
  );
}
