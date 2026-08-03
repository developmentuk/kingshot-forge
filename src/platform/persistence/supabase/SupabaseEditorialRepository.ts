import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import type {
  EditorialAuditEvent,
  EditorialRecordHead,
  EditorialRecordVersion,
  EditorialRepository,
} from "../../index.js";

import {
  mapAuditRow,
  mapHeadRow,
  mapVersionRow,
  toAuditRow,
  toVersionRow,
  type EditorialAuditRow,
  type EditorialHeadRow,
  type EditorialVersionRow,
} from "./mappers.js";

function requireData<T>(
  data: T | null,
  error: { message: string } | null,
  operation: string,
): T {
  if (error) {
    throw new Error(
      `${operation} failed: ${error.message}`,
    );
  }

  if (data === null) {
    throw new Error(
      `${operation} returned no data.`,
    );
  }

  return data;
}

function readRollbackTargetVersionId(
  auditEvent: EditorialAuditEvent,
): string | null {
  if (auditEvent.action !== "rolled_back") {
    return null;
  }

  const targetVersionId =
    auditEvent.metadata?.rolledBackToVersionId;

  if (
    typeof targetVersionId !== "string" ||
    targetVersionId.trim().length === 0
  ) {
    throw new Error(
      "Atomic editorial rollback requires the target version ID in immutable audit metadata.",
    );
  }

  return targetVersionId.trim();
}

export class SupabaseEditorialRepository
implements EditorialRepository {
  private readonly client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  async getHead(
    datasetId: string,
    recordId: string,
  ): Promise<EditorialRecordHead | undefined> {
    const { data, error } = await this.client
      .from("editorial_record_heads")
      .select("*")
      .eq("dataset_id", datasetId)
      .eq("record_id", recordId)
      .maybeSingle();

    if (error) {
      throw new Error(
        `Unable to load editorial head: ${error.message}`,
      );
    }

    return data
      ? mapHeadRow(data as EditorialHeadRow)
      : undefined;
  }

  async getVersion(
    versionId: string,
  ): Promise<EditorialRecordVersion | undefined> {
    const { data, error } = await this.client
      .from("editorial_record_versions")
      .select("*")
      .eq("id", versionId)
      .maybeSingle();

    if (error) {
      throw new Error(
        `Unable to load editorial version: ${error.message}`,
      );
    }

    return data
      ? mapVersionRow(data as EditorialVersionRow)
      : undefined;
  }

  async listVersions(
    datasetId: string,
    recordId: string,
  ): Promise<EditorialRecordVersion[]> {
    const { data, error } = await this.client
      .from("editorial_record_versions")
      .select("*")
      .eq("dataset_id", datasetId)
      .eq("record_id", recordId)
      .order("version", { ascending: true });

    if (error) {
      throw new Error(
        `Unable to list editorial versions: ${error.message}`,
      );
    }

    return ((data ?? []) as EditorialVersionRow[])
      .map(mapVersionRow);
  }

  async listAuditEvents(
    datasetId: string,
    recordId: string,
  ): Promise<EditorialAuditEvent[]> {
    const { data, error } = await this.client
      .from("editorial_audit_events")
      .select("*")
      .eq("dataset_id", datasetId)
      .eq("record_id", recordId)
      .order("occurred_at", { ascending: true });

    if (error) {
      throw new Error(
        `Unable to list editorial audit events: ${error.message}`,
      );
    }

    return ((data ?? []) as EditorialAuditRow[])
      .map(mapAuditRow);
  }

  async commitVersion(
    head: EditorialRecordHead,
    version: EditorialRecordVersion,
    auditEvent: EditorialAuditEvent,
    expectedVersion: number | null,
  ): Promise<void> {
    const rollbackTargetVersionId =
      readRollbackTargetVersionId(auditEvent);

    if (rollbackTargetVersionId) {
      if (
        expectedVersion === null ||
        !Number.isInteger(expectedVersion) ||
        expectedVersion < 1
      ) {
        throw new Error(
          "Atomic editorial rollback requires a positive expected version.",
        );
      }

      const { data, error } = await this.client.rpc(
        "rollback_editorial_version_checked",
        {
          p_dataset_id: head.datasetId,
          p_record_id: head.recordId,
          p_target_version_id:
            rollbackTargetVersionId,
          p_actor_id: auditEvent.actorId,
          p_expected_version: expectedVersion,
          p_published_version_id: version.id,
          p_audit_event_id: auditEvent.id,
          p_occurred_at: auditEvent.occurredAt,
          p_note: auditEvent.note ?? null,
        },
      );

      requireData(
        data,
        error,
        "Atomic editorial rollback",
      );
      return;
    }

    const { data, error } = await this.client.rpc(
      "commit_editorial_version",
      {
        p_head: {
          dataset_id: head.datasetId,
          record_id: head.recordId,
          current_version: head.currentVersion,
          current_version_id: head.currentVersionId,
          status: head.status,
          updated_at: head.updatedAt,
          updated_by: head.updatedBy,
        },
        p_version: toVersionRow(version),
        p_audit_event: toAuditRow(auditEvent),
        p_expected_version: expectedVersion,
      },
    );

    requireData(
      data,
      error,
      "Editorial version commit",
    );
  }
}
