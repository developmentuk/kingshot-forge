import type { SearchRecord } from '../../shared/search/contracts.js'
import type { OasisPublicDataset } from './publicProjection.js'
import { assertOasisPublicRecord } from './publicProjection.js'

function sameTimestamp(left: string, right: string): boolean {
  return Number.isFinite(Date.parse(left)) && Date.parse(left) === Date.parse(right)
}

export function buildOasisSearchRecords(dataset: OasisPublicDataset): readonly SearchRecord[] {
  if (dataset.dataset !== 'oasis-island' || dataset.status !== 'current_published') throw new Error('Only the current published Oasis projection may be prepared for Search.')
  if (!dataset.publicationId || dataset.recordCount !== dataset.records.length) throw new Error('Oasis Search preparation requires a complete publication identity and record set.')
  return dataset.records.map((record) => {
    assertOasisPublicRecord(record)
    if (!sameTimestamp(record.publishedAt, dataset.publishedAt) || !sameTimestamp(record.updatedAt, dataset.updatedAt)) throw new Error('Oasis Search preparation requires database-authoritative publication timestamps.')
    return Object.freeze({
      id: record.id,
      forge_id: null,
      dataset: 'oasis-island',
      title: record.name,
      subtitle: record.rarity ?? record.recordType.replaceAll('_', ' '),
      summary: record.function,
      keywords: Object.freeze([record.name, ...record.aliases, record.recordType, record.rarity, record.availabilityCategory, record.trustLabel].filter((item): item is string => Boolean(item))),
      tags: Object.freeze(['oasis-island', record.recordType, ...(record.rarity ? [record.rarity] : [])]),
      image: record.media[0]?.url ?? null,
      status: 'published' as const,
      published_at: record.publishedAt,
      permissions: Object.freeze({ visibility: 'public' as const }),
      relationships: Object.freeze([]),
      canonical_url: record.canonicalRoute,
      search_weight: 1,
      aliases: record.aliases,
      source_version_id: `${record.publicationId}:${record.id}`,
      source_publication_id: record.publicationId,
      verified_at: record.updatedAt,
      source_updated_at: record.updatedAt,
    })
  })
}
