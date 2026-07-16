export type HeroSkillCategory =
  | 'conquest'
  | 'expedition'
  | 'talent'
  | 'exclusive_gear'

export interface PublishedHeroSkill {
  id: string
  editorial_key: string
  hero_id: string
  hero_slug: string
  hero_name: string
  name: string
  category: HeroSkillCategory
  skill_type: string | null
  description: string | null
  icon_url: string | null
  display_order: number
  slot_index: number
  max_level: number
  source_updated_at: string | null
  source_verified: string | null
  source_accuracy_score: number | null
  source_name: string | null
  source_url: string | null
  published_version: number
  published_at: string
  updated_at: string
}
