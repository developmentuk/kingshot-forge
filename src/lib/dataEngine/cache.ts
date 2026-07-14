import type {
  DatasetCacheEntry,
  DatasetKey,
} from "./types";

const DEFAULT_CACHE_DURATION_MS = 5 * 60 * 1000;

const cache = new Map<DatasetKey, DatasetCacheEntry>();

export function getCachedDataset<TData>(
  key: DatasetKey,
): TData | null {
  const entry = cache.get(key);

  if (!entry) {
    return null;
  }

  if (Date.now() >= entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  return entry.data as TData;
}

export function setCachedDataset<TData>(
  key: DatasetKey,
  data: TData,
  cacheDurationMs = DEFAULT_CACHE_DURATION_MS,
): void {
  const loadedAt = Date.now();

  cache.set(key, {
    data,
    loadedAt,
    expiresAt: loadedAt + cacheDurationMs,
  });
}

export function removeCachedDataset(key: DatasetKey): void {
  cache.delete(key);
}

export function clearDatasetCache(): void {
  cache.clear();
}

export function hasCachedDataset(key: DatasetKey): boolean {
  return getCachedDataset(key) !== null;
}

export function getDatasetCacheInfo(
  key: DatasetKey,
): DatasetCacheEntry | null {
  return cache.get(key) ?? null;
}