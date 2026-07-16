import {
  DatasetRegistry,
  DatasetValidationService,
} from "../../../platform/datasets";

import type {
  DatasetDefinition,
  DatasetFieldDefinition,
  DatasetFieldType,
  DatasetRecordDraft,
  DatasetRecordValues,
  DatasetValidationIssue,
  DatasetValue,
} from "../../../platform/datasets";

import type {
  RecordEditorFieldSchema,
  RecordEditorFieldType,
  RecordEditorRecord,
  RecordEditorSchema,
  RecordEditorValidationResult,
  RecordEditorValue,
} from "./recordEditorSchema";

function toDatasetValue(
  value: RecordEditorValue,
): DatasetValue {
  if (value === undefined) {
    return null;
  }

  if (Array.isArray(value)) {
    return value.map(toDatasetValue);
  }

  if (
    value !== null &&
    typeof value === "object"
  ) {
    return Object.fromEntries(
      Object.entries(value).map(
        ([key, childValue]) => [
          key,
          toDatasetValue(childValue),
        ],
      ),
    );
  }

  return value;
}

function toDatasetFieldType(
  type: RecordEditorFieldType,
): DatasetFieldType {
  switch (type) {
    case "building-costs":
      return "array";
    case "readonly":
      return "readonly";
    default:
      return type;
  }
}

function createFieldDefinition(
  field: RecordEditorFieldSchema,
): DatasetFieldDefinition {
  return {
    id: field.key,
    label: field.label,
    type: toDatasetFieldType(field.type),
    description: field.description,
    placeholder: field.placeholder,
    sectionId: field.section,
    order: field.order,
    required: field.required,
    readOnly: field.readOnly,
    hidden: field.hidden,
    options: field.options,
    validation: {
      required:
        field.validation?.required,
      minimum: field.validation?.min,
      maximum: field.validation?.max,
      minimumLength:
        field.validation?.minLength,
      maximumLength:
        field.validation?.maxLength,
      integer: field.validation?.integer,
      pattern:
        field.validation?.pattern?.source,
      message: field.validation?.message,
      validate:
        field.validation?.validate ||
        field.type === "url"
          ? (value, context) => {
              const customMessage =
                field.validation?.validate?.(
                  value as RecordEditorValue,
                  {
                    id: context.recordId ?? "",
                    values:
                      context.values as RecordEditorRecord["values"],
                  },
                ) ?? null;

              if (customMessage) {
                return customMessage;
              }

              if (
                field.type !== "url" ||
                typeof value !== "string" ||
                value.trim().length === 0
              ) {
                return null;
              }

              try {
                const parsedUrl = new URL(value);

                return parsedUrl.protocol === "http:" ||
                  parsedUrl.protocol === "https:"
                  ? null
                  : `${field.label} must use an HTTP or HTTPS address.`;
              } catch {
                return `${field.label} must be a valid URL.`;
              }
            }
          : undefined,
    },
  };
}

function createDatasetDefinition(
  schema: RecordEditorSchema,
): DatasetDefinition {
  return {
    id: schema.datasetId,
    version: 1,
    title: schema.pluralLabel,
    singularTitle: schema.singularLabel,
    description: `${schema.pluralLabel} Record Editor schema.`,
    category: "game-data",
    idField: schema.idField,
    titleField: schema.titleField,
    fields: schema.fields
      .filter(
        (field) =>
          !field.hidden &&
          !field.readOnly,
      )
      .map(createFieldDefinition),
    validators: schema.validateRecord
      ? [
          (draft) =>
            Object.entries(
              schema.validateRecord?.({
                id: draft.id ?? "",
                values:
                  draft.values as RecordEditorRecord["values"],
              }) ?? {},
            ).map(
              ([fieldId, message]): DatasetValidationIssue => ({
                code: "record.custom",
                message,
                severity: "error",
                fieldId,
                path: fieldId,
              }),
            ),
        ]
      : undefined,
  };
}

function createRecordDraft(
  schema: RecordEditorSchema,
  record: RecordEditorRecord,
): DatasetRecordDraft {
  const values: DatasetRecordValues =
    Object.fromEntries(
      Object.entries(record.values).map(
        ([key, value]) => [
          key,
          toDatasetValue(value),
        ],
      ),
    );

  return {
    id: record.id,
    datasetId: schema.datasetId,
    baseVersion: null,
    values,
  };
}

function toRecordEditorValidationResult(
  issues: DatasetValidationIssue[],
): RecordEditorValidationResult {
  const errorsByField: Record<string, string> = {};

  for (const issue of issues) {
    if (
      issue.severity !== "error" ||
      !issue.fieldId ||
      errorsByField[issue.fieldId]
    ) {
      continue;
    }

    errorsByField[issue.fieldId] = issue.message;
  }

  const errors = Object.entries(
    errorsByField,
  ).map(([fieldKey, message]) => ({
    fieldKey,
    message,
  }));

  return {
    isValid: !issues.some(
      (issue) => issue.severity === "error",
    ),
    errors,
    errorsByField,
  };
}

export async function validateRecordEditorRecordForSave(
  schema: RecordEditorSchema,
  record: RecordEditorRecord,
): Promise<RecordEditorValidationResult> {
  const registry = new DatasetRegistry();
  registry.register(
    createDatasetDefinition(schema),
  );

  const validationService =
    new DatasetValidationService(registry);

  const result = await validationService.validate(
    createRecordDraft(schema, record),
    {
      datasetId: schema.datasetId,
      operation: "update",
    },
  );

  return toRecordEditorValidationResult(
    result.issues,
  );
}
