import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

import type { DatasetSourceMetadata, PublishedDatasetKey } from '../../shared/data-engine/types.js'
import type { DatasetLoadResult } from './runner.js'

type OasisSource = {
  _meta?: Record<string, unknown>
  buildings?: unknown[]
  imageInventory?: string[]
}

type OasisRecord = Record<string, unknown> & {
  id: string
  name: string
  aliases: string[]
  recordType: string
  levels: unknown[]
  images: string[]
}

const dataset: PublishedDatasetKey = 'oasis-island'

function readSource(): OasisSource {
  const sourceUrl = new URL('./sources/kingshot_oasis_island_buildings.json', import.meta.url)
  return JSON.parse(readFileSync(sourceUrl, 'utf8')) as OasisSource
}

function normaliseName(value: string): string {
  return value.toLocaleLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '')
}

function imageFilesForRecord(record: Record<string, unknown>, inventory: string[]): string[] {
  const names = [
    typeof record.name === 'string' ? record.name : '',
    ...(Array.isArray(record.aliases) ? record.aliases.filter((value): value is string => typeof value === 'string') : []),
  ].map(normaliseName).filter(Boolean)
  return inventory.filter((file) => {
    const base = file.replace(/\s+lvl\d+\.png$/i, '').replace(/\.png$/i, '')
    const normalised = normaliseName(base)
    return names.some((name) => normalised === name || normalised.includes(name) || name.includes(normalised))
  }).map((file) => `/assets/oasis-island/${encodeURIComponent(file)}`)
}

function toRecord(value: unknown, inventory: string[]): OasisRecord | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  if (typeof record.id !== 'string' || typeof record.name !== 'string') return null
  return {
    ...record,
    id: record.id,
    name: record.name,
    aliases: Array.isArray(record.aliases) ? record.aliases.filter((item): item is string => typeof item === 'string') : [],
    recordType: typeof record.recordType === 'string' ? record.recordType : 'decoration_building',
    levels: Array.isArray(record.levels) ? record.levels : [],
    images: imageFilesForRecord(record, inventory),
  }
}

export async function loadSourceStagedOasisIslandDataset(): Promise<DatasetLoadResult> {
  const source = readSource()
  const inventory = Array.isArray(source.imageInventory) ? source.imageInventory : []
  const records = (source.buildings ?? []).map((record) => toRecord(record, inventory)).filter((record): record is OasisRecord => Boolean(record))
  const ownerVerifiedRecords = records.map((record) => ({
    ...record,
    verification: {
      ...(record.verification && typeof record.verification === 'object' ? record.verification : {}),
      status: 'owner_direct_ingame_verified',
      provenance: 'owner_direct_ingame',
    },
  }))
  const sourceText = JSON.stringify(source)
  const coverage = source._meta?.coverage && typeof source._meta.coverage === 'object' ? source._meta.coverage as Record<string, unknown> : {}
  const dataPolicy = source._meta?.dataPolicy && typeof source._meta.dataPolicy === 'object' ? source._meta.dataPolicy as Record<string, unknown> : {}
  const metadata: DatasetSourceMetadata = {
    dataset,
    title: 'Oasis Island catalogue',
    description: 'Source-staged Oasis Island structures, progression and verification metadata from the approved Forge research package.',
    canonical: 'forge-source://oasis-island/kingshot_oasis_island_buildings.json',
    updated: typeof source._meta?.generated === 'string' ? source._meta.generated : undefined,
    provenance: {
      storage: 'Repository source staging',
      visibility: 'source-staging; not a Supabase publication',
      sourceDocument: source._meta?.sourceDocument ?? 'Oasis Island.docx',
      functionalRecords: coverage.functionalRecords ?? records.length,
      imageCount: inventory.length,
      ownerEvidence: 'All non-null game values in the supplied JSON were manually checked and recorded directly from the live Kingshot game by the Product Owner.',
      sourcePriority: 'owner_direct_ingame_values_first',
      unknownValues: dataPolicy.unknownValues ?? 'Left null/empty instead of guessed.',
    },
  }
  return {
    dataset,
    sourceUrl: metadata.canonical ?? 'forge-source://oasis-island',
    fetchedAt: new Date().toISOString(),
    httpStatus: 200,
    payloadHash: createHash('sha256').update(sourceText).digest('hex'),
    metadata,
    recordCount: ownerVerifiedRecords.length,
    records: ownerVerifiedRecords,
  }
}
