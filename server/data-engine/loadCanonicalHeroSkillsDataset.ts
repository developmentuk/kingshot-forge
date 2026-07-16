import { createHash } from 'node:crypto'

import type {
  DatasetLoadResult,
} from './runner.js'

import {
  getSupabaseAdmin,
} from '../database/supabaseAdmin.js'

interface PublishedHeroSkillRow {
  id: string
  editorial_key: string
  hero_id: string
  hero_slug: string
  hero_name: string
  name: string
  category: string
  skill_type: string | null
  description: string | null
  icon_url: string | null
  display_order: number
  slot_index: number
  max_level: number
  source_updated_at: string | null
  source_verified: string | null
  source_accuracy_score: number | null
  source_name: string | null
  source_url: string | null
  published_version: number
  published_at: string
  updated_at: string
}

export async function loadCanonicalHeroSkillsDataset():
Promise<DatasetLoadResult> {
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('published_hero_skills')
    .select('*')
    .order('hero_slug', { ascending: true })
    .order('display_order', { ascending: true })
    .order('slot_index', { ascending: true })
    .order('editorial_key', { ascending: true })

  if (error) {
    throw new Error(
      `Unable to load published canonical Hero Skills: ${error.message}`,
    )
  }

  const records = ((data ?? []) as PublishedHeroSkillRow[])
    .map((row) => ({
      id: row.editorial_key,
      live_id: row.id,
      hero_id: row.hero_id,
      hero_slug: row.hero_slug,
      hero_name: row.hero_name,
      name: row.name,
      category: row.category,
      skill_type: row.skill_type,
      description: row.description,
      icon_url: row.icon_url,
      display_order: row.display_order,
      slot_index: row.slot_index,
      max_level: row.max_level,
      is_active: true,
      source_updated_at: row.source_updated_at,
      source_verified: row.source_verified,
      source_accuracy_score: row.source_accuracy_score,
      source_name: row.source_name,
      source_url: row.source_url,
      published_version: row.published_version,
      published_at: row.published_at,
      updated_at: row.updated_at,
    }))

  const fetchedAt = new Date().toISOString()
  const serialised = JSON.stringify(records)
  const payloadHash = createHash('sha256')
    .update(serialised)
    .digest('hex')

  return {
    dataset: 'hero-skills',
    sourceUrl: 'supabase://public/published_hero_skills',
    fetchedAt,
    httpStatus: 200,
    payloadHash,
    metadata: {
      dataset: 'hero-skills',
      title: 'Published Canonical Hero Skills',
      description:
        'Reviewed and published Hero Skill definitions linked to canonical Heroes.',
      canonical: 'supabase://public/published_hero_skills',
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
        projection: 'public.published_hero_skills',
        visibility: 'published-only',
      },
    },
    recordCount: records.length,
    records,
  }
}
