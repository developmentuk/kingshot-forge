import { supabase } from '../lib/supabase'
import type {
  Hero,
  HeroEditorValues,
  HeroGearPosition,
  PlayerHeroWithHero,
} from '../types/hero'
import { getActiveHeroes } from '../repositories/heroRepository'

interface PlayerHeroGearRow {
  position: HeroGearPosition
  gear_level: number | null
}

interface PlayerHeroRow {
  id: string
  player_account_id: string
  hero_id: string
  hero_level: number | null
  star_level: number | null
  awakening_level: number | null
  hero_power: number | null
  skill_1_level: number | null
  skill_2_level: number | null
  skill_3_level: number | null
  skill_4_level: number | null
  skill_5_level: number | null
  skill_6_level: number | null
  widget_level: number | null
  is_owned: boolean
  is_showcase: boolean
  display_order: number | null
  notes: string | null
  created_at: string
  updated_at: string
  hero: Hero | Hero[] | null
  gear: PlayerHeroGearRow[] | null
}

function getGearLevel(
  gear: PlayerHeroGearRow[] | null,
  position: HeroGearPosition,
) {
  return gear?.find((item) => item.position === position)?.gear_level ?? null
}

function normaliseJoinedHero(
  row: PlayerHeroRow,
): PlayerHeroWithHero | null {
  const joinedHero = Array.isArray(row.hero)
    ? row.hero[0]
    : row.hero

  if (!joinedHero) {
    return null
  }

  return {
    id: row.id,
    player_account_id: row.player_account_id,
    hero_id: row.hero_id,
    hero_level: row.hero_level,
    star_level: row.star_level,
    hero_power: row.hero_power,
    awakening_level: row.awakening_level,
    skill_1_level: row.skill_1_level,
    skill_2_level: row.skill_2_level,
    skill_3_level: row.skill_3_level,
    skill_4_level: row.skill_4_level,
    skill_5_level: row.skill_5_level,
    skill_6_level: row.skill_6_level,
    gear_top_left_level: getGearLevel(row.gear, 'top_left'),
    gear_top_right_level: getGearLevel(row.gear, 'top_right'),
    gear_bottom_left_level: getGearLevel(row.gear, 'bottom_left'),
    gear_bottom_right_level: getGearLevel(row.gear, 'bottom_right'),
    widget_level: row.widget_level,
    is_owned: row.is_owned,
    is_showcase: row.is_showcase,
    display_order: row.display_order,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
    hero: joinedHero,
  }
}

export async function getHeroCatalogue(): Promise<Hero[]> {
  return getActiveHeroes()
}

export async function getPlayerHeroes(
  playerAccountId: string,
): Promise<PlayerHeroWithHero[]> {
  const { data, error } = await supabase
    .from('player_heroes')
    .select(`
      id,
      player_account_id,
      hero_id,
      hero_level,
      star_level,
      hero_power,
      awakening_level,
      skill_1_level,
      skill_2_level,
      skill_3_level,
      skill_4_level,
      skill_5_level,
      skill_6_level,
      widget_level,
      is_owned,
      is_showcase,
      display_order,
      notes,
      created_at,
      updated_at,
      gear:player_hero_gear (
        position,
        gear_level
      ),
      hero:heroes (
        id,
        name,
        slug,
        generation,
        troop_type,
        rarity,
        rally_tier,
        garrison_tier,
        bear_tier,
        joiner_tier,
        is_f2p,
        is_vip,
        best_use,
        portrait_url,
        description,
        tags,
        is_active,
        source_updated_at,
        source_verified,
        source_accuracy_score,
        source_name,
        source_url,
        created_at,
        updated_at
      )
    `)
    .eq('player_account_id', playerAccountId)
    .order('is_showcase', { ascending: false })
    .order('display_order', {
      ascending: true,
      nullsFirst: false,
    })

  if (error) {
    throw new Error(
      `Unable to load the player's heroes: ${error.message}`,
    )
  }

  return ((data ?? []) as unknown as PlayerHeroRow[])
    .map(normaliseJoinedHero)
    .filter(
      (hero): hero is PlayerHeroWithHero =>
        hero !== null,
    )
}

export async function getHeroShowcase(
  playerAccountId: string,
): Promise<PlayerHeroWithHero[]> {
  const heroes = await getPlayerHeroes(playerAccountId)

  return heroes
    .filter((hero) => hero.is_showcase)
    .sort(
      (first, second) =>
        (first.display_order ?? 99) -
        (second.display_order ?? 99),
    )
}

export async function savePlayerHero(
  playerAccountId: string,
  values: HeroEditorValues,
): Promise<void> {
  const displayOrder = values.isShowcase
    ? values.displayOrder
    : null

  const { data, error } = await supabase
    .from('player_heroes')
    .upsert(
      {
        player_account_id: playerAccountId,
        hero_id: values.heroId,
        hero_level: values.heroLevel,
        star_level: values.starLevel,
        awakening_level: values.awakeningLevel,
        hero_power: values.heroPower,
        skill_1_level: values.skill1Level,
        skill_2_level: values.skill2Level,
        skill_3_level: values.skill3Level,
        skill_4_level: values.skill4Level,
        skill_5_level: values.skill5Level,
        skill_6_level: values.skill6Level,
        widget_level: values.widgetLevel,
        is_owned: values.isOwned,
        is_showcase: values.isShowcase,
        display_order: displayOrder,
        notes: values.notes.trim() || null,
      },
      {
        onConflict: 'player_account_id,hero_id',
      },
    )
    .select('id')
    .single()

  if (error || !data) {
    throw new Error(
      `Unable to save the hero: ${error?.message ?? 'No record returned.'}`,
    )
  }

  const gearRows = [
    ['top_left', values.gearTopLeftLevel],
    ['top_right', values.gearTopRightLevel],
    ['bottom_left', values.gearBottomLeftLevel],
    ['bottom_right', values.gearBottomRightLevel],
  ].map(([position, gearLevel]) => ({
    player_hero_id: data.id,
    position,
    gear_level: gearLevel,
    enhancement_level: null,
  }))

  const { error: gearError } = await supabase
    .from('player_hero_gear')
    .upsert(gearRows, {
      onConflict: 'player_hero_id,position',
    })

  if (gearError) {
    throw new Error(
      `Hero saved, but gear levels could not be saved: ${gearError.message}`,
    )
  }
}

export async function removePlayerHero(
  playerAccountId: string,
  heroId: string,
): Promise<void> {
  const { error } = await supabase
    .from('player_heroes')
    .delete()
    .eq('player_account_id', playerAccountId)
    .eq('hero_id', heroId)

  if (error) {
    throw new Error(
      `Unable to remove the hero: ${error.message}`,
    )
  }
}

export async function clearHeroShowcase(
  playerAccountId: string,
): Promise<void> {
  const { error } = await supabase
    .from('player_heroes')
    .update({
      is_showcase: false,
      display_order: null,
    })
    .eq('player_account_id', playerAccountId)
    .eq('is_showcase', true)

  if (error) {
    throw new Error(
      `Unable to clear the Hero Showcase: ${error.message}`,
    )
  }
}
