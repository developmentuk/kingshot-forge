import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

import type { DatasetSourceMetadata } from '../../shared/data-engine/types.js'
import type { DatasetLoadResult } from './runner.js'

type OasisStagedLoadResult = Omit<DatasetLoadResult, 'dataset'> & { dataset: 'oasis-island' }

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
  images: Record<string, unknown>
  imageFiles: string[]
  imageVariantFiles: Record<string, string[]>
}

const dataset = 'oasis-island' as const

function readSource(): OasisSource {
  const sourceUrl = new URL('./sources/kingshot_oasis_island_buildings.json', import.meta.url)
  return JSON.parse(readFileSync(sourceUrl, 'utf8')) as OasisSource
}

function imageVariantFiles(images: Record<string, unknown>): Record<string, string[]> {
  const variants = images.levelVariants
  if (!variants || typeof variants !== 'object') return {}
  return Object.fromEntries(Object.entries(variants).map(([level, files]) => {
    const values = Array.isArray(files) ? files : [files]
    return [level, values.filter((file): file is string => typeof file === 'string')]
  }))
}

function declaredImageFiles(images: Record<string, unknown>): string[] {
  return Array.isArray(images.files)
    ? images.files.filter((file): file is string => typeof file === 'string')
    : []
}

function validateImageMappings(records: Record<string, unknown>[], inventory: string[]): void {
  const inventorySet = new Set(inventory)
  const declared = new Set<string>()
  for (const record of records) {
    const images = record.images && typeof record.images === 'object' ? record.images as Record<string, unknown> : {}
    const files = declaredImageFiles(images)
    const variants = imageVariantFiles(images)
    for (const file of [...files, ...Object.values(variants).flat()]) {
      declared.add(file)
      if (!inventorySet.has(file)) throw new Error(`Oasis source image mapping is missing from inventory: ${file}`)
    }
  }
  const undeclared = inventory.filter((file) => !declared.has(file))
  if (undeclared.length) throw new Error(`Oasis source inventory contains undeclared image files: ${undeclared.join(', ')}`)
}

function toRecord(value: unknown): OasisRecord | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  if (typeof record.id !== 'string' || typeof record.name !== 'string') return null
  const images = record.images && typeof record.images === 'object' ? record.images as Record<string, unknown> : {}
  const files = declaredImageFiles(images)
  return {
    ...record,
    id: record.id,
    name: record.name,
    aliases: Array.isArray(record.aliases) ? record.aliases.filter((item): item is string => typeof item === 'string') : [],
    recordType: typeof record.recordType === 'string' ? record.recordType : 'decoration_building',
    levels: Array.isArray(record.levels) ? record.levels : [],
    images,
    imageFiles: files,
    imageVariantFiles: imageVariantFiles(images),
  }
}

export async function loadSourceStagedOasisIslandDataset(): Promise<OasisStagedLoadResult> {
  const source = readSource()
  const inventory = Array.isArray(source.imageInventory) ? source.imageInventory : []
  validateImageMappings((source.buildings ?? []).filter((record): record is Record<string, unknown> => Boolean(record && typeof record === 'object')), inventory)
  const records = (source.buildings ?? []).map((record) => toRecord(record)).filter((record): record is OasisRecord => Boolean(record))
  const ownerVerifiedRecords = records.map((record) => ({
    ...record,
    verification: {
      current: { status: 'owner_direct_ingame_verified', provenance: 'owner_direct_ingame' },
      history: record.verification && typeof record.verification === 'object' ? record.verification : null,
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
