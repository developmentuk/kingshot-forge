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

export function isImportableDatasetKey(
  value: string,
): value is ImportableDatasetKey {
  return (IMPORTABLE_DATASET_KEYS as readonly string[]).includes(value)
}
