import type {
  RecordEditorFieldSchema,
  RecordEditorRecord,
  RecordEditorSchema,
  RecordEditorValidationResult,
  RecordEditorValue,
} from "./recordEditorSchema.js";

function isEmptyValue(
  value: RecordEditorValue,
): boolean {
  if (
    value === null ||
    value === undefined
  ) {
    return true;
  }

  if (
    typeof value === "string"
  ) {
    return value.trim().length === 0;
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  return false;
}

function validateRequiredField(
  field: RecordEditorFieldSchema,
  value: RecordEditorValue,
): string | null {
  const isRequired =
    field.required === true ||
    field.validation?.required ===
      true;

  if (
    isRequired &&
    isEmptyValue(value)
  ) {
    return `${field.label} is required.`;
  }

  return null;
}

function validateStringField(
  field: RecordEditorFieldSchema,
  value: RecordEditorValue,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const validation =
    field.validation;

  if (
    validation?.minLength !==
      undefined &&
    value.length <
      validation.minLength
  ) {
    return (
      validation.message ??
      `${field.label} must contain at least ${validation.minLength} characters.`
    );
  }

  if (
    validation?.maxLength !==
      undefined &&
    value.length >
      validation.maxLength
  ) {
    return (
      validation.message ??
      `${field.label} must contain no more than ${validation.maxLength} characters.`
    );
  }

  if (
    validation?.pattern &&
    !validation.pattern.test(value)
  ) {
    return (
      validation.message ??
      `${field.label} is not in the expected format.`
    );
  }

  if (
    field.type === "url" &&
    value.trim().length > 0
  ) {
    try {
      const parsedUrl = new URL(
        value,
      );

      if (
        parsedUrl.protocol !==
          "http:" &&
        parsedUrl.protocol !==
          "https:"
      ) {
        return `${field.label} must use an HTTP or HTTPS address.`;
      }
    } catch {
      return `${field.label} must be a valid URL.`;
    }
  }

  return null;
}

function validateNumberField(
  field: RecordEditorFieldSchema,
  value: RecordEditorValue,
): string | null {
  if (
    field.type !== "number" ||
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return `${field.label} must be a valid number.`;
  }

  const validation =
    field.validation;

  if (
    validation?.integer &&
    !Number.isInteger(value)
  ) {
    return `${field.label} must be a whole number.`;
  }

  if (
    validation?.min !==
      undefined &&
    value < validation.min
  ) {
    return (
      validation.message ??
      `${field.label} must be at least ${validation.min}.`
    );
  }

  if (
    validation?.max !==
      undefined &&
    value > validation.max
  ) {
    return (
      validation.message ??
      `${field.label} must be no more than ${validation.max}.`
    );
  }

  return null;
}

function validateSelectField(
  field: RecordEditorFieldSchema,
  value: RecordEditorValue,
): string | null {
  if (
    field.type !== "select" ||
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const options =
    field.options ?? [];

  const isValidOption =
    options.some(
      (option) =>
        option.value === value,
    );

  if (!isValidOption) {
    return `${field.label} contains an invalid option.`;
  }

  return null;
}

function validateCustomFieldRule(
  field: RecordEditorFieldSchema,
  value: RecordEditorValue,
  record: RecordEditorRecord,
): string | null {
  const customValidator =
    field.validation?.validate;

  if (!customValidator) {
    return null;
  }

  return customValidator(
    value,
    record,
  );
}

function validateField(
  field: RecordEditorFieldSchema,
  record: RecordEditorRecord,
): string | null {
  const value =
    record.values[field.key];

  const requiredError =
    validateRequiredField(
      field,
      value,
    );

  if (requiredError) {
    return requiredError;
  }

  if (isEmptyValue(value)) {
    return null;
  }

  const stringError =
    validateStringField(
      field,
      value,
    );

  if (stringError) {
    return stringError;
  }

  const numberError =
    validateNumberField(
      field,
      value,
    );

  if (numberError) {
    return numberError;
  }

  const selectError =
    validateSelectField(
      field,
      value,
    );

  if (selectError) {
    return selectError;
  }

  return validateCustomFieldRule(
    field,
    value,
    record,
  );
}

export function validateRecordEditorRecord(
  schema: RecordEditorSchema,
  record: RecordEditorRecord,
): RecordEditorValidationResult {
  const errorsByField: Record<
    string,
    string
  > = {};

  for (const field of schema.fields) {
    if (
      field.hidden ||
      field.readOnly
    ) {
      continue;
    }

    const fieldError =
      validateField(
        field,
        record,
      );

    if (fieldError) {
      errorsByField[field.key] =
        fieldError;
    }
  }

  const recordErrors =
    schema.validateRecord?.(
      record,
    ) ?? {};

  for (const [
    fieldKey,
    message,
  ] of Object.entries(
    recordErrors,
  )) {
    if (
      !errorsByField[fieldKey]
    ) {
      errorsByField[fieldKey] =
        message;
    }
  }

  const errors = Object.entries(
    errorsByField,
  ).map(
    ([fieldKey, message]) => ({
      fieldKey,
      message,
    }),
  );

  return {
    isValid:
      errors.length === 0,
    errors,
    errorsByField,
  };
}