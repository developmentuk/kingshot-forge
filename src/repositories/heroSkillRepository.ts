import { supabase } from '../lib/supabase'
import type { PublishedHeroSkill } from '../types/heroSkill'

export async function getPublishedHeroSkills(
  heroSlug: string,
): Promise<PublishedHeroSkill[]> {
  const { data, error } = await supabase
    .from('published_hero_skills')
    .select('*')
    .eq('hero_slug', heroSlug)
    .order('display_order', { ascending: true })
    .order('slot_index', { ascending: true })
    .order('editorial_key', { ascending: true })

  if (error) {
    throw new Error(
      `Unable to load published Hero Skills: ${error.message}`,
    )
  }

  return (data ?? []) as PublishedHeroSkill[]
}
