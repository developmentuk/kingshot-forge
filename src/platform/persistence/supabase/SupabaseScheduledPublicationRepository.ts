import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import type {
  ScheduledPublication,
  ScheduledPublicationFilter,
  ScheduledPublicationRepository,
} from "../../index";

import {
  mapScheduleRow,
  toScheduleRow,
  type ScheduledPublicationRow,
} from "./mappers";

export class SupabaseScheduledPublicationRepository
implements ScheduledPublicationRepository {
  private readonly client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  async get(
    scheduleId: string,
  ): Promise<ScheduledPublication | undefined> {
    const { data, error } = await this.client
      .from("scheduled_publications")
      .select("*")
      .eq("id", scheduleId)
      .maybeSingle();

    if (error) {
      throw new Error(
        `Unable to load scheduled publication: ${error.message}`,
      );
    }

    return data
      ? mapScheduleRow(
          data as ScheduledPublicationRow,
        )
      : undefined;
  }

  async list(
    filter: ScheduledPublicationFilter = {},
  ): Promise<ScheduledPublication[]> {
    let query = this.client
      .from("scheduled_publications")
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

    if (filter.createdBy) {
      query = query.eq(
        "created_by",
        filter.createdBy,
      );
    }

    if (filter.status) {
      query = query.eq(
        "status",
        filter.status,
      );
    }

    if (filter.dueBefore) {
      query = query.lte(
        "scheduled_for",
        filter.dueBefore,
      );
    }

    const { data, error } = await query.order(
      "scheduled_for",
      { ascending: true },
    );

    if (error) {
      throw new Error(
        `Unable to list scheduled publications: ${error.message}`,
      );
    }

    return (
      (data ?? []) as ScheduledPublicationRow[]
    ).map(mapScheduleRow);
  }

  async create(
    schedule: ScheduledPublication,
  ): Promise<void> {
    const { error } = await this.client
      .from("scheduled_publications")
      .insert(toScheduleRow(schedule));

    if (error) {
      throw new Error(
        `Unable to create scheduled publication: ${error.message}`,
      );
    }
  }

  async update(
    schedule: ScheduledPublication,
    expectedStatus: ScheduledPublication["status"],
  ): Promise<void> {
    const { data, error } = await this.client
      .from("scheduled_publications")
      .update(toScheduleRow(schedule))
      .eq("id", schedule.id)
      .eq("status", expectedStatus)
      .select("id")
      .maybeSingle();

    if (error) {
      throw new Error(
        `Unable to update scheduled publication: ${error.message}`,
      );
    }

    if (!data) {
      throw new Error(
        `Scheduled publication "${schedule.id}" changed before it could be updated.`,
      );
    }
  }

  async findActiveForVersion(
    versionId: string,
  ): Promise<ScheduledPublication | undefined> {
    const { data, error } = await this.client
      .from("scheduled_publications")
      .select("*")
      .eq("version_id", versionId)
      .eq("status", "scheduled")
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(
        `Unable to check active schedules: ${error.message}`,
      );
    }

    return data
      ? mapScheduleRow(
          data as ScheduledPublicationRow,
        )
      : undefined;
  }
}
