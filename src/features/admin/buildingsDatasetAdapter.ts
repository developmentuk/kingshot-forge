import type {
  DatasetLoadResult,
} from "./dataEngineApi";

import type {
  DatasetBrowserDefinition,
} from "./datasetBrowserTypes";

import {
  toRecordEditorValue,
  type RecordEditorRecord,
} from "./recordEditor/recordEditorSchema";

import {
  createRowsFromRecords,
  isRecordObject,
  readNumberValue,
  readStringValue,
  toCellValue,
  type DatasetAdapter,
} from "./datasetAdapters";

function getBuildingKey(record: Record<string, unknown>): string | null {
  return readStringValue(record.building_key);
}

function createBuildingEditorRecord(
  record: Record<string, unknown>,
): RecordEditorRecord {
  const key = getBuildingKey(record);
  if (!key) throw new Error("Published Buildings record is missing building_key.");
  const progression = Array.isArray(record.progression) ? record.progression : [];
  const costs = progression.flatMap((row) => {
    if (!isRecordObject(row)) return [];
    const standardLevel = readNumberValue(row.base_level);
    if (standardLevel === null || !Number.isInteger(standardLevel) || standardLevel < 1) return [];
    return [[
      standardLevel,
      readNumberValue(row.bread) ?? 0,
      readNumberValue(row.wood) ?? 0,
      readNumberValue(row.stone) ?? 0,
      readNumberValue(row.iron) ?? 0,
      readNumberValue(row.truegold) ?? 0,
      readNumberValue(row.upgrade_time_seconds) ?? 0,
    ]];
  });

  return {
    id: key,
    values: {
      key,
      name: readStringValue(record.building_name) ?? "",

      maxLevel:
        readNumberValue(
          record.standard_max_level,
        ),

      source:
        readStringValue(
          record.source_url,
        ) ?? "",

      note:
        readStringValue(
          record.verification_note,
        ) ?? "",

      costs:
        toRecordEditorValue(
          costs,
        ),

      isActive:
        typeof record.is_active ===
        "boolean"
          ? record.is_active
          : true,

      sourceUpdated:
        readStringValue(
          record.updated_at,
        ),

      sourceVerified:
        readStringValue(
          record.verification_status,
        ),

      sourceAccuracyScore:
        null,

      sourceName:
        readStringValue(
          record.source_name,
        ),

      sourceUrl:
        readStringValue(
          record.source_url,
        ),

      progression: toRecordEditorValue(progression),
    },
  };
}

export const buildingsDatasetAdapter:
  DatasetAdapter = {
    datasetId: "buildings",

    createBrowserDefinition(
      result: DatasetLoadResult,
    ): DatasetBrowserDefinition {
      const canonicalRecords = result.records.filter((value): value is Record<string, unknown> => isRecordObject(value) && Boolean(getBuildingKey(value)) && Boolean(readStringValue(value.building_name)));
      const rows =
        createRowsFromRecords(
          canonicalRecords,
          (building) => {
            const key = getBuildingKey(building);
            const name = readStringValue(building.building_name);
            if (!key || !name) throw new Error("Published Buildings record is missing canonical identity fields.");
            const progression = Array.isArray(building.progression) ? building.progression : [];

            return {
              id: key,

              values: {
                name,
                key,

                maxLevel: toCellValue(building.standard_max_level),

                upgradeRows: progression.length,

                confidence:
                  toCellValue(
                  building.verification_note,
                  ),

                active:
                  toCellValue(
                  building.editorial_status,
                  ),

                sourceUpdated:
                  toCellValue(
                  building.updated_at,
                  ),
              },
            };
          },
        );

      return {
        datasetId:
          "buildings",

        columns: [
          {
            key: "name",
            label: "Building",
            sortable: true,
            width: "220px",
          },
          {
            key: "key",
            label: "Key",
            sortable: true,
            width: "160px",
          },
          {
            key: "maxLevel",
            label: "Max level",
            sortable: true,
            width: "100px",
          },
          {
            key: "upgradeRows",
            label: "Upgrade rows",
            sortable: true,
            width: "120px",
          },
          {
            key: "confidence",
            label: "Confidence",
            sortable: true,
            width: "110px",
          },
          {
            key: "active",
            label: "Active",
            sortable: true,
            width: "90px",
          },
          {
            key: "sourceUpdated",
            label: "Source updated",
            sortable: true,
            width: "140px",
          },
        ],

        rows,
      };
    },

    createEditorRecord(
      result: DatasetLoadResult,
      rowId: string,
    ): RecordEditorRecord | null {
      for (
        let index = 0;
        index <
        result.records.length;
        index += 1
      ) {
        const value =
          result.records[index];

        if (
          !isRecordObject(value)
        ) {
          continue;
        }

        const recordId = getBuildingKey(value);

        if (recordId !== rowId) {
          continue;
        }

        return createBuildingEditorRecord(
          value,
        );
      }

      return null;
    },
  };
