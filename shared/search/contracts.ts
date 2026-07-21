export type SearchDataset = string
import type { ForgeId } from '../entity-identity/contracts.js'

export type SearchRecordStatus =
  | 'draft'
  | 'in_review'
  | 'approved'
  | 'published'
  | 'archived'
  | 'deprecated'

export type SearchVisibility = 'public' | 'authenticated' | 'restricted' | 'internal'

export interface SearchPermissionContext {
  userId?: string | null
  roles?: readonly string[]
  permissions?: readonly string[]
  isAdmin?: boolean
}

export interface SearchPermissions {
  visibility: SearchVisibility
  requiredRoles?: readonly string[]
  requiredPermissions?: readonly string[]
}

export type RelationshipType =
  | 'belongs_to' | 'requires' | 'uses' | 'recommended_with' | 'countered_by'
  | 'synergy_with' | 'appears_in' | 'published_by' | 'references'
  | 'derived_from' | 'related_to' | (string & {})

export interface SearchRelationship {
  type: RelationshipType
  targetId: string
  targetDataset: SearchDataset
  weight?: number
  label?: string
}

export type RelationshipConfidence = 'editorial_verified' | 'dataset_verified' | 'relationship_derived' | 'community_verified' | 'experimental'

export interface SearchRecord {
  id: string
  forge_id?: ForgeId | null
  dataset: SearchDataset
  title: string
  subtitle: string | null
  summary: string | null
  keywords: readonly string[]
  tags: readonly string[]
  image: string | null
  status: SearchRecordStatus
  published_at: string | null
  permissions: SearchPermissions
  relationships: readonly SearchRelationship[]
  canonical_url: string | null
  search_weight: number
  aliases?: readonly string[]
  source_version_id?: string | null
  source_publication_id?: string | null
  verified_at?: string | null
  source_updated_at?: string | null
  confidence?: RelationshipConfidence | null
  confidence_label?: string | null
}

export interface SearchQuery {
  text?: string
  keywords?: readonly string[]
  tags?: readonly string[]
  datasets?: readonly SearchDataset[]
  relationshipFrom?: string
  relationshipTypes?: readonly RelationshipType[]
  relationshipDepth?: number
  limit?: number
  includeUnpublished?: boolean
  permissions?: SearchPermissionContext
}

export interface SearchMatch {
  record: SearchRecord
  score: number
  reasons: readonly string[]
  relationshipType?: RelationshipType
  relationshipPath?: readonly string[]
  relationshipExplanation?: string
}

export interface SearchResponse {
  query: SearchQuery
  results: readonly SearchMatch[]
  indexedAt: string
  diagnostics: SearchDiagnostics
}

export interface SearchDiagnostics {
  recordsIndexed: number
  relationshipsIndexed: number
  orphanedRecords: number
  brokenReferences: number
  duplicateIdentifiers: number
  relationshipCycles: number
  permissionMismatches: number
  indexFreshness: string | null
  datasetCoverage: Readonly<Record<string, number>>
}

