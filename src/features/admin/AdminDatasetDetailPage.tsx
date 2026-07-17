import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useParams,
} from "react-router-dom";

import {
  useRole,
} from "../../context/RoleContext";

import {
  canRolePerformStandardEditorialAction,
} from "../../platform";

import type {
  ReadinessCapability,
  ReadinessStatus,
} from "../../../shared/platform/readiness";

import {
  getAdminDataset,
  type AdminDatasetDefinition,
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
  mode: "create" | "edit" | "review";
  schema: RecordEditorSchema;
  record: RecordEditorRecord;
}

const capabilityLabels: Partial<
  Record<ReadinessCapability, string>
> = {
  browser: "Dataset browser",
  viewer: "Record viewer",
  editor: "Record Editor",
  publishing: "Live publishing",
  "version-history": "Version history",
  search: "Search",
  mobile: "Mobile layout",
};

function formatReadinessStatus(
  status: ReadinessStatus,
): string {
  switch (status) {
    case "implemented":
      return "Implemented";
    case "partial":
      return "Partial";
    case "missing":
      return "Not implemented";
    case "not-applicable":
      return "Not applicable";
    case "not-audited":
      return "Not audited";
  }
}

function getReadinessStatus(
  dataset: AdminDatasetDefinition,
  capability: ReadinessCapability,
): ReadinessStatus {
  return dataset.readiness.capabilities.find(
    (candidate) =>
      candidate.capability === capability,
  )?.status ?? "not-audited";
}

function formatFetchedAt(value: string): string {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString();
}

export function AdminDatasetDetailPage() {
  const { hasPermission, role } = useRole();
  const { datasetId } =
    useParams<{
      datasetId: string;
    }>();

  const [
    selectedRow,
    setSelectedRow,
  ] = useState<DatasetTableRow | null>(
    null,
  );

  const [
    activeEditor,
    setActiveEditor,
  ] = useState<ActiveRecordEditor | null>(
    null,
  );

  const [
    liveDatasetResult,
    setLiveDatasetResult,
  ] = useState<DatasetLoadResult | null>(
    null,
  );

  const [
    liveBrowserDefinition,
    setLiveBrowserDefinition,
  ] = useState<DatasetBrowserDefinition | null>(
    null,
  );

  const [
    datasetLoading,
    setDatasetLoading,
  ] = useState(true);

  const [
    datasetError,
    setDatasetError,
  ] = useState<string | null>(null);

  const [
    editorError,
    setEditorError,
  ] = useState<string | null>(null);

  const [
    reloadRequest,
    setReloadRequest,
  ] = useState(0);

  const dataset = datasetId
    ? getAdminDataset(datasetId)
    : undefined;

  const adapter = datasetId
    ? getDatasetAdapter(datasetId)
    : undefined;

  const editorSchema = datasetId
    ? getRecordEditorSchema(datasetId)
    : null;

  const supportsRecordEditor = Boolean(
    dataset?.capabilities.editing &&
    adapter?.createEditorRecord &&
    editorSchema,
  );

  const supportsRecordEditing = Boolean(
    supportsRecordEditor &&
    hasPermission("cms.records.edit") &&
    canRolePerformStandardEditorialAction(
      role,
      "update",
    ),
  );

  const supportsWorkflowReview = Boolean(
    supportsRecordEditor &&
    !supportsRecordEditing &&
    (
      canRolePerformStandardEditorialAction(
        role,
        "review",
      ) &&
      hasPermission("cms.history.restore") ||
      (
        canRolePerformStandardEditorialAction(
          role,
          "approve",
        ) &&
        hasPermission("cms.publish")
      ) ||
      (
        dataset?.capabilities.publishing &&
        canRolePerformStandardEditorialAction(
          role,
          "publish",
        ) &&
        hasPermission("cms.publish")
      )
    ),
  );

  const supportsRecordCreation = Boolean(
    dataset?.capabilities.creation &&
    editorSchema?.createEmptyRecord &&
    hasPermission("cms.records.create") &&
    canRolePerformStandardEditorialAction(
      role,
      "create",
    ),
  );

  const supportsBrowsing = Boolean(
    dataset?.capabilities.browsing &&
    adapter,
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
      !adapter ||
      !supportsBrowsing
    ) {
      setDatasetLoading(false);
      return;
    }

    const controller =
      new AbortController();

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
          adapter.createBrowserDefinition(
            result,
          ),
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
    adapter,
    datasetId,
    reloadRequest,
    supportsBrowsing,
  ]);

  function handleViewRow(
    row: DatasetTableRow,
  ) {
    setEditorError(null);
    setActiveEditor(null);
    setSelectedRow(row);
  }

  function handleCreateRow() {
    setEditorError(null);
    setSelectedRow(null);

    if (
      !dataset?.capabilities.creation ||
      !editorSchema?.createEmptyRecord ||
      !hasPermission("cms.records.create") ||
      !canRolePerformStandardEditorialAction(
        role,
        "create",
      )
    ) {
      setEditorError(
        "Record creation is not implemented for this dataset.",
      );
      return;
    }

    setActiveEditor({
      mode: "create",
      schema: editorSchema,
      record:
        editorSchema.createEmptyRecord(),
    });
  }

  function openRecordEditor(
    row: DatasetTableRow,
    mode: "edit" | "review",
  ) {
    setEditorError(null);
    setSelectedRow(null);

    if (!adapter?.createEditorRecord) {
      setEditorError(
        "This dataset does not have a Record Editor adapter.",
      );
      return;
    }

    if (!editorSchema) {
      setEditorError(
        "This dataset does not have a registered Record Editor schema.",
      );
      return;
    }

    if (!liveDatasetResult) {
      setEditorError(
        "The live dataset must load before this record can be edited.",
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
        `Unable to find the complete record for "${row.id}".`,
      );
      return;
    }

    setActiveEditor({
      mode,
      schema: editorSchema,
      record: editorRecord,
    });
  }

  function handleEditRow(
    row: DatasetTableRow,
  ) {
    if (
      !hasPermission("cms.records.edit") ||
      !canRolePerformStandardEditorialAction(
        role,
        "update",
      )
    ) {
      setEditorError(
        "Your role can view this dataset but cannot edit records.",
      );
      return;
    }

    openRecordEditor(row, "edit");
  }

  function handleReviewRow(
    row: DatasetTableRow,
  ) {
    if (!supportsWorkflowReview) {
      setEditorError(
        "Your role cannot review this editorial record.",
      );
      return;
    }

    openRecordEditor(row, "review");
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
            The requested dataset is not registered in the Admin dataset catalogue.
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

  const visibleCapabilities: ReadinessCapability[] = [
    "browser",
    "viewer",
    "editor",
    "version-history",
    "publishing",
    "search",
    "mobile",
  ];

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
              className={`admin-dataset-readiness admin-dataset-readiness--${
                dataset.capabilities.editing
                  ? "implemented"
                  : "browse-only"
              }`}
            >
              {dataset.capabilities.editing
                ? "Editor implemented"
                : dataset.capabilities.browsing
                  ? "Browse only"
                  : "Browser unavailable"}
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
            Readiness evidence
          </p>
          <h2>
            {dataset.capabilities.editing
              ? "Browse, inspect and edit through the governed Record Editor."
              : dataset.capabilities.browsing
                ? "Browse and inspect live records. Editing is not implemented for this dataset."
                : "This dataset is registered without an Admin browser implementation."}
          </h2>
          <p>{dataset.sourceDescription}</p>
        </div>

        <dl className="admin-dataset-experience__capabilities">
          {visibleCapabilities.map(
            (capability) => {
              const status =
                getReadinessStatus(
                  dataset,
                  capability,
                );

              return (
                <div key={capability}>
                  <dt>
                    {capabilityLabels[capability] ??
                      capability}
                  </dt>
                  <dd
                    className={`admin-readiness-value admin-readiness-value--${status}`}
                  >
                    {formatReadinessStatus(status)}
                  </dd>
                </div>
              );
            },
          )}
          <div>
            <dt>Create records</dt>
            <dd
              className={`admin-readiness-value admin-readiness-value--${
                dataset.capabilities.creation
                  ? "implemented"
                  : "missing"
              }`}
            >
              {dataset.capabilities.creation
                ? "Implemented"
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
            onClick={() =>
              setEditorError(null)
            }
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
              Fetching and normalising the current dataset source.
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
              No demo or fallback records are being substituted.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setReloadRequest(
                (request) => request + 1,
              )
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
                <dd>
                  {liveDatasetResult.recordCount}
                </dd>
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
              columns={
                liveBrowserDefinition.columns
              }
              rows={
                liveBrowserDefinition.rows
              }
              searchPlaceholder={`Search ${dataset.name.toLowerCase()}...`}
              pageSize={10}
              emptyMessage={`The ${dataset.name} source loaded successfully, but it contains no records.`}
              onCreateRow={
                supportsRecordCreation
                  ? handleCreateRow
                  : undefined
              }
              onViewRow={
                dataset.capabilities.viewing
                  ? handleViewRow
                  : undefined
              }
              onEditRow={
                supportsRecordEditing
                  ? handleEditRow
                  : undefined
              }
              onReviewRow={
                supportsWorkflowReview
                  ? handleReviewRow
                  : undefined
              }
            />

            {selectedRow && (
              <DatasetRecordPanel
                columns={
                  liveBrowserDefinition.columns
                }
                row={selectedRow}
                onClose={() =>
                  setSelectedRow(null)
                }
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
                onClose={() =>
                  setActiveEditor(null)
                }
              />
            )}
          </>
        )}

      {!datasetLoading &&
        !datasetError &&
        !supportsBrowsing && (
          <section className="admin-state-panel">
            <div>
              <h2>Dataset browser not implemented</h2>
              <p>
                This dataset remains registered, but it exposes no record links or actions until a browser adapter is available.
              </p>
            </div>
          </section>
        )}
    </main>
  );
}
