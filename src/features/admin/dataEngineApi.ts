import type {
  DatasetKey,
} from "../../../shared/data-engine/datasets";

export type {
  DatasetKey,
} from "../../../shared/data-engine/datasets";

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

function isDatasetResponse(
  value: unknown,
): value is DatasetResponse {
  if (
    typeof value !== "object" ||
    value === null ||
    !("status" in value)
  ) {
    return false;
  }

  const status = value.status;
  return status === "success" || status === "error";
}

export async function fetchDataset(
  dataset: DatasetKey,
  signal?: AbortSignal,
): Promise<DatasetLoadResult> {
  const endpoint =
    `/api/data-engine/dataset?dataset=${encodeURIComponent(dataset)}`;

  let response: Response;

  try {
    response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal,
    });
  } catch (error) {
    if (
      error instanceof DOMException &&
      error.name === "AbortError"
    ) {
      throw error;
    }

    throw new Error(
      "The local Data Engine API could not be reached. Start `vercel dev` on port 3000 alongside the Vite app, then reload this page.",
    );
  }

  const responseText = await response.text();

  if (!responseText.trim()) {
    throw new Error(
      response.ok
        ? "The Data Engine API returned an empty response. When running locally, make sure `vercel dev` is running on port 3000 alongside Vite."
        : `The Data Engine API returned an empty response with status ${response.status}.`,
    );
  }

  let parsedPayload: unknown;

  try {
    parsedPayload = JSON.parse(responseText);
  } catch {
    const contentType =
      response.headers.get("content-type") ?? "unknown";

    throw new Error(
      `The Data Engine API returned a non-JSON response (${contentType}, status ${response.status}). When running locally, make sure Vite is proxying to an active \`vercel dev\` server on port 3000.`,
    );
  }

  if (!isDatasetResponse(parsedPayload)) {
    throw new Error(
      `The Data Engine API returned an invalid response for "${dataset}".`,
    );
  }

  if (
    !response.ok ||
    parsedPayload.status !== "success"
  ) {
    const message =
      parsedPayload.status === "error"
        ? parsedPayload.message
        : `Dataset request failed with status ${response.status}.`;

    throw new Error(message);
  }

  return parsedPayload.data;
}
