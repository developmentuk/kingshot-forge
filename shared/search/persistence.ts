import type { SearchPermissions, SearchRelationship, SearchRecord, SearchVisibility } from './contracts.js'

export const SEARCH_PROJECTION_SCHEMA_VERSION = 1

export interface SearchProjection {
  projection_id: string
  source_dataset: string
  source_record_id: string
  forge_id: string | null
  source_version_id: string | null
  source_publication_id: string | null
  title: string
  subtitle: string | null
  summary: string | null
  keywords: readonly string[]
  tags: readonly string[]
  image: string | null
  canonical_url: string | null
  search_weight: number
  visibility: SearchVisibility
  permission_requirements: SearchPermissions
  publication_status: 'published'
  published_at: string
  verified_at: string | null
  source_updated_at: string | null
  projection_updated_at: string
  content_hash: string
  schema_version: number
  relationships: readonly SearchRelationship[]
}

export interface SearchIndexMetadata {
  index_version: number
  projection_count: number
  relationship_count: number
  last_successful_refresh: string | null
  last_failed_refresh: string | null
  cache_built_at: string | null
  schema_version: number
  provider_versions: Readonly<Record<string, string>>
  stale: boolean
}

export type SearchRefreshMode = 'full' | 'dataset' | 'record' | 'relationships'

export interface SearchRefreshRun {
  run_id: string
  mode: SearchRefreshMode
  datasets_requested: readonly string[]
  records_inspected: number
  records_inserted: number
  records_updated: number
  records_unchanged: number
  records_removed: number
  relationships_inserted: number
  relationships_removed: number
  failures: readonly SearchRefreshFailure[]
  started_at: string
  finished_at: string
  duration_ms: number
  resulting_index_version: number
}

export interface SearchRefreshFailure {
  dataset: string
  record_id?: string
  code: string
  message: string
}

export interface SearchPermissionSimulationAudit {
  real_actor_id: string
  simulated_role: string
  simulated_permissions: readonly string[]
  occurred_at: string
}

export interface SearchProjectionRepository {
  listProjections(filter?: { dataset?: string; recordIds?: readonly string[] }): Promise<readonly SearchProjection[]>
  getProjection(projectionId: string): Promise<SearchProjection | undefined>
  upsertProjection(projection: SearchProjection): Promise<'inserted' | 'updated' | 'unchanged'>
  bulkUpsertProjections(projections: readonly SearchProjection[]): Promise<{ inserted: number; updated: number; unchanged: number }>
  deleteProjection(projectionId: string): Promise<boolean>
  deleteBySource(dataset: string, recordIds?: readonly string[]): Promise<number>
  listRelationships(sourceProjectionId?: string): Promise<readonly { source_projection_id: string; relationship: SearchRelationship }[]>
  replaceRelationships(sourceProjectionId: string, relationships: readonly SearchRelationship[]): Promise<{ inserted: number; removed: number }>
  readIndexMetadata(): Promise<SearchIndexMetadata>
  updateIndexMetadata(metadata: SearchIndexMetadata): Promise<void>
  recordRefreshRun(run: SearchRefreshRun): Promise<void>
  recordRefreshError(error: SearchRefreshFailure, occurredAt: string): Promise<void>
  recordPermissionSimulation(audit: SearchPermissionSimulationAudit): Promise<void>
}

export function projectionToSearchRecord(projection: SearchProjection): SearchRecord {
  return {
    id: projection.source_record_id,
    forge_id: projection.forge_id as SearchRecord['forge_id'],
    dataset: projection.source_dataset,
    title: projection.title,
    subtitle: projection.subtitle,
    summary: projection.summary,
    keywords: projection.keywords,
    tags: projection.tags,
    image: projection.image,
    status: projection.publication_status,
    published_at: projection.published_at,
    permissions: projection.permission_requirements,
    relationships: projection.relationships,
    canonical_url: projection.canonical_url,
    search_weight: projection.search_weight,
    source_version_id: projection.source_version_id,
    source_publication_id: projection.source_publication_id,
    verified_at: projection.verified_at,
    source_updated_at: projection.source_updated_at,
  }
}

