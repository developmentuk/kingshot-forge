import type {
  DatasetKey,
  DatasetLoaderResult,
  DatasetMeta,
  DatasetSource,
} from "./types";
import { DataEngineError } from "./types";

const DATASET_ENDPOINTS: Record<DatasetKey, string> = {
  heroes: "/api/data-engine/heroes",
  heroXp: "/api/data-engine/hero-xp",
  shards: "/api/data-engine/shards",
  troops: "/api/data-engine/troops",
  buildings: "/api/data-engine/buildings",
  truegold: "/api/data-engine/truegold",
  gear: "/api/data-engine/gear",
  charm: "/api/data-engine/charm",
  vip: "/api/data-engine/vip",
  events: "/api/data-engine/events",
  masters: "/api/data-engine/masters",
  warAcademy: "/api/data-engine/war-academy",
  kvk: "/api/data-engine/kvk",
};

interface RawDatasetResponse {
  status?: string;
  dataset?: string;
  source?: DatasetSource;
  data?: unknown;
  meta?: DatasetMeta;
  _meta?: DatasetMeta;
  loadedAt?: string;
  message?: string;
  error?: string;
  [key: string]: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractDatasetData(response: RawDatasetResponse): unknown {
  if ("data" in response && response.data !== undefined) {
    return response.data;
  }

  const {
    status: _status,
    dataset: _dataset,
    source: _source,
    meta: _meta,
    _meta: _documentMeta,
    loadedAt: _loadedAt,
    message: _message,
    error: _error,
    ...remainingData
  } = response;

  return remainingData;
}

function extractDatasetMeta(
  response: RawDatasetResponse,
): DatasetMeta | null {
  if (isRecord(response.meta)) {
    return response.meta as DatasetMeta;
  }

  if (isRecord(response._meta)) {
    return response._meta as DatasetMeta;
  }

  return null;
}

export async function loadDataset<TData = unknown>(
  key: DatasetKey,
  signal?: AbortSignal,
): Promise<DatasetLoaderResult<TData>> {
  const endpoint = DATASET_ENDPOINTS[key];

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
      signal,
    });

    const body = (await response.json()) as RawDatasetResponse;

    if (!response.ok) {
      const message =
        body.message ??
        body.error ??
        `Request failed with status ${response.status}.`;

      throw new DataEngineError(key, message);
    }

    if (body.status === "error" || body.status === "fail") {
      throw new DataEngineError(
        key,
        body.message ?? body.error ?? "The dataset request failed.",
      );
    }

    const data = extractDatasetData(body) as TData;

    if (data === undefined || data === null) {
      throw new DataEngineError(
        key,
        `The ${key} endpoint returned no dataset data.`,
      );
    }

    return {
      key,
      data,
      meta: extractDatasetMeta(body),
      source: body.source ?? "remote",
      loadedAt: body.loadedAt ?? new Date().toISOString(),
    };
  } catch (error) {
    if (error instanceof DataEngineError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new DataEngineError(
        key,
        `Loading the ${key} dataset was cancelled.`,
        error,
      );
    }

    throw new DataEngineError(
      key,
      `Unable to load the ${key} dataset.`,
      error,
    );
  }
}

export function getDatasetEndpoint(key: DatasetKey): string {
  return DATASET_ENDPOINTS[key];
}