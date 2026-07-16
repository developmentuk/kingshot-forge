import type {
  VercelResponse,
} from "@vercel/node";

import {
  DatasetPermissionDeniedError,
  EditorialConcurrencyError,
  PublicationQueueError,
  ScheduledPublicationError,
} from "../../src/platform/index.js";

import {
  ForgeAuthenticationError,
} from "../auth/requireForgeActor.js";

export function sendEditorialError(
  response: VercelResponse,
  error: unknown,
): void {
  if (
    error instanceof ForgeAuthenticationError
  ) {
    response.status(error.statusCode).json({
      status: "error",
      message: error.message,
    });
    return;
  }

  if (
    error instanceof
      DatasetPermissionDeniedError
  ) {
    response.status(403).json({
      status: "error",
      message: error.message,
      decision: error.decision,
    });
    return;
  }

  if (
    error instanceof EditorialConcurrencyError
  ) {
    response.status(409).json({
      status: "error",
      message: error.message,
      expectedVersion:
        error.expectedVersion,
      actualVersion: error.actualVersion,
    });
    return;
  }

  if (
    error instanceof PublicationQueueError ||
    error instanceof ScheduledPublicationError
  ) {
    response.status(400).json({
      status: "error",
      message: error.message,
    });
    return;
  }

  response.status(500).json({
    status: "error",
    message:
      error instanceof Error
        ? error.message
        : "Unknown editorial platform error.",
  });
}
