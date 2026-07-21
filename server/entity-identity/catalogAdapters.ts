import { createForgeId } from '../../shared/entity-identity/forgeId.js'
import type { EntityAdapterRecord } from '../../shared/entity-identity/contracts.js'

type Row = Record<string, unknown>

export function buildingIdentity(row: Row): EntityAdapterRecord | null {
  const key = typeof row.building_key === 'string' ? row.building_key : null
  const name = typeof row.building_name === 'string' ? row.building_name : null
  const forgeId = key ? createForgeId('building', key) : null
  if (!key || !name || !forgeId) return null
  const published = row.editorial_status === 'published' && row.published_version != null
  return { forgeId, canonicalRecordId: key, displayName: name, slug: typeof row.slug === 'string' ? row.slug : key, route: `/buildings/${encodeURIComponent(typeof row.slug === 'string' ? row.slug : key)}`, lifecycle: published ? 'published' : 'draft', sourceVersion: row.published_version == null ? null : String(row.published_version), resolverMetadata: { source: 'public.buildings', publication_id: row.publication_id ?? null } }
}

export function heroIdentity(row: Row): EntityAdapterRecord | null {
  const key = typeof row.slug === 'string' ? row.slug : null
  const name = typeof row.name === 'string' ? row.name : null
  const forgeId = key ? createForgeId('hero', key) : null
  if (!key || !name || !forgeId) return null
  const published = row.editorial_status === 'published' || row.status === 'published' || row.published_at != null
  return { forgeId, canonicalRecordId: typeof row.id === 'string' ? row.id : key, displayName: name, slug: key, route: `/companion/heroes/${encodeURIComponent(key)}`, lifecycle: published ? 'published' : 'draft', sourceVersion: typeof row.published_version === 'string' || typeof row.published_version === 'number' ? String(row.published_version) : null, resolverMetadata: { source: 'public.heroes' } }
}
