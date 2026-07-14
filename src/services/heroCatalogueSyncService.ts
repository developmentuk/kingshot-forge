import { supabase } from '../lib/supabase'
import { getKingshotDataset } from './kingshotDataService'
import type {
  HeroRarity,
  HeroTier,
  HeroTroopType,
} from '../types/hero'

interface KingshotProHero {
  name: string
  gen: number
  rarity: string
  troop: string
  rally: string
  garrison: string
  bear: string
  joiner: string
  f2p: boolean
  vip?: boolean
  bestUse: string
  desc: string
  tags: string[]
}

interface KingshotProHeroesDataset {
  _meta: {
    dataset: string
    title: string
    updated?: string
    verified?: string
    accuracyScore?: number
    canonical?: string
  }
  heroes: KingshotProHero[]
}

export interface HeroCatalogueSyncResult {
  total: number
  activeHeroes: number
  sourceUpdatedAt: string | null
}

function createSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normaliseRarity(
  value: string,
): HeroRarity {
  const rarity = value
    .trim()
    .toLowerCase()

  switch (rarity) {
    case 'rare':
    case 'epic':
    case 'legendary':
    case 'mythic':
      return rarity

    default:
      throw new Error(
        `Unsupported hero rarity: ${value}`,
      )
  }
}

function normaliseTroopType(
  value: string,
): HeroTroopType {
  const troopType = value
    .trim()
    .toLowerCase()

  switch (troopType) {
    case 'infantry':
    case 'cavalry':
    case 'archer':
      return troopType

    default:
      throw new Error(
        `Unsupported hero troop type: ${value}`,
      )
  }
}

function normaliseTier(
  value: string,
): HeroTier {
  switch (value.trim().toUpperCase()) {
    case 'S+':
      return 'S+'

    case 'S':
      return 'S'

    case 'A':
      return 'A'

    case 'B':
      return 'B'

    case 'C':
      return 'C'

    case 'D':
      return 'D'

    case '-':
      return '-'

    default:
      throw new Error(
        `Unsupported hero tier: ${value}`,
      )
  }
}

export async function syncHeroCatalogue(): Promise<HeroCatalogueSyncResult> {
  const dataset =
    await getKingshotDataset<KingshotProHeroesDataset>(
      'heroes',
      true,
    )

  if (!Array.isArray(dataset.heroes)) {
    throw new Error(
      'The hero dataset did not contain a valid heroes array.',
    )
  }

  const heroRows = dataset.heroes.map(
    (hero) => ({
      name: hero.name.trim(),
      slug: createSlug(hero.name),

      generation: hero.gen,
      troop_type:
        normaliseTroopType(hero.troop),

      rarity:
        normaliseRarity(hero.rarity),

      rally_tier:
        normaliseTier(hero.rally),

      garrison_tier:
        normaliseTier(hero.garrison),

      bear_tier:
        normaliseTier(hero.bear),

      joiner_tier:
        normaliseTier(hero.joiner),

      is_f2p: hero.f2p,
      is_vip: hero.vip ?? false,

      best_use:
        hero.bestUse.trim() || null,

      description:
        hero.desc.trim() || null,

      tags: Array.isArray(hero.tags)
        ? hero.tags
            .filter(
              (tag): tag is string =>
                typeof tag === 'string',
            )
            .map((tag) =>
              tag.trim().toLowerCase(),
            )
            .filter(Boolean)
        : [],

      is_active: true,

      source_updated_at:
        dataset._meta.updated ?? null,

      source_verified:
        dataset._meta.verified ?? null,

      source_accuracy_score:
        dataset._meta.accuracyScore ??
        null,

      source_name:
        dataset._meta.title ||
        dataset._meta.dataset,

      source_url:
        dataset._meta.canonical ??
        'https://kingshotpro.com/data/heroes.json',

      updated_at:
        new Date().toISOString(),
    }),
  )

  const slugs = heroRows.map(
    (hero) => hero.slug,
  )

  const { error: upsertError } =
    await supabase
      .from('heroes')
      .upsert(heroRows, {
        onConflict: 'slug',
      })

  if (upsertError) {
    throw new Error(
      `Unable to synchronise heroes: ${upsertError.message}`,
    )
  }

  const {
  data: existingHeroes,
  error: existingHeroesError,
} = await supabase
  .from('heroes')
  .select('id, slug')

if (existingHeroesError) {
  throw new Error(
    `Heroes were synchronised, but the existing catalogue could not be checked: ${existingHeroesError.message}`,
  )
}

const inactiveHeroIds = (
  existingHeroes ?? []
)
  .filter(
    (hero) =>
      !slugs.includes(hero.slug),
  )
  .map((hero) => hero.id)

if (inactiveHeroIds.length > 0) {
  const { error: deactivateError } =
    await supabase
      .from('heroes')
      .update({
        is_active: false,
        updated_at:
          new Date().toISOString(),
      })
      .in('id', inactiveHeroIds)

  if (deactivateError) {
    throw new Error(
      `Heroes were synchronised, but old catalogue entries could not be deactivated: ${deactivateError.message}`,
    )
  }
}

  return {
    total: heroRows.length,

    activeHeroes:
      heroRows.length,

    sourceUpdatedAt:
      dataset._meta.updated ?? null,
  }
}