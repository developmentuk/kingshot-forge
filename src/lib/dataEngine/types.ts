export const DATASET_KEYS = [
  "heroes",
  "heroXp",
  "shards",
  "troops",
  "buildings",
  "truegold",
  "gear",
  "charm",
  "vip",
  "events",
  "masters",
  "warAcademy",
  "kvk",
] as const;

export type DatasetKey = (typeof DATASET_KEYS)[number];

export type DatasetSource = "local" | "remote" | "database";

export interface DatasetMeta {
  dataset?: string;
  title?: string;
  description?: string;
  count?: number;
  updated?: string;
  verified?: string;
  canonical?: string;
  license?: string;
  accuracyScore?: number;
  [key: string]: unknown;
}

export interface DatasetDocument<TData = unknown> {
  _meta?: DatasetMeta;
  data: TData;
}

export interface DatasetHealth {
  key: DatasetKey;
  available: boolean;
  source: DatasetSource;
  recordCount: number | null;
  loadedAt: string | null;
  updatedAt: string | null;
  error: string | null;
}

export interface DatasetCacheEntry<TData = unknown> {
  data: TData;
  loadedAt: number;
  expiresAt: number;
}

export interface DatasetLoaderResult<TData = unknown> {
  key: DatasetKey;
  data: TData;
  meta: DatasetMeta | null;
  source: DatasetSource;
  loadedAt: string;
}

export interface DataEngineOptions {
  cacheDurationMs?: number;
  forceRefresh?: boolean;
}

export class DataEngineError extends Error {
  public readonly dataset: DatasetKey;
  public readonly cause?: unknown;

  constructor(dataset: DatasetKey, message: string, cause?: unknown) {
    super(message);
    this.name = "DataEngineError";
    this.dataset = dataset;
    this.cause = cause;
  }
}