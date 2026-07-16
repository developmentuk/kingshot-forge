import type {
  DatasetImporter,
  DatasetSourceMetadata,
  NormalisedDataset,
} from "../../../../shared/data-engine/types.js";

import type {
  EventSourcePayload,
  EventSourceRecord,
  NormalisedEventRecord,
} from "./types.js";

const EVENTS_SOURCE_URL =
  "https://kingshotpro.com/data/events.json";

function isObject(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function readString(
  ...values: unknown[]
): string | null {
  for (const value of values) {
    if (
      typeof value === "string" &&
      value.trim().length > 0
    ) {
      return value.trim();
    }
  }

  return null;
}

function readNumber(
  ...values: unknown[]
): number | null {
  for (const value of values) {
    if (
      typeof value === "number" &&
      Number.isFinite(value)
    ) {
      return value;
    }

    if (
      typeof value === "string" &&
      value.trim() !== ""
    ) {
      const parsed = Number(value);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function createSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseMetadata(
  value: unknown,
): DatasetSourceMetadata | null {
  if (!isObject(value)) {
    return null;
  }

  return {
    dataset:
      readString(value.dataset) ?? undefined,

    title:
      readString(value.title) ?? undefined,

    description:
      readString(value.description) ??
      undefined,

    canonical:
      readString(value.canonical) ??
      undefined,

    updated:
      readString(value.updated) ?? undefined,

    verified:
      readString(value.verified) ?? undefined,

    accuracyScore:
      readNumber(value.accuracyScore) ??
      undefined,

    license:
      readString(value.license) ?? undefined,

    provenance: value.provenance,
  };
}

function parsePayload(
  payload: unknown,
): EventSourcePayload {
  if (!isObject(payload)) {
    throw new Error(
      "Events source payload must be a JSON object.",
    );
  }

  if (!Array.isArray(payload.events)) {
    throw new Error(
      "Events source payload must contain an events array.",
    );
  }

  return {
    _meta: payload._meta,
    events: payload.events,
  };
}

function normaliseEvent(
  value: unknown,
  metadata: DatasetSourceMetadata | null,
): NormalisedEventRecord {
  if (!isObject(value)) {
    throw new Error(
      "Event record must be a JSON object.",
    );
  }

  const event =
    value as EventSourceRecord;

  const name = readString(event.name);

  if (!name) {
    throw new Error(
      "Event record is missing a valid name.",
    );
  }

  const slug =
    readString(event.slug) ??
    createSlug(name);

  if (!slug) {
    throw new Error(
      `Unable to create a slug for event "${name}".`,
    );
  }

  return {
    name,
    slug,

    schedule:
      readString(event.schedule),

    recur_every_hours:
      readNumber(
        event.recur_every_hours,
        event.recurEveryHours,
      ),

    is_active: true,

    source_updated_at:
      metadata?.updated ?? null,

    source_verified:
      metadata?.verified ?? null,

    source_accuracy_score:
      metadata?.accuracyScore ?? null,

    source_name: "KingshotPro",

    source_url:
      metadata?.canonical ??
      EVENTS_SOURCE_URL,
  };
}

function normalisePayload(
  payload: EventSourcePayload,
): NormalisedDataset<NormalisedEventRecord> {
  const metadata =
    parseMetadata(payload._meta);

  const records =
    payload.events.map((event) =>
      normaliseEvent(event, metadata),
    );

  return {
    metadata,
    records,
  };
}

export const eventsImporter:
  DatasetImporter<
    EventSourcePayload,
    NormalisedEventRecord
  > = {
    key: "events",

    sourceUrl: EVENTS_SOURCE_URL,

    parsePayload,

    normalisePayload,

    getRecordKey(record) {
      return record.slug;
    },
  };