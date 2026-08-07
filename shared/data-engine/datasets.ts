export const DATASET_KEYS = [
  'heroes',
  'hero-skills',
  'hero-xp',
  'shards',
  'gear',
  'charm',
  'troops',
  'buildings',
  'truegold',
  'war-academy',
  'vip',
  'events',
  'masters',
  'kvk',
] as const

export type DatasetKey = (typeof DATASET_KEYS)[number]

export const PUBLISHED_DATASET_KEYS = [
  ...DATASET_KEYS,
  'items',
  'oasis-island',
] as const

export type PublishedDatasetKey =
  (typeof PUBLISHED_DATASET_KEYS)[number]

export const IMPORTABLE_DATASET_KEYS = [
  'heroes',
  'hero-xp',
  'shards',
  'gear',
  'charm',
  'troops',
  'buildings',
  'truegold',
  'war-academy',
  'vip',
  'events',
  'masters',
  'kvk',
] as const satisfies readonly DatasetKey[]

export type ImportableDatasetKey =
  (typeof IMPORTABLE_DATASET_KEYS)[number]

export function isDatasetKey(value: string): value is DatasetKey {
  return (DATASET_KEYS as readonly string[]).includes(value)
}

export function isPublishedDatasetKey(
  value: string,
): value is PublishedDatasetKey {
  return (PUBLISHED_DATASET_KEYS as readonly string[]).includes(value)
}

export function isImportableDatasetKey(
  value: string,
): value is ImportableDatasetKey {
  return (IMPORTABLE_DATASET_KEYS as readonly string[]).includes(value)
}
