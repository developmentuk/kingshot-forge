import { supabase } from '../lib/supabase'
import type {
  Hero,
  PlayerHeroWithHero,
} from '../types/hero'
import type {
  HeroExclusiveGear,
  HeroGearInput,
  HeroProgression,
  HeroProgressionEditorValues,
  HeroSkill,
  PlayerHeroExclusiveGearWithDefinition,
  PlayerHeroGear,
  PlayerHeroSkillWithDefinition,
} from '../types/heroProgression'

interface PlayerHeroIdRow {
  id: string
}

interface PlayerHeroSkillRow {
  id: string
  player_hero_id: string
  hero_skill_id: string
  skill_level: number | null
  created_at: string
  updated_at: string
  skill: HeroSkill | HeroSkill[] | null
}

interface PlayerHeroExclusiveGearRow {
  id: string
  player_hero_id: string
  hero_exclusive_gear_id: string
  gear_level: number | null
  created_at: string
  updated_at: string
  exclusiveGear:
    | HeroExclusiveGear
    | HeroExclusiveGear[]
    | null
}

function normalisePlayerSkill(
  row: PlayerHeroSkillRow,
): PlayerHeroSkillWithDefinition | null {
  const skill = Array.isArray(row.skill)
    ? row.skill[0]
    : row.skill

  if (!skill) {
    return null
  }

  return {
    id: row.id,
    player_hero_id: row.player_hero_id,
    hero_skill_id: row.hero_skill_id,
    skill_level: row.skill_level,
    created_at: row.created_at,
    updated_at: row.updated_at,
    skill,
  }
}

function normalisePlayerExclusiveGear(
  row: PlayerHeroExclusiveGearRow,
):
  | PlayerHeroExclusiveGearWithDefinition
  | undefined {
  const exclusiveGear = Array.isArray(
    row.exclusiveGear,
  )
    ? row.exclusiveGear[0]
    : row.exclusiveGear

  if (!exclusiveGear) {
    return undefined
  }

  return {
    id: row.id,
    player_hero_id: row.player_hero_id,
    hero_exclusive_gear_id:
      row.hero_exclusive_gear_id,
    gear_level: row.gear_level,
    created_at: row.created_at,
    updated_at: row.updated_at,
    exclusiveGear,
  }
}

async function getPlayerHeroId(
  playerAccountId: string,
  heroId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('player_heroes')
    .select('id')
    .eq('player_account_id', playerAccountId)
    .eq('hero_id', heroId)
    .maybeSingle()

  if (error) {
    throw new Error(
      `Unable to find the player hero record: ${error.message}`,
    )
  }

  return (data as PlayerHeroIdRow | null)?.id ?? null
}

async function getHeroSkills(
  heroId: string,
): Promise<HeroSkill[]> {
  const { data, error } = await supabase
    .from('hero_skills')
    .select(`
      id,
      hero_id,
      name,
      category,
      slot_index,
      max_level,
      skill_type,
      description,
      icon_url,
      display_order,
      created_at,
      updated_at
    `)
    .eq('hero_id', heroId)
    .order('display_order', {
      ascending: true,
    })

  if (error) {
    throw new Error(
      `Unable to load hero skills: ${error.message}`,
    )
  }

  return (data ?? []) as HeroSkill[]
}

async function getHeroExclusiveGear(
  heroId: string,
): Promise<HeroExclusiveGear | undefined> {
  const { data, error } = await supabase
    .from('hero_exclusive_gear')
    .select(`
      id,
      hero_id,
      name,
      icon_url,
      description,
      created_at,
      updated_at
    `)
    .eq('hero_id', heroId)
    .maybeSingle()

  if (error) {
    throw new Error(
      `Unable to load Exclusive Gear: ${error.message}`,
    )
  }

  return (
    (data as HeroExclusiveGear | null) ??
    undefined
  )
}

async function getPlayerSkills(
  playerHeroId: string,
): Promise<PlayerHeroSkillWithDefinition[]> {
  const { data, error } = await supabase
    .from('player_hero_skills')
    .select(`
      id,
      player_hero_id,
      hero_skill_id,
      skill_level,
      created_at,
      updated_at,
      skill:hero_skills (
        id,
        hero_id,
        name,
        category,
        slot_index,
        max_level,
        skill_type,
        description,
        icon_url,
        display_order,
        created_at,
        updated_at
      )
    `)
    .eq('player_hero_id', playerHeroId)

  if (error) {
    throw new Error(
      `Unable to load player skill levels: ${error.message}`,
    )
  }

  return (
    (data ?? []) as unknown as PlayerHeroSkillRow[]
  )
    .map(normalisePlayerSkill)
    .filter(
      (
        item,
      ): item is PlayerHeroSkillWithDefinition =>
        item !== null,
    )
    .sort(
      (first, second) =>
        first.skill.display_order -
        second.skill.display_order,
    )
}

async function getPlayerGear(
  playerHeroId: string,
): Promise<PlayerHeroGear[]> {
  const { data, error } = await supabase
    .from('player_hero_gear')
    .select(`
      id,
      player_hero_id,
      position,
      gear_level,
      enhancement_level,
      created_at,
      updated_at
    `)
    .eq('player_hero_id', playerHeroId)

  if (error) {
    throw new Error(
      `Unable to load player hero gear: ${error.message}`,
    )
  }

  return (data ?? []) as PlayerHeroGear[]
}

async function getPlayerExclusiveGear(
  playerHeroId: string,
): Promise<
  | PlayerHeroExclusiveGearWithDefinition
  | undefined
> {
  const { data, error } = await supabase
    .from('player_hero_exclusive_gear')
    .select(`
      id,
      player_hero_id,
      hero_exclusive_gear_id,
      gear_level,
      created_at,
      updated_at,
      exclusiveGear:hero_exclusive_gear (
        id,
        hero_id,
        name,
        icon_url,
        description,
        created_at,
        updated_at
      )
    `)
    .eq('player_hero_id', playerHeroId)
    .maybeSingle()

  if (error) {
    throw new Error(
      `Unable to load player Exclusive Gear: ${error.message}`,
    )
  }

  if (!data) {
    return undefined
  }

  return normalisePlayerExclusiveGear(
    data as unknown as PlayerHeroExclusiveGearRow,
  )
}

export async function getHeroProgression(
  playerAccountId: string,
  hero: Hero,
  playerHero?: PlayerHeroWithHero,
): Promise<HeroProgression> {
  const playerHeroId =
    playerHero?.id ??
    (await getPlayerHeroId(
      playerAccountId,
      hero.id,
    ))

  const [
    skills,
    exclusiveGear,
  ] = await Promise.all([
    getHeroSkills(hero.id),
    getHeroExclusiveGear(hero.id),
  ])

  if (!playerHeroId) {
    return {
      hero,
      playerHero,
      skills,
      playerSkills: [],
      gear: [],
      exclusiveGear,
      playerExclusiveGear: undefined,
    }
  }

  const [
    playerSkills,
    gear,
    playerExclusiveGear,
  ] = await Promise.all([
    getPlayerSkills(playerHeroId),
    getPlayerGear(playerHeroId),
    getPlayerExclusiveGear(playerHeroId),
  ])

  return {
    hero,
    playerHero,
    skills,
    playerSkills,
    gear,
    exclusiveGear,
    playerExclusiveGear,
  }
}

async function upsertPlayerHero(
  playerAccountId: string,
  values: HeroProgressionEditorValues,
): Promise<string> {
  const { data, error } = await supabase
    .from('player_heroes')
    .upsert(
      {
        player_account_id: playerAccountId,
        hero_id: values.heroId,
        hero_level: values.heroLevel,
        star_level: values.starLevel,
        hero_power: values.heroPower,
        is_owned: values.isOwned,
        is_showcase:
          values.isOwned &&
          values.isShowcase,
        display_order:
          values.isOwned &&
          values.isShowcase
            ? values.displayOrder
            : null,
        notes:
          values.notes.trim() || null,
      },
      {
        onConflict:
          'player_account_id,hero_id',
      },
    )
    .select('id')
    .single()

  if (error) {
    throw new Error(
      `Unable to save the hero: ${error.message}`,
    )
  }

  return (data as PlayerHeroIdRow).id
}

async function saveSkillLevels(
  playerHeroId: string,
  values: HeroProgressionEditorValues,
): Promise<void> {
  if (values.skills.length === 0) {
    return
  }

  const rows = values.skills.map(
    (skill) => ({
      player_hero_id: playerHeroId,
      hero_skill_id: skill.heroSkillId,
      skill_level: skill.skillLevel,
    }),
  )

  const { error } = await supabase
    .from('player_hero_skills')
    .upsert(rows, {
      onConflict:
        'player_hero_id,hero_skill_id',
    })

  if (error) {
    throw new Error(
      `Unable to save hero skill levels: ${error.message}`,
    )
  }
}

async function saveGear(
  playerHeroId: string,
  gear: HeroGearInput[],
): Promise<void> {
  if (gear.length === 0) {
    return
  }

  const rows = gear.map((piece) => ({
    player_hero_id: playerHeroId,
    position: piece.position,
    gear_level: piece.gearLevel,
    enhancement_level:
      piece.enhancementLevel,
  }))

  const { error } = await supabase
    .from('player_hero_gear')
    .upsert(rows, {
      onConflict:
        'player_hero_id,position',
    })

  if (error) {
    throw new Error(
      `Unable to save hero gear: ${error.message}`,
    )
  }
}

async function saveExclusiveGear(
  playerHeroId: string,
  values: HeroProgressionEditorValues,
): Promise<void> {
  if (!values.exclusiveGear) {
    return
  }

  const { error } = await supabase
    .from('player_hero_exclusive_gear')
    .upsert(
      {
        player_hero_id: playerHeroId,
        hero_exclusive_gear_id:
          values.exclusiveGear
            .heroExclusiveGearId,
        gear_level:
          values.exclusiveGear.gearLevel,
      },
      {
        onConflict:
          'player_hero_id,hero_exclusive_gear_id',
      },
    )

  if (error) {
    throw new Error(
      `Unable to save Exclusive Gear: ${error.message}`,
    )
  }
}

export async function saveHeroProgression(
  playerAccountId: string,
  values: HeroProgressionEditorValues,
): Promise<void> {
  const playerHeroId =
    await upsertPlayerHero(
      playerAccountId,
      values,
    )

  await Promise.all([
    saveSkillLevels(
      playerHeroId,
      values,
    ),
    saveGear(
      playerHeroId,
      values.gear,
    ),
    saveExclusiveGear(
      playerHeroId,
      values,
    ),
  ])
}