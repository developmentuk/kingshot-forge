import { getKingshotDataset } from './kingshotDataService'

export type KingshotHeroTier =
  | 'S+'
  | 'S'
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | '-'

export type KingshotHeroRarity =
  | 'epic'
  | 'legendary'
  | 'mythic'

export type KingshotHeroTroop =
  | 'infantry'
  | 'cavalry'
  | 'archer'

export interface KingshotReferenceHero {
  name: string
  gen: number
  rarity: KingshotHeroRarity
  troop: KingshotHeroTroop
  rally: KingshotHeroTier
  garrison: KingshotHeroTier
  bear: KingshotHeroTier
  joiner: KingshotHeroTier
  f2p: boolean
  vip?: boolean
  bestUse: string
  desc: string
  tags: string[]
}

interface HeroesDatasetResponse {
  _meta: {
    dataset: string
    title: string
    updated?: string
    verified?: string
    accuracyScore?: number
  }
  heroes: KingshotReferenceHero[]
}

export async function getKingshotHeroes() {
  const dataset =
    await getKingshotDataset<HeroesDatasetResponse>(
      'heroes',
    )

  return dataset.heroes
}

export async function getF2pKingshotHeroes() {
  const heroes = await getKingshotHeroes()

  return heroes.filter((hero) => hero.f2p)
}

export async function getKingshotHeroByName(
  heroName: string,
) {
  const heroes = await getKingshotHeroes()

  const normalisedName =
    heroName.trim().toLowerCase()

  return (
    heroes.find(
      (hero) =>
        hero.name.toLowerCase() ===
        normalisedName,
    ) ?? null
  )
}