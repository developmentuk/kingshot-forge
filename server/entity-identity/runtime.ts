import { getSupabaseAdmin } from '../database/supabaseAdmin.js'
import { createForgeId, parseForgeId } from '../../shared/entity-identity/forgeId.js'
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
  resolver.register(publishedHeroSkillAdapter())
  resolver.register(searchProjectionAdapter('building-progression', 'building-progression', 'building_progression'))
  for (const [namespace, dataset] of [
    ['event', 'events'],
    ['troop', 'troops'],
    ['gear', 'gear'],
    ['charm', 'charm'],
    ['research', 'research'],
    ['war-academy', 'war-academy'],
    ['dataset', 'datasets'],
    ['tool', 'tools'],
    ['calculator', 'calculators'],
  ] as const) resolver.register(searchProjectionAdapter(namespace, namespace, dataset))
  return resolver
}

function publishedHeroSkillAdapter(): EntityResolverAdapter {
  return { resolverKey: 'hero-skill', async resolve(id, _mode, _context) {
    const parsed = parseForgeId(id.forgeId)
    if (!parsed) return null
    const { data, error } = await getSupabaseAdmin()
      .from('published_hero_skills')
      .select('id,editorial_key,hero_slug,name,published_version,published_at')
      .eq('editorial_key', parsed.localKey)
      .maybeSingle()
    if (error || !data) return null
    const forgeId = createForgeId('hero-skill', String(data.editorial_key))
    if (!forgeId) return null
    return { forgeId, canonicalRecordId: String(data.id), displayName: String(data.name), slug: String(data.editorial_key), route: null, lifecycle: 'published', sourceVersion: data.published_version == null ? null : String(data.published_version), resolverMetadata: { source: 'public.published_hero_skills', hero_slug: data.hero_slug, published_at: data.published_at } }
  } }
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

function searchProjectionAdapter(resolverKey: string, namespace: string, sourceDataset: string): EntityResolverAdapter {
  return { resolverKey, async resolve(id, _mode, _context) {
    const parsed = parseForgeId(id.forgeId)
    if (!parsed) return null
    const { data, error } = await getSupabaseAdmin()
      .from('search_projections')
      .select('source_record_id,title,source_version_id,source_publication_id,publication_status,published_at')
      .eq('source_dataset', sourceDataset)
      .eq('source_record_id', parsed.localKey)
      .eq('publication_status', 'published')
      .maybeSingle()
    if (error || !data) return null
    const forgeId = createForgeId(namespace, String(data.source_record_id))
    if (!forgeId) return null
    return {
      forgeId,
      canonicalRecordId: String(data.source_record_id),
      displayName: String(data.title),
      slug: String(data.source_record_id),
      route: null,
      lifecycle: 'published',
      sourceVersion: data.source_version_id == null ? null : String(data.source_version_id),
      resolverMetadata: { source: 'public.search_projections', source_dataset: sourceDataset, source_publication_id: data.source_publication_id ?? null, published_at: data.published_at ?? null },
    }
  } }
}

function allowedMode(mode: ResolutionMode, context: EntityResolutionContext): boolean {
  return mode === 'published' || mode === 'public-route' || mode === 'search' || context.isServiceRole === true || context.isOwnerOrAdmin === true
}
