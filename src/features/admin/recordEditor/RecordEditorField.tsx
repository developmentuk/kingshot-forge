import type {
  ChangeEvent,
  ReactNode,
} from "react";

import {
  BuildingCostsField,
} from "./BuildingCostsField.js";

import type {
  RecordEditorFieldSchema,
  RecordEditorRecord,
  RecordEditorValue,
} from "./recordEditorSchema.js";

interface RecordEditorFieldProps {
  field:
    RecordEditorFieldSchema;

  record:
    RecordEditorRecord;

  value:
    RecordEditorValue;

  error?: string;
  disabled?: boolean;

  onChange: (
    fieldKey: string,
    value: RecordEditorValue,
  ) => void;
}

function formatReadOnlyValue(
  value: RecordEditorValue,
): string {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  if (typeof value === "boolean") {
    return value
      ? "Yes"
      : "No";
  }

  if (
    typeof value === "string" ||
    typeof value === "number"
  ) {
    return String(value);
  }

  try {
    return JSON.stringify(
      value,
      null,
      2,
    );
  } catch {
    return String(value);
  }
}

function formatJsonValue(
  value: RecordEditorValue,
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  if (
    typeof value === "string"
  ) {
    return value;
  }

  try {
    return JSON.stringify(
      value,
      null,
      2,
    );
  } catch {
    return "";
  }
}

function parseJsonValue(
  value: string,
): RecordEditorValue {
  if (!value.trim()) {
    return [];
  }

  try {
    return JSON.parse(
      value,
    ) as RecordEditorValue;
  } catch {
    return value;
  }
}

function getInputId(
  fieldKey: string,
): string {
  return `record-editor-field-${fieldKey}`;
}

export function RecordEditorField({
  field,
  record,
  value,
  error,
  disabled = false,
  onChange,
}: RecordEditorFieldProps) {
  const inputId =
    getInputId(
      field.key,
    );

  const isDisabled =
    disabled ||
    field.readOnly === true;

  const describedByIds = [
    field.description
      ? `${inputId}-description`
      : null,

    error
      ? `${inputId}-error`
      : null,
  ]
    .filter(Boolean)
    .join(" ");

  function handleTextChange(
    event:
      ChangeEvent<HTMLInputElement>,
  ) {
    onChange(
      field.key,
      event.target.value,
    );
  }

  function handleTextareaChange(
    event:
      ChangeEvent<HTMLTextAreaElement>,
  ) {
    onChange(
      field.key,
      event.target.value,
    );
  }

  function handleNumberChange(
    event:
      ChangeEvent<HTMLInputElement>,
  ) {
    const rawValue =
      event.target.value;

    if (rawValue === "") {
      onChange(
        field.key,
        null,
      );

      return;
    }

    const numericValue =
      Number(rawValue);

    onChange(
      field.key,
      Number.isNaN(
        numericValue,
      )
        ? rawValue
        : numericValue,
    );
  }

  function handleBooleanChange(
    event:
      ChangeEvent<HTMLInputElement>,
  ) {
    onChange(
      field.key,
      event.target.checked,
    );
  }

  function handleSelectChange(
    event:
      ChangeEvent<HTMLSelectElement>,
  ) {
    const selectedOption =
      field.options?.find(
        (option) =>
          String(
            option.value,
          ) ===
          event.target.value,
      );

    onChange(
      field.key,
      selectedOption?.value ??
        event.target.value,
    );
  }

  function handleJsonChange(
    event:
      ChangeEvent<HTMLTextAreaElement>,
  ) {
    onChange(
      field.key,
      parseJsonValue(
        event.target.value,
      ),
    );
  }

  function handleBuildingCostsChange(
    nextValue:
      RecordEditorValue,
  ) {
    onChange(
      field.key,
      nextValue,
    );
  }

  const commonAttributes = {
    id: inputId,
    name: field.key,

    disabled:
      isDisabled,

    "aria-invalid":
      error
        ? true
        : undefined,

    "aria-describedby":
      describedByIds ||
      undefined,
  };

  let fieldControl:
    ReactNode;

  switch (field.type) {
    case "textarea":
      fieldControl = (
        <textarea
          {...commonAttributes}
          rows={6}
          value={
            typeof value ===
            "string"
              ? value
              : ""
          }
          placeholder={
            field.placeholder
          }
          onChange={
            handleTextareaChange
          }
        />
      );

      break;

    case "number":
      fieldControl = (
        <input
          {...commonAttributes}
          type="number"
          value={
            typeof value ===
            "number"
              ? value
              : ""
          }
          placeholder={
            field.placeholder
          }
          min={
            field.validation
              ?.min
          }
          max={
            field.validation
              ?.max
          }
          step={
            field.validation
              ?.integer
              ? 1
              : "any"
          }
          onChange={
            handleNumberChange
          }
        />
      );

      break;

    case "boolean":
      fieldControl = (
        <label className="record-editor-checkbox">
          <input
            {...commonAttributes}
            type="checkbox"
            checked={
              value === true
            }
            onChange={
              handleBooleanChange
            }
          />

          <span>
            {field.label}
          </span>
        </label>
      );

      break;

    case "select":
      fieldControl = (
        <select
          {...commonAttributes}
          value={
            value === null ||
            value ===
              undefined
              ? ""
              : String(value)
          }
          onChange={
            handleSelectChange
          }
        >
          <option value="">
            Select an option
          </option>

          {(field.options ??
            []).map(
            (option) => (
              <option
                key={String(
                  option.value,
                )}
                value={String(
                  option.value,
                )}
              >
                {option.label}
              </option>
            ),
          )}
        </select>
      );

      break;

    case "building-costs":
      fieldControl = (
        <BuildingCostsField
          id={inputId}
          value={value}
          disabled={
            isDisabled
          }
          error={error}
          describedBy={
            describedByIds ||
            undefined
          }
          onChange={
            handleBuildingCostsChange
          }
        />
      );

      break;

    case "json":
      fieldControl = (
        <textarea
          {...commonAttributes}
          className="record-editor-json-input"
          rows={18}
          value={
            formatJsonValue(
              value,
            )
          }
          placeholder={
            field.placeholder
          }
          spellCheck={false}
          onChange={
            handleJsonChange
          }
        />
      );

      break;

    case "readonly":
      fieldControl = (
        <pre
          id={inputId}
          className="record-editor-readonly-value"
        >
          {field.formatValue
            ? field.formatValue(
                value,
                record,
              )
            : formatReadOnlyValue(
                value,
              )}
        </pre>
      );

      break;

    case "url":
      fieldControl = (
        <input
          {...commonAttributes}
          type="url"
          value={
            typeof value ===
            "string"
              ? value
              : ""
          }
          placeholder={
            field.placeholder
          }
          onChange={
            handleTextChange
          }
        />
      );

      break;

    case "text":
    default:
      fieldControl = (
        <input
          {...commonAttributes}
          type="text"
          value={
            typeof value ===
            "string"
              ? value
              : ""
          }
          placeholder={
            field.placeholder
          }
          onChange={
            handleTextChange
          }
        />
      );

      break;
  }

  const showStandardLabel =
    field.type !==
      "boolean" &&
    field.type !==
      "building-costs";

  return (
    <div
      className={[
        "record-editor-field",

        field.type ===
        "building-costs"
          ? "record-editor-field--full-width"
          : "",

        error
          ? "record-editor-field--error"
          : "",

        field.readOnly
          ? "record-editor-field--readonly"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {showStandardLabel && (
        <label
          htmlFor={inputId}
        >
          <span>
            {field.label}
          </span>

          {(field.required ||
            field.validation
              ?.required) && (
            <span
              className="record-editor-required"
              aria-label="Required"
            >
              *
            </span>
          )}
        </label>
      )}

      {field.type ===
        "building-costs" && (
        <div className="record-editor-special-field-heading">
          <div>
            <span>
              {field.label}
            </span>

            {(field.required ||
              field.validation
                ?.required) && (
              <span
                className="record-editor-required"
                aria-label="Required"
              >
                *
              </span>
            )}
          </div>
        </div>
      )}

      {fieldControl}

      {field.description && (
        <p
          id={`${inputId}-description`}
          className="record-editor-field-description"
        >
          {
            field.description
          }
        </p>
      )}

      {error && (
        <p
          id={`${inputId}-error`}
          className="record-editor-field-error"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
