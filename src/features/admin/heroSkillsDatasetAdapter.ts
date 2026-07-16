import type {
  DatasetLoadResult,
} from "./dataEngineApi";

import type {
  DatasetBrowserDefinition,
} from "./datasetBrowserTypes";

import {
  createRowsFromRecords,
  isRecordObject,
  toCellValue,
  toTitleCase,
  type DatasetAdapter,
} from "./datasetAdapters";

import {
  toRecordEditorValue,
  type RecordEditorRecord,
} from "./recordEditor/recordEditorSchema";

function getSkillId(
  skill: Record<string, unknown>,
  index: number,
): string {
  return typeof skill.id === "string"
    ? skill.id
    : `hero-skill-${index + 1}`;
}

export const heroSkillsDatasetAdapter: DatasetAdapter = {
  datasetId: "hero-skills",

  createBrowserDefinition(
    result: DatasetLoadResult,
  ): DatasetBrowserDefinition {
    const rows = createRowsFromRecords(
      result.records,
      (skill, index) => ({
        id: getSkillId(skill, index),
        values: {
          hero: toCellValue(
            skill.hero_name ?? skill.hero_slug,
          ),
          name: toCellValue(skill.name),
          category: toTitleCase(skill.category),
          skillType: toTitleCase(skill.skill_type),
          slot: toCellValue(skill.slot_index),
          order: toCellValue(skill.display_order),
          maxLevel: toCellValue(skill.max_level),
        },
      }),
    );

    return {
      datasetId: "hero-skills",
      columns: [
        {
          key: "hero",
          label: "Hero",
          sortable: true,
          width: "170px",
        },
        {
          key: "name",
          label: "Skill",
          sortable: true,
          width: "220px",
        },
        {
          key: "category",
          label: "Category",
          sortable: true,
          width: "130px",
        },
        {
          key: "skillType",
          label: "Type",
          sortable: true,
          width: "130px",
        },
        {
          key: "slot",
          label: "Slot",
          sortable: true,
          width: "75px",
        },
        {
          key: "order",
          label: "Order",
          sortable: true,
          width: "80px",
        },
        {
          key: "maxLevel",
          label: "Max level",
          sortable: true,
          width: "100px",
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
      const [index, candidate] of
      result.records.entries()
    ) {
      if (!isRecordObject(candidate)) {
        continue;
      }

      if (getSkillId(candidate, index) !== rowId) {
        continue;
      }

      const values: Record<
        string,
        ReturnType<typeof toRecordEditorValue>
      > = {};

      for (const [key, value] of Object.entries(candidate)) {
        values[key] = toRecordEditorValue(value);
      }

      return {
        id: rowId,
        values,
      };
    }

    return null;
  },
};
