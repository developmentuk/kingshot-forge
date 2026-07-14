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
import {
  getDatasetBrowserDefinition,
} from "./datasetBrowserData";

import {
  fetchDataset,
  type DatasetLoadResult,
} from "./dataEngineApi";

import type {
  DatasetBrowserDefinition,
  DatasetTableRow,
} from "./datasetBrowserTypes";

function toTitleCase(value: unknown): string {
  return String(value ?? "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

function createRecordId(
  name: string,
  index: number,
): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || `hero-${index + 1}`;
}
function toCellValue(
  value: unknown,
): string | number | boolean | null {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  return null;
}
function createHeroBrowserDefinition(
  result: DatasetLoadResult,
): DatasetBrowserDefinition {
  const rows: DatasetTableRow[] =
    result.records.map(
  (record: unknown, index: number) => {
      const hero =
        record as Record<string, unknown>;

      const name =
        typeof hero.name === "string"
          ? hero.name
          : `Hero ${index + 1}`;

return {
  id: createRecordId(name, index),
  values: {
    name,
    generation: toCellValue(hero.gen),
    rarity: toTitleCase(hero.rarity),
    troop: toTitleCase(hero.troop),
    rally: toCellValue(hero.rally),
    garrison: toCellValue(hero.garrison),
    bear: toCellValue(hero.bear),
    joiner: toCellValue(hero.joiner),
    f2p: toCellValue(hero.f2p),
  },
};
    });

  return {
    datasetId: "heroes",
    columns: [
      {
        key: "name",
        label: "Name",
        sortable: true,
      },
      {
        key: "generation",
        label: "Generation",
        sortable: true,
      },
      {
        key: "rarity",
        label: "Rarity",
        sortable: true,
      },
      {
        key: "troop",
        label: "Troop",
        sortable: true,
      },
      {
        key: "rally",
        label: "Rally",
        sortable: true,
      },
      {
        key: "garrison",
        label: "Garrison",
        sortable: true,
      },
      {
        key: "bear",
        label: "Bear",
        sortable: true,
      },
      {
        key: "joiner",
        label: "Joiner",
        sortable: true,
      },
      {
        key: "f2p",
        label: "F2P",
        sortable: true,
      },
    ],
    rows,
  };
}

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

  const fallbackBrowserDefinition = datasetId
    ? getDatasetBrowserDefinition(datasetId)
    : undefined;

  const browserDefinition =
    datasetId === "heroes"
      ? liveBrowserDefinition ??
        fallbackBrowserDefinition
      : fallbackBrowserDefinition;

  useEffect(() => {
    setSelectedRow(null);

    if (datasetId !== "heroes") {
      setLiveBrowserDefinition(null);
      setDatasetError(null);
      setDatasetLoading(false);

      return;
    }

    const controller = new AbortController();

    setDatasetLoading(true);
    setDatasetError(null);

    fetchDataset(
      "heroes",
      controller.signal,
    )
      .then((result: DatasetLoadResult) => {
        if (controller.signal.aborted) {
          return;
        }

        setLiveBrowserDefinition(
          createHeroBrowserDefinition(result),
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
            : "Unable to load the Heroes dataset.",
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
  }, [datasetId]);

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

      {datasetId === "heroes" &&
        datasetLoading && (
          <section className="admin-placeholder-panel">
            <div className="admin-placeholder-panel__body">
              <h2>
                Loading live Heroes dataset…
              </h2>

              <p>
                Fetching and normalising the current
                Kingshot hero data.
              </p>
            </div>
          </section>
        )}

      {datasetId === "heroes" &&
        datasetError && (
          <section className="admin-placeholder-panel">
            <div className="admin-placeholder-panel__body">
              <h2>
                Live dataset unavailable
              </h2>

              <p>{datasetError}</p>

              <p>
                The temporary browser data is being
                shown as a fallback.
              </p>
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
              Browser definition not yet available
            </h2>

            <p>
              This dataset is registered in the
              admin area, but its table columns and
              rows have not yet been connected.
            </p>
          </div>
        </section>
      )}
    </main>
  );
}