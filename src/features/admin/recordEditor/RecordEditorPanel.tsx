import {
  useEffect,
  useState,
} from "react";

import {
  RecordEditorForm,
} from "./RecordEditorForm";

import type {
  RecordEditorRecord,
  RecordEditorSchema,
  RecordEditorValidationResult,
  RecordEditorValue,
} from "./recordEditorSchema";

import {
  useRecordEditor,
} from "./useRecordEditor";

import {
  validateRecordEditorRecordForSave,
} from "./recordEditorPlatformValidation";

interface RecordEditorPanelProps {
  schema: RecordEditorSchema;
  record: RecordEditorRecord;

  isOpen?: boolean;

  onClose: () => void;

  onSave?: (
    record: RecordEditorRecord,
  ) =>
    | Promise<RecordEditorRecord | void>
    | RecordEditorRecord
    | void;
}

export function RecordEditorPanel({
  schema,
  record,
  isOpen = true,
  onClose,
  onSave,
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

  useEffect(() => {
    replaceRecord(record);
    setSaveError(null);
    setSaveMessage(null);
    setSaveValidation(null);
  }, [
    record,
    replaceRecord,
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
    if (!isDirty) {
      return true;
    }

    return window.confirm(
      "You have unsaved changes. Discard them?",
    );
  }

  function handleClose() {
    if (
      !confirmDiscardChanges()
    ) {
      return;
    }

    resetChanges();
    setSaveError(null);
    setSaveMessage(null);
    onClose();
  }

  function handleCancel() {
    if (
      !confirmDiscardChanges()
    ) {
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
      !validation.isValid
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

      setSaveValidation(platformValidation);

      if (!platformValidation.isValid) {
        return;
      }
      const savedRecord =
        await onSave?.(
          workingRecord,
        );

      if (savedRecord) {
        commitChanges(
          savedRecord,
        );
      } else {
        commitChanges();
      }

      setSaveMessage(
        onSave
          ? "Record saved successfully."
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
              Edit{" "}
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
            <strong>
              Save failed
            </strong>

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

        <div className="record-editor-panel-content">
          <RecordEditorForm
            schema={schema}
            record={
              workingRecord
            }
            validation={
              saveValidation ?? validation
            }
            isDirty={isDirty}
            isSaving={isSaving}
            onChange={
              handleFieldChange
            }
            onSave={
              handleSave
            }
            onCancel={
              handleCancel
            }
          />
        </div>
      </section>
    </div>
  );
}
