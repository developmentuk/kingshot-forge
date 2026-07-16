import type {
  VercelRequest,
  VercelResponse,
} from "@vercel/node";

import type {
  DatasetRecordValues,
  EditorialRollbackInput,
  EditorialTransitionInput,
} from "../../src/platform/index.js";
import {
  AuthorisedEditorialService,
} from "../../src/platform/index.js";

import {
  requireForgeActor,
} from "../../server/auth/requireForgeActor.js";
import {
  createEditorialRuntime,
  createRuntimeDatasetDefinition,
} from "../../server/editorial/createEditorialRuntime.js";
import {
  sendEditorialError,
} from "../../server/editorial/http.js";

type EditorialRuntimeAction =
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

interface EditorialActionBody {
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

function requireText(
  value: string | undefined,
  label: string,
): string {
  const trimmed = value?.trim();

  if (!trimmed) {
    throw new Error(`${label} is required.`);
  }

  return trimmed;
}

function requireExpectedVersion(
  value: number | null | undefined,
): number {
  if (
    !Number.isInteger(value) ||
    (value ?? 0) < 1
  ) {
    throw new Error(
      "Expected version must be a positive integer.",
    );
  }

  return value as number;
}

function transitionInput(
  body: EditorialActionBody,
  actorId: string,
): EditorialTransitionInput {
  return {
    datasetId: requireText(
      body.datasetId,
      "Dataset ID",
    ),
    recordId: requireText(
      body.recordId,
      "Record ID",
    ),
    actorId,
    expectedVersion:
      requireExpectedVersion(
        body.expectedVersion,
      ),
    note: body.note,
  };
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
): Promise<void> {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    response.status(405).json({
      status: "error",
      message: "Method not allowed.",
    });
    return;
  }

  try {
    const actor =
      await requireForgeActor(request);
    const body =
      request.body as EditorialActionBody;
    const action = body.action;

    if (!action) {
      throw new Error(
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
    const definition =
      createRuntimeDatasetDefinition(
        datasetId,
      );
    const runtime = createEditorialRuntime();

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

    let result: unknown;

    switch (action) {
      case "save_draft": {
        if (
          !body.values ||
          typeof body.values !== "object" ||
          Array.isArray(body.values)
        ) {
          throw new Error(
            "Draft values are required.",
          );
        }

        result = await service.saveDraft(
          {
            datasetId,
            recordId,
            values: body.values,
            actorId: actor.userId,
            expectedVersion:
              body.expectedVersion ?? null,
            note: body.note,
          },
          editorialActor,
        );
        break;
      }

      case "submit_for_review":
        result =
          await service.submitForReview(
            transitionInput(
              body,
              actor.userId,
            ),
            editorialActor,
          );
        break;

      case "return_to_draft":
        result =
          await service.returnToDraft(
            transitionInput(
              body,
              actor.userId,
            ),
            editorialActor,
          );
        break;

      case "approve":
        result = await service.approve(
          transitionInput(
            body,
            actor.userId,
          ),
          editorialActor,
        );
        break;

      case "reject":
        result = await service.reject(
          transitionInput(
            body,
            actor.userId,
          ),
          editorialActor,
        );
        break;

      case "archive":
        result = await service.archive(
          transitionInput(
            body,
            actor.userId,
          ),
          editorialActor,
        );
        break;

      case "restore":
        result = await service.restore(
          transitionInput(
            body,
            actor.userId,
          ),
          editorialActor,
        );
        break;

      case "rollback": {
        const input: EditorialRollbackInput = {
          ...transitionInput(
            body,
            actor.userId,
          ),
          targetVersionId: requireText(
            body.targetVersionId,
            "Target version ID",
          ),
        };

        result = await service.rollback(
          input,
          editorialActor,
        );
        break;
      }

      case "queue_publish": {
        await runtime.permissionService.assert({
          operation: "publish",
          definition,
          userId: actor.userId,
          roles: actor.roles,
          recordId,
        });

        const head =
          await runtime.editorialRepository.getHead(
            datasetId,
            recordId,
          );

        if (!head) {
          throw new Error(
            "Editorial record was not found.",
          );
        }

        result = await runtime.queueService.enqueue({
          datasetId,
          recordId,
          versionId: head.currentVersionId,
          expectedVersion:
            requireExpectedVersion(
              body.expectedVersion,
            ),
          requestedBy: actor.userId,
          note: body.note,
        });
        break;
      }

      case "schedule_publish": {
        await runtime.permissionService.assert({
          operation: "publish",
          definition,
          userId: actor.userId,
          roles: actor.roles,
          recordId,
        });

        const head =
          await runtime.editorialRepository.getHead(
            datasetId,
            recordId,
          );

        if (!head) {
          throw new Error(
            "Editorial record was not found.",
          );
        }

        result =
          await runtime.scheduledPublishingService.schedule({
            publication: {
              datasetId,
              recordId,
              versionId:
                head.currentVersionId,
              expectedVersion:
                requireExpectedVersion(
                  body.expectedVersion,
                ),
              requestedBy: actor.userId,
              note: body.note,
            },
            scheduledFor: requireText(
              body.scheduledFor,
              "Scheduled time",
            ),
            createdBy: actor.userId,
          });
        break;
      }

      case "retry_queue":
        await runtime.permissionService.assert({
          operation: "publish",
          definition,
          userId: actor.userId,
          roles: actor.roles,
          recordId,
        });
        result =
          await runtime.queueService.retry(
            requireText(
              body.queueItemId,
              "Queue item ID",
            ),
          );
        break;

      case "cancel_queue":
        await runtime.permissionService.assert({
          operation: "publish",
          definition,
          userId: actor.userId,
          roles: actor.roles,
          recordId,
        });
        result =
          await runtime.queueService.cancel(
            requireText(
              body.queueItemId,
              "Queue item ID",
            ),
          );
        break;

      case "cancel_schedule":
        await runtime.permissionService.assert({
          operation: "publish",
          definition,
          userId: actor.userId,
          roles: actor.roles,
          recordId,
        });
        result =
          await runtime.scheduledPublishingService.cancel(
            requireText(
              body.scheduleId,
              "Schedule ID",
            ),
          );
        break;

      case "process_queue":
        await runtime.permissionService.assert({
          operation: "publish",
          definition,
          userId: actor.userId,
          roles: actor.roles,
          recordId,
        });
        result =
          body.queueItemId
            ? await runtime.queueService.process(
                body.queueItemId,
              )
            : await runtime.queueService.processNext();
        break;

      default:
        throw new Error(
          `Unsupported editorial action: ${String(action)}`,
        );
    }

    response.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    sendEditorialError(response, error);
  }
}
