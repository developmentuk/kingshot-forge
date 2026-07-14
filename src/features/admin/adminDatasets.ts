export type AdminDatasetStatus =
  | "ready"
  | "warning"
  | "error"
  | "not-imported";

export interface AdminDatasetDefinition {
  id: string;
  name: string;
  description: string;
  route: string;
  status: AdminDatasetStatus;
}

export const adminDatasets: AdminDatasetDefinition[] = [
  {
    id: "heroes",
    name: "Heroes",
    description: "Hero roles, generations, rarities and recommended uses.",
    route: "/admin/data/heroes",
    status: "ready",
  },
  {
    id: "buildings",
    name: "Buildings",
    description: "Building upgrade costs, levels and construction times.",
    route: "/admin/data/buildings",
    status: "not-imported",
  },
  {
    id: "gear",
    name: "Governor Gear",
    description: "Governor Gear tiers, material costs, bonuses and power.",
    route: "/admin/data/gear",
    status: "not-imported",
  },
  {
    id: "troops",
    name: "Troops",
    description: "Troop training costs, times and event scoring.",
    route: "/admin/data/troops",
    status: "not-imported",
  },
  {
    id: "charm",
    name: "Governor Charm",
    description: "Charm levels, material requirements, stats and power.",
    route: "/admin/data/charm",
    status: "not-imported",
  },
  {
    id: "vip",
    name: "VIP",
    description: "VIP levels, XP requirements and gem equivalents.",
    route: "/admin/data/vip",
    status: "not-imported",
  },
  {
    id: "shards",
    name: "Hero Shards",
    description: "Hero shard requirements by rarity and star level.",
    route: "/admin/data/shards",
    status: "not-imported",
  },
  {
    id: "hero-xp",
    name: "Hero XP",
    description: "Hero level XP and deployment capacity progression.",
    route: "/admin/data/hero-xp",
    status: "not-imported",
  },
  {
    id: "truegold",
    name: "Truegold",
    description: "Truegold and Tempered Truegold building requirements.",
    route: "/admin/data/truegold",
    status: "not-imported",
  },
  {
    id: "war-academy",
    name: "War Academy",
    description: "War Academy technologies, costs and research times.",
    route: "/admin/data/war-academy",
    status: "not-imported",
  },
  {
    id: "events",
    name: "Events",
    description: "Recurring events, schedules and reset intervals.",
    route: "/admin/data/events",
    status: "not-imported",
  },
  {
    id: "kvk",
    name: "KvK Scoring",
    description: "KvK preparation days, activities and scoring values.",
    route: "/admin/data/kvk",
    status: "not-imported",
  },
  {
    id: "masters",
    name: "Masters",
    description: "Master roles, skills, unlock order and upgrade values.",
    route: "/admin/data/masters",
    status: "not-imported",
  },
];

export function getAdminDataset(
  datasetId: string,
): AdminDatasetDefinition | undefined {
  return adminDatasets.find((dataset) => dataset.id === datasetId);
}