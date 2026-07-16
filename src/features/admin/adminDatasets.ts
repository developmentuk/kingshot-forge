import type {
  AdminDatasetRegistration,
  AdminDatasetStatus,
} from "./datasetDefinitions";
import {
  adminDatasetService,
} from "./adminDatasetService";
import {
  hasDatasetAdapter,
} from "./datasetAdapterRegistry";

export type {
  AdminDatasetStatus,
} from "./datasetDefinitions";

export interface AdminDatasetDefinition {
  id: string;
  name: string;
  description: string;
  route: string;
  status: AdminDatasetStatus;
}

function getRuntimeStatus(
  registration: AdminDatasetRegistration,
): AdminDatasetStatus {
  if (hasDatasetAdapter(registration.id)) {
    return registration.id === "hero-skills"
      ? "warning"
      : "ready";
  }

  return registration.admin.status;
}

function toAdminDatasetDefinition(
  registration: AdminDatasetRegistration,
): AdminDatasetDefinition {
  return {
    id: registration.id,
    name: registration.title,
    description: registration.description,
    route:
      registration.route ??
      `/admin/data/${registration.id}`,
    status: getRuntimeStatus(registration),
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
