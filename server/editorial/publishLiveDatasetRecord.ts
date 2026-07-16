import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import type {
  DatasetRecordValues,
} from "../../src/platform/datasets/index.js";

export interface LivePublicationContext {
  version: number;
  versionId: string;
  publishedBy: string;
}

function optionalText(
  value: unknown,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

function requiredText(
  value: unknown,
  label: string,
): string {
  const text = optionalText(value);

  if (!text) {
    throw new Error(
      `${label} is required before this record can be published.`,
    );
  }

  return text;
}

function optionalBoolean(
  value: unknown,
): boolean | null {
  return typeof value === "boolean"
    ? value
    : null;
}

function optionalInteger(
  value: unknown,
): number | null {
  return typeof value === "number" &&
    Number.isInteger(value)
    ? value
    : null;
}

function requiredPositiveInteger(
  value: unknown,
  label: string,
): number {
  const integer = optionalInteger(value);

  if (integer === null || integer < 1) {
    throw new Error(
      `${label} must be a positive integer before this record can be published.`,
    );
  }

  return integer;
}

function stringArray(
  value: unknown,
): string[] {
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

async function publishHero(
  client: SupabaseClient,
  recordId: string,
  values: DatasetRecordValues,
): Promise<void> {
  const slug = requiredText(
    values.slug ?? recordId,
    "Hero slug",
  );

  const payload = {
    name: requiredText(values.name, "Hero name"),
    slug,
    generation: optionalInteger(values.generation),
    troop_type: requiredText(
      values.troop_type,
      "Troop type",
    ),
    rarity: requiredText(values.rarity, "Rarity"),
    portrait_url: optionalText(values.portrait_url),
    description: optionalText(values.description),
    is_active:
      optionalBoolean(values.is_active) ?? true,
    rally_tier: optionalText(values.rally_tier),
    garrison_tier: optionalText(
      values.garrison_tier,
    ),
    bear_tier: optionalText(values.bear_tier),
    joiner_tier: optionalText(values.joiner_tier),
    is_f2p: optionalBoolean(values.is_f2p),
    is_vip: optionalBoolean(values.is_vip),
    best_use: optionalText(values.best_use),
    tags: stringArray(values.tags),
    source_updated_at: optionalText(
      values.source_updated_at,
    ),
    source_verified: optionalText(
      values.source_verified,
    ),
    source_accuracy_score: optionalInteger(
      values.source_accuracy_score,
    ),
    source_name: optionalText(values.source_name),
    source_url: optionalText(values.source_url),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await client
    .from("heroes")
    .update(payload)
    .eq("slug", slug)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(
      `Unable to publish hero "${slug}" to the live catalogue: ${error.message}`,
    );
  }

  if (!data) {
    throw new Error(
      `Unable to publish hero "${slug}": no matching live hero record was found.`,
    );
  }
}

async function publishHeroSkill(
  client: SupabaseClient,
  recordId: string,
  values: DatasetRecordValues,
  context: LivePublicationContext,
): Promise<void> {
  const heroSlug = requiredText(
    values.hero_slug,
    "Hero slug",
  );
  const editorialKey = requiredText(
    values.id ?? recordId,
    "Hero Skill record ID",
  );

  const { data: hero, error: heroError } = await client
    .from("heroes")
    .select("id")
    .eq("slug", heroSlug)
    .eq("is_active", true)
    .maybeSingle();

  if (heroError) {
    throw new Error(
      `Unable to resolve Hero "${heroSlug}" for publication: ${heroError.message}`,
    );
  }

  if (!hero) {
    throw new Error(
      `Unable to publish Hero Skill "${editorialKey}": active Hero "${heroSlug}" was not found.`,
    );
  }

  const payload = {
    editorial_key: editorialKey,
    hero_id: hero.id,
    name: requiredText(values.name, "Skill name"),
    category: requiredText(values.category, "Skill category"),
    skill_type: optionalText(values.skill_type),
    description: optionalText(values.description),
    icon_url: optionalText(values.icon_url),
    display_order: requiredPositiveInteger(
      values.display_order,
      "Display order",
    ),
    slot_index: requiredPositiveInteger(
      values.slot_index,
      "Skill slot",
    ),
    max_level: requiredPositiveInteger(
      values.max_level,
      "Maximum level",
    ),
    is_active:
      optionalBoolean(values.is_active) ?? true,
    source_updated_at: optionalText(
      values.source_updated_at,
    ),
    source_verified: optionalText(
      values.source_verified,
    ),
    source_accuracy_score: optionalInteger(
      values.source_accuracy_score,
    ),
    source_name: optionalText(values.source_name),
    source_url: optionalText(values.source_url),
    published_version: context.version,
    published_version_id: context.versionId,
    published_at: new Date().toISOString(),
    published_by: context.publishedBy,
    updated_at: new Date().toISOString(),
  };

  const { error } = await client
    .from("hero_skills")
    .upsert(payload, {
      onConflict: "editorial_key",
    });

  if (error) {
    throw new Error(
      `Unable to publish Hero Skill "${editorialKey}" to the live catalogue: ${error.message}`,
    );
  }
}

export async function publishLiveDatasetRecord(
  client: SupabaseClient,
  datasetId: string,
  recordId: string,
  values: DatasetRecordValues,
  context: LivePublicationContext,
): Promise<void> {
  switch (datasetId) {
    case "heroes":
      await publishHero(
        client,
        recordId,
        values,
      );
      return;

    case "hero-skills":
      await publishHeroSkill(
        client,
        recordId,
        values,
        context,
      );
      return;

    default:
      throw new Error(
        `Live publication is not yet configured for dataset "${datasetId}".`,
      );
  }
}
