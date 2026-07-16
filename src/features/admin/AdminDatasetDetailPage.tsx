import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useParams,
} from "react-router-dom";

import {
  getAdminDataset,
} from "./adminDatasets";

import {
  DatasetRecordPanel,
} from "./DatasetRecordPanel";

import {
  DatasetTable,
} from "./DatasetTable";

import {
  getDatasetAdapter,
} from "./datasetAdapterRegistry";

import {
  fetchDataset,
} from "./dataEngineApi";

import type {
  DatasetKey,
  DatasetLoadResult,
} from "./dataEngineApi";

import type {
  DatasetBrowserDefinition,
  DatasetTableRow,
} from "./datasetBrowserTypes";

import {
  ConnectedEditorialRecordEditor,
} from "./editorial";

import {
  getRecordEditorSchema,
} from "./recordEditor/recordEditorSchemaRegistry";

import type {
  RecordEditorRecord,
  RecordEditorSchema,
} from "./recordEditor/recordEditorSchema";

interface ActiveRecordEditor {
  mode: "create" | "edit";
  schema: RecordEditorSchema;
  record: RecordEditorRecord;
}

function formatFetchedAt(value: string): string {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString();
}

export function AdminDatasetDetailPage() {
  const { datasetId } =
    useParams<{
      datasetId: string;
    }>();

  const [
    selectedRow,
    setSelectedRow,
  ] = useState<DatasetTableRow | null>(null);

  const [
    activeEditor,
    setActiveEditor,
  ] = useState<ActiveRecordEditor | null>(null);

  const [
    liveDatasetResult,
    setLiveDatasetResult,
  ] = useState<DatasetLoadResult | null>(null);

  const [
    liveBrowserDefinition,
    setLiveBrowserDefinition,
  ] = useState<DatasetBrowserDefinition | null>(null);

  const [
    datasetLoading,
    setDatasetLoading,
  ] = useState(false);

  const [
    datasetError,
    setDatasetError,
  ] = useState<string | null>(null);

  const [
    editorError,
    setEditorError,
  ] = useState<string | null>(null);

  const [reloadRequest, setReloadRequest] =
    useState(0);

  const dataset = datasetId
    ? getAdminDataset(datasetId)
    : undefined;

  const adapter = datasetId
    ? getDatasetAdapter(datasetId)
    : undefined;

  const editorSchema = datasetId
    ? getRecordEditorSchema(datasetId)
    : null;

  const supportsRecordEditing = Boolean(
    dataset?.capabilities.editing &&
    adapter?.createEditorRecord &&
    editorSchema,
  );

  const supportsRecordCreation = Boolean(
    dataset?.capabilities.creation &&
    adapter?.createEditorRecord &&
    editorSchema?.allowCreate &&
    editorSchema?.createEmptyRecord &&
    editorSchema,
  );

  useEffect(() => {
    setSelectedRow(null);
    setActiveEditor(null);
    setLiveDatasetResult(null);
    setLiveBrowserDefinition(null);
    setDatasetError(null);
    setEditorError(null);

    if (
      !datasetId ||
      !dataset?.capabilities.browsing ||
      !adapter
    ) {
      setDatasetLoading(false);
      return;
    }

    const controller = new AbortController();

    setDatasetLoading(true);

    fetchDataset(
      datasetId as DatasetKey,
      controller.signal,
    )
      .then((result) => {
        if (controller.signal.aborted) {
          return;
        }

        setLiveDatasetResult(result);
        setLiveBrowserDefinition(
          adapter.createBrowserDefinition(result),
        );
      })
      .catch((error: unknown) => {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        setDatasetError(
          error instanceof Error
            ? error.message
            : `Unable to load the ${datasetId} dataset.`,
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setDatasetLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [
    datasetId,
    dataset?.capabilities.browsing,
    adapter,
    reloadRequest,
  ]);

  function handleViewRow(row: DatasetTableRow) {
    setEditorError(null);
    setActiveEditor(null);
    setSelectedRow(row);
  }

  function handleEditRow(row: DatasetTableRow) {
    setEditorError(null);
    setSelectedRow(null);

    if (
      !adapter?.createEditorRecord ||
      !editorSchema ||
      !liveDatasetResult
    ) {
      setEditorError(
        "The Record Editor is not available for this dataset.",
      );
      return;
    }

    const editorRecord =
      adapter.createEditorRecord(
        liveDatasetResult,
        row.id,
      );

    if (!editorRecord) {
      setEditorError(
        `Unable to find the complete record for "${row.id}". Reload the dataset and try again.`,
      );
      return;
    }

    setActiveEditor({
      mode: "edit",
      schema: editorSchema,
      record: editorRecord,
    });
  }

  function handleCreateRow() {
    setEditorError(null);
    setSelectedRow(null);

    if (
      !adapter?.createEditorRecord ||
      !editorSchema?.allowCreate ||
      !editorSchema.createEmptyRecord
    ) {
      setEditorError(
        "Record creation is not available for this dataset.",
      );
      return;
    }

    setActiveEditor({
      mode: "create",
      schema: editorSchema,
      record: editorSchema.createEmptyRecord(),
    });
  }

  if (!dataset) {
    return (
      <main className="admin-page">
        <section className="admin-empty-state">
          <p className="admin-page__eyebrow">
            Data Engine Admin
          </p>
          <h1>Dataset not found</h1>
          <p>
            The requested dataset is not registered in the
            Dataset Registry.
          </p>
          <Link
            to="/admin/datasets"
            className="admin-empty-state__link"
          >
            Return to datasets
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <section className="admin-page__header">
        <div>
          <Link
            to="/admin/datasets"
            className="admin-page__back-link"
          >
            ← All datasets
          </Link>
          <p className="admin-page__eyebrow">
            Data Engine Admin
          </p>
          <div className="admin-dataset-heading">
            <h1>{dataset.name}</h1>
            <span
              className={`admin-dataset-status admin-dataset-status--${dataset.status}`}
            >
              {dataset.status === "editor-ready"
                ? "Editor ready"
                : dataset.status === "browse-only"
                  ? "Browse only"
                  : "Registered"}
            </span>
          </div>
          <p className="admin-page__intro">
            {dataset.description}
          </p>
        </div>
      </section>

      <section className="admin-dataset-experience">
        <div>
          <p className="admin-page__eyebrow">
            Implementation status
          </p>
          <h2>{dataset.statusDescription}</h2>
          <p>{dataset.sourceDescription}</p>
        </div>

        <dl className="admin-dataset-experience__capabilities">
          <div>
            <dt>Dataset browser</dt>
            <dd>
              {dataset.capabilities.browsing
                ? "Available"
                : "Not implemented"}
            </dd>
          </div>
          <div>
            <dt>Search</dt>
            <dd>
              {dataset.capabilities.search
                ? "Available"
                : "Not implemented"}
            </dd>
          </div>
          <div>
            <dt>Record Editor</dt>
            <dd>
              {dataset.capabilities.editing
                ? "Available"
                : "Not implemented"}
            </dd>
          </div>
          <div>
            <dt>Version history</dt>
            <dd>
              {dataset.capabilities.versionHistory
                ? "Available in editor"
                : "Not implemented"}
            </dd>
          </div>
          <div>
            <dt>Live publishing</dt>
            <dd>
              {dataset.capabilities.publishing
                ? "Available in editor"
                : "Not implemented"}
            </dd>
          </div>
        </dl>
      </section>

      {editorError && (
        <section
          className="admin-state-panel admin-state-panel--error"
          role="alert"
        >
          <div>
            <h2>Record Editor unavailable</h2>
            <p>{editorError}</p>
          </div>
          <button
            type="button"
            onClick={() => setEditorError(null)}
          >
            Dismiss
          </button>
        </section>
      )}

      {datasetLoading && (
        <section
          className="admin-state-panel admin-state-panel--loading"
          aria-live="polite"
        >
          <span
            className="admin-state-panel__spinner"
            aria-hidden="true"
          />
          <div>
            <h2>Loading {dataset.name}</h2>
            <p>
              Fetching and normalising the current dataset
              source.
            </p>
          </div>
        </section>
      )}

      {!datasetLoading && datasetError && (
        <section
          className="admin-state-panel admin-state-panel--error"
          role="alert"
        >
          <div>
            <h2>Dataset unavailable</h2>
            <p>{datasetError}</p>
            <p>
              No demo or cached records are being substituted.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setReloadRequest((request) => request + 1)
            }
          >
            Retry
          </button>
        </section>
      )}

      {!datasetLoading &&
        !datasetError &&
        liveDatasetResult &&
        liveBrowserDefinition && (
          <>
            <dl className="admin-dataset-source-summary">
              <div>
                <dt>Records loaded</dt>
                <dd>{liveDatasetResult.recordCount}</dd>
              </div>
              <div>
                <dt>Source status</dt>
                <dd>Available</dd>
              </div>
              <div>
                <dt>Fetched</dt>
                <dd>
                  {formatFetchedAt(
                    liveDatasetResult.fetchedAt,
                  )}
                </dd>
              </div>
            </dl>

            <DatasetTable
              columns={liveBrowserDefinition.columns}
              rows={liveBrowserDefinition.rows}
              searchPlaceholder={`Search ${dataset.name.toLowerCase()}...`}
              pageSize={10}
              emptyMessage={`The ${dataset.name} source loaded successfully, but it contains no records.`}
              onCreateRow={
                supportsRecordCreation
                  ? handleCreateRow
                  : undefined
              }
              onViewRow={handleViewRow}
              onEditRow={
                supportsRecordEditing
                  ? handleEditRow
                  : undefined
              }
            />

            {selectedRow && (
              <DatasetRecordPanel
                columns={liveBrowserDefinition.columns}
                row={selectedRow}
                onClose={() => setSelectedRow(null)}
              />
            )}

            {activeEditor && (
              <ConnectedEditorialRecordEditor
                mode={activeEditor.mode}
                publishingAvailable={
                  dataset.capabilities.publishing
                }
                schema={activeEditor.schema}
                record={activeEditor.record}
                onClose={() => setActiveEditor(null)}
              />
            )}
          </>
        )}

      {!datasetLoading &&
        !datasetError &&
        !dataset.capabilities.browsing && (
          <section className="admin-state-panel">
            <div>
              <h2>Dataset browser not implemented</h2>
              <p>
                This dataset remains registered, but it does
                not expose record links or actions until a
                browser adapter is available.
              </p>
            </div>
          </section>
        )}
    </main>
  );
}
