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

const CREATE_ROW_PREFIX = "new-hero-skill";

function createDraftRecordId(): string {
  return `${CREATE_ROW_PREFIX}-${Date.now().toString(36)}`;
}

function getSkillId(
  skill: Record<string, unknown>,
  index: number,
): string {
  if (
    typeof skill.editorial_key === "string" &&
    skill.editorial_key.trim()
  ) {
    return skill.editorial_key;
  }

  return typeof skill.id === "string"
    ? skill.id
    : `hero-skill-${index + 1}`;
}

export const heroSkillsDatasetAdapter: DatasetAdapter = {
  datasetId: "hero-skills",

  createBrowserDefinition(
    result: DatasetLoadResult,
  ): DatasetBrowserDefinition {
    const createRecordId = createDraftRecordId();
    const rows = [
      {
        id: createRecordId,
        values: {
          hero: "Choose a Hero in the editor",
          name: "＋ Create a Hero Skill",
          category: "New draft",
          skillType: "",
          slot: "—",
          order: "—",
          maxLevel: "—",
        },
      },
      ...createRowsFromRecords(
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
      ),
    ];

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
    if (rowId.startsWith(`${CREATE_ROW_PREFIX}-`)) {
      return {
        id: rowId,
        values: {
          id: rowId,
          hero_id: null,
          hero_slug: "",
          hero_name: null,
          name: "",
          category: "conquest",
          skill_type: null,
          description: null,
          icon_url: null,
          display_order: 1,
          slot_index: 1,
          max_level: 5,
          is_active: true,
          source_updated_at: null,
          source_verified: null,
          source_accuracy_score: null,
          source_name: null,
          source_url: null,
          created_at: null,
          updated_at: null,
        },
      };
    }

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
