import { createHash } from 'node:crypto'

import type {
  DatasetLoadResult,
} from './runner.js'

import {
  getSupabaseAdmin,
} from '../database/supabaseAdmin.js'

interface HeroSkillRow {
  id: string
  hero_id: string
  name: string
  category: string
  skill_type: string | null
  description: string | null
  icon_url: string | null
  display_order: number
  slot_index: number
  max_level: number
  created_at: string
  updated_at: string
  hero:
    | {
        slug: string
        name: string
      }
    | Array<{
        slug: string
        name: string
      }>
    | null
}

function normaliseJoinedHero(
  value: HeroSkillRow['hero'],
): { slug: string; name: string } | null {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value
}

export async function loadCanonicalHeroSkillsDataset():
Promise<DatasetLoadResult> {
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('hero_skills')
    .select(`
      id,
      hero_id,
      name,
      category,
      skill_type,
      description,
      icon_url,
      display_order,
      slot_index,
      max_level,
      created_at,
      updated_at,
      hero:heroes!hero_skills_hero_id_fkey (
        slug,
        name
      )
    `)
    .order('hero_id', { ascending: true })
    .order('display_order', { ascending: true })
    .order('slot_index', { ascending: true })

  if (error) {
    throw new Error(
      `Unable to load canonical Hero Skills: ${error.message}`,
    )
  }

  const records = ((data ?? []) as unknown as HeroSkillRow[])
    .map((row) => {
      const hero = normaliseJoinedHero(row.hero)

      return {
        id: row.id,
        hero_id: row.hero_id,
        hero_slug: hero?.slug ?? null,
        hero_name: hero?.name ?? null,
        name: row.name,
        category: row.category,
        skill_type: row.skill_type,
        description: row.description,
        icon_url: row.icon_url,
        display_order: row.display_order,
        slot_index: row.slot_index,
        max_level: row.max_level,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }
    })

  const fetchedAt = new Date().toISOString()
  const serialised = JSON.stringify(records)
  const payloadHash = createHash('sha256')
    .update(serialised)
    .digest('hex')

  return {
    dataset: 'hero-skills',
    sourceUrl: 'supabase://public/hero_skills',
    fetchedAt,
    httpStatus: 200,
    payloadHash,
    metadata: {
      dataset: 'hero-skills',
      title: 'Canonical Hero Skills',
      description:
        'Published Hero Skill definitions linked to canonical Heroes.',
      canonical: 'supabase://public/hero_skills',
      updated: records.reduce<string | null>(
        (latest, record) =>
          !latest || record.updated_at > latest
            ? record.updated_at
            : latest,
        null,
      ) ?? undefined,
      provenance: {
        storage: 'Supabase',
        table: 'public.hero_skills',
      },
    },
    recordCount: records.length,
    records,
  }
}
