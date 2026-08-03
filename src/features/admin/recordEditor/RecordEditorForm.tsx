import {
  useMemo,
  type FormEvent,
} from "react";

import {
  CompanionImageField,
} from "./CompanionImageField.js";

import {
  RecordEditorField,
} from "./RecordEditorField.js";

import {
  getOrderedEditorFields,
  getOrderedEditorSections,
} from "./recordEditorSchema.js";

import type {
  RecordEditorFieldSchema,
  RecordEditorRecord,
  RecordEditorSchema,
  RecordEditorValidationResult,
  RecordEditorValue,
} from "./recordEditorSchema.js";

interface RecordEditorFormProps {
  mode?: "create" | "edit" | "review";
  schema: RecordEditorSchema;
  record: RecordEditorRecord;
  validation: RecordEditorValidationResult;
  isDirty: boolean;
  isSaving?: boolean;
  disabled?: boolean;
  onChange: (
    fieldKey: string,
    value: RecordEditorValue,
  ) => void;
  onSave: () => void;
  onCancel: () => void;
}

function getRecordTitle(
  schema: RecordEditorSchema,
  record: RecordEditorRecord,
  mode: "create" | "edit" | "review",
): string {
  const titleValue =
    record.values[schema.titleField];

  if (
    typeof titleValue === "string" &&
    titleValue.trim()
  ) {
    return titleValue.trim();
  }

  if (
    typeof titleValue === "number" ||
    typeof titleValue === "boolean"
  ) {
    return String(titleValue);
  }

  return mode === "create"
    ? `New ${schema.singularLabel}`
    : record.id;
}

function getUngroupedFields(
  fields: RecordEditorFieldSchema[],
): RecordEditorFieldSchema[] {
  return fields.filter((field) => !field.section);
}

function getFieldsForSection(
  fields: RecordEditorFieldSchema[],
  sectionId: string,
): RecordEditorFieldSchema[] {
  return fields.filter(
    (field) => field.section === sectionId,
  );
}

export function RecordEditorForm({
  mode = "edit",
  schema,
  record,
  validation,
  isDirty,
  isSaving = false,
  disabled = false,
  onChange,
  onSave,
  onCancel,
}: RecordEditorFormProps) {
  const orderedFields = useMemo(
    () => getOrderedEditorFields(schema),
    [schema],
  );
  const orderedSections = useMemo(
    () => getOrderedEditorSections(schema),
    [schema],
  );
  const ungroupedFields = useMemo(
    () => getUngroupedFields(orderedFields),
    [orderedFields],
  );

  const isFormDisabled = disabled || isSaving;
  const canSave =
    isDirty &&
    validation.isValid &&
    !isFormDisabled;

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (canSave) {
      onSave();
    }
  }

  function renderField(
    field: RecordEditorFieldSchema,
  ) {
    const value = record.values[field.key];
    const error =
      validation.errorsByField[field.key];
    const isHeroPortrait =
      schema.datasetId === "heroes" &&
      field.key === "portrait_url";
    const isBuildingImage =
      schema.datasetId === "buildings" &&
      field.key === "image_url";

    if (isHeroPortrait || isBuildingImage) {
      const inputId =
        `record-editor-field-${field.key}`;
      const kind = isBuildingImage
        ? "building"
        : "hero";

      return (
        <div
          key={field.key}
          className={[
            "record-editor-field",
            "record-editor-field--full-width",
            error
              ? "record-editor-field--error"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div className="record-editor-special-field-heading">
            <div>
              <span>
                {isBuildingImage
                  ? "Building image"
                  : "Hero portrait"}
              </span>
              {field.description && (
                <p>{field.description}</p>
              )}
            </div>
          </div>

          <CompanionImageField
            id={inputId}
            value={value}
            record={record}
            kind={kind}
            disabled={isFormDisabled}
            describedBy={
              error
                ? `${inputId}-error`
                : undefined
            }
            onChange={(nextValue) =>
              onChange(field.key, nextValue)
            }
          />

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

    return (
      <RecordEditorField
        key={field.key}
        field={field}
        record={record}
        value={value}
        error={error}
        disabled={isFormDisabled}
        onChange={onChange}
      />
    );
  }

  return (
    <form
      className="record-editor-form"
      onSubmit={handleSubmit}
      noValidate
    >
      <header className="record-editor-form-header">
        <div>
          <p className="record-editor-form-eyebrow">
            {mode === "create"
              ? "Creating"
              : mode === "review"
                ? "Reviewing"
                : "Editing"}{" "}
            {schema.singularLabel}
          </p>
          <h2>
            {getRecordTitle(
              schema,
              record,
              mode,
            )}
          </h2>
          <p>
            {mode === "create"
              ? "Complete the fields below to create an editorial draft."
              : mode === "review"
                ? "Inspect the current values and use the editorial workflow controls below."
                : "Update this record using the fields below."}
          </p>
        </div>

        <div className="record-editor-form-status">
          <span>
            {isSaving
              ? "Saving…"
              : isDirty
                ? "Unsaved changes"
                : "No changes"}
          </span>
        </div>
      </header>

      {!validation.isValid && (
        <section
          className="record-editor-validation-summary"
          aria-labelledby="record-editor-validation-heading"
          role="alert"
        >
          <h3 id="record-editor-validation-heading">
            Please correct the following
          </h3>
          <ul>
            {validation.errors.map((error) => {
              const field = schema.fields.find(
                (candidate) =>
                  candidate.key === error.fieldKey,
              );

              return (
                <li key={error.fieldKey}>
                  <strong>
                    {field?.label ?? error.fieldKey}:
                  </strong>{" "}
                  {error.message}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {ungroupedFields.length > 0 && (
        <section className="record-editor-section">
          <div className="record-editor-section-header">
            <h3>General details</h3>
          </div>
          <div className="record-editor-field-grid">
            {ungroupedFields.map(renderField)}
          </div>
        </section>
      )}

      {orderedSections.map((section) => {
        const sectionFields =
          getFieldsForSection(
            orderedFields,
            section.id,
          );

        if (sectionFields.length === 0) {
          return null;
        }

        return (
          <section
            key={section.id}
            className="record-editor-section"
          >
            <div className="record-editor-section-header">
              <h3>{section.title}</h3>
              {section.description && (
                <p>{section.description}</p>
              )}
            </div>
            <div className="record-editor-field-grid">
              {sectionFields.map(renderField)}
            </div>
          </section>
        );
      })}

      <footer className="record-editor-form-actions">
        <button
          type="button"
          className="record-editor-button record-editor-button--secondary"
          disabled={isFormDisabled || !isDirty}
          onClick={onCancel}
        >
          Cancel changes
        </button>

        <button
          type="submit"
          className="record-editor-button record-editor-button--primary"
          disabled={!canSave}
        >
          {isSaving ? "Saving…" : "Save changes"}
        </button>
      </footer>
    </form>
  );
}
