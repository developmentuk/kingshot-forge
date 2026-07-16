import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  EditorialDiffService,
  type EditorialRecordVersion,
} from "../../../platform";

import {
  useRole,
} from "../../../context/RoleContext";

import {
  RecordEditorPanel,
} from "../recordEditor/RecordEditorPanel";

import type {
  RecordEditorRecord,
  RecordEditorSchema,
} from "../recordEditor/recordEditorSchema";

import {
  EditorialAdminWorkspace,
} from "./EditorialAdminWorkspace";

import type {
  EditorialWorkflowAction,
} from "./EditorialWorkflowPanel";

import {
  fetchEditorialRecordState,
  runEditorialAction,
  type EditorialApiAction,
  type EditorialRecordState,
} from "./editorialApi";

interface ConnectedEditorialRecordEditorProps {
  schema: RecordEditorSchema;
  record: RecordEditorRecord;
  onClose: () => void;
}

function sanitiseValues(
  values: RecordEditorRecord["values"],
): Record<string, unknown> {
  return JSON.parse(
    JSON.stringify(values),
  ) as Record<string, unknown>;
}

export function ConnectedEditorialRecordEditor({
  schema,
  record,
  onClose,
}: ConnectedEditorialRecordEditorProps) {
  const {
    hasPermission,
  } = useRole();

  const [
    currentRecord,
    setCurrentRecord,
  ] = useState(record);

  const [
    state,
    setState,
  ] = useState<EditorialRecordState | null>(
    null,
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    runtimeError,
    setRuntimeError,
  ] = useState<string | null>(null);

  const [
    busyAction,
    setBusyAction,
  ] = useState<
    EditorialWorkflowAction | null
  >(null);

  const [
    comparison,
    setComparison,
  ] = useState<
    ReturnType<
      EditorialDiffService["compareVersions"]
    > | undefined
  >(undefined);

  const [
    selectedVersionId,
    setSelectedVersionId,
  ] = useState<string>();

  const loadState = useCallback(
    async (signal?: AbortSignal) => {
      setRuntimeError(null);

      try {
        const nextState =
          await fetchEditorialRecordState(
            schema.datasetId,
            record.id,
            signal,
          );

        setState(nextState);

        if (nextState.currentVersion) {
          setCurrentRecord({
            id: record.id,
            values:
              nextState.currentVersion.values,
          });
        }
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        setRuntimeError(
          error instanceof Error
            ? error.message
            : "Unable to load editorial state.",
        );
      } finally {
        setLoading(false);
      }
    },
    [
      record.id,
      schema.datasetId,
    ],
  );

  useEffect(() => {
    const controller =
      new AbortController();

    setCurrentRecord(record);
    setState(null);
    setComparison(undefined);
    setSelectedVersionId(undefined);
    setLoading(true);

    void loadState(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadState, record]);

  const allowedActions = useMemo(() => {
    const actions:
      EditorialWorkflowAction[] = [];

    if (
      hasPermission("cms.records.edit")
    ) {
      actions.push("submit_for_review");
    }

    if (
      hasPermission("cms.history.restore")
    ) {
      actions.push(
        "return_to_draft",
        "reject",
        "restore",
      );
    }

    if (hasPermission("cms.publish")) {
      actions.push(
        "approve",
        "publish",
        "archive",
      );
    }

    return actions;
  }, [hasPermission]);

  async function saveDraft(
    nextRecord: RecordEditorRecord,
  ): Promise<RecordEditorRecord> {
    const result = await runEditorialAction<{
      head: EditorialRecordState["head"];
      version: EditorialRecordVersion;
    }>(
      "save_draft",
      {
        datasetId: schema.datasetId,
        recordId: nextRecord.id,
        values: sanitiseValues(
          nextRecord.values,
        ),
        expectedVersion:
          state?.head?.currentVersion ??
          null,
      },
    );

    setCurrentRecord({
      id: nextRecord.id,
      values: result.version.values,
    });

    await loadState();

    return {
      id: nextRecord.id,
      values: result.version.values,
    };
  }

  async function runWorkflowAction(
    action: EditorialWorkflowAction,
  ) {
    if (!state?.head) {
      throw new Error(
        "Save a draft before using workflow actions.",
      );
    }

    const apiAction:
      EditorialApiAction =
      action === "publish"
        ? "queue_publish"
        : action;

    setBusyAction(action);
    setRuntimeError(null);

    try {
      await runEditorialAction(
        apiAction,
        {
          datasetId: schema.datasetId,
          recordId: record.id,
          expectedVersion:
            state.head.currentVersion,
        },
      );

      await loadState();
    } catch (error) {
      setRuntimeError(
        error instanceof Error
          ? error.message
          : "Unable to complete the workflow action.",
      );
    } finally {
      setBusyAction(null);
    }
  }

  function compareWithCurrent(
    versionId: string,
  ) {
    const current =
      state?.currentVersion;
    const selected =
      state?.history.entries.find(
        (entry) =>
          entry.version.id === versionId,
      )?.version;

    if (!current || !selected) {
      return;
    }

    setSelectedVersionId(versionId);
    setComparison(
      new EditorialDiffService()
        .compareVersions(
          selected,
          current,
        ),
    );
  }

  async function previewRollback(
    versionId: string,
  ) {
    compareWithCurrent(versionId);

    if (
      !state?.head ||
      !window.confirm(
        "Restore this historical version as a new draft version?",
      )
    ) {
      return;
    }

    setRuntimeError(null);

    try {
      await runEditorialAction(
        "rollback",
        {
          datasetId: schema.datasetId,
          recordId: record.id,
          expectedVersion:
            state.head.currentVersion,
          targetVersionId: versionId,
        },
      );

      await loadState();
    } catch (error) {
      setRuntimeError(
        error instanceof Error
          ? error.message
          : "Unable to roll back this record.",
      );
    }
  }

  async function retryQueueItem(
    queueItemId: string,
  ) {
    await runOperationalAction(
      "retry_queue",
      { queueItemId },
    );
  }

  async function cancelQueueItem(
    queueItemId: string,
  ) {
    await runOperationalAction(
      "cancel_queue",
      { queueItemId },
    );
  }

  async function cancelSchedule(
    scheduleId: string,
  ) {
    await runOperationalAction(
      "cancel_schedule",
      { scheduleId },
    );
  }

  async function runOperationalAction(
    action: EditorialApiAction,
    extra: Record<string, unknown>,
  ) {
    setRuntimeError(null);

    try {
      await runEditorialAction(
        action,
        {
          datasetId: schema.datasetId,
          recordId: record.id,
          ...extra,
        },
      );

      await loadState();
    } catch (error) {
      setRuntimeError(
        error instanceof Error
          ? error.message
          : "Unable to update publishing operations.",
      );
    }
  }

  return (
    <RecordEditorPanel
      schema={schema}
      record={currentRecord}
      onClose={onClose}
      onSave={saveDraft}
      supplementalContent={
        <>
          {runtimeError && (
            <div
              className="record-editor-save-message record-editor-save-message--error"
              role="alert"
            >
              <strong>
                Editorial workflow error
              </strong>
              <p>{runtimeError}</p>
            </div>
          )}

          {loading ? (
            <section className="editorial-admin-card">
              <p className="editorial-admin-empty">
                Loading editorial history…
              </p>
            </section>
          ) : state?.head ? (
            <EditorialAdminWorkspace
              status={state.head.status}
              version={
                state.head.currentVersion
              }
              updatedAt={
                state.head.updatedAt
              }
              updatedBy={
                state.head.updatedBy
              }
              historyEntries={
                state.history.entries
              }
              comparison={comparison}
              queueItems={
                state.queueItems
              }
              schedules={state.schedules}
              allowedActions={
                allowedActions
              }
              busyAction={busyAction}
              selectedVersionId={
                selectedVersionId
              }
              onWorkflowAction={
                runWorkflowAction
              }
              onSelectVersion={
                setSelectedVersionId
              }
              onCompareWithCurrent={
                compareWithCurrent
              }
              onPreviewRollback={
                previewRollback
              }
              onRetryQueueItem={
                retryQueueItem
              }
              onCancelQueueItem={
                cancelQueueItem
              }
              onCancelSchedule={
                cancelSchedule
              }
            />
          ) : (
            <section className="editorial-admin-card">
              <p className="editorial-admin-empty">
                Save this record to create its first editorial draft and version history.
              </p>
            </section>
          )}
        </>
      }
    />
  );
}
