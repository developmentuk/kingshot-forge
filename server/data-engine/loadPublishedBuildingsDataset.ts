import { createHash } from 'node:crypto'

import type { DatasetLoadResult } from './runner.js'
import { getSupabaseAdmin } from '../database/supabaseAdmin.js'

type Row = Record<string, unknown>

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

  const [{ data: buildings, error: buildingsError }, { data: progression, error: progressionError }] = await Promise.all([
    supabase.from('buildings').select('*').eq('publication_id', publication.publication_id).eq('editorial_status', 'published').not('published_version', 'is', null).order('building_key'),
    supabase.from('building_progression').select('*').eq('publication_id', publication.publication_id).eq('published_version', publication.publication_version).order('building_key').order('stage'),
  ])

  if (buildingsError) throw new Error(`Unable to load published Buildings: ${buildingsError.message}`)
  if (progressionError) throw new Error(`Unable to load published Building progression: ${progressionError.message}`)

  const progressionByBuilding = new Map<string, Row[]>()
  for (const row of (progression ?? []) as Row[]) {
    const key = typeof row.building_key === 'string' ? row.building_key : ''
    if (!key) continue
    const rows = progressionByBuilding.get(key) ?? []
    rows.push({ ...row, status: 'published' })
    progressionByBuilding.set(key, rows)
  }

  const records = ((buildings ?? []) as Row[]).flatMap((row) => {
    const key = typeof row.building_key === 'string' ? row.building_key : ''
    const name = typeof row.building_name === 'string' ? row.building_name : ''
    if (!key || !name) return []
    const buildingProgression = progressionByBuilding.get(key) ?? []
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
      total_publication_records: ((buildings ?? []) as Row[]).length + (progression ?? []).length,
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
      description: 'Owner-approved Buildings catalogue and progression from the current Forge publication.',
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
        progressionCount: (progression ?? []).length,
        totalPublicationRecords: ((buildings ?? []) as Row[]).length + (progression ?? []).length,
      },
    },
    recordCount: records.length,
    records,
  }
}
