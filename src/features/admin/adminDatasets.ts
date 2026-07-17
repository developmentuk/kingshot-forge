import {
  getDatasetReadinessDefinition,
  type DatasetReadinessDefinition,
} from "../../../shared/data-engine/readiness-registry";

import {
  calculateReadiness,
  type ReadinessScore,
} from "../../../shared/platform/readiness";

import {
  adminDatasetService,
} from "./adminDatasetService";

import {
  getDatasetAdapter,
} from "./datasetAdapterRegistry";

import type {
  AdminDatasetRegistration,
} from "./datasetDefinitions";

import {
  getRecordEditorSchema,
} from "./recordEditor/recordEditorSchemaRegistry";

export interface AdminDatasetCapabilities {
  browsing: boolean;
  creation: boolean;
  editing: boolean;
  publishing: boolean;
  search: boolean;
  versionHistory: boolean;
  viewing: boolean;
}

export interface AdminDatasetDefinition {
  id: AdminDatasetRegistration["id"];
  name: string;
  description: string;
  route: string;
  sourceDescription: string;
  capabilities: AdminDatasetCapabilities;
  readiness: DatasetReadinessDefinition;
  readinessScore: ReadinessScore;
}

function toAdminDatasetDefinition(
  registration: AdminDatasetRegistration,
): AdminDatasetDefinition {
  const readiness =
    getDatasetReadinessDefinition(
      registration.id,
    );

  const adapter =
    getDatasetAdapter(registration.id);

  const editorSchema =
    getRecordEditorSchema(registration.id);

  const hasBrowser = Boolean(
    registration.capabilities?.browsing &&
    adapter,
  );

  const hasEditor = Boolean(
    registration.capabilities?.editing &&
    adapter?.createEditorRecord &&
    editorSchema,
  );

  const capabilities: AdminDatasetCapabilities = {
    browsing: hasBrowser,
    creation: Boolean(
      registration.capabilities?.creation &&
      hasEditor &&
      editorSchema?.allowCreate &&
      editorSchema.createEmptyRecord,
    ),
    editing: hasEditor,
    publishing: Boolean(
      registration.capabilities?.publishing &&
      hasEditor,
    ),
    search: Boolean(
      registration.capabilities?.search &&
      hasBrowser,
    ),
    versionHistory: Boolean(
      registration.capabilities?.versionHistory &&
      hasEditor,
    ),
    viewing: Boolean(
      hasBrowser,
    ),
  };

  return {
    id: registration.id,
    name: registration.title,
    description: registration.description,
    route:
      registration.route ??
      `/admin/data/${registration.id}`,
    sourceDescription:
      readiness.importMode === "source-staging"
        ? "Governed source-staging projection"
        : "Data Engine import source",
    capabilities,
    readiness,
    readinessScore: calculateReadiness(
      readiness.capabilities,
    ),
  };
}

export const adminDatasets: AdminDatasetDefinition[] =
  adminDatasetService
    .list({ category: "game-data" })
    .map(
      (definition) =>
        toAdminDatasetDefinition(
          definition as AdminDatasetRegistration,
        ),
    );

export function getAdminDataset(
  datasetId: string,
): AdminDatasetDefinition | undefined {
  const registration =
    adminDatasetService.get(datasetId) as
      | AdminDatasetRegistration
      | undefined;

  return registration
    ? toAdminDatasetDefinition(registration)
    : undefined;
}
