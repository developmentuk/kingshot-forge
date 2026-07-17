import type {
  VercelRequest,
  VercelResponse,
} from "@vercel/node";

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
import {
  EditorialRequestError,
} from "../../server/editorial/errors.js";
import {
  requireRegisteredDatasetCapabilities,
} from "../../shared/data-engine/dataset-capabilities.js";

function readQueryText(
  value: string | string[] | undefined,
  label: string,
): string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    throw new EditorialRequestError(
      `${label} is required.`,
    );
  }

  return value.trim();
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
): Promise<void> {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    response.status(405).json({
      status: "error",
      message: "Method not allowed.",
    });
    return;
  }

  try {
    const actor =
      await requireForgeActor(request);
    const datasetId = readQueryText(
      request.query.datasetId,
      "Dataset ID",
    );
    const recordId = readQueryText(
      request.query.recordId,
      "Record ID",
    );

    const runtime = createEditorialRuntime();
    const definition =
      createRuntimeDatasetDefinition(
        datasetId,
      );
    const capabilities =
      requireRegisteredDatasetCapabilities(
        datasetId,
      );

    await runtime.permissionService.assert({
      operation: "view_history",
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
      response.status(200).json({
        status: "success",
        data: {
          head: null,
          currentVersion: null,
          history: {
            entries: [],
            totalVersions: 0,
          },
          queueItems: [],
          schedules: [],
        },
      });
      return;
    }

    const [
      currentVersion,
      history,
      queueItems,
      schedules,
    ] = await Promise.all([
      runtime.editorialRepository.getVersion(
        head.currentVersionId,
      ),
      runtime.historyService.getHistory(
        datasetId,
        recordId,
      ),
      capabilities.publishing
        ? runtime.queueService.list({
            datasetId,
            recordId,
          })
        : Promise.resolve([]),
      capabilities.publishing
        ? runtime.scheduledPublishingService.list({
            datasetId,
            recordId,
          })
        : Promise.resolve([]),
    ]);

    response.status(200).json({
      status: "success",
      data: {
        head,
        currentVersion:
          currentVersion ?? null,
        history,
        queueItems,
        schedules,
      },
    });
  } catch (error) {
    sendEditorialError(response, error);
  }
}
