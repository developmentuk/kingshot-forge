import type {
  DatasetValidationIssue,
} from "../../src/platform/datasets/index.js";

export class EditorialRequestError extends Error {
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
    this.name = "EditorialRequestError";
  }
}

export class EditorialDatasetNotFoundError extends Error {
  readonly statusCode = 404;

  constructor(datasetId: string) {
    super(`Dataset "${datasetId}" is not registered.`);
    this.name = "EditorialDatasetNotFoundError";
  }
}

export class EditorialRecordNotFoundError extends Error {
  readonly statusCode = 404;

  constructor(datasetId: string, recordId: string) {
    super(`Editorial record "${datasetId}/${recordId}" was not found.`);
    this.name = "EditorialRecordNotFoundError";
  }
}

export class EditorialCapabilityError extends Error {
  readonly statusCode = 422;
  readonly datasetId: string;
  readonly capability: string;

  constructor(
    datasetId: string,
    capability: string,
    message?: string,
  ) {
    super(
      message ??
        `Dataset "${datasetId}" does not support ${capability}.`,
    );
    this.name = "EditorialCapabilityError";
    this.datasetId = datasetId;
    this.capability = capability;
  }
}

export class EditorialValidationError extends Error {
  readonly statusCode = 422;
  readonly issues: DatasetValidationIssue[];

  constructor(issues: DatasetValidationIssue[]) {
    super(
      issues[0]?.message ??
        "The editorial record did not pass validation.",
    );
    this.name = "EditorialValidationError";
    this.issues = structuredClone(issues);
  }
}

export class EditorialResourceMismatchError extends Error {
  readonly statusCode = 409;

  constructor(resource: string) {
    super(
      `The requested ${resource} does not belong to this dataset record.`,
    );
    this.name = "EditorialResourceMismatchError";
  }
}
