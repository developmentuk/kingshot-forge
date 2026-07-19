import { useEffect, useMemo, useState } from "react";

import { adminDatasets } from "../adminDatasets";
import {
  EditorialAdminWorkspace,
} from "./EditorialAdminWorkspace";
import type { EditorialWorkflowAction } from "./EditorialWorkflowPanel";
import {
  fetchEditorialRecordState,
  runEditorialAction,
  type EditorialRecordState,
} from "./editorialApi";
import type { DatasetKey } from "../dataEngineApi";

type EditorialOperationsMode = "history" | "publish";

interface EditorialOperationsPageProps {
  mode: EditorialOperationsMode;
}

export function EditorialOperationsPage({
  mode,
}: EditorialOperationsPageProps) {
  const editableDatasets = useMemo(
    () => adminDatasets.filter((dataset) => dataset.capabilities.editing),
    [],
  );
  const [datasetId, setDatasetId] = useState(editableDatasets[0]?.id ?? "");
  const [recordId, setRecordId] = useState("");
  const [state, setState] = useState<EditorialRecordState | null>(null);
  const [loading, setLoading] = useState(false);
  const [busyAction, setBusyAction] = useState<EditorialWorkflowAction | null>(null);
  const [error, setError] = useState("");

  async function loadState(): Promise<void> {
    if (!datasetId || !recordId.trim()) {
      setError("Choose a dataset and enter a record ID.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      setState(await fetchEditorialRecordState(datasetId, recordId.trim()));
    } catch (value) {
      setError(value instanceof Error ? value.message : "Editorial state unavailable.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setState(null);
  }, [datasetId]);

  async function runAction(action: EditorialWorkflowAction): Promise<void> {
    if (!state?.head) return;
    setBusyAction(action);
    setError("");
    try {
      await runEditorialAction(action === "publish" ? "queue_publish" : action, {
        datasetId,
        recordId: recordId.trim(),
        expectedVersion: state.head.currentVersion,
      });
      await loadState();
    } catch (value) {
      setError(value instanceof Error ? value.message : "Editorial action failed.");
    } finally {
      setBusyAction(null);
    }
  }

  async function runQueueAction(action: "process_queue" | "retry_queue" | "cancel_queue" | "cancel_schedule", id: string): Promise<void> {
    setError("");
    try {
      await runEditorialAction(action, {
        datasetId,
        recordId: recordId.trim(),
        ...(action === "cancel_schedule" ? { scheduleId: id } : { queueItemId: id }),
      });
      await loadState();
    } catch (value) {
      setError(value instanceof Error ? value.message : "Publishing operation failed.");
    }
  }

  async function rollback(versionId: string): Promise<void> {
    if (!state?.head || !window.confirm("Create a new published version from this historical version?")) return;
    setBusyAction("restore");
    try {
      await runEditorialAction("rollback", {
        datasetId,
        recordId: recordId.trim(),
        expectedVersion: state.head.currentVersion,
        targetVersionId: versionId,
      });
      await loadState();
    } catch (value) {
      setError(value instanceof Error ? value.message : "Rollback failed.");
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <main className="admin-page editorial-operations-page">
      <section className="admin-page__header">
        <p className="admin-page__eyebrow">Forge Admin CMS</p>
        <h1>{mode === "history" ? "Version History" : "Publish Centre"}</h1>
        <p className="admin-page__intro">
          {mode === "history"
            ? "Inspect immutable versions, compare revisions and create a new rollback version when authorised."
            : "Review queue state and process approved editorial publications through the governed workflow."}
        </p>
      </section>

      <section className="editorial-operations-selector" aria-label="Editorial record selector">
        <label>Dataset<select value={datasetId} onChange={(event) => setDatasetId(event.target.value as DatasetKey)}>{editableDatasets.map((dataset) => <option key={dataset.id} value={dataset.id}>{dataset.name}</option>)}</select></label>
        <label>Record ID<input value={recordId} onChange={(event) => setRecordId(event.target.value)} placeholder="e.g. sophia" /></label>
        <button type="button" className="button button--primary" onClick={() => void loadState()} disabled={loading}>{loading ? "Loading…" : "Inspect record"}</button>
      </section>

      {error && <div className="error-state" role="alert">{error}</div>}
      {state?.head && <EditorialAdminWorkspace
        status={state.head.status}
        version={state.head.currentVersion}
        updatedAt={state.head.updatedAt}
        updatedBy={state.head.updatedBy}
        historyEntries={state.history.entries}
        queueItems={state.queueItems}
        schedules={state.schedules}
        publishingAvailable={mode === "publish"}
        busyAction={busyAction}
        onWorkflowAction={runAction}
        onPreviewRollback={rollback}
        onProcessQueueItem={(id) => void runQueueAction("process_queue", id)}
        onRetryQueueItem={(id) => void runQueueAction("retry_queue", id)}
        onCancelQueueItem={(id) => void runQueueAction("cancel_queue", id)}
        onCancelSchedule={(id) => void runQueueAction("cancel_schedule", id)}
      />}
    </main>
  );
}
