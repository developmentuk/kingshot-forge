import type {
  DatasetImporter,
  DatasetSourceMetadata,
  NormalisedDataset,
} from '../../../../shared/data-engine/types.js'

import type {
  HeroSourcePayload,
  HeroSourceRecord,
  NormalisedHeroRecord,
} from './types.js'

const HERO_SOURCE_URL =
  'https://kingshotpro.com/data/heroes.json'

function isObject(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

function readString(
  ...values: unknown[]
): string | null {
  for (const value of values) {
    if (
      typeof value === 'string' &&
      value.trim().length > 0
    ) {
      return value.trim()
    }
  }

  return null
}

function readNumber(
  ...values: unknown[]
): number | null {
  for (const value of values) {
    if (
      typeof value === 'number' &&
      Number.isFinite(value)
    ) {
      return value
    }

    if (
      typeof value === 'string' &&
      value.trim() !== ''
    ) {
      const parsed = Number(value)

      if (Number.isFinite(parsed)) {
        return parsed
      }
    }
  }

  return null
}

function readBoolean(
  ...values: unknown[]
): boolean | null {
  for (const value of values) {
    if (typeof value === 'boolean') {
      return value
    }

    if (typeof value === 'number') {
      if (value === 1) return true
      if (value === 0) return false
    }

    if (typeof value === 'string') {
      const normalised =
        value.trim().toLowerCase()

      if (
        normalised === 'true' ||
        normalised === 'yes' ||
        normalised === '1'
      ) {
        return true
      }

      if (
        normalised === 'false' ||
        normalised === 'no' ||
        normalised === '0'
      ) {
        return false
      }
    }
  }

  return null
}

function readStringArray(
  value: unknown,
): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter(
      (item): item is string =>
        typeof item === 'string',
    )
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

function createSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function parseMetadata(
  value: unknown,
): DatasetSourceMetadata | null {
  if (!isObject(value)) {
    return null
  }

  return {
    dataset:
      readString(value.dataset) ?? undefined,

    title:
      readString(value.title) ?? undefined,

    description:
      readString(value.description) ??
      undefined,

    canonical:
      readString(value.canonical) ?? undefined,

    updated:
      readString(value.updated) ?? undefined,

    verified:
      readString(value.verified) ?? undefined,

    accuracyScore:
      readNumber(value.accuracyScore) ??
      undefined,

    license:
      readString(value.license) ?? undefined,

    provenance:
      value.provenance,
  }
}

function parsePayload(
  payload: unknown,
): HeroSourcePayload {
  if (!isObject(payload)) {
    throw new Error(
      'Heroes source payload must be a JSON object.',
    )
  }

  if (!Array.isArray(payload.heroes)) {
    throw new Error(
      'Heroes source payload must contain a heroes array.',
    )
  }

  return {
    _meta: payload._meta,
    heroes: payload.heroes,
  }
}

function normaliseHero(
  value: unknown,
  metadata: DatasetSourceMetadata | null,
): NormalisedHeroRecord {
  if (!isObject(value)) {
    throw new Error(
      'Hero record must be a JSON object.',
    )
  }

  const hero =
    value as HeroSourceRecord

  const name =
    readString(hero.name)

  if (!name) {
    throw new Error(
      'Hero record is missing a valid name.',
    )
  }

  const suppliedSlug =
    readString(hero.slug)

  const slug =
    suppliedSlug
      ? createSlug(suppliedSlug)
      : createSlug(name)

  if (!slug) {
    throw new Error(
      `Unable to create a slug for hero "${name}".`,
    )
  }

  const troopType =
    readString(
      hero.troop_type,
      hero.troopType,
      hero.troop,
    )

  if (!troopType) {
    throw new Error(
      `Hero "${name}" is missing a troop type.`,
    )
  }

  const rarity =
    readString(hero.rarity)

  if (!rarity) {
    throw new Error(
      `Hero "${name}" is missing a rarity.`,
    )
  }

  return {
    name,
    slug,

    generation:
      readNumber(
        hero.generation,
        hero.gen,
      ),

    troop_type:
      troopType.toLowerCase(),

    rarity:
      rarity.toLowerCase(),

    portrait_url:
      readString(
        hero.portrait_url,
        hero.portraitUrl,
        hero.portrait,
      ),

    description:
      readString(
        hero.description,
        hero.desc,
      ),

    rally_tier:
      readString(
        hero.rally_tier,
        hero.rallyTier,
        hero.rally,
      ),

    garrison_tier:
      readString(
        hero.garrison_tier,
        hero.garrisonTier,
        hero.garrison,
      ),

    bear_tier:
      readString(
        hero.bear_tier,
        hero.bearTier,
        hero.bear,
      ),

    joiner_tier:
      readString(
        hero.joiner_tier,
        hero.joinerTier,
        hero.joiner,
      ),

    is_f2p:
      readBoolean(
        hero.is_f2p,
        hero.isF2p,
        hero.f2p,
      ),

    is_vip:
      readBoolean(
        hero.is_vip,
        hero.isVip,
        hero.vip,
      ),

    best_use:
      readString(
        hero.best_use,
        hero.bestUse,
      ),

    tags:
      readStringArray(hero.tags),

    is_active: true,

    source_updated_at:
      metadata?.updated ?? null,

    source_verified:
      metadata?.verified ?? null,

    source_accuracy_score:
      metadata?.accuracyScore ?? null,

    source_name:
      'KingshotPro',

    source_url:
      metadata?.canonical ??
      HERO_SOURCE_URL,
  }
}

function normalisePayload(
  payload: HeroSourcePayload,
): NormalisedDataset<NormalisedHeroRecord> {
  const metadata =
    parseMetadata(payload._meta)

  if (!Array.isArray(payload.heroes)) {
    throw new Error(
      'Heroes source payload contains an invalid heroes value.',
    )
  }

  const records =
    payload.heroes.map((hero) =>
      normaliseHero(hero, metadata),
    )

  return {
    metadata,
    records,
  }
}

export const heroesImporter:
  DatasetImporter<
    HeroSourcePayload,
    NormalisedHeroRecord
  > = {
    key: 'heroes',

    sourceUrl: HERO_SOURCE_URL,

    parsePayload,

    normalisePayload,

    getRecordKey(record) {
      return record.slug
    },
  }