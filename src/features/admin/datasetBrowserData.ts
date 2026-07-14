import type {
  DatasetBrowserDefinition,
  DatasetTableRow,
} from "./datasetBrowserTypes";

const heroRows: DatasetTableRow[] = [
  {
    id: "amadeus",
    values: {
      name: "Amadeus",
      generation: 1,
      rarity: "Legendary",
      troop: "Infantry",
      rally: "S",
      garrison: "B",
    },
  },
  {
    id: "jabel",
    values: {
      name: "Jabel",
      generation: 1,
      rarity: "Legendary",
      troop: "Cavalry",
      rally: "B",
      garrison: "S",
    },
  },
  {
    id: "saul",
    values: {
      name: "Saul",
      generation: 1,
      rarity: "Legendary",
      troop: "Archer",
      rally: "B",
      garrison: "A",
    },
  },
  {
    id: "zoe",
    values: {
      name: "Zoe",
      generation: 2,
      rarity: "Legendary",
      troop: "Infantry",
      rally: "B",
      garrison: "S",
    },
  },
  {
    id: "marlin",
    values: {
      name: "Marlin",
      generation: 2,
      rarity: "Legendary",
      troop: "Archer",
      rally: "S",
      garrison: "B",
    },
  },
];

const buildingRows: DatasetTableRow[] = [
  {
    id: "town-center",
    values: {
      name: "Town Center",
      key: "castle",
      maxLevel: 30,
      upgradeRows: 29,
      confidence: 78,
    },
  },
  {
    id: "war-academy",
    values: {
      name: "War Academy",
      key: "academy",
      maxLevel: 30,
      upgradeRows: 29,
      confidence: 78,
    },
  },
];

const eventRows: DatasetTableRow[] = [
  {
    id: "viking-vengeance",
    values: {
      name: "Viking Vengeance",
      schedule: "Bi-weekly Tue & Thu",
      intervalHours: 84,
    },
  },
  {
    id: "mystic-trials",
    values: {
      name: "Mystic Trials",
      schedule: "Daily rotation",
      intervalHours: 24,
    },
  },
  {
    id: "bear-hunt",
    values: {
      name: "Bear Hunt",
      schedule: "Multiple daily",
      intervalHours: 8,
    },
  },
];

const browsers: DatasetBrowserDefinition[] = [
  {
    datasetId: "heroes",
    columns: [
      {
        key: "name",
        label: "Name",
        sortable: true,
      },
      {
        key: "generation",
        label: "Generation",
        sortable: true,
      },
      {
        key: "rarity",
        label: "Rarity",
        sortable: true,
      },
      {
        key: "troop",
        label: "Troop",
        sortable: true,
      },
      {
        key: "rally",
        label: "Rally",
        sortable: true,
      },
      {
        key: "garrison",
        label: "Garrison",
        sortable: true,
      },
    ],
    rows: heroRows,
  },
  {
    datasetId: "buildings",
    columns: [
      {
        key: "name",
        label: "Name",
        sortable: true,
      },
      {
        key: "key",
        label: "Key",
        sortable: true,
      },
      {
        key: "maxLevel",
        label: "Max level",
        sortable: true,
      },
      {
        key: "upgradeRows",
        label: "Upgrade rows",
        sortable: true,
      },
      {
        key: "confidence",
        label: "Confidence",
        sortable: true,
      },
    ],
    rows: buildingRows,
  },
  {
    datasetId: "events",
    columns: [
      {
        key: "name",
        label: "Name",
        sortable: true,
      },
      {
        key: "schedule",
        label: "Schedule",
        sortable: true,
      },
      {
        key: "intervalHours",
        label: "Interval",
        sortable: true,
      },
    ],
    rows: eventRows,
  },
];

export function getDatasetBrowserDefinition(
  datasetId: string,
): DatasetBrowserDefinition | undefined {
  return browsers.find(
    (browser) => browser.datasetId === datasetId,
  );
}