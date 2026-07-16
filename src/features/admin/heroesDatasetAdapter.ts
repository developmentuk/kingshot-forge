import type {
  DatasetLoadResult,
} from "./dataEngineApi";

import type {
  DatasetBrowserDefinition,
} from "./datasetBrowserTypes";

import {
  createRowsFromRecords,
  createSlugId,
  isRecordObject,
  toCellValue,
  toTitleCase,
  type DatasetAdapter,
} from "./datasetAdapters";

import {
  toRecordEditorValue,
  type RecordEditorRecord,
} from "./recordEditor/recordEditorSchema";

function getHeroSlug(
  hero: Record<string, unknown>,
  index: number,
): string {
  const name =
    typeof hero.name === "string"
      ? hero.name
      : `Hero ${index + 1}`;

  return typeof hero.slug === "string"
    ? hero.slug
    : createSlugId(
        name,
        `hero-${index + 1}`,
      );
}

export const heroesDatasetAdapter: DatasetAdapter = {
  datasetId: "heroes",

  createBrowserDefinition(
    result: DatasetLoadResult,
  ): DatasetBrowserDefinition {
    const rows = createRowsFromRecords(
      result.records,
      (hero, index) => {
        const name =
          typeof hero.name === "string"
            ? hero.name
            : `Hero ${index + 1}`;

        return {
          id: getHeroSlug(
            hero,
            index,
          ),
          values: {
            name,
            generation: toCellValue(
              hero.generation,
            ),
            troop: toTitleCase(
              hero.troop_type,
            ),
            rarity: toTitleCase(
              hero.rarity,
            ),
            rally: toCellValue(
              hero.rally_tier,
            ),
            garrison: toCellValue(
              hero.garrison_tier,
            ),
            bear: toCellValue(
              hero.bear_tier,
            ),
            joiner: toCellValue(
              hero.joiner_tier,
            ),
            f2p: toCellValue(
              hero.is_f2p,
            ),
            vip: toCellValue(
              hero.is_vip,
            ),
            bestUse: toCellValue(
              hero.best_use,
            ),
          },
        };
      },
    );

    return {
      datasetId: "heroes",
      columns: [
        {
          key: "name",
          label: "Name",
          sortable: true,
          width: "180px",
        },
        {
          key: "generation",
          label: "Gen",
          sortable: true,
          width: "80px",
        },
        {
          key: "troop",
          label: "Troop",
          sortable: true,
          width: "110px",
        },
        {
          key: "rarity",
          label: "Rarity",
          sortable: true,
          width: "110px",
        },
        {
          key: "rally",
          label: "Rally",
          sortable: true,
          width: "85px",
        },
        {
          key: "garrison",
          label: "Garrison",
          sortable: true,
          width: "95px",
        },
        {
          key: "bear",
          label: "Bear",
          sortable: true,
          width: "80px",
        },
        {
          key: "joiner",
          label: "Joiner",
          sortable: true,
          width: "85px",
        },
        {
          key: "f2p",
          label: "F2P",
          sortable: true,
          width: "75px",
        },
        {
          key: "vip",
          label: "VIP",
          sortable: true,
          width: "75px",
        },
        {
          key: "bestUse",
          label: "Best use",
          sortable: true,
          width: "260px",
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

      if (
        getHeroSlug(
          candidate,
          index,
        ) !== rowId
      ) {
        continue;
      }

      const values: Record<
        string,
        ReturnType<
          typeof toRecordEditorValue
        >
      > = {};

      for (
        const [key, value] of
        Object.entries(candidate)
      ) {
        values[key] =
          toRecordEditorValue(value);
      }

      return {
        id: rowId,
        values,
      };
    }

    return null;
  },
};
