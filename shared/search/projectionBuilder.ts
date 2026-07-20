import type { SearchRecord, SearchRelationship, SearchVisibility } from './contracts.js'
import { SEARCH_PROJECTION_SCHEMA_VERSION, type SearchProjection } from './persistence.js'

export interface ProjectionBuildResult {
  projection?: SearchProjection
  failure?: { code: string; message: string }
}

export function buildSearchProjection(record: SearchRecord, now: string, relationships = record.relationships): ProjectionBuildResult {
  if (record.status !== 'published') return { failure: { code: 'not_published', message: 'Only published records may enter the public search projection.' } }
  if (!record.published_at) return { failure: { code: 'missing_published_at', message: 'Published records require published_at.' } }
  if (record.canonical_url !== null && !isSafeCanonicalUrl(record.canonical_url)) return { failure: { code: 'invalid_canonical_url', message: 'canonical_url must be a relative path or HTTPS URL.' } }
  if (!isValidPermissions(record.permissions)) return { failure: { code: 'invalid_permissions', message: 'Search permissions contain an invalid visibility value.' } }
  const projectionBase = {
    source_dataset: record.dataset,
    source_record_id: record.id,
    source_version_id: record.source_version_id ?? null,
    source_publication_id: record.source_publication_id ?? null,
    title: record.title.trim(),
    subtitle: record.subtitle,
    summary: record.summary,
    keywords: [...record.keywords].map((item) => item.trim()).filter(Boolean),
    tags: [...record.tags].map((item) => item.trim()).filter(Boolean),
    image: record.image,
    canonical_url: record.canonical_url,
    search_weight: Number.isFinite(record.search_weight) ? record.search_weight : 0,
    visibility: record.permissions.visibility,
    permission_requirements: record.permissions,
    publication_status: 'published' as const,
    published_at: record.published_at,
    verified_at: record.verified_at ?? null,
    source_updated_at: record.source_updated_at ?? null,
    schema_version: SEARCH_PROJECTION_SCHEMA_VERSION,
  }
  const content_hash = deterministicHash({ ...projectionBase, relationships })
  return { projection: { ...projectionBase, projection_id: `${record.dataset}:${record.id}`, relationships, projection_updated_at: now, content_hash } }
}

export function deterministicHash(value: unknown): string {
  const input = stableStringify(value)
  let hash = 2166136261
  for (let index = 0; index < input.length; index++) { hash ^= input.charCodeAt(index); hash = Math.imul(hash, 16777619) }
  return `fnv1a:${(hash >>> 0).toString(16).padStart(8, '0')}`
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`).join(',')}}`
}

function isSafeCanonicalUrl(value: string): boolean { return value.startsWith('/') || value.startsWith('https://') }
function isValidPermissions(value: { visibility: SearchVisibility }): boolean { return ['public', 'authenticated', 'restricted', 'internal'].includes(value.visibility) }

export function relationshipProjectionIsValid(relationship: SearchRelationship): boolean {
  return Boolean(relationship.type && relationship.targetDataset && relationship.targetId)
}

