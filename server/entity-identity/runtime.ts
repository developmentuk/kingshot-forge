import { getSupabaseAdmin } from '../database/supabaseAdmin.js'
import { parseForgeId } from '../../shared/entity-identity/forgeId.js'
import { entityTypeRegistry } from '../../shared/entity-identity/registry.js'
import type { EntityResolutionContext, EntityResolverAdapter, ResolutionMode } from '../../shared/entity-identity/contracts.js'
import { EntityResolver } from './resolver.js'
import { buildingIdentity, heroIdentity } from './catalogAdapters.js'

let resolver: EntityResolver | null = null

export function getEntityResolver(): EntityResolver {
  if (resolver) return resolver
  resolver = new EntityResolver()
  resolver.register(supabaseAdapter('building', 'building', 'building_key', buildingIdentity))
  resolver.register(supabaseAdapter('hero', 'hero', 'slug', heroIdentity))
  return resolver
}

function supabaseAdapter(resolverKey: string, namespace: string, lookupColumn: string, mapper: (row: Record<string, unknown>) => ReturnType<typeof buildingIdentity>): EntityResolverAdapter {
  return { resolverKey, async resolve(id, mode, context) {
    const definition = entityTypeRegistry.byNamespace(namespace)
    if (!definition) return null
    const parsed = parseForgeId(id.forgeId)
    if (!parsed) return null
    const query = getSupabaseAdmin().from(definition.canonicalSource.replace('public.', '')).select('*').eq(lookupColumn, parsed.localKey).maybeSingle()
    const { data, error } = await query
    if (error || !data || !allowedMode(mode, context)) return null
    return mapper(data as Record<string, unknown>)
  } }
}

function allowedMode(mode: ResolutionMode, context: EntityResolutionContext): boolean {
  return mode === 'published' || mode === 'public-route' || mode === 'search' || context.isServiceRole === true || context.isOwnerOrAdmin === true
}
