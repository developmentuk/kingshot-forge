import { buildSearchProjection } from './projectionBuilder.js'
import { projectionToSearchRecord, type SearchProjectionRepository } from './persistence.js'

export type SearchFindingSeverity = 'informational' | 'warning' | 'blocker'
export interface SearchOperationalFinding { severity: SearchFindingSeverity; code: string; message: string; count: number }
export interface SearchOperationalDiagnostics {
  persistedProjectionCount: number
  cachedIndexCount: number | null
  relationshipCount: number
  datasetCoverage: Readonly<Record<string, number>>
  providerCoverage: readonly string[]
  staleProjections: number
  orphanedProjections: number
  orphanedRelationships: number
  brokenEndpoints: number
  duplicateSourceIdentities: number
  duplicateCanonicalUrls: number
  invalidVisibilityStates: number
  permissionMismatches: number
  unpublishedContentPresent: number
  archivedOrDeprecatedLeakage: number
  projectionSchemaMismatches: number
  contentHashMismatches: number
  indexCacheVersionMismatch: boolean
  findings: readonly SearchOperationalFinding[]
}

export async function buildSearchOperationalDiagnostics(repository: SearchProjectionRepository): Promise<SearchOperationalDiagnostics> {
  const projections = await repository.listProjections(); const relationships = await repository.listRelationships(); const metadata = await repository.readIndexMetadata()
  const keys = new Set(projections.map((projection) => projection.projection_id)); const sources = new Set<string>(); const urls = new Map<string, number>(); const coverage: Record<string, number> = {}; let duplicateSourceIdentities = 0; let duplicateCanonicalUrls = 0; let brokenEndpoints = 0; let orphanedRelationships = 0; let invalidVisibilityStates = 0; let permissionMismatches = 0; let unpublishedContentPresent = 0; let archivedDeprecated = 0; let schemaMismatches = 0; let hashMismatches = 0
  for (const projection of projections) {
    const source = `${projection.source_dataset}:${projection.source_record_id}`; if (sources.has(source)) duplicateSourceIdentities++; sources.add(source); coverage[projection.source_dataset] = (coverage[projection.source_dataset] ?? 0) + 1
    if (projection.canonical_url) { urls.set(projection.canonical_url, (urls.get(projection.canonical_url) ?? 0) + 1) }
    if (!['public', 'authenticated', 'restricted', 'internal'].includes(projection.visibility)) invalidVisibilityStates++
    const publicationStatus = String(projection.publication_status)
    if (publicationStatus !== 'published') unpublishedContentPresent++
    if (publicationStatus === 'archived' || publicationStatus === 'deprecated') archivedDeprecated++
    if (projection.schema_version !== metadata.schema_version) schemaMismatches++
    const rebuilt = buildSearchProjection(projectionToSearchRecord(projection), projection.projection_updated_at, projection.relationships).projection
    if (!rebuilt || rebuilt.content_hash !== projection.content_hash) hashMismatches++
  }
  duplicateCanonicalUrls = [...urls.values()].filter((count) => count > 1).length
  for (const item of relationships) { if (!keys.has(item.source_projection_id)) orphanedRelationships++; if (!projections.some((projection) => projection.source_dataset === item.relationship.targetDataset && projection.source_record_id === item.relationship.targetId)) brokenEndpoints++ }
  const findings: SearchOperationalFinding[] = []
  addFinding(findings, 'blocker', 'unpublished_content_present', 'Unpublished content is present in the persistent public projection.', unpublishedContentPresent)
  addFinding(findings, 'blocker', 'archived_deprecated_leakage', 'Archived or deprecated content is present in the persistent projection.', archivedDeprecated)
  addFinding(findings, 'blocker', 'invalid_visibility', 'Projection visibility metadata is invalid.', invalidVisibilityStates)
  addFinding(findings, 'blocker', 'permission_mismatch', 'Projection permission metadata is inconsistent with the published public boundary.', permissionMismatches)
  addFinding(findings, 'warning', 'broken_relationship_endpoint', 'A relationship points to a missing projection endpoint.', brokenEndpoints)
  addFinding(findings, 'warning', 'orphaned_relationship', 'A relationship has no source projection.', orphanedRelationships)
  addFinding(findings, 'warning', 'content_hash_mismatch', 'Projection content hash does not match its canonical fields.', hashMismatches)
  addFinding(findings, 'warning', 'schema_mismatch', 'Projection schema version differs from the active index schema.', schemaMismatches)
  addFinding(findings, 'informational', 'duplicate_canonical_url', 'Multiple projections share a canonical URL.', duplicateCanonicalUrls)
  return { persistedProjectionCount: projections.length, cachedIndexCount: null, relationshipCount: relationships.length, datasetCoverage: coverage, providerCoverage: Object.keys(metadata.provider_versions), staleProjections: metadata.stale ? projections.length : 0, orphanedProjections: 0, orphanedRelationships, brokenEndpoints, duplicateSourceIdentities, duplicateCanonicalUrls, invalidVisibilityStates, permissionMismatches, unpublishedContentPresent, archivedOrDeprecatedLeakage: archivedDeprecated, projectionSchemaMismatches: schemaMismatches, contentHashMismatches: hashMismatches, indexCacheVersionMismatch: metadata.cache_built_at === null && metadata.index_version > 0, findings }
}

function addFinding(findings: SearchOperationalFinding[], severity: SearchFindingSeverity, code: string, message: string, count: number): void { if (count > 0) findings.push({ severity, code, message, count }) }

