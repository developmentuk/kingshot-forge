import type {
  Hero,
  PlayerHeroWithHero,
} from './hero'

export type HeroSkillCategory =
  | 'conquest'
  | 'expedition'
  | 'talent'
  | 'exclusive_gear'

export type HeroGearPosition =
  | 'top_left'
  | 'top_right'
  | 'bottom_left'
  | 'bottom_right'

export interface HeroSkill {
  id: string
  hero_id: string

  name: string
  category: HeroSkillCategory
  slot_index: number
  max_level: number

  skill_type: string | null
  description: string | null
  icon_url: string | null

  display_order: number

  created_at: string
  updated_at: string
}

export interface PlayerHeroSkill {
  id: string
  player_hero_id: string
  hero_skill_id: string

  skill_level: number | null

  created_at: string
  updated_at: string
}

export interface PlayerHeroSkillWithDefinition
  extends PlayerHeroSkill {
  skill: HeroSkill
}

export interface PlayerHeroGear {
  id: string
  player_hero_id: string

  position: HeroGearPosition

  gear_level: number | null
  enhancement_level: number | null

  created_at: string
  updated_at: string
}

export interface HeroExclusiveGear {
  id: string
  hero_id: string

  name: string
  icon_url: string | null
  description: string | null

  created_at: string
  updated_at: string
}

export interface PlayerHeroExclusiveGear {
  id: string
  player_hero_id: string
  hero_exclusive_gear_id: string

  gear_level: number | null

  created_at: string
  updated_at: string
}

export interface PlayerHeroExclusiveGearWithDefinition
  extends PlayerHeroExclusiveGear {
  exclusiveGear: HeroExclusiveGear
}

export interface HeroProgression {
  hero: Hero
  playerHero?: PlayerHeroWithHero

  skills: HeroSkill[]
  playerSkills: PlayerHeroSkillWithDefinition[]

  gear: PlayerHeroGear[]

  exclusiveGear?: HeroExclusiveGear
  playerExclusiveGear?:
    PlayerHeroExclusiveGearWithDefinition
}

export interface HeroSkillLevelInput {
  heroSkillId: string
  skillLevel: number | null
}

export interface HeroGearInput {
  position: HeroGearPosition
  gearLevel: number | null
  enhancementLevel: number | null
}

export interface HeroExclusiveGearInput {
  heroExclusiveGearId: string
  gearLevel: number | null
}

export interface HeroProgressionEditorValues {
  heroId: string

  heroLevel: number | null
  starLevel: number | null
  heroPower: number | null

  isOwned: boolean
  isShowcase: boolean
  displayOrder: number | null
  notes: string

  skills: HeroSkillLevelInput[]
  gear: HeroGearInput[]

  exclusiveGear:
    | HeroExclusiveGearInput
    | null
}