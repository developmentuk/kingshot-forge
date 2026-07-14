const KINGSHOT_PRO_DATA_URL =
  'https://kingshotpro.com/data'

export type KingshotProDatasetName =
  | 'heroes'
  | 'hero-xp'
  | 'shards'
  | 'gear'
  | 'charm'
  | 'troops'
  | 'vip'
  | 'buildings'
  | 'truegold'
  | 'war-academy'
  | 'events'
  | 'kvk'
  | 'masters'

const datasetCache = new Map<
  KingshotProDatasetName,
  unknown
>()

export async function getKingshotDataset<T>(
  dataset: KingshotProDatasetName,
  forceRefresh = false,
): Promise<T> {
  if (
    !forceRefresh &&
    datasetCache.has(dataset)
  ) {
    return datasetCache.get(dataset) as T
  }

  const response = await fetch(
    `${KINGSHOT_PRO_DATA_URL}/${dataset}.json`,
    {
      headers: {
        Accept: 'application/json',
      },
    },
  )

  if (!response.ok) {
    throw new Error(
      `Unable to load ${dataset}: ${response.status} ${response.statusText}`,
    )
  }

  const data = (await response.json()) as T

  datasetCache.set(dataset, data)

  return data
}

export function clearKingshotDatasetCache(
  dataset?: KingshotProDatasetName,
) {
  if (dataset) {
    datasetCache.delete(dataset)
    return
  }

  datasetCache.clear()
}