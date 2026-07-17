import type {
  DatasetLoadResult,
  DatasetKey,
} from "./dataEngineApi";

import type {
  DatasetBrowserDefinition,
  DatasetCellValue,
  DatasetTableColumn,
  DatasetTableRow,
} from "./datasetBrowserTypes";

import {
  createSlugId,
  isRecordObject,
  readNumberValue,
  readStringValue,
  toCellValue,
  toTitleCase,
  type DatasetAdapter,
} from "./datasetAdapters";

type RecordValueReader = (
  record: Record<string, unknown>,
  index: number,
) => DatasetCellValue;

interface BrowserColumnConfig {
  key: string;
  label: string;
  width?: string;
  sortable?: boolean;
  read?: RecordValueReader;
}

interface BrowserAdapterConfig {
  datasetId: DatasetKey;
  idKeys: string[];
  columns: BrowserColumnConfig[];
}

function firstValue(
  record: Record<string, unknown>,
  keys: string[],
): unknown {
  for (const key of keys) {
    if (record[key] !== undefined) {
      return record[key];
    }
  }

  return undefined;
}

function readArrayLength(
  ...keys: string[]
): RecordValueReader {
  return (record) => {
    const value = firstValue(record, keys);
    return Array.isArray(value)
      ? value.length
      : 0;
  };
}

function readNestedNumber(
  parentKey: string,
  childKey: string,
): RecordValueReader {
  return (record) => {
    const parent = record[parentKey];
    if (!isRecordObject(parent)) {
      return null;
    }

    return toCellValue(parent[childKey]);
  };
}

function readNumber(
  ...keys: string[]
): RecordValueReader {
  return (record) =>
    readNumberValue(
      firstValue(record, keys),
    );
}

function readText(
  ...keys: string[]
): RecordValueReader {
  return (record) =>
    readStringValue(
      firstValue(record, keys),
    );
}

function readTitle(
  ...keys: string[]
): RecordValueReader {
  return (record) => {
    const value = firstValue(record, keys);
    return value === undefined || value === null
      ? null
      : toTitleCase(value);
  };
}

function readBoolean(
  ...keys: string[]
): RecordValueReader {
  return (record) => {
    const value = firstValue(record, keys);
    return typeof value === "boolean"
      ? value
      : null;
  };
}

function createRowId(
  config: BrowserAdapterConfig,
  record: Record<string, unknown>,
  index: number,
): string {
  const explicitId = firstValue(
    record,
    config.idKeys,
  );

  if (
    typeof explicitId === "string" &&
    explicitId.trim()
  ) {
    return explicitId.trim();
  }

  if (
    typeof explicitId === "number" &&
    Number.isFinite(explicitId)
  ) {
    return String(explicitId);
  }

  const label = firstValue(record, [
    "label",
    "name",
    "building",
    "tier",
    "rarity",
    "level",
    "day",
  ]);

  return createSlugId(
    String(label ?? ""),
    `${config.datasetId}-${index + 1}`,
  );
}

function createBrowserAdapter(
  config: BrowserAdapterConfig,
): DatasetAdapter {
  return {
    datasetId: config.datasetId,

    createBrowserDefinition(
      result: DatasetLoadResult,
    ): DatasetBrowserDefinition {
      const rows: DatasetTableRow[] = [];

      result.records.forEach((value, index) => {
        if (!isRecordObject(value)) {
          return;
        }

        const values: Record<
          string,
          DatasetCellValue
        > = {};

        for (const column of config.columns) {
          values[column.key] = column.read
            ? column.read(value, index)
            : toCellValue(value[column.key]);
        }

        rows.push({
          id: createRowId(
            config,
            value,
            index,
          ),
          values,
        });
      });

      const columns: DatasetTableColumn[] =
        config.columns.map((column) => ({
          key: column.key,
          label: column.label,
          sortable:
            column.sortable ?? true,
          width: column.width,
        }));

      return {
        datasetId: config.datasetId,
        columns,
        rows,
      };
    },
  };
}

export const troopsDatasetAdapter =
  createBrowserAdapter({
    datasetId: "troops",
    idKeys: ["key", "id"],
    columns: [
      { key: "label", label: "Troop tier", width: "180px", read: readText("label") },
      { key: "troopType", label: "Troop type", width: "130px", read: readTitle("troop_type", "troopType") },
      { key: "tier", label: "Tier", width: "80px", read: readNumber("tier") },
      { key: "food", label: "Food", width: "100px", read: readNumber("food") },
      { key: "wood", label: "Wood", width: "100px", read: readNumber("wood") },
      { key: "stone", label: "Stone", width: "100px", read: readNumber("stone") },
      { key: "iron", label: "Iron", width: "100px", read: readNumber("iron") },
      { key: "timeSeconds", label: "Time (sec)", width: "110px", read: readNumber("time_seconds", "timeSec") },
      { key: "kvkPoints", label: "KvK points", width: "110px", read: readNumber("points_kvk") },
      { key: "status", label: "Status", width: "90px", read: readText("status") },
    ],
  });

export const gearDatasetAdapter =
  createBrowserAdapter({
    datasetId: "gear",
    idKeys: ["key", "id"],
    columns: [
      { key: "tier", label: "Tier", width: "130px", read: readText("tier") },
      { key: "stars", label: "Stars", width: "80px", read: readNumber("stars") },
      { key: "satin", label: "Satin", width: "100px", read: (record) => readNumberValue(record.satin) ?? readNestedNumber("materials", "satin")(record, 0) },
      { key: "threads", label: "Gilded threads", width: "140px", read: (record) => readNumberValue(record.gilded_threads) ?? readNestedNumber("materials", "gilded_threads")(record, 0) },
      { key: "attack", label: "Attack", width: "100px", read: (record) => toCellValue(record.attack_bonus) ?? readNestedNumber("bonuses", "attack")(record, 0) },
      { key: "defense", label: "Defence", width: "100px", read: (record) => toCellValue(record.defense_bonus) ?? readNestedNumber("bonuses", "defense")(record, 0) },
      { key: "power", label: "Power", width: "120px", read: readNumber("power_total", "power") },
      { key: "confidence", label: "Confidence", width: "110px", read: readNumber("confidence", "source_accuracy_score") },
    ],
  });

export const charmDatasetAdapter =
  createBrowserAdapter({
    datasetId: "charm",
    idKeys: ["key", "id", "level"],
    columns: [
      { key: "level", label: "Level", width: "90px", read: readNumber("level") },
      { key: "guides", label: "Charm guides", width: "130px", read: readNumber("charm_guides", "charmGuides") },
      { key: "designs", label: "Charm designs", width: "140px", read: readNumber("charm_designs", "charmDesigns") },
      { key: "statIncrease", label: "Stat increase %", width: "130px", read: readNumber("stat_increase_pct", "statIncreasePct") },
      { key: "power", label: "Power gained", width: "130px", read: readNumber("power_gained", "powerGained") },
      { key: "confidence", label: "Confidence", width: "110px", read: readNumber("confidence", "source_accuracy_score") },
    ],
  });

export const vipDatasetAdapter =
  createBrowserAdapter({
    datasetId: "vip",
    idKeys: ["key", "id", "level"],
    columns: [
      { key: "level", label: "VIP level", width: "100px", read: readNumber("level") },
      { key: "xp", label: "XP to reach", width: "140px", read: readNumber("xp_to_reach", "xpToReach") },
      { key: "gems", label: "Gem equivalent", width: "150px", read: readNumber("gems_equivalent", "gemsEquivalent") },
      { key: "active", label: "Active", width: "90px", read: readBoolean("is_active") },
      { key: "sourceUpdated", label: "Source updated", width: "140px", read: readText("source_updated_at") },
    ],
  });

export const heroXpDatasetAdapter =
  createBrowserAdapter({
    datasetId: "hero-xp",
    idKeys: ["key", "id", "level"],
    columns: [
      { key: "level", label: "Hero level", width: "110px", read: readNumber("level") },
      { key: "xp", label: "XP to reach", width: "140px", read: readNumber("xp_to_reach", "xpToReach") },
      { key: "capacity", label: "Deployment capacity", width: "170px", read: readNumber("deployment_capacity", "deploymentCapacity") },
      { key: "active", label: "Active", width: "90px", read: readBoolean("is_active") },
      { key: "sourceUpdated", label: "Source updated", width: "140px", read: readText("source_updated_at") },
    ],
  });

export const truegoldDatasetAdapter =
  createBrowserAdapter({
    datasetId: "truegold",
    idKeys: ["key", "id", "building"],
    columns: [
      { key: "building", label: "Building", width: "180px", read: readText("building", "name") },
      { key: "tg1", label: "TG1", width: "85px", read: (record) => readNumberValue(record.tg1) ?? readNestedNumber("truegold", "tg1")(record, 0) },
      { key: "tg5", label: "TG5", width: "85px", read: (record) => readNumberValue(record.tg5) ?? readNestedNumber("truegold", "tg5")(record, 0) },
      { key: "tg6", label: "TG6", width: "85px", read: (record) => readNumberValue(record.tg6) ?? readNestedNumber("truegold", "tg6")(record, 0) },
      { key: "tempered6", label: "Tempered TG6", width: "135px", read: (record) => readNumberValue(record.tempered_tg6) ?? readNestedNumber("temperedTruegold", "tg6")(record, 0) },
      { key: "tempered8", label: "Tempered TG8", width: "135px", read: (record) => readNumberValue(record.tempered_tg8) ?? readNestedNumber("temperedTruegold", "tg8")(record, 0) },
      { key: "confidence", label: "Confidence", width: "110px", read: readNumber("confidence", "source_accuracy_score") },
    ],
  });

export const warAcademyDatasetAdapter =
  createBrowserAdapter({
    datasetId: "war-academy",
    idKeys: ["key", "id"],
    columns: [
      { key: "name", label: "Technology", width: "220px", read: readText("name") },
      { key: "category", label: "Category", width: "130px", read: readText("category") },
      { key: "benefit", label: "Benefit", width: "190px", read: readText("benefit") },
      { key: "levels", label: "Levels", width: "90px", read: readArrayLength("levels") },
      { key: "confidence", label: "Confidence", width: "110px", read: readNumber("confidence", "source_accuracy_score") },
      { key: "active", label: "Active", width: "90px", read: readBoolean("is_active") },
    ],
  });

export const shardsDatasetAdapter =
  createBrowserAdapter({
    datasetId: "shards",
    idKeys: ["key", "id", "rarity"],
    columns: [
      { key: "rarity", label: "Rarity", width: "120px", read: readTitle("rarity") },
      { key: "label", label: "Shard track", width: "210px", read: readText("label") },
      { key: "tiers", label: "Star tiers", width: "100px", read: readArrayLength("tiers") },
      { key: "total", label: "Total shards", width: "130px", read: readNumber("total_shards", "total") },
      { key: "confidence", label: "Confidence", width: "110px", read: readNumber("confidence", "source_accuracy_score") },
    ],
  });

export const mastersDatasetAdapter =
  createBrowserAdapter({
    datasetId: "masters",
    idKeys: ["key", "id", "name"],
    columns: [
      { key: "name", label: "Master", width: "160px", read: readText("name") },
      { key: "generation", label: "Generation", width: "110px", read: readNumber("generation", "gen") },
      { key: "role", label: "Role", width: "160px", read: readText("role") },
      { key: "skills", label: "Skills", width: "90px", read: readArrayLength("skills") },
      { key: "power", label: "Total power", width: "130px", read: readNumber("total_power") },
      { key: "manuscripts", label: "Manuscripts", width: "130px", read: readNumber("manuscripts") },
      { key: "unlockOrder", label: "Unlock order", width: "120px", read: readNumber("unlock_order", "unlockOrder") },
      { key: "confidence", label: "Confidence", width: "110px", read: readNumber("confidence", "source_accuracy_score") },
    ],
  });

export const kvkDatasetAdapter =
  createBrowserAdapter({
    datasetId: "kvk",
    idKeys: ["key", "id", "day"],
    columns: [
      { key: "day", label: "Day", width: "80px", read: readNumber("day") },
      { key: "name", label: "Preparation focus", width: "220px", read: readText("name") },
      { key: "actions", label: "Scoring actions", width: "130px", read: readArrayLength("actions") },
      { key: "confidence", label: "Confidence", width: "110px", read: readNumber("confidence", "source_accuracy_score") },
      { key: "sourceUpdated", label: "Source updated", width: "140px", read: readText("source_updated_at") },
    ],
  });

export const coreDatasetAdapters: DatasetAdapter[] = [
  troopsDatasetAdapter,
  gearDatasetAdapter,
  charmDatasetAdapter,
  vipDatasetAdapter,
  heroXpDatasetAdapter,
  truegoldDatasetAdapter,
  warAcademyDatasetAdapter,
  shardsDatasetAdapter,
  mastersDatasetAdapter,
  kvkDatasetAdapter,
];
