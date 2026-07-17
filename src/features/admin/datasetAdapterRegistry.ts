import type {
  DatasetKey,
} from "./dataEngineApi";

import {
  getDatasetCapabilityReadiness,
} from "../../../shared/data-engine/readiness-registry";

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
  heroesDatasetAdapter,
  heroSkillsDatasetAdapter,
  eventsDatasetAdapter,
  buildingsDatasetAdapter,
  ...coreDatasetAdapters,
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
  const adapter = datasetAdapters.get(registration.id);
  const editorSchema =
    getRecordEditorSchema(registration.id);

  const hasBrowserAdapter = Boolean(adapter);

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

  const readinessChecks = [
    ["browser", hasBrowserAdapter],
    ["editor", hasCompleteRecordEditor],
    [
      "publishing",
      registration.capabilities?.publishing === true,
    ],
    [
      "version-history",
      registration.capabilities?.versionHistory === true,
    ],
    [
      "search",
      registration.capabilities?.search === true &&
        hasBrowserAdapter,
    ],
  ] as const;

  for (const [capability, implemented] of readinessChecks) {
    const readinessImplemented =
      getDatasetCapabilityReadiness(
        registration.id,
        capability,
      ).status === "implemented";

    if (readinessImplemented !== implemented) {
      throw new Error(
        `Dataset "${registration.id}" ${capability} readiness does not match its registered Admin capability.`,
      );
    }
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
