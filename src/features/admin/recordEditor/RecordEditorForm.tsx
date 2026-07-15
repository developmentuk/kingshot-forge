import {
  useMemo,
} from "react";

import type {
  FormEvent,
} from "react";

import {
  RecordEditorField,
} from "./RecordEditorField";

import {
  getOrderedEditorFields,
  getOrderedEditorSections,
} from "./recordEditorSchema";

import type {
  RecordEditorFieldSchema,
  RecordEditorRecord,
  RecordEditorSchema,
  RecordEditorValidationResult,
  RecordEditorValue,
} from "./recordEditorSchema";

interface RecordEditorFormProps {
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

function getUngroupedFields(
  fields: RecordEditorFieldSchema[],
): RecordEditorFieldSchema[] {
  return fields.filter(
    (field) => !field.section,
  );
}

function getFieldsForSection(
  fields: RecordEditorFieldSchema[],
  sectionId: string,
): RecordEditorFieldSchema[] {
  return fields.filter(
    (field) =>
      field.section === sectionId,
  );
}

export function RecordEditorForm({
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
    () =>
      getOrderedEditorFields(
        schema,
      ),
    [schema],
  );

  const orderedSections = useMemo(
    () =>
      getOrderedEditorSections(
        schema,
      ),
    [schema],
  );

  const ungroupedFields =
    useMemo(
      () =>
        getUngroupedFields(
          orderedFields,
        ),
      [orderedFields],
    );

  const isFormDisabled =
    disabled || isSaving;

  const canSave =
    isDirty &&
    validation.isValid &&
    !isFormDisabled;

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!canSave) {
      return;
    }

    onSave();
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
            Editing{" "}
            {schema.singularLabel}
          </p>

          <h2>
            {String(
              record.values[
                schema.titleField
              ] ??
                record.id,
            )}
          </h2>

          <p>
            Update this record using
            the fields below.
          </p>
        </div>

        <div className="record-editor-form-status">
          {isSaving ? (
            <span>
              Saving…
            </span>
          ) : isDirty ? (
            <span>
              Unsaved changes
            </span>
          ) : (
            <span>
              No changes
            </span>
          )}
        </div>
      </header>

      {!validation.isValid && (
        <section
          className="record-editor-validation-summary"
          aria-labelledby="record-editor-validation-heading"
          role="alert"
        >
          <h3 id="record-editor-validation-heading">
            Please correct the
            following
          </h3>

          <ul>
            {validation.errors.map(
              (error) => {
                const field =
                  schema.fields.find(
                    (candidate) =>
                      candidate.key ===
                      error.fieldKey,
                  );

                return (
                  <li
                    key={
                      error.fieldKey
                    }
                  >
                    <strong>
                      {field?.label ??
                        error.fieldKey}
                      :
                    </strong>{" "}
                    {error.message}
                  </li>
                );
              },
            )}
          </ul>
        </section>
      )}

      {ungroupedFields.length >
        0 && (
        <section className="record-editor-section">
          <div className="record-editor-section-header">
            <h3>
              General details
            </h3>
          </div>

          <div className="record-editor-field-grid">
            {ungroupedFields.map(
              (field) => (
                <RecordEditorField
                  key={field.key}
                  field={field}
                  record={record}
                  value={
                    record.values[
                      field.key
                    ]
                  }
                  error={
                    validation
                      .errorsByField[
                      field.key
                    ]
                  }
                  disabled={
                    isFormDisabled
                  }
                  onChange={
                    onChange
                  }
                />
              ),
            )}
          </div>
        </section>
      )}

      {orderedSections.map(
        (section) => {
          const sectionFields =
            getFieldsForSection(
              orderedFields,
              section.id,
            );

          if (
            sectionFields.length === 0
          ) {
            return null;
          }

          return (
            <section
              key={section.id}
              className="record-editor-section"
            >
              <div className="record-editor-section-header">
                <h3>
                  {section.title}
                </h3>

                {section.description && (
                  <p>
                    {
                      section.description
                    }
                  </p>
                )}
              </div>

              <div className="record-editor-field-grid">
                {sectionFields.map(
                  (field) => (
                    <RecordEditorField
                      key={
                        field.key
                      }
                      field={field}
                      record={record}
                      value={
                        record.values[
                          field.key
                        ]
                      }
                      error={
                        validation
                          .errorsByField[
                          field.key
                        ]
                      }
                      disabled={
                        isFormDisabled
                      }
                      onChange={
                        onChange
                      }
                    />
                  ),
                )}
              </div>
            </section>
          );
        },
      )}

      <footer className="record-editor-form-actions">
        <button
          type="button"
          className="record-editor-button record-editor-button--secondary"
          disabled={
            isFormDisabled ||
            !isDirty
          }
          onClick={onCancel}
        >
          Cancel changes
        </button>

        <button
          type="submit"
          className="record-editor-button record-editor-button--primary"
          disabled={!canSave}
        >
          {isSaving
            ? "Saving…"
            : "Save changes"}
        </button>
      </footer>
    </form>
  );
}