export type BuildingProgressionRowKind =
  | "base-state"
  | "upgrade"
  | "truegold-stage";

export interface BuildingProgressionCounts {
  canonicalRecordCount: number;
  upgradeRowCount: number;
  baseStateCount: number;
  truegoldStageCount: number;
  baseState: Record<string, unknown> | null;
}

function numberValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function classifyBuildingProgressionRow(
  row: Record<string, unknown>,
): BuildingProgressionRowKind {
  const baseLevel = numberValue(row.base_level);
  if (row.progression_phase === "normal" && baseLevel === 0) return "base-state";
  if (row.progression_phase === "truegold") return "truegold-stage";
  return "upgrade";
}

export function getBuildingProgressionCounts(
  progression: Record<string, unknown>[],
): BuildingProgressionCounts {
  const baseStates = progression.filter(
    (row) => classifyBuildingProgressionRow(row) === "base-state",
  );
  const truegoldStageCount = progression.filter(
    (row) => classifyBuildingProgressionRow(row) === "truegold-stage",
  ).length;

  return {
    canonicalRecordCount: progression.length,
    upgradeRowCount: progression.length - baseStates.length,
    baseStateCount: baseStates.length,
    truegoldStageCount,
    baseState: baseStates[0] ?? null,
  };
}
