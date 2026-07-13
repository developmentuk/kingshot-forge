import { supabase } from '../lib/supabase'
import type {
  KingdomMember,
  KingdomRecord,
  AllianceRecord,
  AllianceMember
} from '../types/community'


export async function getKingdomByNumber(
  kingdomNumber: number,
): Promise<KingdomRecord | null> {
  const { data, error } = await supabase
    .from('kingdoms')
    .select(
      `
        id,
        kingdom_number,
        display_name,
        description,
        primary_language,
        recruitment_status,
        transfer_status,
        discord_invite_url,
        recruitment_channel_url,
        is_verified,
        created_by,
        verified_by,
        verified_at,
        created_at,
        updated_at
      `,
    )
    .eq('kingdom_number', kingdomNumber)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data
    ? (data as KingdomRecord)
    : null
}

export async function getKingdomMembers(
  kingdomNumber: number,
): Promise<KingdomMember[]> {
  const { data, error } = await supabase
    .from('public_kingdom_members')
    .select(
      `
        membership_id,
        kingdom_id,
        kingdom_number,
        joined_at,
        player_account_id,
        player_id,
        player_name,
        player_level,
        level_rendered,
        level_rendered_detailed,
        level_image,
        profile_photo,
        verification_status,
        last_refreshed_at,
        user_id
      `,
    )
    .eq('kingdom_number', kingdomNumber)
    .order('player_name', {
      ascending: true,
    })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as KingdomMember[]
}

export async function getAlliancesByKingdom(
  kingdomNumber: number,
): Promise<AllianceRecord[]> {
  const { data, error } = await supabase
    .from('public_alliances')
    .select(
      `
        id,
        kingdom_id,
        kingdom_number,
        tag,
        name,
        description,
        primary_language,
        secondary_languages,
        timezone,
        bear_time_utc,
        gift_level,
        member_capacity,
        estimated_power,
        recruitment_status,
        minimum_power,
        discord_invite_url,
        recruitment_channel_url,
        verification_status,
        is_public,
        is_active,
        created_at,
        updated_at,
        registered_member_count
      `,
    )
    .eq('kingdom_number', kingdomNumber)
    .order('tag', {
      ascending: true,
    })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map((alliance) => ({
    ...alliance,
    registered_member_count: Number(
      alliance.registered_member_count ?? 0,
    ),
  })) as AllianceRecord[]
}

export async function getAllianceById(
  allianceId: string,
): Promise<AllianceRecord | null> {
  const { data, error } = await supabase
    .from('public_alliances')
    .select(
      `
        id,
        kingdom_id,
        kingdom_number,
        tag,
        name,
        description,
        primary_language,
        secondary_languages,
        timezone,
        bear_time_utc,
        gift_level,
        member_capacity,
        estimated_power,
        recruitment_status,
        minimum_power,
        discord_invite_url,
        recruitment_channel_url,
        verification_status,
        is_public,
        is_active,
        created_at,
        updated_at,
        registered_member_count
      `,
    )
    .eq('id', allianceId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!data) {
    return null
  }

  return {
    ...data,
    registered_member_count: Number(
      data.registered_member_count ?? 0,
    ),
  } as AllianceRecord
}

export async function getAllianceMembers(
  allianceId: string,
): Promise<AllianceMember[]> {
  const { data, error } = await supabase
    .from('public_alliance_members')
    .select(
      `
        membership_id,
        alliance_id,
        kingdom_id,
        kingdom_number,
        member_role,
        joined_at,
        player_account_id,
        user_id,
        player_id,
        player_name,
        player_level,
        level_rendered,
        level_rendered_detailed,
        level_image,
        profile_photo,
        verification_status,
        last_refreshed_at,
        forge_id
      `,
    )
    .eq('alliance_id', allianceId)
    .order('member_role', {
      ascending: false,
    })
    .order('player_name', {
      ascending: true,
    })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as AllianceMember[]
}