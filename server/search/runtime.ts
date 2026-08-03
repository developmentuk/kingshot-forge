import { loadCanonicalHeroSkillsDataset } from '../data-engine/loadCanonicalHeroSkillsDataset.js'
import { loadDataset } from '../data-engine/runner.js'
import { PUBLISHED_DATASET_KEYS, type PublishedDatasetKey } from '../../shared/data-engine/datasets.js'
import { SearchEngine, SearchProviderRegistry, type SearchProvider, type SearchRecord, type SearchRecordStatus } from '../../shared/search/index.js'
import { SearchIndexCache } from '../../shared/search/cache.js'
import { SearchProjectionRefreshService } from '../../shared/search/refresh.js'
import { getSearchProjectionRepository } from './repository.js'
import { createForgeId } from '../../shared/entity-identity/forgeId.js'

const STATUS_VALUES = new Set<SearchRecordStatus>(['draft', 'in_review', 'approved', 'published', 'archived', 'deprecated'])

function value(record: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) if (typeof record[key] === 'string' || typeof record[key] === 'number') return String(record[key])
  return null
}

function stringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean)
    : []
}

function toSearchRecord(dataset: PublishedDatasetKey, input: unknown): SearchRecord | null {
  if (!input || typeof input !== 'object') return null
  const record = input as Record<string, unknown>
  const id = value(record, 'id', 'key', 'slug', 'name', 'level', 'day')
  const title = value(record, 'title', 'name', 'label', 'tier', 'level', 'day')
  if (!id || !title) return null
  const rawStatus = value(record, 'status')
  const status: SearchRecordStatus = rawStatus && STATUS_VALUES.has(rawStatus as SearchRecordStatus) ? rawStatus as SearchRecordStatus : 'published'
  const forge_id = forgeIdForDataset(dataset, id)
  const aliases = stringList(record.aliases)
  const relationships = Array.isArray(record.relationships) ? record.relationships.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object')).flatMap((item) => {
    const targetId = value(item, 'targetId', 'target_id', 'id')
    const targetDataset = value(item, 'targetDataset', 'target_dataset', 'dataset')
    const type = value(item, 'type', 'relationshipType', 'relationship_type')
    const label = value(item, 'label', 'relationshipLabel', 'relationship_label')
    return targetId && targetDataset && type ? [{ targetId, targetDataset, type, ...(label ? { label } : {}) }] : []
  }) : []
  return {
    id, forge_id, dataset, title,
    subtitle: value(record, 'subtitle', 'role', 'category_label', 'category'),
    summary: value(record, 'summary', 'description', 'best_use'),
    keywords: [value(record, 'name'), value(record, 'slug'), value(record, 'role'), value(record, 'troop_type'), ...aliases, value(record, 'trust_label')].filter((item): item is string => Boolean(item)),
    tags: stringList(record.tags),
    image: value(record, 'image', 'image_url', 'imageUrl'), status,
    published_at: status === 'published' || status === 'approved' ? value(record, 'published_at', 'publishedAt', 'source_updated_at') ?? new Date(0).toISOString() : null,
    permissions: { visibility: value(record, 'visibility') === 'internal' ? 'internal' : 'public' },
    relationships, canonical_url: value(record, 'canonical_url', 'canonicalUrl', 'url'),
    search_weight: typeof record.search_weight === 'number' ? record.search_weight : 0,
    aliases,
    source_version_id: value(record, 'source_version_id', 'sourceVersionId'),
    source_publication_id: value(record, 'source_publication_id', 'sourcePublicationId'),
    verified_at: value(record, 'verified_at', 'verifiedAt'),
    source_updated_at: value(record, 'source_updated_at', 'sourceUpdatedAt'),
    confidence: value(record, 'confidence') as SearchRecord['confidence'],
    confidence_label: value(record, 'confidence_label', 'confidenceLabel'),
  }
}

function forgeIdForDataset(dataset: PublishedDatasetKey, id: string) {
  const namespace = ({ heroes: 'hero', 'hero-skills': 'hero-skill', buildings: 'building', items: 'item', events: 'event', troops: 'troop', gear: 'gear', charm: 'charm', research: 'research', 'war-academy': 'war-academy' } as Record<string, string>)[dataset]
  return namespace ? createForgeId(namespace, id) : null
}

function createProvider(dataset: PublishedDatasetKey): SearchProvider {
  return {
    dataset,
    name: `${dataset} Search Provider`,
    async load() {
      const loaded = dataset === 'hero-skills' ? await loadCanonicalHeroSkillsDataset() : await loadDataset(dataset)
      return loaded.records.map((record) => toSearchRecord(dataset, record)).filter((record): record is SearchRecord => Boolean(record))
    },
  }
}

export function createSearchProviderRegistry(): SearchProviderRegistry {
  const registry = new SearchProviderRegistry()
  registry.registerMany(PUBLISHED_DATASET_KEYS.map(createProvider))
  return registry
}

let cache: SearchIndexCache | null = null
let refreshService: SearchProjectionRefreshService | null = null

export function getSearchIndexCache(): SearchIndexCache {
  if (!cache) cache = new SearchIndexCache(getSearchProjectionRepository())
  return cache
}

export function getSearchRefreshService(): SearchProjectionRefreshService {
  if (!refreshService) refreshService = new SearchProjectionRefreshService(getSearchProjectionRepository(), createSearchProviderRegistry())
  return refreshService
}

export async function invalidateSearchIndex(): Promise<void> {
  await getSearchIndexCache().invalidate()
  const repository = getSearchProjectionRepository()
  const metadata = await repository.readIndexMetadata()
  await repository.updateIndexMetadata({ ...metadata, stale: true })
}

export async function createSearchEngine(datasets?: readonly string[]): Promise<SearchEngine> {
  const registry = createSearchProviderRegistry()
  const selected = datasets?.length ? datasets : PUBLISHED_DATASET_KEYS
  const records = (await Promise.all(selected.flatMap((dataset) => {
    const provider = registry.get(dataset)
    return provider ? [provider.load({ now: new Date().toISOString() })] : []
  }))).flat()
  const engine = new SearchEngine()
  engine.index(records)
  return engine
}
