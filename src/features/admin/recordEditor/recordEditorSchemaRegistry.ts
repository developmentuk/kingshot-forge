import {
  buildingsRecordEditorSchema,
} from "./buildingsRecordEditorSchema.js";

import {
  heroSkillsRecordEditorSchema,
} from "./heroSkillsRecordEditorSchema.js";

import {
  heroesRecordEditorSchema,
} from "./heroesRecordEditorSchema.js";

import type {
  RecordEditorSchema,
} from "./recordEditorSchema.js";

const recordEditorSchemas = new Map<
  string,
  RecordEditorSchema
>();

function registerRecordEditorSchema(
  schema: RecordEditorSchema,
): void {
  const datasetId =
    schema.datasetId.trim();

  if (!datasetId) {
    throw new Error(
      "Record Editor schemas must include a dataset ID.",
    );
  }

  if (
    recordEditorSchemas.has(
      datasetId,
    )
  ) {
    throw new Error(
      `A Record Editor schema is already registered for "${datasetId}".`,
    );
  }

  recordEditorSchemas.set(
    datasetId,
    schema,
  );
}

registerRecordEditorSchema(
  buildingsRecordEditorSchema,
);

registerRecordEditorSchema(
  heroesRecordEditorSchema,
);

registerRecordEditorSchema(
  heroSkillsRecordEditorSchema,
);

export function getRecordEditorSchema(
  datasetId: string,
): RecordEditorSchema | null {
  return (
    recordEditorSchemas.get(
      datasetId,
    ) ?? null
  );
}

export function requireRecordEditorSchema(
  datasetId: string,
): RecordEditorSchema {
  const schema =
    getRecordEditorSchema(
      datasetId,
    );

  if (!schema) {
    throw new Error(
      `No Record Editor schema is registered for "${datasetId}".`,
    );
  }

  return schema;
}

export function hasRecordEditorSchema(
  datasetId: string,
): boolean {
  return recordEditorSchemas.has(
    datasetId,
  );
}

export function listRecordEditorSchemas():
RecordEditorSchema[] {
  return Array.from(
    recordEditorSchemas.values(),
  );
}

export function listEditableDatasetIds():
string[] {
  return listRecordEditorSchemas()
    .map(
      (schema) =>
        schema.datasetId,
    )
    .sort((first, second) =>
      first.localeCompare(second),
    );
}
