import type { VercelRequest, VercelResponse } from '@vercel/node'
import { readSingleQueryParameter } from '../server/http/requestQuery.js'
import { getSearchIndexCache } from '../server/search/runtime.js'
import { PUBLISHED_DATASET_KEYS } from '../shared/data-engine/datasets.js'
import type { SearchQuery } from '../shared/search/index.js'

const MAX_QUERY_LENGTH = 200
const MAX_RESULTS = 100
const MAX_TRAVERSAL_DEPTH = 2

function list(value: string | null): string[] | undefined {
  if (typeof value !== 'string') return undefined
  const items = value.split(',').map((item) => item.trim()).filter(Boolean)
  return items.length ? items : undefined
}

export function parseQuery(request: VercelRequest): SearchQuery {
  const textValue = readSingleQueryParameter(request.url, 'q')
  const text = typeof textValue === 'string' ? textValue.trim() : undefined
  if (text && text.length > MAX_QUERY_LENGTH) throw new SearchRequestError('query_too_long', 'Search queries must be 200 characters or fewer.')
  const datasets = list(readSingleQueryParameter(request.url, 'dataset'))
  if (datasets?.some((dataset) => !PUBLISHED_DATASET_KEYS.includes(dataset as typeof PUBLISHED_DATASET_KEYS[number]))) throw new SearchRequestError('invalid_dataset', 'One or more dataset filters are invalid.')
  const limitRaw = readSingleQueryParameter(request.url, 'limit') ?? undefined
  const limit = limitRaw ? Number(limitRaw) : 50
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_RESULTS) throw new SearchRequestError('invalid_limit', 'Result limits must be an integer from 1 to 100.')
  const depthRaw = readSingleQueryParameter(request.url, 'depth') ?? undefined
  const relationshipDepth = depthRaw ? Number(depthRaw) : undefined
  if (relationshipDepth !== undefined && (!Number.isInteger(relationshipDepth) || relationshipDepth < 1 || relationshipDepth > MAX_TRAVERSAL_DEPTH)) throw new SearchRequestError('invalid_depth', 'Relationship depth must be an integer from 1 to 2.')
  return {
    text,
    keywords: list(readSingleQueryParameter(request.url, 'keyword')),
    tags: list(readSingleQueryParameter(request.url, 'tag')),
    datasets,
    relationshipFrom: readSingleQueryParameter(request.url, 'relationshipFrom') ?? undefined,
    relationshipDepth,
    limit,
    permissions: { userId: null },
  }
}

export class SearchRequestError extends Error { constructor(readonly code: string, message: string) { super(message) } }

export default async function handler(request: VercelRequest, response: VercelResponse): Promise<void> {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    response.status(405).json({ status: 'error', error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed.' } })
    return
  }
  let query: SearchQuery
  try { query = parseQuery(request) } catch (error) { if (error instanceof SearchRequestError) { response.status(400).json({ status: 'error', error: { code: error.code.toUpperCase(), message: error.message } }); return }; throw error }
  const startedAt = performance.now()
  try {
    const cache = getSearchIndexCache()
    const result = await cache.query(query)
    const health = await cache.health()
      response.status(200).json({ status: 'success', data: { query: result.query, results: result.results.map(({ record, score, relationshipType, relationshipPath, relationshipExplanation }) => ({ record: { id: record.id, forge_id: record.forge_id, dataset: record.dataset, title: record.title, subtitle: record.subtitle, summary: record.summary, status: record.status, published_at: record.published_at, canonical_url: record.canonical_url, image: record.image, tags: record.tags, relationship_count: record.relationships.length, confidence: record.confidence, confidence_label: record.confidence_label }, score, relationshipType, relationshipPath, relationshipExplanation })), meta: { resultCount: result.results.length, filters: { datasets: query.datasets ?? [], tags: query.tags ?? [], keywords: query.keywords ?? [] }, executionTimeMs: Number((performance.now() - startedAt).toFixed(2)), indexVersion: health.index_version, indexFreshness: health.last_successful_refresh, stale: health.stale || health.fallback_active, relationshipDepth: query.relationshipDepth ?? 0, truncated: result.results.length >= (query.limit ?? MAX_RESULTS) } } })
  } catch {
    response.status(503).json({ status: 'error', error: { code: 'SEARCH_UNAVAILABLE', message: 'Search is temporarily unavailable.' } })
  }
}
