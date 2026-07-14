import {
  useCallback,
  useEffect,
  useState,
} from "react";
import { forgeEngine } from "./engine";
import type {
  DataEngineOptions,
  DatasetHealth,
  DatasetKey,
} from "./types";

export interface UseDatasetResult<TData> {
  data: TData | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  health: DatasetHealth;
  refresh: () => Promise<void>;
}

export function useDataset<TData = unknown>(
  key: DatasetKey,
  options: DataEngineOptions = {},
): UseDatasetResult<TData> {
  const [data, setData] = useState<TData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [error, setError] = useState<
    string | null
  >(null);
  const [health, setHealth] =
    useState<DatasetHealth>(() =>
      forgeEngine.getDatasetHealth(key),
    );

  const load = useCallback(
    async (
      forceRefresh = false,
    ): Promise<void> => {
      if (forceRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      try {
        const result =
          await forgeEngine.getDataset<TData>(
            key,
            {
              ...options,
              forceRefresh,
            },
          );

        setData(result);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : `Unable to load the ${key} dataset.`,
        );
      } finally {
        setHealth(
          forgeEngine.getDatasetHealth(key),
        );
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      key,
      options.cacheDurationMs,
      options.forceRefresh,
    ],
  );

  useEffect(() => {
    let active = true;

    const initialLoad = async (): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const result =
          await forgeEngine.getDataset<TData>(
            key,
            options,
          );

        if (active) {
          setData(result);
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : `Unable to load the ${key} dataset.`,
          );
        }
      } finally {
        if (active) {
          setHealth(
            forgeEngine.getDatasetHealth(key),
          );
          setLoading(false);
        }
      }
    };

    void initialLoad();

    return () => {
      active = false;
    };
  }, [
    key,
    options.cacheDurationMs,
    options.forceRefresh,
  ]);

  const refresh =
    useCallback(async (): Promise<void> => {
      await load(true);
    }, [load]);

  return {
    data,
    loading,
    refreshing,
    error,
    health,
    refresh,
  };
}