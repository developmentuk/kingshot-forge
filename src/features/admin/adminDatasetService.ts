import {
  DatasetService,
  type DatasetDefinition,
  type DatasetDefinitionSource,
} from "../../platform/datasets";

import {
  getAdminDatasetRegistration,
  hasAdminDatasetRegistration,
  listAdminDatasetRegistrations,
  requireAdminDatasetRegistration,
} from "./datasetDefinitions";

const adminDatasetSource: DatasetDefinitionSource = {
  get(datasetId: string): DatasetDefinition | undefined {
    return getAdminDatasetRegistration(datasetId);
  },

  require(datasetId: string): DatasetDefinition {
    return requireAdminDatasetRegistration(datasetId);
  },

  has(datasetId: string): boolean {
    return hasAdminDatasetRegistration(datasetId);
  },

  list(): DatasetDefinition[] {
    return listAdminDatasetRegistrations();
  },
};

export const adminDatasetService =
  new DatasetService(adminDatasetSource);
