import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import type {
  PublicationQueueFilter,
  PublicationQueueItem,
  PublicationQueueRepository,
} from "../../index.js";

import {
  mapQueueRow,
  toQueueRow,
  type PublicationQueueRow,
} from "./mappers.js";

export class SupabasePublicationQueueRepository
implements PublicationQueueRepository {
  private readonly client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  async get(
    itemId: string,
  ): Promise<PublicationQueueItem | undefined> {
    const { data, error } = await this.client
      .from("publication_queue")
      .select("*")
      .eq("id", itemId)
      .maybeSingle();

    if (error) {
      throw new Error(
        `Unable to load publication queue item: ${error.message}`,
      );
    }

    return data
      ? mapQueueRow(data as PublicationQueueRow)
      : undefined;
  }

  async list(
    filter: PublicationQueueFilter = {},
  ): Promise<PublicationQueueItem[]> {
    let query = this.client
      .from("publication_queue")
      .select("*");

    if (filter.datasetId) {
      query = query.eq(
        "dataset_id",
        filter.datasetId,
      );
    }

    if (filter.recordId) {
      query = query.eq(
        "record_id",
        filter.recordId,
      );
    }

    if (filter.requestedBy) {
      query = query.eq(
        "requested_by",
        filter.requestedBy,
      );
    }

    if (filter.status) {
      query = query.eq(
        "status",
        filter.status,
      );
    }

    const { data, error } = await query.order(
      "requested_at",
      { ascending: true },
    );

    if (error) {
      throw new Error(
        `Unable to list publication queue: ${error.message}`,
      );
    }

    return ((data ?? []) as PublicationQueueRow[])
      .map(mapQueueRow);
  }

  async create(
    item: PublicationQueueItem,
  ): Promise<void> {
    const { error } = await this.client
      .from("publication_queue")
      .insert(toQueueRow(item));

    if (error) {
      throw new Error(
        `Unable to create publication queue item: ${error.message}`,
      );
    }
  }

  async update(
    item: PublicationQueueItem,
    expectedStatus: PublicationQueueItem["status"],
  ): Promise<void> {
    const { data, error } = await this.client
      .from("publication_queue")
      .update(toQueueRow(item))
      .eq("id", item.id)
      .eq("status", expectedStatus)
      .select("id")
      .maybeSingle();

    if (error) {
      throw new Error(
        `Unable to update publication queue item: ${error.message}`,
      );
    }

    if (!data) {
      throw new Error(
        `Publication queue item "${item.id}" changed before it could be updated.`,
      );
    }
  }

  async findActiveForVersion(
    versionId: string,
  ): Promise<PublicationQueueItem | undefined> {
    const { data, error } = await this.client
      .from("publication_queue")
      .select("*")
      .eq("version_id", versionId)
      .in("status", ["pending", "processing"])
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(
        `Unable to check active publication requests: ${error.message}`,
      );
    }

    return data
      ? mapQueueRow(data as PublicationQueueRow)
      : undefined;
  }
}
