import type { RecordEditorRecord, RecordEditorValue } from "./recordEditor/recordEditorSchema.js";

export interface BuildingsEditorialStateLike {
  head: { status: string } | null;
  currentVersion: { values: Record<string, unknown> } | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isProgression(value: unknown): value is RecordEditorValue[] {
  return Array.isArray(value) && value.every((row) => isRecord(row));
}

export function hydrateBuildingsEditorRecord(
  canonical: RecordEditorRecord,
  state: BuildingsEditorialStateLike | null,
): RecordEditorRecord {
  const draft = state?.currentVersion?.values;
  if (!draft || state?.head?.status !== "draft") return canonical;

  const values = { ...canonical.values };
  for (const [key, value] of Object.entries(draft)) {
    if (value !== undefined && key !== "progression") values[key] = value as RecordEditorValue;
  }
  if (isProgression(draft.progression) && draft.progression.length > 0) values.progression = draft.progression;
  return { id: canonical.id, values };
}

export function isRealBuildingsDraft(state: BuildingsEditorialStateLike | null): boolean {
  return state?.head?.status === "draft" && Boolean(state.currentVersion);
}
