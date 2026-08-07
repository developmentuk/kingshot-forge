import { buildPublicRoute } from '../../../shared/entity-identity/registry.js'

export type SearchDestinationRecord = {
  id: string
  dataset: string
  canonical_url?: string | null
  forge_id?: string | null
}

const DATASET_ROUTES: Record<string, (id: string) => string> = {
  heroes: (id) => `/companion/heroes/${encodeURIComponent(id)}`,
  'oasis-island': (id) => `/oasis-island/buildings/${encodeURIComponent(id)}`,
  kvk: () => '/kvk-tracker',
}

export function resolveSearchDestination(record: SearchDestinationRecord): string | null {
  if (record.forge_id) {
    const route = buildPublicRoute(record.forge_id, record.id)
    if (route) return route
  }
  const canonical = record.canonical_url?.trim()
  if (canonical?.startsWith('/') && !canonical.startsWith('/search')) return canonical
  return DATASET_ROUTES[record.dataset]?.(record.id) ?? null
}
