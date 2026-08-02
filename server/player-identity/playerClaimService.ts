import { getSupabaseAdmin } from '../database/supabaseAdmin.js'
import {
  LinkedPlayerServiceError,
  validateKingdomId,
  validatePlayerId,
} from './linkedPlayerService.js'

type DataRecord = Readonly<Record<string, unknown>>

const ACCOUNT_SELECT = [
  'id',
  'user_id',
  'player_id',
  'player_name',
  'kingdom_id',
  'player_level',
  'town_center_level',
  'level_rendered',
  'level_rendered_detailed',
  'level_image',
  'profile_photo',
  'verification_status',
  'verification_method',
  'verified_at',
  'last_refreshed_at',
  'is_primary',
  'is_public',
  'created_at',
  'updated_at',
].join(',')

export type IndexedPlayerRecord = Readonly<{
  playerId: string
  playerName: string
  kingdomId: number
  townCenterLevel: number | null
  profilePhoto: string | null
  verificationStatus: string
  verificationMethod: string
  isPublic: boolean
  allianceName: string | null
  currentPower: number | null
  observedAt: string
}>

export type PlayerClaimSearchResult = Readonly<{
  match: 'not_found' | 'owned' | 'claimed_elsewhere' | 'state_mismatch'
  claimable: boolean
  player: IndexedPlayerRecord | null
  message: string
}>

function record(value: unknown): DataRecord | null {
  return value && typeof value === 'object' ? value as DataRecord : null
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function nullableText(value: unknown): string | null {
  const valueText = text(value)
  return valueText || null
}

function nullableInteger(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const number = typeof value === 'number' ? value : Number(value)
  return Number.isInteger(number) ? number : null
}

function nullablePower(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const number = typeof value === 'number' ? value : Number(value)
  return Number.isSafeInteger(number) && number >= 0 ? number : null
}

export function validatePlayerName(value: unknown): string {
  const playerName = text(value)
  if (!playerName || playerName.length > 120) {
    throw new LinkedPlayerServiceError(422, 'Enter the player name shown on the Kingshot profile.')
  }
  return playerName
}

export function validateOptionalTownCenterLevel(value: unknown): number | null {
  if (value === null || value === undefined || String(value).trim() === '') return null
  const townCenterLevel = typeof value === 'number' ? value : Number(String(value).trim())
  if (!Number.isInteger(townCenterLevel) || townCenterLevel < 1 || townCenterLevel > 30) {
    throw new LinkedPlayerServiceError(422, 'Town Centre level must be between 1 and 30.')
  }
  return townCenterLevel
}

export function validateSelfReportedClaim(input: Readonly<Record<string, unknown>>) {
  return {
    playerId: validatePlayerId(input.playerId),
    kingdomId: validateKingdomId(input.kingdomId ?? input.state),
    playerName: validatePlayerName(input.playerName ?? input.displayName),
    townCenterLevel: validateOptionalTownCenterLevel(input.townCenterLevel),
  }
}

async function projectIndexedPlayer(accountValue: unknown): Promise<IndexedPlayerRecord> {
  const account = record(accountValue)
  if (!account) throw new LinkedPlayerServiceError(500, 'The indexed player record is invalid.')

  const playerAccountId = text(account.id)
  const admin = getSupabaseAdmin()
  const profileResult = playerAccountId
    ? await admin
      .from('player_profiles')
      .select('alliance_name,current_power')
      .eq('player_account_id', playerAccountId)
      .maybeSingle()
    : { data: null, error: null }

  if (profileResult.error) throw profileResult.error
  const profile = record(profileResult.data)

  return {
    playerId: text(account.player_id),
    playerName: text(account.player_name),
    kingdomId: Number(account.kingdom_id),
    townCenterLevel: nullableInteger(account.town_center_level),
    profilePhoto: nullableText(account.profile_photo),
    verificationStatus: text(account.verification_status) || 'linked',
    verificationMethod: text(account.verification_method) || 'none',
    isPublic: account.is_public === true,
    allianceName: nullableText(profile?.alliance_name),
    currentPower: nullablePower(profile?.current_power),
    observedAt: text(account.updated_at) || text(account.last_refreshed_at) || new Date(0).toISOString(),
  }
}

async function findIndexedAccount(playerId: string) {
  const admin = getSupabaseAdmin()
  const result = await admin
    .from('player_accounts')
    .select(ACCOUNT_SELECT)
    .eq('player_id', playerId)
    .maybeSingle()
  if (result.error) throw result.error
  return result.data
}

export async function searchPlayerClaimCandidate(
  userId: string,
  playerIdInput: unknown,
  kingdomIdInput: unknown,
): Promise<PlayerClaimSearchResult> {
  const playerId = validatePlayerId(playerIdInput)
  const kingdomId = validateKingdomId(kingdomIdInput)
  const indexed = await findIndexedAccount(playerId)

  if (!indexed) {
    return {
      match: 'not_found',
      claimable: true,
      player: null,
      message: 'Forge does not have an indexed record for this Player ID yet. You can create a self-reported claim or submit a profile screenshot for review.',
    }
  }

  const account = record(indexed)
  const ownerUserId = text(account?.user_id)
  const indexedKingdomId = Number(account?.kingdom_id)
  const isOwner = ownerUserId === userId
  const isPublic = account?.is_public === true

  if (indexedKingdomId !== kingdomId) {
    return {
      match: 'state_mismatch',
      claimable: false,
      player: isOwner || isPublic ? await projectIndexedPlayer(indexed) : null,
      message: 'The State entered does not match the indexed Forge record for this Player ID. Review the in-game profile before continuing.',
    }
  }

  if (isOwner) {
    return {
      match: 'owned',
      claimable: false,
      player: await projectIndexedPlayer(indexed),
      message: 'This Player ID is already linked to your Forge account.',
    }
  }

  return {
    match: 'claimed_elsewhere',
    claimable: false,
    player: isPublic ? await projectIndexedPlayer(indexed) : null,
    message: 'This Player ID is already claimed by another Forge account. Use the account-recovery route if this is your player.',
  }
}

export async function searchPublicIndexedPlayer(
  playerIdInput: unknown,
  kingdomIdInput: unknown,
): Promise<IndexedPlayerRecord | null> {
  const playerId = validatePlayerId(playerIdInput)
  const kingdomId = validateKingdomId(kingdomIdInput)
  const indexed = await findIndexedAccount(playerId)
  const account = record(indexed)
  if (!account || account.is_public !== true || Number(account.kingdom_id) !== kingdomId) return null
  return projectIndexedPlayer(indexed)
}

export async function createSelfReportedPlayerClaim(
  userId: string,
  input: Readonly<Record<string, unknown>>,
) {
  const claim = validateSelfReportedClaim(input)
  const admin = getSupabaseAdmin()

  const existingForUser = await admin
    .from('player_accounts')
    .select(ACCOUNT_SELECT)
    .eq('user_id', userId)
    .maybeSingle()
  if (existingForUser.error) throw existingForUser.error
  if (existingForUser.data) {
    const existing = record(existingForUser.data)
    if (text(existing?.player_id) === claim.playerId && Number(existing?.kingdom_id) === claim.kingdomId) {
      return projectIndexedPlayer(existingForUser.data)
    }
    throw new LinkedPlayerServiceError(409, 'A different primary Kingshot player is already linked to your Forge account.')
  }

  const alreadyClaimed = await findIndexedAccount(claim.playerId)
  if (alreadyClaimed) {
    throw new LinkedPlayerServiceError(409, 'This Kingshot Player ID is already claimed by another Forge account.')
  }

  const now = new Date().toISOString()
  const payload = {
    user_id: userId,
    player_id: claim.playerId,
    player_name: claim.playerName,
    kingdom_id: claim.kingdomId,
    player_level: null,
    town_center_level: claim.townCenterLevel,
    level_rendered: null,
    level_rendered_detailed: null,
    level_image: null,
    profile_photo: null,
    verification_status: 'linked' as const,
    verification_method: 'none' as const,
    verified_by: null,
    verified_at: null,
    last_refreshed_at: now,
    is_primary: true,
    is_public: false,
    created_at: now,
    updated_at: now,
  }

  const saved = await admin
    .from('player_accounts')
    .insert(payload)
    .select(ACCOUNT_SELECT)
    .single()

  if (saved.error) {
    if (saved.error.code === '23505') {
      throw new LinkedPlayerServiceError(409, 'This Player ID or Forge account already has a player claim.')
    }
    throw saved.error
  }

  const savedRecord = record(saved.data)
  const accountId = text(savedRecord?.id)
  const verificationEvent = await admin.from('player_verification_events').insert({
    player_account_id: accountId,
    requested_by: userId,
    reviewed_by: null,
    previous_status: null,
    new_status: 'linked',
    method: 'none',
    notes: 'Self-reported Player ID and State claim. Ownership and current profile values are not yet verified.',
  })

  if (verificationEvent.error) {
    await admin.from('player_accounts').delete().eq('id', accountId).eq('user_id', userId)
    throw verificationEvent.error
  }

  return projectIndexedPlayer(saved.data)
}
