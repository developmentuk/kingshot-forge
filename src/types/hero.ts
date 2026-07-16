export type HeroTroopType =
  | 'infantry'
  | 'cavalry'
  | 'archer'

export type HeroRarity =
  | 'rare'
  | 'epic'
  | 'legendary'
  | 'mythic'

export type HeroTier =
  | 'S+'
  | 'S'
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | '-'

export type HeroGearPosition =
  | 'top_left'
  | 'top_right'
  | 'bottom_left'
  | 'bottom_right'

export interface Hero {
  id: string
  name: string
  slug: string
  generation: number | null
  troop_type: HeroTroopType
  rarity: HeroRarity
  rally_tier: HeroTier | null
  garrison_tier: HeroTier | null
  bear_tier: HeroTier | null
  joiner_tier: HeroTier | null
  is_f2p: boolean | null
  is_vip: boolean | null
  best_use: string | null
  description: string | null
  tags: string[]
  portrait_url: string | null
  is_active: boolean
  source_updated_at: string | null
  source_verified: string | null
  source_accuracy_score: number | null
  source_name: string | null
  source_url: string | null
  created_at: string
  updated_at: string
}

export interface PlayerHero {
  id: string
  player_account_id: string
  hero_id: string
  hero_level: number | null
  star_level: number | null
  hero_power: number | null
  awakening_level: number | null
  skill_1_level: number | null
  skill_2_level: number | null
  skill_3_level: number | null
  skill_4_level: number | null
  skill_5_level: number | null
  skill_6_level: number | null
  gear_top_left_level: number | null
  gear_top_right_level: number | null
  gear_bottom_left_level: number | null
  gear_bottom_right_level: number | null
  widget_level: number | null
  is_owned: boolean
  is_showcase: boolean
  display_order: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface PlayerHeroWithHero extends PlayerHero {
  hero: Hero
}

export interface HeroEditorValues {
  heroId: string
  heroLevel: number | null
  starLevel: number | null
  heroPower: number | null
  awakeningLevel: number | null
  skill1Level: number | null
  skill2Level: number | null
  skill3Level: number | null
  skill4Level: number | null
  skill5Level?: number | null
  skill6Level?: number | null
  gearTopLeftLevel?: number | null
  gearTopRightLevel?: number | null
  gearBottomLeftLevel?: number | null
  gearBottomRightLevel?: number | null
  /** Legacy compatibility only; ignored by the current persistence model. */
  exclusiveGearLevel?: number | null
  widgetLevel: number | null
  isOwned: boolean
  isShowcase: boolean
  displayOrder: number | null
  notes: string
}

export interface HeroShowcaseSlot {
  position: number
  playerHero: PlayerHeroWithHero | null
}
