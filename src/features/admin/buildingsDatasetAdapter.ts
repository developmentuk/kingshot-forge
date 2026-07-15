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
  createSlugId,
  isRecordObject,
  readNumberValue,
  readStringValue,
  toCellValue,
  type DatasetAdapter,
} from "./datasetAdapters";

function getBuildingKey(
  record: Record<string, unknown>,
  index: number,
): string {
  const key =
    readStringValue(record.key);

  if (key) {
    return key;
  }

  const name =
    readStringValue(record.name);

  return createSlugId(
    name ?? "",
    `building-${index + 1}`,
  );
}

function getBuildingRowId(
  record: Record<string, unknown>,
  index: number,
): string {
  return getBuildingKey(
    record,
    index,
  );
}

function createBuildingEditorRecord(
  record: Record<string, unknown>,
  index: number,
): RecordEditorRecord {
  const key = getBuildingKey(
    record,
    index,
  );

  return {
    id: key,
    values: {
      key,
      name:
        readStringValue(
          record.name,
        ) ?? `Building ${index + 1}`,

      maxLevel:
        readNumberValue(
          record.max_level,
        ),

      source:
        readStringValue(
          record.source,
        ) ?? "",

      note:
        readStringValue(
          record.note,
        ) ?? "",

      costs:
        toRecordEditorValue(
          record.costs,
        ),

      isActive:
        typeof record.is_active ===
        "boolean"
          ? record.is_active
          : true,

      sourceUpdated:
        readStringValue(
          record.source_updated_at,
        ),

      sourceVerified:
        readStringValue(
          record.source_verified,
        ),

      sourceAccuracyScore:
        readNumberValue(
          record.source_accuracy_score,
        ),

      sourceName:
        readStringValue(
          record.source_name,
        ),

      sourceUrl:
        readStringValue(
          record.source_url,
        ),
    },
  };
}

export const buildingsDatasetAdapter:
  DatasetAdapter = {
    datasetId: "buildings",

    createBrowserDefinition(
      result: DatasetLoadResult,
    ): DatasetBrowserDefinition {
      const rows =
        createRowsFromRecords(
          result.records,
          (
            building,
            index,
          ) => {
            const key =
              getBuildingKey(
                building,
                index,
              );

            const name =
              readStringValue(
                building.name,
              ) ??
              `Building ${
                index + 1
              }`;

            const costs =
              Array.isArray(
                building.costs,
              )
                ? building.costs
                : [];

            return {
              id: getBuildingRowId(
                building,
                index,
              ),

              values: {
                name,
                key,

                maxLevel:
                  toCellValue(
                    building.max_level,
                  ),

                upgradeRows:
                  costs.length,

                confidence:
                  toCellValue(
                    building.source_accuracy_score,
                  ),

                active:
                  toCellValue(
                    building.is_active,
                  ),

                sourceUpdated:
                  toCellValue(
                    building.source_updated_at,
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

        const recordId =
          getBuildingRowId(
            value,
            index,
          );

        if (
          recordId !== rowId
        ) {
          continue;
        }

        return createBuildingEditorRecord(
          value,
          index,
        );
      }

      return null;
    },
  };