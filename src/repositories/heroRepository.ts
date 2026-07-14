import { supabase } from "../lib/supabase";
import type { Hero } from "../types/hero";

export interface HeroUpsertInput {
  name: string;
  slug: string;
  generation: number | null;
  troop_type: string;
  rarity: string;
  portrait_url: string | null;
  description: string | null;

  rally_tier: string | null;
  garrison_tier: string | null;
  bear_tier: string | null;
  joiner_tier: string | null;

  is_f2p: boolean | null;
  is_vip: boolean | null;
  best_use: string | null;
  tags: string[];

  is_active: boolean;

  source_updated_at: string | null;
  source_verified: string | null;
  source_accuracy_score: number | null;
  source_name: string | null;
  source_url: string | null;
}

export async function getAllHeroes(): Promise<Hero[]> {
  const { data, error } = await supabase
    .from("heroes")
    .select("*")
    .order("generation", {
      ascending: true,
      nullsFirst: false,
    })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(
      `Unable to load heroes: ${error.message}`,
    );
  }

  return (data ?? []) as Hero[];
}

export async function getActiveHeroes(): Promise<Hero[]> {
  const { data, error } = await supabase
    .from("heroes")
    .select("*")
    .eq("is_active", true)
    .order("generation", {
      ascending: true,
      nullsFirst: false,
    })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(
      `Unable to load active heroes: ${error.message}`,
    );
  }

  return (data ?? []) as Hero[];
}

export async function getHeroById(
  heroId: string,
): Promise<Hero | null> {
  const { data, error } = await supabase
    .from("heroes")
    .select("*")
    .eq("id", heroId)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Unable to load hero by ID: ${error.message}`,
    );
  }

  return data as Hero | null;
}

export async function getHeroBySlug(
  slug: string,
): Promise<Hero | null> {
  const { data, error } = await supabase
    .from("heroes")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Unable to load hero by slug: ${error.message}`,
    );
  }

  return data as Hero | null;
}

export async function upsertHero(
  hero: HeroUpsertInput,
): Promise<Hero> {
  const { data, error } = await supabase
    .from("heroes")
    .upsert(
      {
        ...hero,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "slug",
      },
    )
    .select("*")
    .single();

  if (error) {
    throw new Error(
      `Unable to upsert hero "${hero.name}": ${error.message}`,
    );
  }

  return data as Hero;
}

export async function bulkUpsertHeroes(
  heroes: HeroUpsertInput[],
): Promise<Hero[]> {
  if (heroes.length === 0) {
    return [];
  }

  const updatedAt = new Date().toISOString();

  const rows = heroes.map((hero) => ({
    ...hero,
    updated_at: updatedAt,
  }));

  const { data, error } = await supabase
    .from("heroes")
    .upsert(rows, {
      onConflict: "slug",
    })
    .select("*");

  if (error) {
    throw new Error(
      `Unable to import heroes: ${error.message}`,
    );
  }

  return (data ?? []) as Hero[];
}

export async function deactivateMissingHeroes(
  activeSlugs: string[],
): Promise<number> {
  if (activeSlugs.length === 0) {
    throw new Error(
      "Refusing to deactivate heroes because the imported slug list is empty.",
    );
  }

  const { data: currentHeroes, error: loadError } =
    await supabase
      .from("heroes")
      .select("id, slug")
      .eq("is_active", true);

  if (loadError) {
    throw new Error(
      `Unable to check existing heroes: ${loadError.message}`,
    );
  }

  const activeSlugSet = new Set(activeSlugs);

  const heroIdsToDeactivate = (currentHeroes ?? [])
    .filter((hero) => !activeSlugSet.has(hero.slug))
    .map((hero) => hero.id);

  if (heroIdsToDeactivate.length === 0) {
    return 0;
  }

  const { error: updateError } = await supabase
    .from("heroes")
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .in("id", heroIdsToDeactivate);

  if (updateError) {
    throw new Error(
      `Unable to deactivate missing heroes: ${updateError.message}`,
    );
  }

  return heroIdsToDeactivate.length;
}