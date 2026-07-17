import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import type {
  PublicationExecutionResult,
  PublicationQueueItem,
} from "../../index.js";

interface AtomicPublicationResponse {
  publishedVersionId: string;
  publishedVersion: number;
  completedAt: string;
}

interface CompletedQueueRow {
  status: string;
  completed_at: string | null;
  metadata: Record<string, unknown> | null;
}

export interface SupabaseAtomicPublicationRepositoryOptions {
  now?: () => string;
  createId?: () => string;
}

function defaultNow(): string {
  return new Date().toISOString();
}

function defaultCreateId(): string {
  return crypto.randomUUID();
}

function readResponse(
  value: unknown,
): AtomicPublicationResponse | null {
  if (
    typeof value !== "object" ||
    value === null ||
    !("publishedVersionId" in value) ||
    !("publishedVersion" in value) ||
    !("completedAt" in value) ||
    typeof value.publishedVersionId !== "string" ||
    typeof value.publishedVersion !== "number" ||
    typeof value.completedAt !== "string"
  ) {
    return null;
  }

  return {
    publishedVersionId:
      value.publishedVersionId,
    publishedVersion:
      value.publishedVersion,
    completedAt: value.completedAt,
  };
}

export class SupabaseAtomicPublicationRepository {
  private readonly client: SupabaseClient;
  private readonly now: () => string;
  private readonly createId: () => string;

  constructor(
    client: SupabaseClient,
    options: SupabaseAtomicPublicationRepositoryOptions = {},
  ) {
    this.client = client;
    this.now = options.now ?? defaultNow;
    this.createId =
      options.createId ?? defaultCreateId;
  }

  async publish(
    item: PublicationQueueItem,
  ): Promise<PublicationExecutionResult> {
    const occurredAt = this.now();
    const publishedVersionId = this.createId();
    const auditEventId = this.createId();
    const { data, error } = await this.client.rpc(
      "publish_editorial_queue_item",
      {
        p_queue_item_id: item.id,
        p_actor_id: item.requestedBy,
        p_published_version_id:
          publishedVersionId,
        p_audit_event_id: auditEventId,
        p_occurred_at: occurredAt,
      },
    );

    if (error) {
      const recovered =
        await this.recoverCompletedResult(item.id);

      if (recovered) {
        return recovered;
      }

      throw new Error(
        `Atomic editorial publication failed: ${error.message}`,
      );
    }

    const response = readResponse(data);

    if (!response) {
      throw new Error(
        "Atomic editorial publication returned an invalid response.",
      );
    }

    return {
      publishedVersionId:
        response.publishedVersionId,
      queueOutcomeCommitted: true,
      metadata: {
        publishedVersion:
          response.publishedVersion,
        completedAt: response.completedAt,
      },
    };
  }

  private async recoverCompletedResult(
    itemId: string,
  ): Promise<PublicationExecutionResult | null> {
    const { data } = await this.client
      .from("publication_queue")
      .select("status, completed_at, metadata")
      .eq("id", itemId)
      .maybeSingle();
    const row = data as CompletedQueueRow | null;
    const publishedVersionId =
      row?.metadata?.publishedVersionId;

    if (
      row?.status !== "completed" ||
      typeof publishedVersionId !== "string"
    ) {
      return null;
    }

    return {
      publishedVersionId,
      queueOutcomeCommitted: true,
      metadata: {
        completedAt: row.completed_at,
        recoveredAfterAmbiguousResponse: true,
      },
    };
  }
}
