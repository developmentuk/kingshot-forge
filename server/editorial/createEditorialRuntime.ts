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
import {
  publishLiveDatasetRecord,
} from "./publishLiveDatasetRecord.js";

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

  const editorialExecutor =
    createEditorialPublicationExecutor(
      workflowService,
    );

  const queueService =
    new PublicationQueueService(
      queueRepository,
      async (context) => {
        const version =
          await editorialRepository.getVersion(
            context.item.versionId,
          );

        if (!version) {
          throw new Error(
            "The approved editorial version could not be found.",
          );
        }

        if (
          version.datasetId !==
            context.item.datasetId ||
          version.recordId !==
            context.item.recordId
        ) {
          throw new Error(
            "The publication queue item does not match its editorial version.",
          );
        }

        // Project the approved values into the live catalogue before
        // recording the editorial Published transition. If projection
        // fails, the queue item fails and the editorial record remains
        // Approved rather than claiming content is publicly available.
        await publishLiveDatasetRecord(
          client,
          context.item.datasetId,
          context.item.recordId,
          version.values,
          {
            version: version.version,
            versionId: version.id,
            publishedBy:
              context.item.requestedBy,
          },
        );

        return editorialExecutor(context);
      },
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
