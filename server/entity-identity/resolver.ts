import { entityTypeRegistry } from '../../shared/entity-identity/registry.js'
import { parseForgeId } from '../../shared/entity-identity/forgeId.js'
import type { EntityAdapterRecord, EntityResolutionContext, EntityResolverAdapter, ResolutionMode, ResolvedEntity } from '../../shared/entity-identity/contracts.js'

const CAPABILITY_BY_MODE: Readonly<Record<ResolutionMode, string | null>> = {
  internal: 'entity.resolve.internal',
  editorial: 'entity.resolve.editorial',
  published: null,
  'public-route': null,
  search: null,
}

export class EntityResolver {
  private readonly adapters = new Map<string, EntityResolverAdapter>()

  register(adapter: EntityResolverAdapter): void {
    if (this.adapters.has(adapter.resolverKey)) throw new Error(`Resolver already registered: ${adapter.resolverKey}`)
    this.adapters.set(adapter.resolverKey, adapter)
  }

  async resolve(value: unknown, mode: ResolutionMode, context: EntityResolutionContext = {}): Promise<ResolvedEntity> {
    const parsed = parseForgeId(value)
    const definition = parsed ? entityTypeRegistry.byNamespace(parsed.namespace) : null
    const empty = (metadata: Readonly<Record<string, unknown>> = {}): ResolvedEntity => ({ forge_id: parsed?.forgeId ?? (typeof value === 'string' ? value as ResolvedEntity['forge_id'] : '' as ResolvedEntity['forge_id']), entity_type: definition?.key ?? 'unknown', local_key: parsed?.localKey ?? '', canonical_record_id: null, display_name: null, slug: null, route: null, publication_state: 'unknown', editorial_state: null, archive_state: null, resolver_metadata: metadata, source_version: null, found: false })
    if (!parsed || !definition || !definition.enabled) return empty({ reason: !parsed ? 'invalid_forge_id' : !definition ? 'unknown_namespace' : 'entity_type_disabled' })
    const requiredCapability = CAPABILITY_BY_MODE[mode]
    if (requiredCapability && !context.isServiceRole && context.isOwnerOrAdmin !== true && !context.capabilities?.includes(requiredCapability)) return empty({ reason: 'capability_required' })
    const adapter = this.adapters.get(definition.resolverKey)
    if (!adapter) return empty({ reason: 'resolver_unavailable' })
    const record = await adapter.resolve(parsed, mode, context)
    if (!record) return empty({ reason: 'not_found' })
    if ((mode === 'published' || mode === 'public-route' || mode === 'search') && (record.lifecycle !== 'published' || record.archiveState === 'archived')) return empty({ reason: 'not_published' })
    return toResolvedEntity(parsed.forgeId, definition.key, parsed.localKey, record)
  }
}

function toResolvedEntity(forgeId: ResolvedEntity['forge_id'], entityType: string, localKey: string, record: EntityAdapterRecord): ResolvedEntity {
  return { forge_id: forgeId, entity_type: entityType, local_key: localKey, canonical_record_id: record.canonicalRecordId, display_name: record.displayName, slug: record.slug, route: record.route, publication_state: record.lifecycle, editorial_state: record.editorialState ?? null, archive_state: record.archiveState ?? null, resolver_metadata: record.resolverMetadata ?? {}, source_version: record.sourceVersion ?? null, found: true }
}

export function createCatalogAdapter(resolverKey: string, records: readonly EntityAdapterRecord[]): EntityResolverAdapter {
  const byId = new Map(records.map((record) => [record.forgeId, record]))
  return { resolverKey, resolve: (id) => byId.get(id.forgeId) ?? null }
}
