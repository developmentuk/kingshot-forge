import type {
  DatasetRecordValues,
} from "../../src/platform/index.js";
import {
  requireRecordEditorSchema,
} from "../../src/features/admin/recordEditor/recordEditorSchemaRegistry.js";
import {
  validateRecordEditorRecordWithPlatform,
} from "../../src/features/admin/recordEditor/recordEditorPlatformValidation.js";
import type {
  RecordEditorRecord,
} from "../../src/features/admin/recordEditor/recordEditorSchema.js";
import {
  EditorialValidationError,
} from "./errors.js";

export async function validateEditorialValues(
  datasetId: string,
  recordId: string,
  values: DatasetRecordValues,
  operation: "create" | "update" | "review" | "publish",
): Promise<void> {
  const schema =
    requireRecordEditorSchema(datasetId);
  const result =
    await validateRecordEditorRecordWithPlatform(
      schema,
      {
        id: recordId,
        values:
          values as RecordEditorRecord["values"],
      },
      operation,
    );

  if (!result.valid) {
    throw new EditorialValidationError(
      result.issues,
    );
  }
}
