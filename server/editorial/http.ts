import type {
  VercelResponse,
} from "@vercel/node";

import {
  DatasetPermissionDeniedError,
  EditorialConcurrencyError,
  EditorialDraftStatusError,
  EditorialRollbackError,
  EditorialTransitionError,
  PublicationQueueError,
  ScheduledPublicationError,
} from "../../src/platform/index.js";

import {
  ForgeAuthenticationError,
} from "../auth/requireForgeActor.js";
import {
  EditorialCapabilityError,
  EditorialDatasetNotFoundError,
  EditorialRecordNotFoundError,
  EditorialRequestError,
  EditorialResourceMismatchError,
  EditorialValidationError,
} from "./errors.js";

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
    error instanceof EditorialTransitionError ||
    error instanceof EditorialDraftStatusError ||
    error instanceof EditorialRollbackError ||
    error instanceof EditorialResourceMismatchError
  ) {
    response.status(409).json({
      status: "error",
      message: error.message,
    });
    return;
  }

  if (error instanceof EditorialValidationError) {
    response.status(error.statusCode).json({
      status: "error",
      message: error.message,
      issues: error.issues,
    });
    return;
  }

  if (
    error instanceof EditorialRequestError ||
    error instanceof EditorialDatasetNotFoundError ||
    error instanceof EditorialRecordNotFoundError ||
    error instanceof EditorialCapabilityError
  ) {
    response.status(error.statusCode).json({
      status: "error",
      message: error.message,
    });
    return;
  }

  if (
    error instanceof PublicationQueueError ||
    error instanceof ScheduledPublicationError
  ) {
    response.status(409).json({
      status: "error",
      message: error.message,
    });
    return;
  }

  response.status(500).json({
    status: "error",
    message:
      "The editorial platform could not complete the request. Retry, then contact an administrator if the problem continues.",
  });
}
