export type SearchDestinationRecord = {
  id: string
  dataset: string
  canonical_url?: string | null
}

const DATASET_ROUTES: Record<string, (id: string) => string> = {
  heroes: (id) => `/companion/heroes/${encodeURIComponent(id)}`,
  kvk: () => '/kvk-tracker',
}

export function resolveSearchDestination(record: SearchDestinationRecord): string | null {
  const canonical = record.canonical_url?.trim()
  if (canonical?.startsWith('/') && !canonical.startsWith('/search')) return canonical
  return DATASET_ROUTES[record.dataset]?.(record.id) ?? null
}
