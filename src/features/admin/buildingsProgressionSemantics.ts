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

export function classifyBuildingProgressionRow(
  row: Record<string, unknown>,
): BuildingProgressionRowKind {
  const kind: SharedRowKind = getBuildingProgressionSemantics(row).rowKind;
  if (kind === "base-state") return "base-state";
  if (kind === "truegold-tier" || kind === "truegold-sub-stage") return "truegold-stage";
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
import { getBuildingProgressionSemantics, type BuildingProgressionRowKind as SharedRowKind } from "../../../shared/data-pipeline/buildingsProgressionOrdering";
