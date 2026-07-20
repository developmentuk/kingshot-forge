import type {
  DatasetDefinition,
} from "../../src/platform/datasets/index.js";

import {
  getDatasetCapabilityFlags,
  getRegisteredDatasetCapabilities,
} from "../../shared/data-engine/dataset-capabilities.js";
import {
  isDatasetKey,
} from "../../shared/data-engine/datasets.js";

import {
  createRecordEditorDatasetDefinition,
} from "../../src/features/admin/recordEditor/recordEditorPlatformValidation.js";
import {
  getRecordEditorSchema,
} from "../../src/features/admin/recordEditor/recordEditorSchemaRegistry.js";

import {
  EditorialDraftService,
  EditorialHistoryService,
  EditorialPermissionService,
  EditorialConcurrencyError,
  EditorialTransitionError,
  EditorialWorkflowService,
  PublicationQueueService,
  ScheduledPublishingService,
  SupabaseEditorialRepository,
  SupabaseAtomicPublicationRepository,
  SupabasePublicationQueueRepository,
  SupabaseScheduledPublicationRepository,
  standardEditorialPermissionPolicy,
} from "../../src/platform/index.js";

import {
  getSupabaseAdmin,
} from "../database/supabaseAdmin.js";
import {
  EditorialCapabilityError,
  EditorialDatasetNotFoundError,
  EditorialRecordNotFoundError,
  EditorialResourceMismatchError,
} from "./errors.js";
import {
  validateEditorialValues,
} from "./validation.js";

export interface EditorialRuntimeOptions {
  onPublicationCommitted?: (event: {
    datasetId: string;
    recordId: string;
    versionId?: string;
  }) => Promise<void> | void;
}

export function createRuntimeDatasetDefinition(
  datasetId: string,
): DatasetDefinition {
  const capabilities =
    getRegisteredDatasetCapabilities(datasetId);

  if (!capabilities || !isDatasetKey(datasetId)) {
    throw new EditorialDatasetNotFoundError(
      datasetId,
    );
  }

  const schema = getRecordEditorSchema(datasetId);

  if (!capabilities.editing || !schema) {
    throw new EditorialCapabilityError(
      datasetId,
      "editorial editing",
      `Dataset "${datasetId}" is browse-only and does not expose editorial mutation APIs.`,
    );
  }

  const definition =
    createRecordEditorDatasetDefinition(schema);

  return {
    ...definition,
    route: `/admin/data/${datasetId}`,
    capabilities:
      getDatasetCapabilityFlags(
        datasetId,
      ),
    permissions:
      standardEditorialPermissionPolicy,
  };
}

export function createEditorialRuntime(
  options: EditorialRuntimeOptions = {},
) {
  const client = getSupabaseAdmin();

  const editorialRepository =
    new SupabaseEditorialRepository(client);
  const queueRepository =
    new SupabasePublicationQueueRepository(client);
  const scheduleRepository =
    new SupabaseScheduledPublicationRepository(
      client,
    );
  const atomicPublicationRepository =
    new SupabaseAtomicPublicationRepository(
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
      async (context) => {
        const version =
          await editorialRepository.getVersion(
            context.item.versionId,
          );

        if (!version) {
          throw new EditorialRecordNotFoundError(
            context.item.datasetId,
            context.item.recordId,
          );
        }

        if (
          version.datasetId !==
            context.item.datasetId ||
          version.recordId !==
            context.item.recordId
        ) {
          throw new EditorialResourceMismatchError(
            "publication queue item",
          );
        }

        const head =
          await editorialRepository.getHead(
            context.item.datasetId,
            context.item.recordId,
          );

        if (!head) {
          throw new EditorialRecordNotFoundError(
            context.item.datasetId,
            context.item.recordId,
          );
        }

        if (
          head.currentVersion !==
            context.item.expectedVersion ||
          head.currentVersionId !==
            context.item.versionId
        ) {
          throw new EditorialConcurrencyError(
            context.item.datasetId,
            context.item.recordId,
            context.item.expectedVersion,
            head.currentVersion,
          );
        }

        if (
          head.status !== "approved" ||
          version.status !== "approved"
        ) {
          throw new EditorialTransitionError(
            head.status,
            ["approved"],
            "published",
          );
        }

        await validateEditorialValues(
          context.item.datasetId,
          context.item.recordId,
          version.values,
          "publish",
        );

        const result = await atomicPublicationRepository.publish(
          context.item,
        );
        if (options.onPublicationCommitted) {
          try {
            await options.onPublicationCommitted({
              datasetId: context.item.datasetId,
              recordId: context.item.recordId,
              versionId: result.publishedVersionId,
            });
          } catch (error) {
            console.error("[editorial] Search invalidation event failed", {
              datasetId: context.item.datasetId,
              recordId: context.item.recordId,
              error: error instanceof Error ? error.message : "unknown error",
            });
          }
        }
        return result;
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
    atomicPublicationRepository,
    draftService,
    workflowService,
    historyService,
    permissionService,
    queueService,
    scheduledPublishingService,
  };
}
