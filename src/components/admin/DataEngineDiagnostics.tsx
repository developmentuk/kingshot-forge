import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  DATASET_KEYS,
  forgeEngine,
  type DatasetHealth,
  type DatasetKey,
} from "../../lib/dataEngine";

function formatDatasetName(key: DatasetKey): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (character) =>
      character.toUpperCase(),
    );
}

function formatDate(value: string | null): string {
  if (!value) {
    return "Not loaded";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export function DataEngineDiagnostics() {
  const [health, setHealth] = useState<
    DatasetHealth[]
  >(() => forgeEngine.getAllDatasetHealth());

  const [loadingKeys, setLoadingKeys] = useState<
    Set<DatasetKey>
  >(new Set());

  const [loadingAll, setLoadingAll] =
    useState(false);

  const updateHealth = useCallback(() => {
    setHealth(
      forgeEngine.getAllDatasetHealth(),
    );
  }, []);

  useEffect(() => {
    updateHealth();
  }, [updateHealth]);

  const refreshOne = async (
    key: DatasetKey,
  ): Promise<void> => {
    setLoadingKeys((current) => {
      const next = new Set(current);
      next.add(key);
      return next;
    });

    try {
      await forgeEngine.refreshDataset(key);
    } catch (error) {
      console.error(
        `Unable to refresh ${key}:`,
        error,
      );
    } finally {
      updateHealth();

      setLoadingKeys((current) => {
        const next = new Set(current);
        next.delete(key);
        return next;
      });
    }
  };

  const refreshAll = async (): Promise<void> => {
    setLoadingAll(true);

    forgeEngine.invalidateAllDatasets();

    await Promise.allSettled(
      DATASET_KEYS.map((key) =>
        forgeEngine.refreshDataset(key),
      ),
    );

    updateHealth();
    setLoadingAll(false);
  };

  return (
    <section className="data-engine-diagnostics">
      <div className="data-engine-diagnostics__header">
        <div>
          <p className="eyebrow">
            Forge Data Engine
          </p>

          <h2>Dataset diagnostics</h2>

          <p>
            Check dataset availability, record counts,
            update times and loading errors.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void refreshAll()}
          disabled={loadingAll}
        >
          {loadingAll
            ? "Refreshing..."
            : "Refresh all"}
        </button>
      </div>

      <div className="data-engine-diagnostics__grid">
        {health.map((dataset) => {
          const isLoading = loadingKeys.has(
            dataset.key,
          );

          return (
            <article
              key={dataset.key}
              className="data-engine-diagnostics__card"
            >
              <div className="data-engine-diagnostics__card-header">
                <div>
                  <h3>
                    {formatDatasetName(
                      dataset.key,
                    )}
                  </h3>

                  <span
                    className={
                      dataset.available
                        ? "status status--success"
                        : dataset.error
                          ? "status status--error"
                          : "status status--idle"
                    }
                  >
                    {dataset.available
                      ? "Available"
                      : dataset.error
                        ? "Error"
                        : "Not loaded"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void refreshOne(dataset.key)
                  }
                  disabled={isLoading || loadingAll}
                >
                  {isLoading
                    ? "Loading..."
                    : "Refresh"}
                </button>
              </div>

              <dl>
                <div>
                  <dt>Source</dt>
                  <dd>{dataset.source}</dd>
                </div>

                <div>
                  <dt>Records</dt>
                  <dd>
                    {dataset.recordCount ?? "Unknown"}
                  </dd>
                </div>

                <div>
                  <dt>Loaded</dt>
                  <dd>
                    {formatDate(dataset.loadedAt)}
                  </dd>
                </div>

                <div>
                  <dt>Dataset updated</dt>
                  <dd>
                    {formatDate(dataset.updatedAt)}
                  </dd>
                </div>
              </dl>

              {dataset.error && (
                <p
                  className="data-engine-diagnostics__error"
                  role="alert"
                >
                  {dataset.error}
                </p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}