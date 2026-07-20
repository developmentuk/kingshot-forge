import { SearchEngine } from './engine.js'
import { diagnoseSearchIndex } from './diagnostics.js'
import { projectionToSearchRecord, type SearchIndexMetadata, type SearchProjectionRepository } from './persistence.js'
import type { SearchQuery, SearchResponse } from './contracts.js'

export interface SearchCacheHealth extends SearchIndexMetadata { cache_age_ms: number | null; fallback_active: boolean }

export class SearchIndexCache {
  private engine: SearchEngine | null = null
  private builtAt: string | null = null
  private fallbackActive = false

  constructor(private readonly repository: SearchProjectionRepository) {}

  async query(query: SearchQuery, now = new Date().toISOString()): Promise<SearchResponse> {
    await this.ensureReady(now)
    if (!this.engine) throw new Error('Search index is unavailable.')
    return this.engine.query(query)
  }

  async ensureReady(now = new Date().toISOString()): Promise<void> {
    if (this.engine) return
    const projections = await this.repository.listProjections()
    const metadata = await this.repository.readIndexMetadata()
    const relationships = await this.repository.listRelationships()
    const bySource = new Map<string, typeof relationships>()
    for (const relationship of relationships) bySource.set(relationship.source_projection_id, [...(bySource.get(relationship.source_projection_id) ?? []), relationship])
    this.engine = new SearchEngine()
    this.engine.index(projections.map((projection) => projectionToSearchRecord({ ...projection, relationships: bySource.get(projection.projection_id)?.map((item) => item.relationship) ?? [] })), now)
    this.builtAt = now; this.fallbackActive = metadata.stale
    await this.repository.updateIndexMetadata({ ...metadata, cache_built_at: now })
  }

  async invalidate(): Promise<void> { this.engine = null; this.builtAt = null; this.fallbackActive = false }
  async health(): Promise<SearchCacheHealth> { const metadata = await this.repository.readIndexMetadata(); return { ...metadata, cache_age_ms: this.builtAt ? Date.now() - Date.parse(this.builtAt) : null, fallback_active: this.fallbackActive } }
  async rebuild(): Promise<void> { await this.invalidate(); await this.ensureReady() }
  diagnostics() { return this.engine ? this.engine.query({ limit: 0 }).diagnostics : diagnoseSearchIndex([], new Date(0).toISOString()) }
}

