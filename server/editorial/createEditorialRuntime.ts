import type {
  DatasetDefinition,
} from "../../src/platform/datasets/index.js";

import {
  EditorialDraftService,
  EditorialHistoryService,
  EditorialPermissionService,
  EditorialWorkflowService,
  PublicationQueueService,
  ScheduledPublishingService,
  SupabaseEditorialRepository,
  SupabasePublicationQueueRepository,
  SupabaseScheduledPublicationRepository,
  standardEditorialPermissionPolicy,
  createEditorialPublicationExecutor,
} from "../../src/platform/index.js";

import {
  getSupabaseAdmin,
} from "../database/supabaseAdmin.js";

export function createRuntimeDatasetDefinition(
  datasetId: string,
): DatasetDefinition {
  return {
    id: datasetId,
    version: 1,
    title: datasetId,
    singularTitle: "Record",
    description:
      "Runtime editorial dataset definition.",
    category: "game-data",
    route: `/admin/data/${datasetId}`,
    idField: "id",
    titleField: "id",
    fields: [],
    capabilities: {
      browsing: true,
      editing: true,
      importing: true,
      search: true,
    },
    permissions:
      standardEditorialPermissionPolicy,
  };
}

export function createEditorialRuntime() {
  const client = getSupabaseAdmin();

  const editorialRepository =
    new SupabaseEditorialRepository(client);
  const queueRepository =
    new SupabasePublicationQueueRepository(client);
  const scheduleRepository =
    new SupabaseScheduledPublicationRepository(
      client,
    );

  const draftService =
    new EditorialDraftService(
      editorialRepository,
    );
  const workflowService =
    new EditorialWorkflowService(
      editorialRepository,
    );
  const historyService =
    new EditorialHistoryService(
      editorialRepository,
    );
  const permissionService =
    new EditorialPermissionService();

  const queueService =
    new PublicationQueueService(
      queueRepository,
      createEditorialPublicationExecutor(
        workflowService,
      ),
    );

  const scheduledPublishingService =
    new ScheduledPublishingService(
      scheduleRepository,
      queueService,
    );

  return {
    editorialRepository,
    queueRepository,
    scheduleRepository,
    draftService,
    workflowService,
    historyService,
    permissionService,
    queueService,
    scheduledPublishingService,
  };
}
