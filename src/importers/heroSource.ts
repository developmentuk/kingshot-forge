import type { HeroUpsertInput } from "../repositories/heroRepository";
import type { ImportValidationIssue } from "./baseImporter";

export interface HeroSourceRecord {
  name?: unknown;
  slug?: unknown;

  gen?: unknown;
  generation?: unknown;

  troop?: unknown;
  troopType?: unknown;
  troop_type?: unknown;

  rarity?: unknown;

  rally?: unknown;
  rallyTier?: unknown;
  rally_tier?: unknown;

  garrison?: unknown;
  garrisonTier?: unknown;
  garrison_tier?: unknown;

  bear?: unknown;
  bearTier?: unknown;
  bear_tier?: unknown;

  joiner?: unknown;
  joinerTier?: unknown;
  joiner_tier?: unknown;

  f2p?: unknown;
  isF2p?: unknown;
  is_f2p?: unknown;

  vip?: unknown;
  isVip?: unknown;
  is_vip?: unknown;

  bestUse?: unknown;
  best_use?: unknown;

  desc?: unknown;
  description?: unknown;

  portrait?: unknown;
  portraitUrl?: unknown;
  portrait_url?: unknown;

  tags?: unknown;
}

export interface HeroSourceMetadata {
  updated?: unknown;
  verified?: unknown;
  accuracyScore?: unknown;
  sourceName?: unknown;
  sourceUrl?: unknown;
}

export interface HeroSourcePayload {
  heroes?: unknown;
  _meta?: HeroSourceMetadata;
}

function readString(
  ...values: unknown[]
): string | null {
  for (const value of values) {
    if (typeof value === "string") {
      const trimmed = value.trim();

      if (trimmed) {
        return trimmed;
      }
    }
  }

  return null;
}

function readNumber(
  ...values: unknown[]
): number | null {
  for (const value of values) {
    if (
      typeof value === "number" &&
      Number.isFinite(value)
    ) {
      return value;
    }

    if (
      typeof value === "string" &&
      value.trim() !== ""
    ) {
      const parsed = Number(value);

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

function readBoolean(
  ...values: unknown[]
): boolean | null {
  for (const value of values) {
    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "number") {
      if (value === 1) {
        return true;
      }

      if (value === 0) {
        return false;
      }
    }

    if (typeof value === "string") {
      const normalised = value.trim().toLowerCase();

      if (
        normalised === "true" ||
        normalised === "yes" ||
        normalised === "1"
      ) {
        return true;
      }

      if (
        normalised === "false" ||
        normalised === "no" ||
        normalised === "0"
      ) {
        return false;
      }
    }
  }

  return null;
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is string =>
        typeof item === "string",
    )
    .map((item) => item.trim())
    .filter(Boolean);
}

export function createHeroSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function validateHeroSourceRecord(
  record: HeroSourceRecord,
): ImportValidationIssue[] {
  const issues: ImportValidationIssue[] = [];

  const name = readString(record.name);

  const generation = readNumber(
    record.generation,
    record.gen,
  );

  const troopType = readString(
    record.troop_type,
    record.troopType,
    record.troop,
  );

  const rarity = readString(record.rarity);

  if (!name) {
    issues.push({
      field: "name",
      message: "Hero name is required.",
    });
  }

  if (
    generation !== null &&
    (!Number.isInteger(generation) || generation < 1)
  ) {
    issues.push({
      field: "generation",
      message:
        "Generation must be a positive whole number.",
    });
  }

  if (!troopType) {
    issues.push({
      field: "troop_type",
      message: "Troop type is required.",
    });
  }

  if (!rarity) {
    issues.push({
      field: "rarity",
      message: "Rarity is required.",
    });
  }

  return issues;
}

export function normaliseHeroSourceRecord(
  record: HeroSourceRecord,
  metadata?: HeroSourceMetadata,
): HeroUpsertInput {
  const name = readString(record.name);

  if (!name) {
    throw new Error(
      "Cannot normalise a hero without a name.",
    );
  }

  const suppliedSlug = readString(record.slug);

  return {
    name,
    slug: suppliedSlug ?? createHeroSlug(name),

    generation: readNumber(
      record.generation,
      record.gen,
    ),

    troop_type:
      readString(
        record.troop_type,
        record.troopType,
        record.troop,
      )?.toLowerCase() ?? "",

    rarity:
      readString(record.rarity)?.toLowerCase() ?? "",

    portrait_url: readString(
      record.portrait_url,
      record.portraitUrl,
      record.portrait,
    ),

    description: readString(
      record.description,
      record.desc,
    ),

    rally_tier: readString(
      record.rally_tier,
      record.rallyTier,
      record.rally,
    ),

    garrison_tier: readString(
      record.garrison_tier,
      record.garrisonTier,
      record.garrison,
    ),

    bear_tier: readString(
      record.bear_tier,
      record.bearTier,
      record.bear,
    ),

    joiner_tier: readString(
      record.joiner_tier,
      record.joinerTier,
      record.joiner,
    ),

    is_f2p: readBoolean(
      record.is_f2p,
      record.isF2p,
      record.f2p,
    ),

    is_vip: readBoolean(
      record.is_vip,
      record.isVip,
      record.vip,
    ),

    best_use: readString(
      record.best_use,
      record.bestUse,
    ),

    tags: readStringArray(record.tags),

    is_active: true,

    source_updated_at: readString(
      metadata?.updated,
    ),

    source_verified: readString(
      metadata?.verified,
    ),

    source_accuracy_score: readNumber(
      metadata?.accuracyScore,
    ),

    source_name:
      readString(metadata?.sourceName) ??
      "Kingshot.net",

    source_url: readString(metadata?.sourceUrl),
  };
}

export function parseHeroSourcePayload(
  payload: unknown,
): {
  heroes: HeroSourceRecord[];
  metadata?: HeroSourceMetadata;
} {
  if (!payload || typeof payload !== "object") {
    throw new Error(
      "The hero source returned an invalid JSON payload.",
    );
  }

  const sourcePayload = payload as HeroSourcePayload;

  if (!Array.isArray(sourcePayload.heroes)) {
    throw new Error(
      'The hero source payload does not contain a valid "heroes" array.',
    );
  }

  return {
    heroes:
      sourcePayload.heroes as HeroSourceRecord[],
    metadata: sourcePayload._meta,
  };
}