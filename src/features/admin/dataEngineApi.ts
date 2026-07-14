export type DatasetKey =
  | "heroes"
  | "hero-xp"
  | "shards"
  | "gear"
  | "charm"
  | "troops"
  | "buildings"
  | "truegold"
  | "war-academy"
  | "vip"
  | "events"
  | "masters"
  | "kvk";

export interface DatasetSourceMetadata {
  dataset?: string;
  title?: string;
  description?: string;
  canonical?: string;
  updated?: string;
  verified?: string;
  accuracyScore?: number;
  license?: string;
  provenance?: unknown;
}

export interface DatasetLoadResult {
  dataset: DatasetKey;
  sourceUrl: string;
  fetchedAt: string;
  httpStatus: number;
  payloadHash: string;
  metadata: DatasetSourceMetadata | null;
  recordCount: number;
  records: unknown[];
}

interface DatasetSuccessResponse {
  status: "success";
  data: DatasetLoadResult;
}

interface DatasetErrorResponse {
  status: "error";
  message: string;
}

type DatasetResponse =
  | DatasetSuccessResponse
  | DatasetErrorResponse;

export async function fetchDataset(
  dataset: DatasetKey,
  signal?: AbortSignal,
): Promise<DatasetLoadResult> {
  const response = await fetch(
    `/api/data-engine/dataset?dataset=${encodeURIComponent(dataset)}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal,
    },
  );

  const payload =
    (await response.json()) as DatasetResponse;

  if (
    !response.ok ||
    payload.status !== "success"
  ) {
    const message =
      payload.status === "error"
        ? payload.message
        : `Dataset request failed with status ${response.status}.`;

    throw new Error(message);
  }

  return payload.data;
}