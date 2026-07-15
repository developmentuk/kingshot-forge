import {
  getAdminDatasetRegistration,
  listAdminDatasetRegistrations,
  type AdminDatasetStatus,
} from "./datasetDefinitions";

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

export const adminDatasets: AdminDatasetDefinition[] =
  listAdminDatasetRegistrations().map(
    (registration) => ({
      id: registration.id,
      name: registration.title,
      description: registration.description,
      route:
        registration.route ??
        `/admin/data/${registration.id}`,
      status: registration.admin.status,
    }),
  );

export function getAdminDataset(
  datasetId: string,
): AdminDatasetDefinition | undefined {
  const registration =
    getAdminDatasetRegistration(datasetId);

  if (!registration) {
    return undefined;
  }

  return {
    id: registration.id,
    name: registration.title,
    description: registration.description,
    route:
      registration.route ??
      `/admin/data/${registration.id}`,
    status: registration.admin.status,
  };
}
