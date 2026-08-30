import { supabase } from '../lib/supabase'
import type {
  PlayerProfile,
  PlayerTransferStatus,
} from '../types/playerProfile'
import type { PlayerAccount } from '../types/playerAccount'
import { normalizeTownCenterLevel } from './playerProgressionService'
import { formatTownCenterRawLevel } from '../../shared/domains/player-identity/townCenterLevel'

type PlayerVerificationStatus =
  | 'linked'
  | 'verified'
  | 'pending'
  | 'community_verified'
  | 'officially_verified'
  | 'rejected'
  | 'revoked'

type PlayerAccountIdentity = {
  id: string
  user_id: string
  player_id: string
  player_name: string
  profile_photo: string | null
  kingdom_id: number | null
  player_level: number | null
  town_center_level?: number | null
  level_rendered: string | null
  level_rendered_detailed: string | null
  level_image: string | null
  verification_status: PlayerVerificationStatus
  last_refreshed_at: string
}

export type PublicPlayerProfile = {
  id: string
  playerAccountId: string
  forgeId: string

  playerId: string
  playerName: string
  profilePhoto: string | null
  kingdomId: number | null

  playerLevel: number | null
  townCenterLevel: string | null
  levelImage: string | null
  verificationStatus: PlayerVerificationStatus
  lastRefreshedAt: string

  allianceName: string | null
  vipLevel: number | null

  aboutMe: string | null
  playStyle: string | null
  mainLanguage: string | null

  transferStatus: PlayerTransferStatus
  activities: string[]
  isPublic: boolean

  createdAt: string
  updatedAt: string
}

export type EditablePlayerProfile = {
  id: string | null
  playerAccountId: string
  forgeId: string

  playerId: string
  playerName: string
  profilePhoto: string | null
  kingdomId: number | null

  playerLevel: number | null
  townCenterLevel: string
  levelImage: string | null
  verificationStatus: PlayerVerificationStatus
  lastRefreshedAt: string

  allianceName: string
  vipLevel: number | null

  aboutMe: string
  playStyle: string
  mainLanguage: string

  transferStatus: PlayerTransferStatus
  activities: string[]
  isPublic: boolean
}

export type SavePlayerProfileValues = {
  playerAccountId: string
  forgeId: string

  allianceName: string
  vipLevel: number | null

  aboutMe: string
  playStyle: string
  mainLanguage: string

  transferStatus: PlayerTransferStatus
  activities: string[]
  isPublic: boolean
}

function normaliseText(
  value: string,
): string | null {
  const trimmedValue = value.trim()

  return trimmedValue || null
}

function getTownCenterDisplay(
  player: PlayerAccountIdentity,
): string {
  const rawLevel = normalizeTownCenterLevel(
    player.town_center_level,
    player.level_rendered_detailed,
    player.level_rendered,
  )

  return rawLevel === null
    ? 'Not available'
    : formatTownCenterRawLevel(rawLevel)
}

function createEditableProfile(
  player: PlayerAccountIdentity,
  profile: PlayerProfile | null,
  fallbackForgeId: string,
): EditablePlayerProfile {
  return {
    id: profile?.id ?? null,
    playerAccountId: player.id,
    forgeId:
      profile?.forge_id ??
      fallbackForgeId,

    playerId: player.player_id,
    playerName: player.player_name,
    profilePhoto: player.profile_photo,
    kingdomId: player.kingdom_id,

    playerLevel: player.player_level,
    townCenterLevel:
      getTownCenterDisplay(player),
    levelImage: player.level_image,
    verificationStatus:
      player.verification_status,
    lastRefreshedAt:
      player.last_refreshed_at,

    allianceName:
      profile?.alliance_name ?? '',

    vipLevel:
      profile?.vip_level ?? null,

    aboutMe:
      profile?.about_me ?? '',

    playStyle:
      profile?.play_style ?? '',

    mainLanguage:
      profile?.main_language ?? '',

    transferStatus:
      profile?.transfer_status ??
      'not_moving',

    activities:
      profile?.activities ?? [],

    isPublic:
      profile?.is_public ?? false,
  }
}

export async function getPublicPlayerProfile(
  forgeId: string,
): Promise<PublicPlayerProfile | null> {
  const normalisedForgeId =
    forgeId.trim()

  if (!normalisedForgeId) {
    return null
  }

  const {
    data: profileData,
    error: profileError,
  } = await supabase
    .from('player_profiles')
    .select(`
      id,
      player_account_id,
      forge_id,
      alliance_name,
      town_center_level,
      vip_level,
      about_me,
      play_style,
      main_language,
      transfer_status,
      activities,
      is_public,
      created_at,
      updated_at
    `)
    .eq('forge_id', normalisedForgeId)
    .eq('is_public', true)
    .maybeSingle()

  if (profileError) {
    throw new Error(
      profileError.message,
    )
  }

  if (!profileData) {
    return null
  }

  const profile =
    profileData as PlayerProfile

  const {
    data: playerData,
    error: playerError,
  } = await supabase
    .from('player_accounts')
    .select(
      `
        id,
        player_id,
        player_name,
        profile_photo,
        kingdom_id,
        player_level,
        town_center_level,
        level_rendered,
        level_rendered_detailed,
        level_image,
        verification_status,
        last_refreshed_at
      `,
    )
    .eq(
      'id',
      profile.player_account_id,
    )
    .eq('is_public', true)
    .maybeSingle()

  if (playerError) {
    throw new Error(
      playerError.message,
    )
  }

  if (!playerData) {
    throw new Error(
      'The Kingshot player linked to this profile could not be found.',
    )
  }

  const player =
    playerData as PlayerAccountIdentity

  return {
    id: profile.id,
    playerAccountId:
      profile.player_account_id,
    forgeId: profile.forge_id,

    playerId: player.player_id,
    playerName: player.player_name,
    profilePhoto:
      player.profile_photo,
    kingdomId: player.kingdom_id,

    playerLevel:
      player.player_level,

    townCenterLevel:
      getTownCenterDisplay(player),

    levelImage:
      player.level_image,

    verificationStatus:
      player.verification_status,

    lastRefreshedAt:
      player.last_refreshed_at,

    allianceName:
      profile.alliance_name,

    vipLevel:
      profile.vip_level,

    aboutMe:
      profile.about_me,

    playStyle:
      profile.play_style,

    mainLanguage:
      profile.main_language,

    transferStatus:
      profile.transfer_status,

    activities:
      profile.activities ?? [],

    isPublic:
      profile.is_public,

    createdAt:
      profile.created_at,

    updatedAt:
      profile.updated_at,
  }
}

export async function getMyPlayerProfileForAccount(
  playerAccount: PlayerAccount,
  fallbackForgeId: string,
): Promise<EditablePlayerProfile | null> {
  return getMyPlayerProfileFromIdentity(
    playerAccount,
    fallbackForgeId,
  )
}

async function getMyPlayerProfileFromIdentity(
  player: PlayerAccountIdentity,
  fallbackForgeId: string,
): Promise<EditablePlayerProfile | null> {

  const {
    data: profileData,
    error: profileError,
  } = await supabase
    .from('player_profiles')
    .select('*')
    .eq(
      'player_account_id',
      player.id,
    )
    .maybeSingle()

  if (profileError) {
    throw new Error(
      profileError.message,
    )
  }

  return createEditableProfile(player, profileData ? (profileData as PlayerProfile) : null, fallbackForgeId)
}

export async function saveMyPlayerProfile(
  values: SavePlayerProfileValues,
): Promise<void> {
  if (!values.forgeId.trim()) {
    throw new Error(
      'A Forge ID is required.',
    )
  }

  if (
    values.vipLevel !== null &&
    (
      values.vipLevel < 0 ||
      values.vipLevel > 30
    )
  ) {
    throw new Error(
      'VIP level must be between 0 and 30.',
    )
  }

  const profilePayload = {
    player_account_id:
      values.playerAccountId,

    forge_id:
      values.forgeId.trim(),

    alliance_name:
      normaliseText(
        values.allianceName,
      ),

    vip_level:
      values.vipLevel,

    about_me:
      normaliseText(
        values.aboutMe,
      ),

    play_style:
      normaliseText(
        values.playStyle,
      ),

    main_language:
      normaliseText(
        values.mainLanguage,
      ),

    transfer_status:
      values.transferStatus,

    activities:
      values.activities,

    is_public:
      values.isPublic,

    updated_at:
      new Date().toISOString(),
  }

  const { error } = await supabase
    .from('player_profiles')
    .upsert(
      profilePayload,
      {
        onConflict: 'player_account_id',
      },
    )

  if (error) {
    throw new Error(
      error.message,
    )
  }
}
