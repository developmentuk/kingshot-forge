import type {
  DatasetLoadResult,
  DatasetKey,
} from "./dataEngineApi";

import type {
  DatasetBrowserDefinition,
  DatasetCellValue,
  DatasetTableRow,
} from "./datasetBrowserTypes";

import type {
  RecordEditorRecord,
} from "./recordEditor/recordEditorSchema";

export interface DatasetAdapter {
  datasetId: DatasetKey;

  createBrowserDefinition(
    result: DatasetLoadResult,
  ): DatasetBrowserDefinition;

  createEditorRecord?: (
    result: DatasetLoadResult,
    rowId: string,
  ) => RecordEditorRecord | null;
}

export function toCellValue(
  value: unknown,
): DatasetCellValue {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  return null;
}

export function toTitleCase(
  value: unknown,
): string {
  return String(value ?? "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

export function createSlugId(
  value: string,
  fallback: string,
): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || fallback;
}

export function createRowsFromRecords(
  records: unknown[],
  mapper: (
    record: Record<string, unknown>,
    index: number,
  ) => DatasetTableRow,
): DatasetTableRow[] {
  return records.map((record, index) =>
    mapper(
      record as Record<string, unknown>,
      index,
    ),
  );
}

export function isRecordObject(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

export function readStringValue(
  value: unknown,
): string | null {
  if (
    typeof value !== "string"
  ) {
    return null;
  }

  const trimmedValue =
    value.trim();

  return trimmedValue.length > 0
    ? trimmedValue
    : null;
}

export function readNumberValue(
  value: unknown,
): number | null {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  if (
    typeof value === "string" &&
    value.trim().length > 0
  ) {
    const parsedValue =
      Number(value);

    if (
      Number.isFinite(
        parsedValue,
      )
    ) {
      return parsedValue;
    }
  }

  return null;
}