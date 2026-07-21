export type ForgeId = string & { readonly __brand: 'ForgeId' }

export interface ParsedForgeId {
  readonly forgeId: ForgeId
  readonly namespace: string
  readonly localKey: string
}

export type EntityLifecycle = 'draft' | 'staged' | 'published' | 'archived'
export type ResolutionMode = 'internal' | 'editorial' | 'published' | 'public-route' | 'search'

export interface EntityTypeDefinition {
  readonly key: string
  readonly namespace: string
  readonly resolverKey: string
  readonly canonicalSource: string
  readonly publishedStateRule: string
  readonly routePolicy: string
  readonly searchAdapterKey: string
  readonly requiredReadCapability: string
  readonly requiredWriteCapability: string
  readonly mediaEligible: boolean
  readonly tagEligible: boolean
  readonly relationshipEligible: boolean
  readonly progressionEligible: boolean
  readonly archiveBehaviour: 'hide' | 'retain'
  readonly enabled: boolean
}

export interface EntityResolutionContext {
  readonly actorId?: string | null
  readonly capabilities?: readonly string[]
  readonly isServiceRole?: boolean
  readonly isOwnerOrAdmin?: boolean
}

export interface ResolvedEntity {
  readonly forge_id: ForgeId
  readonly entity_type: string
  readonly local_key: string
  readonly canonical_record_id: string | null
  readonly display_name: string | null
  readonly slug: string | null
  readonly route: string | null
  readonly publication_state: EntityLifecycle | 'unknown'
  readonly editorial_state: string | null
  readonly archive_state: string | null
  readonly resolver_metadata: Readonly<Record<string, unknown>>
  readonly source_version: string | null
  readonly found: boolean
}

export interface EntityAdapterRecord {
  readonly forgeId: ForgeId
  readonly canonicalRecordId: string
  readonly displayName: string
  readonly slug: string | null
  readonly route: string | null
  readonly lifecycle: EntityLifecycle
  readonly editorialState?: string | null
  readonly archiveState?: string | null
  readonly resolverMetadata?: Readonly<Record<string, unknown>>
  readonly sourceVersion?: string | null
}

export interface EntityResolverAdapter {
  readonly resolverKey: string
  resolve(id: ParsedForgeId, mode: ResolutionMode, context: EntityResolutionContext): Promise<EntityAdapterRecord | null> | EntityAdapterRecord | null
}

export interface LegacyIdentifier {
  readonly kind: 'slug' | 'dataset-key' | 'record-id' | 'search-projection-id' | 'editorial-record-id'
  readonly value: string
}

export interface LegacyIdentityMapping {
  readonly identifier: LegacyIdentifier
  readonly forgeId: ForgeId
  readonly source: string
}
