import type {
  EditorialHistoryResult,
  EditorialRecordHead,
  EditorialRecordVersion,
  PublicationQueueItem,
  ScheduledPublication,
} from "../../../platform";

import {
  supabase,
} from "../../../lib/supabase";

export type EditorialApiAction =
  | "save_draft"
  | "submit_for_review"
  | "return_to_draft"
  | "approve"
  | "reject"
  | "queue_publish"
  | "archive"
  | "restore"
  | "rollback"
  | "schedule_publish"
  | "retry_queue"
  | "cancel_queue"
  | "cancel_schedule"
  | "process_queue";

export interface EditorialRecordState {
  head: EditorialRecordHead | null;
  currentVersion:
    | EditorialRecordVersion
    | null;
  history: Pick<
    EditorialHistoryResult,
    "entries" | "totalVersions"
  >;
  queueItems: PublicationQueueItem[];
  schedules: ScheduledPublication[];
}

interface EditorialApiResponse<T> {
  status: "success" | "error";
  data?: T;
  message?: string;
  issues?: Array<{
    message: string;
    fieldId?: string;
  }>;
}

async function getAccessToken():
Promise<string> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw new Error(error.message);
  }

  if (!session?.access_token) {
    throw new Error(
      "You must be signed in to use the editorial workflow.",
    );
  }

  return session.access_token;
}

async function request<T>(
  url: string,
  init: RequestInit = {},
): Promise<T> {
  const token = await getAccessToken();

  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "Cache-Control": "no-store",
      ...init.headers,
    },
  });

  const payload =
    await response.json() as
      EditorialApiResponse<T>;

  if (
    !response.ok ||
    payload.status !== "success" ||
    payload.data === undefined
  ) {
    const issueSummary = payload.issues
      ?.map((issue) =>
        issue.fieldId
          ? `${issue.fieldId}: ${issue.message}`
          : issue.message,
      )
      .join(" ");

    throw new Error(
      issueSummary ||
        payload.message ||
        "The editorial request failed.",
    );
  }

  return payload.data;
}

export function fetchEditorialRecordState(
  datasetId: string,
  recordId: string,
  signal?: AbortSignal,
): Promise<EditorialRecordState> {
  const query = new URLSearchParams({
    datasetId,
    recordId,
    cacheBust: Date.now().toString(),
  });

  return request<EditorialRecordState>(
    `/api/editorial/record?${query.toString()}`,
    { signal },
  );
}

function prepareEditorialInput(
  action: EditorialApiAction,
  input: Record<string, unknown>,
): Record<string, unknown> | null {
  if (action !== "reject") {
    return input;
  }

  const existingNote =
    typeof input.note === "string"
      ? input.note.trim()
      : "";

  if (existingNote) {
    return {
      ...input,
      note: existingNote,
    };
  }

  const reason = window.prompt(
    "Why are changes being requested? This reason will be recorded in the immutable history.",
  );

  if (reason === null) {
    return null;
  }

  const trimmedReason = reason.trim();

  if (!trimmedReason) {
    throw new Error(
      "A reason is required when requesting changes.",
    );
  }

  return {
    ...input,
    note: trimmedReason,
  };
}

export function runEditorialAction<T>(
  action: EditorialApiAction,
  input: Record<string, unknown>,
): Promise<T> {
  const preparedInput = prepareEditorialInput(
    action,
    input,
  );

  if (preparedInput === null) {
    return Promise.reject(
      new Error("Request changes was cancelled."),
    );
  }

  return request<T>(
    "/api/editorial/action",
    {
      method: "POST",
      body: JSON.stringify({
        action,
        ...preparedInput,
      }),
    },
  );
}
