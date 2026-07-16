import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import type {
  DatasetRecordValues,
} from "../../src/platform/datasets/index.js";

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
      `${label} is required before this hero can be published.`,
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

export async function publishLiveDatasetRecord(
  client: SupabaseClient,
  datasetId: string,
  recordId: string,
  values: DatasetRecordValues,
): Promise<void> {
  switch (datasetId) {
    case "heroes":
      await publishHero(
        client,
        recordId,
        values,
      );
      return;

    default:
      throw new Error(
        `Live publication is not yet configured for dataset "${datasetId}".`,
      );
  }
}
