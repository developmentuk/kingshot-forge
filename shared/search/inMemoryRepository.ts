import { SEARCH_PROJECTION_SCHEMA_VERSION, type SearchIndexMetadata, type SearchPermissionSimulationAudit, type SearchProjection, type SearchProjectionRepository, type SearchRefreshFailure, type SearchRefreshRun } from './persistence.js'
import type { SearchRelationship } from './contracts.js'
import { deterministicHash } from './projectionBuilder.js'

export class InMemorySearchProjectionRepository implements SearchProjectionRepository {
  private readonly projections = new Map<string, SearchProjection>()
  private readonly relationships = new Map<string, readonly SearchRelationship[]>()
  private readonly runs: SearchRefreshRun[] = []
  private readonly errors: Array<{ error: SearchRefreshFailure; occurredAt: string }> = []
  private readonly simulations: SearchPermissionSimulationAudit[] = []
  private metadata: SearchIndexMetadata = { index_version: 0, projection_count: 0, relationship_count: 0, last_successful_refresh: null, last_failed_refresh: null, cache_built_at: null, schema_version: SEARCH_PROJECTION_SCHEMA_VERSION, provider_versions: {}, stale: true }

  async listProjections(filter: { dataset?: string; recordIds?: readonly string[] } = {}): Promise<readonly SearchProjection[]> {
    return [...this.projections.values()].filter((projection) => (!filter.dataset || projection.source_dataset === filter.dataset) && (!filter.recordIds?.length || filter.recordIds.includes(projection.source_record_id)))
  }
  async getProjection(projectionId: string): Promise<SearchProjection | undefined> { return this.projections.get(projectionId) }
  async upsertProjection(projection: SearchProjection): Promise<'inserted' | 'updated' | 'unchanged'> {
    const existing = this.projections.get(projection.projection_id)
    if (existing && existing.content_hash === projection.content_hash) return 'unchanged'
    this.projections.set(projection.projection_id, projection)
    this.metadata.projection_count = this.projections.size
    return existing ? 'updated' : 'inserted'
  }
  async bulkUpsertProjections(projections: readonly SearchProjection[]) { const counts = { inserted: 0, updated: 0, unchanged: 0 }; for (const projection of projections) counts[await this.upsertProjection(projection)]++; return counts }
  async deleteProjection(projectionId: string): Promise<boolean> { const deleted = this.projections.delete(projectionId); this.relationships.delete(projectionId); this.metadata.projection_count = this.projections.size; return deleted }
  async deleteBySource(dataset: string, recordIds?: readonly string[]): Promise<number> { const targets = [...this.projections.values()].filter((projection) => projection.source_dataset === dataset && (!recordIds?.length || recordIds.includes(projection.source_record_id))); for (const target of targets) await this.deleteProjection(target.projection_id); return targets.length }
  async listRelationships(sourceProjectionId?: string) { return [...this.relationships.entries()].filter(([source]) => !sourceProjectionId || source === sourceProjectionId).flatMap(([source_projection_id, items]) => items.map((relationship) => ({ source_projection_id, relationship }))) }
  async replaceRelationships(sourceProjectionId: string, relationships: readonly SearchRelationship[]) { const previous = this.relationships.get(sourceProjectionId) ?? []; this.relationships.set(sourceProjectionId, relationships); this.metadata.relationship_count = [...this.relationships.values()].reduce((count, items) => count + items.length, 0); return { inserted: relationships.length, removed: previous.length } }
  async readIndexMetadata(): Promise<SearchIndexMetadata> { return { ...this.metadata, provider_versions: { ...this.metadata.provider_versions } } }
  async updateIndexMetadata(metadata: SearchIndexMetadata): Promise<void> { this.metadata = { ...metadata, provider_versions: { ...metadata.provider_versions } } }
  async recordRefreshRun(run: SearchRefreshRun): Promise<void> { this.runs.push(run) }
  async recordRefreshError(error: SearchRefreshFailure, occurredAt: string): Promise<void> { this.errors.push({ error, occurredAt }) }
  async recordPermissionSimulation(audit: SearchPermissionSimulationAudit): Promise<void> { this.simulations.push(audit) }
  get refreshRuns(): readonly SearchRefreshRun[] { return this.runs }
  get refreshErrors(): readonly { error: SearchRefreshFailure; occurredAt: string }[] { return this.errors }
  get permissionSimulations(): readonly SearchPermissionSimulationAudit[] { return this.simulations }
  projectionDigest(): string { return deterministicHash([...this.projections.values()].map((projection) => projection.content_hash).sort()) }
}

