import type {
  AdminDatasetRegistration,
} from "./datasetDefinitions";
import {
  adminDatasetService,
} from "./adminDatasetService";

import {
  getDatasetAdapter,
} from "./datasetAdapterRegistry";

import {
  getRecordEditorSchema,
} from "./recordEditor/recordEditorSchemaRegistry";

export type AdminDatasetStatus =
  | "editor-ready"
  | "browse-only"
  | "registered";

export interface AdminDatasetCapabilities {
  browsing: boolean;
  creation: boolean;
  editing: boolean;
  importing: boolean;
  publishing: boolean;
  search: boolean;
  versionHistory: boolean;
}

export interface AdminDatasetDefinition {
  id: string;
  name: string;
  description: string;
  route: string;
  status: AdminDatasetStatus;
  statusDescription: string;
  actionLabel: string;
  sourceDescription: string;
  capabilities: AdminDatasetCapabilities;
}

function toAdminDatasetDefinition(
  registration: AdminDatasetRegistration,
): AdminDatasetDefinition {
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

  const hasCreation = Boolean(
    registration.capabilities?.creation &&
    adapter?.createEditorRecord &&
    editorSchema?.allowCreate &&
    editorSchema.createEmptyRecord,
  );

  const capabilities: AdminDatasetCapabilities = {
    browsing: hasBrowser,
    creation: hasCreation,
    editing: hasEditor,
    importing:
      registration.capabilities?.importing === true,
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
  };

  const status: AdminDatasetStatus =
    hasEditor
      ? "editor-ready"
      : hasBrowser
        ? "browse-only"
        : "registered";

  return {
    id: registration.id,
    name: registration.title,
    description: registration.description,
    route:
      registration.route ??
      `/admin/data/${registration.id}`,
    status,
    statusDescription:
      status === "editor-ready"
        ? "Browse, inspect and edit records through the governed Record Editor."
        : status === "browse-only"
          ? "Browse and inspect live records. Record editing is not implemented for this dataset."
          : "The dataset is registered, but its Admin browser is not implemented yet.",
    actionLabel:
      status === "editor-ready"
        ? "Manage dataset"
        : status === "browse-only"
          ? "Browse dataset"
          : "View implementation status",
    sourceDescription:
      capabilities.importing
        ? "External Data Engine source"
        : "Published canonical source",
    capabilities,
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
