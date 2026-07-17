import type {
  DatasetKey,
  DatasetLoaderResult,
  DatasetMeta,
  DatasetSource,
} from "./types";
import { DataEngineError } from "./types";

const DATASET_QUERY_KEYS: Record<DatasetKey, string> = {
  heroes: "heroes",
  heroXp: "hero-xp",
  shards: "shards",
  troops: "troops",
  buildings: "buildings",
  truegold: "truegold",
  gear: "gear",
  charm: "charm",
  vip: "vip",
  events: "events",
  masters: "masters",
  warAcademy: "war-academy",
  kvk: "kvk",
};

interface RawDatasetResponse {
  status?: string;
  dataset?: string;
  source?: DatasetSource;
  data?: unknown;
  payload?: unknown;
  meta?: DatasetMeta;
  metadata?: DatasetMeta;
  _meta?: DatasetMeta;
  fetchedAt?: string;
  loadedAt?: string;
  message?: string;
  error?: unknown;
  [key: string]: unknown;
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null
  );
}

function normaliseErrorMessage(
  value: unknown,
  fallback: string,
): string {
  if (typeof value === "string") {
    return value;
  }

  if (value instanceof Error) {
    return value.message;
  }

  if (isRecord(value)) {
    const possibleMessage =
      value.message ?? value.error ?? value.detail;

    if (typeof possibleMessage === "string") {
      return possibleMessage;
    }

    try {
      return JSON.stringify(value);
    } catch {
      return fallback;
    }
  }

  return fallback;
}

function extractDatasetData(
  response: RawDatasetResponse,
): unknown {
  if (response.data !== undefined) {
    return response.data;
  }

  if (response.payload !== undefined) {
    return response.payload;
  }

  const {
    status: _status,
    dataset: _dataset,
    source: _source,
    meta: _meta,
    metadata: _metadata,
    _meta: _documentMeta,
    fetchedAt: _fetchedAt,
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

  if (isRecord(response.metadata)) {
    return response.metadata as DatasetMeta;
  }

  if (isRecord(response._meta)) {
    return response._meta as DatasetMeta;
  }

  return null;
}

async function readResponseBody(
  response: Response,
): Promise<RawDatasetResponse> {
  const contentType =
    response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    const text = await response.text();

    throw new Error(
      text ||
        `The server returned ${response.status} ${response.statusText}.`,
    );
  }

  return (await response.json()) as RawDatasetResponse;
}

export async function loadDataset<
  TData = unknown,
>(
  key: DatasetKey,
  signal?: AbortSignal,
): Promise<DatasetLoaderResult<TData>> {
  const dataset = DATASET_QUERY_KEYS[key];

  const endpoint =
    `/api/data-engine/dataset?dataset=` +
    encodeURIComponent(dataset);

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
      signal,
    });

    const body = await readResponseBody(response);

    if (!response.ok) {
      throw new DataEngineError(
        key,
        normaliseErrorMessage(
          body.message ?? body.error,
          `Request failed with status ${response.status}.`,
        ),
      );
    }

    if (
      body.status === "error" ||
      body.status === "fail"
    ) {
      throw new DataEngineError(
        key,
        normaliseErrorMessage(
          body.message ?? body.error,
          `The ${dataset} dataset request failed.`,
        ),
      );
    }

    const extractedData = extractDatasetData(body);
    const data = (
      isRecord(extractedData) && Array.isArray(extractedData.records)
        ? extractedData.records
        : extractedData
    ) as TData;

    if (
      data === undefined ||
      data === null
    ) {
      throw new DataEngineError(
        key,
        `The ${dataset} preview returned no dataset data.`,
      );
    }

    return {
      key,
      data,
      meta: extractDatasetMeta(body),
      source: body.source ?? "remote",
      loadedAt:
        body.loadedAt ??
        body.fetchedAt ??
        new Date().toISOString(),
    };
  } catch (error) {
    if (error instanceof DataEngineError) {
      throw error;
    }

    if (
      error instanceof DOMException &&
      error.name === "AbortError"
    ) {
      throw new DataEngineError(
        key,
        `Loading the ${dataset} dataset was cancelled.`,
        error,
      );
    }

    throw new DataEngineError(
      key,
      normaliseErrorMessage(
        error,
        `Unable to load the ${dataset} dataset.`,
      ),
      error,
    );
  }
}

export function getDatasetEndpoint(
  key: DatasetKey,
): string {
  const dataset = DATASET_QUERY_KEYS[key];

  return (
    `/api/data-engine/dataset?dataset=` +
    encodeURIComponent(dataset)
  );
}
