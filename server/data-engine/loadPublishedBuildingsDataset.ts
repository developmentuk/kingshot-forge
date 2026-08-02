import { createHash } from 'node:crypto'

import type { DatasetLoadResult } from './runner.js'
import { getSupabaseAdmin } from '../database/supabaseAdmin.js'
import { sortBuildingProgression } from '../../shared/data-pipeline/buildingsProgressionOrdering.js'

type Row = Record<string, unknown>
type EditorialOverride = {
  building_key: string
  values: Row
  published_version_id: string
  published_version: number
  published_at: string
  published_by: string
}

const MEDIA_FIELDS = [
  'image_url',
  'image_alt_text',
  'image_credit',
  'image_source_url',
  'image_license',
] as const

function isRow(value: unknown): value is Row {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function readNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function isMissingOverrideRelation(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false
  return error.code === '42P01'
    || error.code === 'PGRST205'
    || /building_editorial_overrides/u.test(error.message ?? '')
}

function applyCostOverrides(progression: Row[], values: Row): Row[] {
  if (!Array.isArray(values.costs)) return progression

  const costsByLevel = new Map<number, unknown[]>()
  for (const candidate of values.costs) {
    if (!Array.isArray(candidate) || candidate.length !== 7) continue
    const level = readNumber(candidate[0])
    if (level === null || !Number.isInteger(level) || level < 1) continue
    costsByLevel.set(level, candidate)
  }

  if (!costsByLevel.size) return progression

  return progression.map((row) => {
    if (row.progression_phase === 'truegold') return row
    const baseLevel = readNumber(row.base_level)
    const cost = baseLevel === null ? undefined : costsByLevel.get(baseLevel)
    if (!cost) return row

    return {
      ...row,
      bread: readNumber(cost[1]),
      wood: readNumber(cost[2]),
      stone: readNumber(cost[3]),
      iron: readNumber(cost[4]),
      truegold: readNumber(cost[5]),
      upgrade_time_seconds: readNumber(cost[6]),
    }
  })
}

function applyEditorialOverride(row: Row, progression: Row[], override?: EditorialOverride) {
  if (!override) {
    return {
      row,
      progression,
      editorialProjection: null,
    }
  }

  const values = isRow(override.values) ? override.values : {}
  const nextRow: Row = { ...row }
  const name = readString(values.name) ?? readString(values.building_name)
  const maxLevel = readNumber(values.maxLevel) ?? readNumber(values.standard_max_level)
  const source = readString(values.source) ?? readString(values.source_url)
  const note = readString(values.note) ?? readString(values.verification_note)

  if (name) nextRow.building_name = name
  if (maxLevel !== null) nextRow.standard_max_level = maxLevel
  if (source) nextRow.source_url = source
  if (note !== null) nextRow.verification_note = note

  for (const field of MEDIA_FIELDS) {
    const value = readString(values[field])
    nextRow[field] = value
  }

  return {
    row: nextRow,
    progression: applyCostOverrides(progression, values),
    editorialProjection: {
      publishedVersionId: override.published_version_id,
      publishedVersion: override.published_version,
      publishedAt: override.published_at,
      publishedBy: override.published_by,
    },
  }
}

export async function loadPublishedBuildingsDataset(): Promise<DatasetLoadResult> {
  const supabase = getSupabaseAdmin()
  const { data: publication, error: publicationError } = await supabase
    .from('buildings_publication_versions')
    .select('publication_id, publication_version, manifest_hash, published_at, source_fingerprint')
    .eq('status', 'published')
    .eq('is_current', true)
    .maybeSingle()

  if (publicationError) throw new Error(`Unable to load the published Buildings version: ${publicationError.message}`)
  if (!publication) throw new Error('Buildings have not been published.')

  const [buildingsResult, progressionResult, overridesResult] = await Promise.all([
    supabase.from('buildings').select('*').eq('publication_id', publication.publication_id).eq('editorial_status', 'published').not('published_version', 'is', null).order('building_key'),
    supabase.from('building_progression').select('*').eq('publication_id', publication.publication_id).eq('published_version', publication.publication_version).order('building_key').order('stage'),
    supabase.from('building_editorial_overrides').select('building_key, values, published_version_id, published_version, published_at, published_by').order('building_key'),
  ])

  if (buildingsResult.error) throw new Error(`Unable to load published Buildings: ${buildingsResult.error.message}`)
  if (progressionResult.error) throw new Error(`Unable to load published Building progression: ${progressionResult.error.message}`)
  if (overridesResult.error && !isMissingOverrideRelation(overridesResult.error)) {
    throw new Error(`Unable to load published Building editorial overrides: ${overridesResult.error.message}`)
  }

  const buildings = (buildingsResult.data ?? []) as Row[]
  const progression = (progressionResult.data ?? []) as Row[]
  const overrides = overridesResult.error
    ? []
    : (overridesResult.data ?? []) as EditorialOverride[]
  const overridesByBuilding = new Map(
    overrides.map((override) => [override.building_key, override]),
  )

  const progressionByBuilding = new Map<string, Row[]>()
  for (const row of progression) {
    const key = typeof row.building_key === 'string' ? row.building_key : ''
    if (!key) continue
    const rows = progressionByBuilding.get(key) ?? []
    rows.push({ ...row, status: 'published' })
    progressionByBuilding.set(key, rows)
  }

  const records = buildings.flatMap((sourceRow) => {
    const key = typeof sourceRow.building_key === 'string' ? sourceRow.building_key : ''
    if (!key) return []

    const applied = applyEditorialOverride(
      sourceRow,
      progressionByBuilding.get(key) ?? [],
      overridesByBuilding.get(key),
    )
    const row = applied.row
    const name = typeof row.building_name === 'string' ? row.building_name : ''
    if (!name) return []
    const buildingProgression = sortBuildingProgression(applied.progression)

    return [{
      ...row,
      key,
      name,
      max_level: row.standard_max_level,
      truegold: row.truegold_supported,
      source: row.source_url,
      note: row.verification_note,
      progression: buildingProgression,
      progression_count: buildingProgression.length,
      total_publication_records: buildings.length + progression.length,
      editorial_projection: applied.editorialProjection,
      status: 'published',
    }]
  })
  const fetchedAt = new Date().toISOString()
  const payloadHash = createHash('sha256').update(JSON.stringify(records)).digest('hex')

  return {
    dataset: 'buildings',
    sourceUrl: 'supabase://public/buildings',
    fetchedAt,
    httpStatus: 200,
    payloadHash,
    metadata: {
      dataset: 'buildings',
      title: 'Published Buildings',
      description: 'Owner-approved Buildings catalogue, editorial companion media and progression from the current Forge publication.',
      canonical: 'supabase://public/buildings',
      updated: String(publication.published_at),
      provenance: {
        storage: 'Supabase',
        publicationId: publication.publication_id,
        publicationVersion: publication.publication_version,
        manifestHash: publication.manifest_hash,
        sourceFingerprint: publication.source_fingerprint,
        visibility: 'published-only',
        catalogueCount: records.length,
        progressionCount: progression.length,
        editorialOverrideCount: overrides.length,
        totalPublicationRecords: buildings.length + progression.length,
      },
    },
    recordCount: records.length,
    records,
  }
}
