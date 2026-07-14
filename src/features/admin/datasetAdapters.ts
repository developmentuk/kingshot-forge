import type {
  DatasetLoadResult,
  DatasetKey,
} from "./dataEngineApi";

import type {
  DatasetBrowserDefinition,
  DatasetCellValue,
  DatasetTableRow,
} from "./datasetBrowserTypes";

export interface DatasetAdapter {
  datasetId: DatasetKey;

  createBrowserDefinition(
    result: DatasetLoadResult,
  ): DatasetBrowserDefinition;
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
