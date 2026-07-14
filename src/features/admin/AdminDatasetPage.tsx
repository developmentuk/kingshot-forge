import {
  useEffect,
  useState,
} from "react";
import {
  Link,
  useParams,
} from "react-router-dom";

import { getAdminDataset } from "./adminDatasets";
import { DatasetRecordPanel } from "./DatasetRecordPanel";
import { DatasetTable } from "./DatasetTable";
import { getDatasetAdapter } from "./datasetAdapterRegistry";
import {
  fetchDataset,
  type DatasetKey,
} from "./dataEngineApi";
import {
  getDatasetBrowserDefinition,
} from "./datasetBrowserData";

import type {
  DatasetBrowserDefinition,
  DatasetTableRow,
} from "./datasetBrowserTypes";

export function AdminDatasetPage() {
  const { datasetId } =
    useParams<{ datasetId: string }>();

  const [selectedRow, setSelectedRow] =
    useState<DatasetTableRow | null>(null);

  const [
    liveBrowserDefinition,
    setLiveBrowserDefinition,
  ] = useState<DatasetBrowserDefinition | null>(
    null,
  );

  const [datasetLoading, setDatasetLoading] =
    useState(false);

  const [datasetError, setDatasetError] =
    useState<string | null>(null);

  const dataset = datasetId
    ? getAdminDataset(datasetId)
    : undefined;

  const adapter = datasetId
    ? getDatasetAdapter(datasetId)
    : undefined;

  const fallbackBrowserDefinition = datasetId
    ? getDatasetBrowserDefinition(datasetId)
    : undefined;

  const browserDefinition =
    liveBrowserDefinition ??
    fallbackBrowserDefinition;

  useEffect(() => {
    setSelectedRow(null);
    setLiveBrowserDefinition(null);
    setDatasetError(null);

    if (!datasetId || !adapter) {
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
  }, [datasetId, adapter]);

  if (!dataset) {
    return (
      <main className="admin-page">
        <section className="admin-empty-state">
          <p className="admin-page__eyebrow">
            Data Engine Admin
          </p>

          <h1>Dataset not found</h1>

          <p>
            The requested dataset is not registered
            in the admin dataset list.
          </p>

          <Link
            to="/admin"
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
            to="/admin"
            className="admin-page__back-link"
          >
            ← All datasets
          </Link>

          <p className="admin-page__eyebrow">
            Data Engine Admin
          </p>

          <h1>{dataset.name}</h1>

          <p className="admin-page__intro">
            {dataset.description}
          </p>
        </div>
      </section>

      {adapter && datasetLoading && (
        <section className="admin-placeholder-panel">
          <div className="admin-placeholder-panel__body">
            <h2>
              Loading live {dataset.name} dataset…
            </h2>

            <p>
              Fetching and normalising the current
              Kingshot data.
            </p>
          </div>
        </section>
      )}

      {adapter && datasetError && (
        <section className="admin-placeholder-panel">
          <div className="admin-placeholder-panel__body">
            <h2>Live dataset unavailable</h2>

            <p>{datasetError}</p>

            {fallbackBrowserDefinition && (
              <p>
                Temporary browser data is being shown
                as a fallback.
              </p>
            )}
          </div>
        </section>
      )}

      {browserDefinition ? (
        <>
          <DatasetTable
            columns={
              browserDefinition.columns
            }
            rows={browserDefinition.rows}
            searchPlaceholder={`Search ${dataset.name.toLowerCase()}...`}
            pageSize={10}
            onViewRow={setSelectedRow}
          />

          {selectedRow && (
            <DatasetRecordPanel
              columns={
                browserDefinition.columns
              }
              row={selectedRow}
              onClose={() =>
                setSelectedRow(null)
              }
            />
          )}
        </>
      ) : (
        <section className="admin-placeholder-panel">
          <div className="admin-placeholder-panel__header">
            <div>
              <p className="admin-placeholder-panel__label">
                Dataset ID
              </p>

              <p className="admin-placeholder-panel__value">
                {dataset.id}
              </p>
            </div>

            <span
              className={`admin-dataset-status admin-dataset-status--${dataset.status}`}
            >
              {dataset.status ===
              "not-imported"
                ? "Not imported"
                : dataset.status}
            </span>
          </div>

          <div className="admin-placeholder-panel__body">
            <h2>
              Dataset adapter not yet available
            </h2>

            <p>
              This dataset is registered in the admin
              area, but its live table adapter has not
              yet been created.
            </p>
          </div>
        </section>
      )}
    </main>
  );
}