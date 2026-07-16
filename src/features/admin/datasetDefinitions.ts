import type {
  DatasetDefinition,
} from "../../platform/datasets";
import {
  DatasetRegistry,
} from "../../platform/datasets";

import type {
  DatasetKey,
} from "./dataEngineApi";

export type AdminDatasetStatus =
  | "ready"
  | "warning"
  | "error"
  | "not-imported";

export interface AdminDatasetMetadata {
  order: number;
  status: AdminDatasetStatus;
}

export interface AdminDatasetRegistration
  extends DatasetDefinition {
  id: DatasetKey;
  admin: AdminDatasetMetadata;
}

const registrations: AdminDatasetRegistration[] = [
  {
    id: "heroes",
    version: 1,
    title: "Heroes",
    singularTitle: "Hero",
    description: "Hero roles, generations, rarities and recommended uses.",
    category: "game-data",
    route: "/admin/data/heroes",
    idField: "name",
    titleField: "name",
    fields: [],
    capabilities: {
      browsing: true,
      editing: true,
      importing: true,
      search: true,
    },
    admin: {
      order: 10,
      status: "ready",
    },
  },
  {
    id: "hero-skills",
    version: 1,
    title: "Hero Skills",
    singularTitle: "Hero Skill",
    description:
      "Canonical Hero Skill definitions, ordering and verified effects.",
    category: "game-data",
    route: "/admin/data/hero-skills",
    idField: "id",
    titleField: "name",
    fields: [],
    capabilities: {
      browsing: true,
      editing: true,
      importing: false,
      search: true,
    },
    admin: {
      order: 15,
      status: "ready",
    },
  },
  {
    id: "buildings",
    version: 1,
    title: "Buildings",
    singularTitle: "Building",
    description: "Building upgrade costs, levels and construction times.",
    category: "game-data",
    route: "/admin/data/buildings",
    idField: "key",
    titleField: "name",
    fields: [],
    capabilities: {
      browsing: true,
      editing: true,
      importing: true,
      search: true,
    },
    admin: {
      order: 20,
      status: "not-imported",
    },
  },
  {
    id: "gear",
    version: 1,
    title: "Governor Gear",
    singularTitle: "Governor Gear Step",
    description: "Governor Gear tiers, material costs, bonuses and power.",
    category: "game-data",
    route: "/admin/data/gear",
    idField: "id",
    titleField: "tier",
    fields: [],
    capabilities: {
      browsing: true,
      importing: true,
      search: true,
    },
    admin: {
      order: 30,
      status: "not-imported",
    },
  },
  {
    id: "troops",
    version: 1,
    title: "Troops",
    singularTitle: "Troop Tier",
    description: "Troop training costs, times and event scoring.",
    category: "game-data",
    route: "/admin/data/troops",
    idField: "id",
    titleField: "label",
    fields: [],
    capabilities: {
      browsing: true,
      importing: true,
      search: true,
    },
    admin: {
      order: 40,
      status: "not-imported",
    },
  },
  {
    id: "charm",
    version: 1,
    title: "Governor Charm",
    singularTitle: "Charm Level",
    description: "Charm levels, material requirements, stats and power.",
    category: "game-data",
    route: "/admin/data/charm",
    idField: "level",
    titleField: "level",
    fields: [],
    capabilities: {
      browsing: true,
      importing: true,
      search: true,
    },
    admin: {
      order: 50,
      status: "not-imported",
    },
  },
  {
    id: "vip",
    version: 1,
    title: "VIP",
    singularTitle: "VIP Level",
    description: "VIP levels, XP requirements and gem equivalents.",
    category: "game-data",
    route: "/admin/data/vip",
    idField: "level",
    titleField: "level",
    fields: [],
    capabilities: {
      browsing: true,
      importing: true,
      search: true,
    },
    admin: {
      order: 60,
      status: "not-imported",
    },
  },
  {
    id: "shards",
    version: 1,
    title: "Hero Shards",
    singularTitle: "Hero Shard Tier",
    description: "Hero shard requirements by rarity and star level.",
    category: "game-data",
    route: "/admin/data/shards",
    idField: "id",
    titleField: "label",
    fields: [],
    capabilities: {
      browsing: true,
      importing: true,
      search: true,
    },
    admin: {
      order: 70,
      status: "not-imported",
    },
  },
  {
    id: "hero-xp",
    version: 1,
    title: "Hero XP",
    singularTitle: "Hero Level",
    description: "Hero level XP and deployment capacity progression.",
    category: "game-data",
    route: "/admin/data/hero-xp",
    idField: "level",
    titleField: "level",
    fields: [],
    capabilities: {
      browsing: true,
      importing: true,
      search: true,
    },
    admin: {
      order: 80,
      status: "not-imported",
    },
  },
  {
    id: "truegold",
    version: 1,
    title: "Truegold",
    singularTitle: "Truegold Requirement",
    description: "Truegold and Tempered Truegold building requirements.",
    category: "game-data",
    route: "/admin/data/truegold",
    idField: "building",
    titleField: "building",
    fields: [],
    capabilities: {
      browsing: true,
      importing: true,
      search: true,
    },
    admin: {
      order: 90,
      status: "not-imported",
    },
  },
  {
    id: "war-academy",
    version: 1,
    title: "War Academy",
    singularTitle: "War Academy Technology",
    description: "War Academy technologies, costs and research times.",
    category: "game-data",
    route: "/admin/data/war-academy",
    idField: "id",
    titleField: "name",
    fields: [],
    capabilities: {
      browsing: true,
      importing: true,
      search: true,
    },
    admin: {
      order: 100,
      status: "not-imported",
    },
  },
  {
    id: "events",
    version: 1,
    title: "Events",
    singularTitle: "Event",
    description: "Recurring events, schedules and reset intervals.",
    category: "game-data",
    route: "/admin/data/events",
    idField: "name",
    titleField: "name",
    fields: [],
    capabilities: {
      browsing: true,
      importing: true,
      search: true,
    },
    admin: {
      order: 110,
      status: "not-imported",
    },
  },
  {
    id: "kvk",
    version: 1,
    title: "KvK Scoring",
    singularTitle: "KvK Preparation Day",
    description: "KvK preparation days, activities and scoring values.",
    category: "game-data",
    route: "/admin/data/kvk",
    idField: "day",
    titleField: "name",
    fields: [],
    capabilities: {
      browsing: true,
      importing: true,
      search: true,
    },
    admin: {
      order: 120,
      status: "not-imported",
    },
  },
  {
    id: "masters",
    version: 1,
    title: "Masters",
    singularTitle: "Master",
    description: "Master roles, skills, unlock order and upgrade values.",
    category: "game-data",
    route: "/admin/data/masters",
    idField: "name",
    titleField: "name",
    fields: [],
    capabilities: {
      browsing: true,
      importing: true,
      search: true,
    },
    admin: {
      order: 130,
      status: "not-imported",
    },
  },
];

const datasetRegistry = new DatasetRegistry();

datasetRegistry.registerMany(registrations);

export function getAdminDatasetRegistration(
  datasetId: string,
): AdminDatasetRegistration | undefined {
  return datasetRegistry.get(datasetId) as
    | AdminDatasetRegistration
    | undefined;
}

export function requireAdminDatasetRegistration(
  datasetId: string,
): AdminDatasetRegistration {
  return datasetRegistry.require(datasetId) as AdminDatasetRegistration;
}

export function hasAdminDatasetRegistration(
  datasetId: string,
): boolean {
  return datasetRegistry.has(datasetId);
}

export function listAdminDatasetRegistrations():
AdminDatasetRegistration[] {
  return datasetRegistry
    .list()
    .map(
      (definition) =>
        definition as AdminDatasetRegistration,
    )
    .sort(
      (first, second) =>
        first.admin.order - second.admin.order,
    );
}
