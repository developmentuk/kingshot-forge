import {
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  RecordEditorForm,
} from "./RecordEditorForm.js";

import type {
  RecordEditorRecord,
  RecordEditorSchema,
  RecordEditorValidationResult,
  RecordEditorValue,
} from "./recordEditorSchema.js";

import {
  useRecordEditor,
} from "./useRecordEditor.js";

import {
  validateRecordEditorRecordForSave,
} from "./recordEditorPlatformValidation.js";

interface RecordEditorPanelProps {
  mode?: "create" | "edit" | "review";
  schema: RecordEditorSchema;
  record: RecordEditorRecord;
  isOpen?: boolean;
  disabled?: boolean;
  disabledMessage?: string;
  disabledActionLabel?: string;
  disabledActionBusy?: boolean;
  onDisabledAction?: () => void | Promise<void>;
  onClose: () => void;
  onSave?: (
    record: RecordEditorRecord,
  ) =>
    | Promise<RecordEditorRecord | void>
    | RecordEditorRecord
    | void;
  supplementalContent?: ReactNode;
  validationEnabled?: boolean;
}

export function RecordEditorPanel({
  mode = "edit",
  schema,
  record,
  isOpen = true,
  disabled = false,
  disabledMessage,
  disabledActionLabel,
  disabledActionBusy = false,
  onDisabledAction,
  onClose,
  onSave,
  supplementalContent,
  validationEnabled = true,
}: RecordEditorPanelProps) {
  const [isSaving, setIsSaving] =
    useState(false);
  const [saveError, setSaveError] =
    useState<string | null>(null);
  const [saveMessage, setSaveMessage] =
    useState<string | null>(null);
  const [saveValidation, setSaveValidation] =
    useState<RecordEditorValidationResult | null>(null);

  const {
    workingRecord,
    validation,
    isDirty,
    updateField,
    resetChanges,
    replaceRecord,
    commitChanges,
  } = useRecordEditor(
    schema,
    record,
  );
  const effectiveValidation = validationEnabled
    ? validation
    : { isValid: true, errors: [], errorsByField: {} };

  useEffect(() => {
    const recordChanged =
      record.id !== workingRecord.id;

    // Do not replace a dirty working copy merely because an external
    // refresh, auth event, or parent rerender supplied a new record
    // object. Preserving the stale working copy is also required for
    // optimistic-concurrency validation.
    if (isDirty && !recordChanged) {
      return;
    }

    replaceRecord(record);
    setSaveError(null);
    setSaveMessage(null);
    setSaveValidation(null);
  }, [
    isDirty,
    record,
    replaceRecord,
    workingRecord.id,
  ]);

  useEffect(() => {
    if (!isOpen || !isDirty) {
      return;
    }

    function handleBeforeUnload(
      event: BeforeUnloadEvent,
    ) {
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener(
      "beforeunload",
      handleBeforeUnload,
    );

    return () => {
      window.removeEventListener(
        "beforeunload",
        handleBeforeUnload,
      );
    };
  }, [isDirty, isOpen]);

  if (!isOpen) {
    return null;
  }

  function confirmDiscardChanges():
  boolean {
    return (
      !isDirty ||
      window.confirm(
        "You have unsaved changes. Discard them?",
      )
    );
  }

  function handleClose() {
    if (!confirmDiscardChanges()) {
      return;
    }

    resetChanges();
    setSaveError(null);
    setSaveMessage(null);
    onClose();
  }

  function handleCancel() {
    if (!confirmDiscardChanges()) {
      return;
    }

    resetChanges();
    setSaveError(null);
    setSaveMessage(
      "Changes discarded.",
    );
  }

  function handleFieldChange(
    fieldKey: string,
    value: RecordEditorValue,
  ) {
    setSaveValidation(null);
    updateField(fieldKey, value);
  }

  async function handleSave() {
    if (
      isSaving ||
      !isDirty ||
      !effectiveValidation.isValid
    ) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveMessage(null);

    try {
      const platformValidation =
        await validateRecordEditorRecordForSave(
          schema,
          workingRecord,
        );

      setSaveValidation(
        platformValidation,
      );

      if (!platformValidation.isValid) {
        return;
      }

      const savedRecord =
        await onSave?.(
          workingRecord,
        );

      if (savedRecord) {
        commitChanges(savedRecord);
      } else {
        commitChanges();
      }

      setSaveMessage(
        onSave
          ? "Draft saved successfully."
          : "Changes accepted locally. Server saving is not connected yet.",
      );
    } catch (error: unknown) {
      setSaveError(
        error instanceof Error
          ? error.message
          : "Unable to save this record.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div
      className="record-editor-overlay"
      role="presentation"
    >
      <section
        className="record-editor-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="record-editor-panel-heading"
      >
        <div className="record-editor-panel-toolbar">
          <div>
            <p className="record-editor-panel-eyebrow">
              Record Editor
            </p>
            <h2 id="record-editor-panel-heading">
              {mode === "create"
                ? "Create"
                : mode === "review"
                  ? "Review"
                  : "Edit"}{" "}
              {schema.singularLabel}
            </h2>
          </div>

          <button
            type="button"
            className="record-editor-panel-close"
            aria-label="Close Record Editor"
            disabled={isSaving}
            onClick={handleClose}
          >
            ×
          </button>
        </div>

        {saveError && (
          <div
            className="record-editor-save-message record-editor-save-message--error"
            role="alert"
          >
            <strong>Save failed</strong>
            <p>{saveError}</p>
          </div>
        )}

        {saveMessage && (
          <div
            className="record-editor-save-message record-editor-save-message--success"
            role="status"
          >
            <p>{saveMessage}</p>
          </div>
        )}

        {disabledMessage && (
          <div
            className="record-editor-save-message"
            role="status"
          >
            <strong>Editing unavailable</strong>
            <p>{disabledMessage}</p>
            {disabledActionLabel &&
              onDisabledAction && (
                <button
                  type="button"
                  className="record-editor-button record-editor-button--primary"
                  disabled={
                    isSaving ||
                    disabledActionBusy
                  }
                  onClick={() => {
                    void onDisabledAction();
                  }}
                >
                  {disabledActionBusy
                    ? "Working…"
                    : disabledActionLabel}
                </button>
              )}
          </div>
        )}

        <div className="record-editor-panel-content">
          <RecordEditorForm
            mode={mode}
            schema={schema}
            record={workingRecord}
            validation={
              saveValidation ??
              effectiveValidation
            }
            isDirty={isDirty}
            isSaving={isSaving}
            disabled={disabled}
            onChange={
              handleFieldChange
            }
            onSave={handleSave}
            onCancel={handleCancel}
          />

          {supplementalContent && (
            <div className="record-editor-editorial-content">
              {supplementalContent}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
