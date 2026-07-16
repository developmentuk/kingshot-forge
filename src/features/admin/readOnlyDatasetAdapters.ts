import type {
  DatasetKey,
  DatasetLoadResult,
} from "./dataEngineApi";

import type {
  DatasetBrowserDefinition,
  DatasetTableColumn,
} from "./datasetBrowserTypes";

import {
  createRowsFromRecords,
  joinCellValues,
  readRecordId,
  toCellValue,
  toTitleCase,
  type DatasetAdapter,
} from "./datasetAdapters";

interface ReadOnlyDatasetAdapterConfig {
  datasetId: DatasetKey;
  columns: DatasetTableColumn[];
  idKeys: readonly string[];
  values: (
    record: Record<string, unknown>,
  ) => DatasetBrowserDefinition["rows"][number]["values"];
}

function createReadOnlyDatasetAdapter({
  datasetId,
  columns,
  idKeys,
  values,
}: ReadOnlyDatasetAdapterConfig): DatasetAdapter {
  return {
    datasetId,

    createBrowserDefinition(
      result: DatasetLoadResult,
    ): DatasetBrowserDefinition {
      return {
        datasetId,
        columns,
        rows: createRowsFromRecords(
          result.records,
          (record, index) => ({
            id: readRecordId(
              record,
              index,
              idKeys,
              datasetId,
            ),
            values: values(record),
          }),
        ),
      };
    },
  };
}

const gearDatasetAdapter =
  createReadOnlyDatasetAdapter({
    datasetId: "gear",
    idKeys: ["key", "id"],
    columns: [
      { key: "tier", label: "Tier", sortable: true },
      { key: "stars", label: "Stars", sortable: true },
      { key: "attack", label: "Attack", sortable: true },
      { key: "defense", label: "Defense", sortable: true },
      { key: "power", label: "Power", sortable: true },
      { key: "confidence", label: "Confidence", sortable: true },
    ],
    values: (record) => ({
      tier: toCellValue(record.tier),
      stars: toCellValue(record.stars),
      attack: toCellValue(record.attack_bonus),
      defense: toCellValue(record.defense_bonus),
      power: toCellValue(record.power_total),
      confidence: toCellValue(record.confidence),
    }),
  });

const troopsDatasetAdapter =
  createReadOnlyDatasetAdapter({
    datasetId: "troops",
    idKeys: ["key", "id"],
    columns: [
      { key: "type", label: "Troop type", sortable: true },
      { key: "tier", label: "Tier", sortable: true },
      { key: "label", label: "Label", sortable: true },
      { key: "food", label: "Food", sortable: true },
      { key: "wood", label: "Wood", sortable: true },
      { key: "stone", label: "Stone", sortable: true },
      { key: "iron", label: "Iron", sortable: true },
      { key: "time", label: "Time (seconds)", sortable: true },
      { key: "kvk", label: "KvK points", sortable: true },
    ],
    values: (record) => ({
      type: toTitleCase(
        record.troop_name ?? record.troop_type,
      ),
      tier: toCellValue(record.tier),
      label: toCellValue(record.label),
      food: toCellValue(record.food),
      wood: toCellValue(record.wood),
      stone: toCellValue(record.stone),
      iron: toCellValue(record.iron),
      time: toCellValue(record.time_seconds),
      kvk: toCellValue(record.points_kvk),
    }),
  });

const charmDatasetAdapter =
  createReadOnlyDatasetAdapter({
    datasetId: "charm",
    idKeys: ["key", "level"],
    columns: [
      { key: "level", label: "Level", sortable: true },
      { key: "guides", label: "Charm guides", sortable: true },
      { key: "designs", label: "Charm designs", sortable: true },
      { key: "statIncrease", label: "Stat increase (%)", sortable: true },
      { key: "power", label: "Power gained", sortable: true },
      { key: "confidence", label: "Confidence", sortable: true },
    ],
    values: (record) => ({
      level: toCellValue(record.level),
      guides: toCellValue(record.charm_guides),
      designs: toCellValue(record.charm_designs),
      statIncrease: toCellValue(record.stat_increase_pct),
      power: toCellValue(record.power_gained),
      confidence: toCellValue(record.confidence),
    }),
  });

const vipDatasetAdapter =
  createReadOnlyDatasetAdapter({
    datasetId: "vip",
    idKeys: ["key", "level"],
    columns: [
      { key: "level", label: "VIP level", sortable: true },
      { key: "xp", label: "XP to reach", sortable: true },
      { key: "gems", label: "Gem equivalent", sortable: true },
      { key: "active", label: "Active", sortable: true },
    ],
    values: (record) => ({
      level: toCellValue(record.level),
      xp: toCellValue(record.xp_to_reach),
      gems: toCellValue(record.gems_equivalent),
      active: toCellValue(record.is_active),
    }),
  });

const shardsDatasetAdapter =
  createReadOnlyDatasetAdapter({
    datasetId: "shards",
    idKeys: ["key", "id"],
    columns: [
      { key: "rarity", label: "Rarity", sortable: true },
      { key: "label", label: "Tier", sortable: true },
      { key: "starLevel", label: "Star level", sortable: true },
      { key: "required", label: "Shards required", sortable: true },
      { key: "active", label: "Active", sortable: true },
    ],
    values: (record) => ({
      rarity: toTitleCase(record.rarity),
      label: toCellValue(record.label),
      starLevel: toCellValue(record.star_level),
      required: toCellValue(record.shards_required),
      active: toCellValue(record.is_active),
    }),
  });

const heroXpDatasetAdapter =
  createReadOnlyDatasetAdapter({
    datasetId: "hero-xp",
    idKeys: ["key", "level"],
    columns: [
      { key: "level", label: "Hero level", sortable: true },
      { key: "xp", label: "XP to reach", sortable: true },
      { key: "capacity", label: "Deployment capacity", sortable: true },
      { key: "active", label: "Active", sortable: true },
    ],
    values: (record) => ({
      level: toCellValue(record.level),
      xp: toCellValue(record.xp_to_reach),
      capacity: toCellValue(record.deployment_capacity),
      active: toCellValue(record.is_active),
    }),
  });

const truegoldDatasetAdapter =
  createReadOnlyDatasetAdapter({
    datasetId: "truegold",
    idKeys: ["key", "building"],
    columns: [
      { key: "building", label: "Building", sortable: true },
      { key: "tg1", label: "TG 1", sortable: true },
      { key: "tg5", label: "TG 5", sortable: true },
      { key: "tg8", label: "TG 8", sortable: true },
      { key: "tempered6", label: "Tempered TG 6", sortable: true },
      { key: "tempered8", label: "Tempered TG 8", sortable: true },
      { key: "confidence", label: "Confidence", sortable: true },
    ],
    values: (record) => ({
      building: toCellValue(record.building),
      tg1: toCellValue(record.truegold_tg1),
      tg5: toCellValue(record.truegold_tg5),
      tg8: toCellValue(record.truegold_tg8),
      tempered6: toCellValue(record.tempered_truegold_tg6),
      tempered8: toCellValue(record.tempered_truegold_tg8),
      confidence: toCellValue(record.confidence),
    }),
  });

const warAcademyDatasetAdapter =
  createReadOnlyDatasetAdapter({
    datasetId: "war-academy",
    idKeys: ["key", "technology_id"],
    columns: [
      { key: "technology", label: "Technology", sortable: true },
      { key: "category", label: "Category", sortable: true },
      { key: "level", label: "Level", sortable: true },
      { key: "benefit", label: "Benefit", sortable: true },
      { key: "gold", label: "Gold", sortable: true },
      { key: "dust", label: "Truegold dust", sortable: true },
      { key: "time", label: "Time (seconds)", sortable: true },
    ],
    values: (record) => ({
      technology: toCellValue(record.technology_name),
      category: toTitleCase(record.category),
      level: toCellValue(record.level),
      benefit: toCellValue(record.benefit),
      gold: toCellValue(record.gold),
      dust: toCellValue(record.truegold_dust),
      time: toCellValue(record.time_seconds),
    }),
  });

const kvkDatasetAdapter =
  createReadOnlyDatasetAdapter({
    datasetId: "kvk",
    idKeys: ["key", "id"],
    columns: [
      { key: "day", label: "Day", sortable: true },
      { key: "name", label: "Preparation day", sortable: true },
      { key: "action", label: "Activity", sortable: true },
      { key: "unit", label: "Unit", sortable: true },
      { key: "points", label: "Points", sortable: true },
      { key: "active", label: "Active", sortable: true },
    ],
    values: (record) => ({
      day: toCellValue(record.day),
      name: toCellValue(record.day_name),
      action: toCellValue(record.action_label),
      unit: toCellValue(record.unit),
      points: toCellValue(record.points),
      active: toCellValue(record.is_active),
    }),
  });

const mastersDatasetAdapter =
  createReadOnlyDatasetAdapter({
    datasetId: "masters",
    idKeys: ["key", "name"],
    columns: [
      { key: "name", label: "Master", sortable: true },
      { key: "generation", label: "Generation", sortable: true },
      { key: "role", label: "Role", sortable: true },
      { key: "skills", label: "Skills", sortable: true },
      { key: "power", label: "Total power", sortable: true },
      { key: "unlock", label: "Unlock order", sortable: true },
      { key: "confidence", label: "Confidence", sortable: true },
    ],
    values: (record) => ({
      name: toCellValue(record.name),
      generation: toCellValue(record.generation),
      role: toTitleCase(record.role),
      skills: joinCellValues(record.skills),
      power: toCellValue(record.total_power),
      unlock: toCellValue(record.unlock_order),
      confidence: toCellValue(record.confidence),
    }),
  });

export const readOnlyDatasetAdapters: DatasetAdapter[] = [
  gearDatasetAdapter,
  troopsDatasetAdapter,
  charmDatasetAdapter,
  vipDatasetAdapter,
  shardsDatasetAdapter,
  heroXpDatasetAdapter,
  truegoldDatasetAdapter,
  warAcademyDatasetAdapter,
  kvkDatasetAdapter,
  mastersDatasetAdapter,
];
