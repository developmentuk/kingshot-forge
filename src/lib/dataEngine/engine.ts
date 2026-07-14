import {
  clearDatasetCache,
  getCachedDataset,
  removeCachedDataset,
  setCachedDataset,
} from "./cache";
import { loadDataset } from "./loaders";
import {
  DATASET_KEYS,
  DataEngineError,
  type DataEngineOptions,
  type DatasetHealth,
  type DatasetKey,
  type DatasetLoaderResult,
} from "./types";

const DEFAULT_CACHE_DURATION_MS = 5 * 60 * 1000;

const datasetHealth = new Map<DatasetKey, DatasetHealth>();

function createInitialHealth(
  key: DatasetKey,
): DatasetHealth {
  return {
    key,
    available: false,
    source: "remote",
    recordCount: null,
    loadedAt: null,
    updatedAt: null,
    error: null,
  };
}

function countRecords(data: unknown): number | null {
  if (Array.isArray(data)) {
    return data.length;
  }

  if (
    typeof data !== "object" ||
    data === null
  ) {
    return null;
  }

  const record = data as Record<
    string,
    unknown
  >;

  for (const value of Object.values(record)) {
    if (Array.isArray(value)) {
      return value.length;
    }
  }

  return Object.keys(record).length;
}

function updateDatasetHealth<TData>(
  result: DatasetLoaderResult<TData>,
): void {
  datasetHealth.set(result.key, {
    key: result.key,
    available: true,
    source: result.source,
    recordCount: countRecords(result.data),
    loadedAt: result.loadedAt,
    updatedAt:
      typeof result.meta?.updated === "string"
        ? result.meta.updated
        : null,
    error: null,
  });
}

function updateDatasetError(
  key: DatasetKey,
  error: unknown,
): void {
  const current =
    datasetHealth.get(key) ??
    createInitialHealth(key);

  datasetHealth.set(key, {
    ...current,
    available: false,
    error:
      error instanceof Error
        ? error.message
        : "An unknown dataset error occurred.",
  });
}

export async function getDataset<
  TData = unknown,
>(
  key: DatasetKey,
  options: DataEngineOptions = {},
): Promise<TData> {
  const {
    cacheDurationMs =
      DEFAULT_CACHE_DURATION_MS,
    forceRefresh = false,
  } = options;

  if (!forceRefresh) {
    const cached =
      getCachedDataset<TData>(key);

    if (cached !== null) {
      return cached;
    }
  }

  try {
    const result =
      await loadDataset<TData>(key);

    setCachedDataset(
      key,
      result.data,
      cacheDurationMs,
    );

    updateDatasetHealth(result);

    return result.data;
  } catch (error) {
    updateDatasetError(key, error);

    if (error instanceof DataEngineError) {
      throw error;
    }

    throw new DataEngineError(
      key,
      `Unable to retrieve the ${key} dataset.`,
      error,
    );
  }
}

export async function refreshDataset<
  TData = unknown,
>(
  key: DatasetKey,
): Promise<TData> {
  removeCachedDataset(key);

  return getDataset<TData>(key, {
    forceRefresh: true,
  });
}

export async function preloadDatasets(
  keys: DatasetKey[] = [...DATASET_KEYS],
): Promise<
  PromiseSettledResult<unknown>[]
> {
  return Promise.allSettled(
    keys.map((key) => getDataset(key)),
  );
}

export function getDatasetHealth(
  key: DatasetKey,
): DatasetHealth {
  return (
    datasetHealth.get(key) ??
    createInitialHealth(key)
  );
}

export function getAllDatasetHealth(): DatasetHealth[] {
  return DATASET_KEYS.map((key) =>
    getDatasetHealth(key),
  );
}

export function invalidateDataset(
  key: DatasetKey,
): void {
  removeCachedDataset(key);
}

export function invalidateAllDatasets(): void {
  clearDatasetCache();
}

export const forgeEngine = {
  getDataset,
  refreshDataset,
  preloadDatasets,
  getDatasetHealth,
  getAllDatasetHealth,
  invalidateDataset,
  invalidateAllDatasets,

  getHeroes: <TData = unknown>(
    options?: DataEngineOptions,
  ) =>
    getDataset<TData>("heroes", options),

  getHeroXp: <TData = unknown>(
    options?: DataEngineOptions,
  ) =>
    getDataset<TData>("heroXp", options),

  getShards: <TData = unknown>(
    options?: DataEngineOptions,
  ) =>
    getDataset<TData>("shards", options),

  getTroops: <TData = unknown>(
    options?: DataEngineOptions,
  ) =>
    getDataset<TData>("troops", options),

  getBuildings: <TData = unknown>(
    options?: DataEngineOptions,
  ) =>
    getDataset<TData>("buildings", options),

  getTruegold: <TData = unknown>(
    options?: DataEngineOptions,
  ) =>
    getDataset<TData>("truegold", options),

  getGear: <TData = unknown>(
    options?: DataEngineOptions,
  ) =>
    getDataset<TData>("gear", options),

  getCharm: <TData = unknown>(
    options?: DataEngineOptions,
  ) =>
    getDataset<TData>("charm", options),

  getVip: <TData = unknown>(
    options?: DataEngineOptions,
  ) =>
    getDataset<TData>("vip", options),

  getEvents: <TData = unknown>(
    options?: DataEngineOptions,
  ) =>
    getDataset<TData>("events", options),

  getMasters: <TData = unknown>(
    options?: DataEngineOptions,
  ) =>
    getDataset<TData>("masters", options),

  getWarAcademy: <TData = unknown>(
    options?: DataEngineOptions,
  ) =>
    getDataset<TData>(
      "warAcademy",
      options,
    ),

  getKvk: <TData = unknown>(
    options?: DataEngineOptions,
  ) =>
    getDataset<TData>("kvk", options),
};