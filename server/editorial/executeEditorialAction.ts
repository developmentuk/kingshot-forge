import type {
  DatasetRecordValues,
  EditorialRecordHead,
  EditorialRecordVersion,
  EditorialTransitionInput,
  PublicationQueueItem,
  ScheduledPublication,
  EditorialRepository,
  EditorialDraftService,
  EditorialHistoryService,
  EditorialPermissionService,
  EditorialWorkflowService,
  PublicationQueueService,
  ScheduledPublishingService,
} from "../../src/platform/index.js";
import {
  AuthorisedEditorialService,
  EditorialConcurrencyError,
  EditorialTransitionError,
} from "../../src/platform/index.js";

import type {
  ForgeActor,
} from "../auth/requireForgeActor.js";
import {
  previewDataset,
} from "../data-engine/runner.js";
import {
  createEditorialRuntime,
  createRuntimeDatasetDefinition,
} from "./createEditorialRuntime.js";
import {
  getRegisteredDatasetCapabilities,
  type RegisteredDatasetCapabilities,
} from "../../shared/data-engine/dataset-capabilities.js";
import type {
  DatasetKey,
} from "../../shared/data-engine/datasets.js";
import {
  EditorialCapabilityError,
  EditorialRecordNotFoundError,
  EditorialRequestError,
  EditorialResourceMismatchError,
} from "./errors.js";
import {
  validateEditorialValues,
} from "./validation.js";

export type EditorialRuntimeAction =
  | "save_draft"
  | "submit_for_review"
  | "return_to_draft"
  | "approve"
  | "reject"
  | "queue_publish"
  | "archive"
  | "restore"
  | "rollback"
  | "schedule_publish"
  | "retry_queue"
  | "cancel_queue"
  | "cancel_schedule"
  | "process_queue";

export interface EditorialActionBody {
  action?: EditorialRuntimeAction;
  datasetId?: string;
  recordId?: string;
  values?: DatasetRecordValues;
  expectedVersion?: number | null;
  targetVersionId?: string;
  queueItemId?: string;
  scheduleId?: string;
  scheduledFor?: string;
  note?: string;
}

export interface EditorialCommandRuntime {
  editorialRepository: EditorialRepository;
  draftService: EditorialDraftService;
  workflowService: EditorialWorkflowService;
  historyService: EditorialHistoryService;
  permissionService: EditorialPermissionService;
  queueService: PublicationQueueService;
  scheduledPublishingService: ScheduledPublishingService;
}

export interface ExecuteEditorialActionOptions {
  runtime?: EditorialCommandRuntime;
  recordExists?: (
    datasetId: DatasetKey,
    recordId: string,
  ) => Promise<boolean>;
  onSearchInvalidation?: (event: {
    datasetId: string;
    recordId: string;
    versionId?: string;
  }) => Promise<void> | void;
}

function requireText(
  value: unknown,
  label: string,
): string {
  const trimmed =
    typeof value === "string"
      ? value.trim()
      : "";

  if (!trimmed) {
    throw new EditorialRequestError(
      `${label} is required.`,
    );
  }

  return trimmed;
}

function requireExpectedVersion(
  value: number | null | undefined,
): number {
  if (!Number.isInteger(value) || (value ?? 0) < 1) {
    throw new EditorialRequestError(
      "Expected version must be a positive integer.",
    );
  }

  return value as number;
}

function requireValues(
  values: DatasetRecordValues | undefined,
): DatasetRecordValues {
  if (
    !values ||
    typeof values !== "object" ||
    Array.isArray(values)
  ) {
    throw new EditorialRequestError(
      "Draft values are required.",
    );
  }

  return values;
}

function requireCapability(
  datasetId: string,
  capabilities: RegisteredDatasetCapabilities,
  capability: keyof RegisteredDatasetCapabilities,
  label: string = capability,
): void {
  if (!capabilities[capability]) {
    throw new EditorialCapabilityError(
      datasetId,
      label,
    );
  }
}

function transitionInput(
  body: EditorialActionBody,
  actorId: string,
  datasetId: string,
  recordId: string,
): EditorialTransitionInput {
  return {
    datasetId,
    recordId,
    actorId,
    expectedVersion: requireExpectedVersion(
      body.expectedVersion,
    ),
    note: body.note,
  };
}

async function canonicalRecordExists(
  datasetId: DatasetKey,
  recordId: string,
): Promise<boolean> {
  const preview = await previewDataset(datasetId);
  return preview.recordKeys.includes(recordId);
}

async function requireCurrentVersion(
  runtime: EditorialCommandRuntime,
  datasetId: string,
  recordId: string,
  expectedVersion: number,
): Promise<{
  head: EditorialRecordHead;
  version: EditorialRecordVersion;
}> {
  const head =
    await runtime.editorialRepository.getHead(
      datasetId,
      recordId,
    );

  if (!head) {
    throw new EditorialRecordNotFoundError(
      datasetId,
      recordId,
    );
  }

  if (head.currentVersion !== expectedVersion) {
    throw new EditorialConcurrencyError(
      datasetId,
      recordId,
      expectedVersion,
      head.currentVersion,
    );
  }

  const version =
    await runtime.editorialRepository.getVersion(
      head.currentVersionId,
    );

  if (!version) {
    throw new EditorialRecordNotFoundError(
      datasetId,
      recordId,
    );
  }

  if (
    version.datasetId !== datasetId ||
    version.recordId !== recordId ||
    version.version !== head.currentVersion
  ) {
    throw new EditorialResourceMismatchError(
      "editorial version",
    );
  }

  return { head, version };
}

async function requireBoundQueueItem(
  runtime: EditorialCommandRuntime,
  itemId: string,
  datasetId: string,
  recordId: string,
): Promise<PublicationQueueItem> {
  const item = await runtime.queueService.get(itemId);

  if (!item) {
    throw new EditorialRecordNotFoundError(
      "publication-queue",
      itemId,
    );
  }

  if (
    item.datasetId !== datasetId ||
    item.recordId !== recordId
  ) {
    throw new EditorialResourceMismatchError(
      "publication queue item",
    );
  }

  return item;
}

async function requireBoundSchedule(
  runtime: EditorialCommandRuntime,
  scheduleId: string,
  datasetId: string,
  recordId: string,
): Promise<ScheduledPublication> {
  const schedule =
    await runtime.scheduledPublishingService.get(
      scheduleId,
    );

  if (!schedule) {
    throw new EditorialRecordNotFoundError(
      "publication-schedule",
      scheduleId,
    );
  }

  if (
    schedule.publication.datasetId !== datasetId ||
    schedule.publication.recordId !== recordId
  ) {
    throw new EditorialResourceMismatchError(
      "publication schedule",
    );
  }

  return schedule;
}

export async function executeEditorialAction(
  body: EditorialActionBody,
  actor: ForgeActor,
  options: ExecuteEditorialActionOptions = {},
): Promise<unknown> {
  const action = body.action;

  if (!action) {
    throw new EditorialRequestError(
      "Editorial action is required.",
    );
  }

  const datasetId = requireText(
    body.datasetId,
    "Dataset ID",
  );
  const recordId = requireText(
    body.recordId,
    "Record ID",
  );
  const capabilities =
    getRegisteredDatasetCapabilities(datasetId);

  if (!capabilities) {
    createRuntimeDatasetDefinition(datasetId);
    throw new Error("Unreachable dataset registration guard.");
  }

  requireCapability(
    datasetId,
    capabilities,
    "editing",
    "editorial editing",
  );

  const definition =
    createRuntimeDatasetDefinition(datasetId);
  const runtime =
    options.runtime ?? createEditorialRuntime({
      onPublicationCommitted: options.onSearchInvalidation,
    });
  const service =
    new AuthorisedEditorialService(
      definition,
      runtime.draftService,
      runtime.workflowService,
      runtime.historyService,
      runtime.permissionService,
    );
  const editorialActor = {
    userId: actor.userId,
    roles: actor.roles,
  };

  switch (action) {
    case "save_draft": {
      const values = requireValues(body.values);
      const existingHead =
        await runtime.editorialRepository.getHead(
          datasetId,
          recordId,
        );

      if (!existingHead) {
        if (body.expectedVersion != null) {
          throw new EditorialConcurrencyError(
            datasetId,
            recordId,
            body.expectedVersion,
            null,
          );
        }

        if (!capabilities.creation) {
          const exists = await (
            options.recordExists ??
            canonicalRecordExists
          )(
            datasetId as DatasetKey,
            recordId,
          );

          if (!exists) {
            throw new EditorialCapabilityError(
              datasetId,
              "record creation",
              `Dataset "${datasetId}" does not support creating record "${recordId}", and no canonical source record exists.`,
            );
          }
        }
      }

      await validateEditorialValues(
        datasetId,
        recordId,
        values,
        existingHead ? "update" : "create",
      );

      return service.saveDraft(
        {
          datasetId,
          recordId,
          values,
          actorId: actor.userId,
          expectedVersion:
            body.expectedVersion ?? null,
          note: body.note,
        },
        editorialActor,
      );
    }

    case "submit_for_review": {
      const input = transitionInput(
        body,
        actor.userId,
        datasetId,
        recordId,
      );
      const { version } =
        await requireCurrentVersion(
          runtime,
          datasetId,
          recordId,
          input.expectedVersion,
        );
      await validateEditorialValues(
        datasetId,
        recordId,
        version.values,
        "review",
      );
      return service.submitForReview(
        input,
        editorialActor,
      );
    }

    case "return_to_draft":
      return service.returnToDraft(
        transitionInput(
          body,
          actor.userId,
          datasetId,
          recordId,
        ),
        editorialActor,
      );

    case "approve": {
      const input = transitionInput(
        body,
        actor.userId,
        datasetId,
        recordId,
      );
      const { version } =
        await requireCurrentVersion(
          runtime,
          datasetId,
          recordId,
          input.expectedVersion,
        );
      await validateEditorialValues(
        datasetId,
        recordId,
        version.values,
        "review",
      );
      return service.approve(
        input,
        editorialActor,
      );
    }

    case "reject":
      return service.reject(
        transitionInput(
          body,
          actor.userId,
          datasetId,
          recordId,
        ),
        editorialActor,
      );

    case "archive":
      return service.archive(
        transitionInput(body, actor.userId, datasetId, recordId),
        editorialActor,
      );

    case "restore":
      return service.restore(
        transitionInput(body, actor.userId, datasetId, recordId),
        editorialActor,
      );

    case "rollback": {
      const targetVersionId = requireText(
        body.targetVersionId,
        "Target version ID",
      );
      return service.rollback(
        {
          ...transitionInput(body, actor.userId, datasetId, recordId),
          targetVersionId,
        },
        editorialActor,
      );
    }

    case "queue_publish":
    case "schedule_publish": {
      requireCapability(
        datasetId,
        capabilities,
        "publishing",
        "publication",
      );
      await runtime.permissionService.assert({
        operation: "publish",
        definition,
        userId: actor.userId,
        roles: actor.roles,
        recordId,
      });
      const expectedVersion =
        requireExpectedVersion(
          body.expectedVersion,
        );
      const { head, version } =
        await requireCurrentVersion(
          runtime,
          datasetId,
          recordId,
          expectedVersion,
        );

      if (head.status !== "approved") {
        throw new EditorialTransitionError(
          head.status,
          ["approved"],
          "published",
        );
      }

      await validateEditorialValues(
        datasetId,
        recordId,
        version.values,
        "publish",
      );

      const publication = {
        datasetId,
        recordId,
        versionId: version.id,
        expectedVersion,
        requestedBy: actor.userId,
        note: body.note,
      };

      if (action === "queue_publish") {
        return runtime.queueService.enqueue(
          publication,
        );
      }

      return runtime.scheduledPublishingService.schedule({
        publication,
        scheduledFor: requireText(
          body.scheduledFor,
          "Scheduled time",
        ),
        createdBy: actor.userId,
      });
    }

    case "retry_queue":
    case "cancel_queue":
    case "process_queue": {
      requireCapability(
        datasetId,
        capabilities,
        "publishing",
        "publication",
      );
      await runtime.permissionService.assert({
        operation: "publish",
        definition,
        userId: actor.userId,
        roles: actor.roles,
        recordId,
      });
      const itemId = requireText(
        body.queueItemId,
        "Queue item ID",
      );
      await requireBoundQueueItem(
        runtime,
        itemId,
        datasetId,
        recordId,
      );

      if (action === "retry_queue") {
        return runtime.queueService.retry(itemId);
      }

      if (action === "cancel_queue") {
        return runtime.queueService.cancel(itemId);
      }

      return runtime.queueService.process(itemId);
    }

    case "cancel_schedule": {
      requireCapability(
        datasetId,
        capabilities,
        "publishing",
        "publication",
      );
      await runtime.permissionService.assert({
        operation: "publish",
        definition,
        userId: actor.userId,
        roles: actor.roles,
        recordId,
      });
      const scheduleId = requireText(
        body.scheduleId,
        "Schedule ID",
      );
      await requireBoundSchedule(
        runtime,
        scheduleId,
        datasetId,
        recordId,
      );
      return runtime.scheduledPublishingService.cancel(
        scheduleId,
      );
    }

    default: {
      const exhaustive: never = action;
      throw new EditorialRequestError(
        `Unsupported editorial action: ${String(exhaustive)}`,
      );
    }
  }
}
