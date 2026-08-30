import {
  PlayerProviderError,
  type NormalizedPlayer,
  type NormalizedPlayerIntelligence,
  type PlayerIntelligenceProvider,
  type PlayerLookupRequest,
} from './playerProvider.js'
import { isTownCenterRawLevel } from '../../../shared/domains/player-identity/townCenterLevel.js'

const DEFAULT_BASE_URL = 'https://api.mightpulse.com/v1'
const TRUSTED_MIGHTPULSE_AVATAR_ORIGIN = 'https://mightpulse.com'
export const DEFAULT_MIGHTPULSE_TIMEOUT_MS = 45_000
const MAX_CONFIGURED_TIMEOUT_MS = 55_000

type JsonRecord = Readonly<Record<string, unknown>>
type FetchImplementation = typeof fetch

type MightPulseProviderOptions = Readonly<{
  apiKey?: string
  baseUrl?: string
  timeoutMs?: number
  fetchImplementation?: FetchImplementation
  now?: () => Date
}>
type MightPulseRuntimeOptions = Omit<MightPulseProviderOptions, 'baseUrl'>

function plainRecord(value: unknown): JsonRecord | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
    ? value as JsonRecord
    : null
}

function providerPlayerId(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
    ? String(value)
    : ''
}

type AvatarDiagnosticStatus = 'accepted' | 'missing' | 'rejected'
type AvatarDiagnosticReason =
  | 'accepted'
  | 'not_provided'
  | 'empty'
  | 'not_string'
  | 'too_long'
  | 'invalid_url'
  | 'non_https'
  | 'credentials'
  | 'missing_hostname'

type InvalidAvatarShape =
  | 'not_applicable'
  | 'protocol_relative'
  | 'root_relative'
  | 'encoded_https'
  | 'quoted'
  | 'relative_path'
  | 'other'

function classifyInvalidAvatarShape(value: unknown): InvalidAvatarShape {
  if (typeof value !== 'string') return 'not_applicable'
  const candidate = value.trim()
  if (!candidate) return 'not_applicable'
  if (candidate.startsWith('//')) return 'protocol_relative'
  if (candidate.startsWith('/')) return 'root_relative'
  if (/^https?%3a%2f%2f/iu.test(candidate)) return 'encoded_https'
  if (
    (candidate.startsWith('"') && candidate.endsWith('"'))
    || (candidate.startsWith("'") && candidate.endsWith("'"))
  ) return 'quoted'
  if (
    /^(?:\.{1,2}\/|[\p{L}\p{N}._~-]+\/)/u.test(candidate)
    || /^[\p{L}\p{N}_~-][\p{L}\p{N}._~-]*\.[\p{L}\p{N}._~-]+(?:[?#][^\s]*)?$/u.test(candidate)
  ) return 'relative_path'
  return 'other'
}

function normalizeAvatarUrl(value: unknown): {
  url: string | null
  status: AvatarDiagnosticStatus
  reason: AvatarDiagnosticReason
} {
  if (value === null || value === undefined) {
    return { url: null, status: 'missing', reason: 'not_provided' }
  }
  if (typeof value !== 'string') {
    return { url: null, status: 'rejected', reason: 'not_string' }
  }

  const candidate = value.trim()
  if (!candidate) {
    return { url: null, status: 'missing', reason: 'empty' }
  }
  if (candidate.length > 2048) {
    return { url: null, status: 'rejected', reason: 'too_long' }
  }

  try {
    const isRootRelative = candidate.startsWith('/') && !candidate.startsWith('//')
    const url = isRootRelative
      ? new URL(candidate, TRUSTED_MIGHTPULSE_AVATAR_ORIGIN)
      : new URL(candidate)
    if (isRootRelative && url.origin !== TRUSTED_MIGHTPULSE_AVATAR_ORIGIN) {
      return { url: null, status: 'rejected', reason: 'invalid_url' }
    }
    if (url.protocol !== 'https:') {
      return { url: null, status: 'rejected', reason: 'non_https' }
    }
    if (url.username || url.password) {
      return { url: null, status: 'rejected', reason: 'credentials' }
    }
    if (!url.hostname) {
      return { url: null, status: 'rejected', reason: 'missing_hostname' }
    }
    return {
      url: url.toString(),
      status: 'accepted',
      reason: 'accepted',
    }
  } catch {
    return { url: null, status: 'rejected', reason: 'invalid_url' }
  }
}

function invalidResponse(): never {
  throw new PlayerProviderError(
    502,
    'PLAYER_PROVIDER_INVALID_RESPONSE',
    'The player provider returned an invalid player record.',
    true,
  )
}

function normalizeMightPulsePlayer(
  value: unknown,
  request: PlayerLookupRequest,
  providerFetchedAt: string,
): NormalizedPlayer {
  const wrapper = plainRecord(value)
  const player = plainRecord(wrapper?.player)
  if (!wrapper || wrapper.ok !== true || !player) invalidResponse()

  const returnedPlayerId = providerPlayerId(wrapper.governor_id)
  const playerGovernorId = player.governor_id === undefined
    ? returnedPlayerId
    : providerPlayerId(player.governor_id)
  const idType = wrapper.id_type
  if (
    returnedPlayerId !== request.playerId
    || playerGovernorId !== request.playerId
    || (idType !== undefined && idType !== 'governor_id')
  ) invalidResponse()

  const name = typeof player.nick_name === 'string' ? player.nick_name.trim() : ''
  const kingdomId = player.kid
  if (
    !name
    || name.length > 120
    || !Number.isInteger(kingdomId)
    || Number(kingdomId) < 1
    || Number(kingdomId) > 9999
  ) invalidResponse()

  let townCenterLevel: number | null = null
  if (player.town_center_level !== null && player.town_center_level !== undefined) {
    if (!isTownCenterRawLevel(player.town_center_level)) invalidResponse()
    townCenterLevel = player.town_center_level
  }

  if (request.expectedKingdomId !== undefined && kingdomId !== request.expectedKingdomId) {
    throw new PlayerProviderError(
      409,
      'STATE_MISMATCH',
      `This Player ID belongs to State ${kingdomId}, not State ${request.expectedKingdomId}.`,
    )
  }

  const avatarShape = classifyInvalidAvatarShape(player.avatar_url)
  const avatar = normalizeAvatarUrl(player.avatar_url)
  console.info('[mightpulse-player-provider]', {
    avatarStatus: avatar.status,
    avatarReason: avatar.reason,
    avatarShape: avatarShape === 'root_relative' || avatar.reason === 'invalid_url'
      ? avatarShape
      : 'not_applicable',
  })

  return {
    playerId: returnedPlayerId,
    name,
    kingdomId: Number(kingdomId),
    townCenterLevel,
    avatarUrl: avatar.url,
    provider: 'mightpulse',
    providerFetchedAt,
  }
}


function optionalString(value: unknown, maxLength = 240): string | null {
  if (value === null || value === undefined) return null
  if (typeof value !== 'string') invalidResponse()
  const text = value.trim()
  if (!text) return null
  if (text.length > maxLength) invalidResponse()
  return text
}

function requiredString(value: unknown, maxLength = 240): string {
  const text = optionalString(value, maxLength)
  if (!text) invalidResponse()
  return text
}

function optionalNumber(value: unknown, nonNegative = true): number | null {
  if (value === null || value === undefined) return null
  if (typeof value !== 'number' || !Number.isFinite(value)) invalidResponse()
  if (nonNegative && value < 0) invalidResponse()
  return value
}

function optionalInteger(
  value: unknown,
  options: { min?: number; max?: number } = {},
): number | null {
  if (value === null || value === undefined) return null
  if (!Number.isSafeInteger(value)) invalidResponse()
  if (options.min !== undefined && Number(value) < options.min) invalidResponse()
  if (options.max !== undefined && Number(value) > options.max) invalidResponse()
  return Number(value)
}

function optionalBoolean(value: unknown): boolean | null {
  if (value === null || value === undefined) return null
  if (typeof value !== 'boolean') invalidResponse()
  return value
}

function optionalScalar(value: unknown): string | number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'string') {
    const text = value.trim()
    if (!text) return null
    if (text.length > 120) invalidResponse()
    return text
  }
  if (typeof value === 'number' && Number.isFinite(value)) return value
  invalidResponse()
}

function optionalTemporal(value: unknown): string | number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) return value
  if (typeof value !== 'string') invalidResponse()
  const text = value.trim()
  if (!text) return null
  if (text.length > 80) invalidResponse()
  return text
}

function normalizedAssetUrl(value: unknown): string | null {
  return normalizeAvatarUrl(value).url
}

function normalizeAllianceIntelligence(value: unknown) {
  if (value === null || value === undefined) return null
  const alliance = plainRecord(value)
  if (!alliance) invalidResponse()

  const rawAllianceId = alliance.aid
  const allianceId = rawAllianceId === null || rawAllianceId === undefined
    ? null
    : providerPlayerId(rawAllianceId)
  if (rawAllianceId !== null && rawAllianceId !== undefined && !allianceId) invalidResponse()

  return {
    allianceId,
    tag: requiredString(alliance.abbr, 32),
    name: requiredString(alliance.name, 160),
    rank: optionalInteger(alliance.rank, { min: 1, max: 5 }),
    rankLabel: optionalString(alliance.rank_label, 80),
    power: optionalNumber(alliance.power),
    memberCount: optionalInteger(alliance.count, { min: 0 }),
    flagUrl: normalizedAssetUrl(alliance.flag_url),
    leaderName: optionalString(alliance.leader_name, 160),
  } as const
}

function normalizeHeroSkill(value: unknown) {
  const skill = plainRecord(value)
  if (!skill) invalidResponse()
  const id = providerPlayerId(skill.id)
  if (!id) invalidResponse()
  const level = optionalInteger(skill.level, { min: 0 })
  if (level === null) invalidResponse()
  return { id, level } as const
}

function normalizeHeroExclusiveAttribute(value: unknown) {
  const attribute = plainRecord(value)
  if (!attribute) invalidResponse()
  const id = providerPlayerId(attribute.id)
  if (!id) invalidResponse()
  const normalizedValue = optionalNumber(attribute.value, false)
  if (normalizedValue === null) invalidResponse()
  return {
    id,
    value: normalizedValue,
    label: optionalString(attribute.label, 120),
  } as const
}

function normalizeHeroExclusiveGear(value: unknown) {
  if (value === null || value === undefined) return null
  const gear = plainRecord(value)
  if (!gear) invalidResponse()
  const id = providerPlayerId(gear.id)
  if (!id) invalidResponse()

  const attributes = gear.slg_attr === null || gear.slg_attr === undefined
    ? []
    : Array.isArray(gear.slg_attr)
      ? gear.slg_attr.map(normalizeHeroExclusiveAttribute)
      : invalidResponse()

  const strategySkillId = gear.slg_skill_id === null || gear.slg_skill_id === undefined
    ? null
    : providerPlayerId(gear.slg_skill_id)
  const pveSkillId = gear.pve_skill_id === null || gear.pve_skill_id === undefined
    ? null
    : providerPlayerId(gear.pve_skill_id)
  if (gear.slg_skill_id !== null && gear.slg_skill_id !== undefined && !strategySkillId) invalidResponse()
  if (gear.pve_skill_id !== null && gear.pve_skill_id !== undefined && !pveSkillId) invalidResponse()

  const slotValue = optionalScalar(gear.slot)
  return {
    id,
    name: requiredString(gear.name, 160),
    level: optionalInteger(gear.level, { min: 0 }),
    slot: slotValue === null ? null : String(slotValue),
    attackRatio: optionalNumber(gear.atk_ratio, false),
    healthRatio: optionalNumber(gear.hp_ratio, false),
    defenceRatio: optionalNumber(gear.def_ratio, false),
    powerRatio: optionalNumber(gear.power_ratio, false),
    strategySkillId,
    pveSkillId,
    strategyAttributes: attributes,
  } as const
}

function normalizeHeroGear(value: unknown) {
  const gear = plainRecord(value)
  if (!gear) invalidResponse()
  const equipmentId = providerPlayerId(gear.eid)
  if (!equipmentId) invalidResponse()

  const sourceId = gear.sid === null || gear.sid === undefined
    ? null
    : providerPlayerId(gear.sid)
  if (gear.sid !== null && gear.sid !== undefined && !sourceId) invalidResponse()

  const slotValue = optionalScalar(gear.slot)
  if (slotValue === null) invalidResponse()

  const troopValue = optionalScalar(gear.troop)
  return {
    equipmentId,
    sourceId,
    slot: String(slotValue),
    name: requiredString(gear.name, 160),
    enhancementLevel: optionalInteger(gear.enhancement_level, { min: 0 }),
    refineLevel: optionalInteger(gear.refine_level, { min: 0 }),
    gearLevel: optionalInteger(gear.gear_level, { min: 0 }),
    quality: optionalScalar(gear.quality),
    qualityKey: optionalString(gear.quality_key, 80),
    qualityLabel: optionalString(gear.quality_label, 120),
    red: optionalBoolean(gear.red),
    troop: troopValue === null ? null : String(troopValue),
    troopLabel: optionalString(gear.troop_label, 120),
  } as const
}

function normalizeHero(value: unknown) {
  const hero = plainRecord(value)
  if (!hero) invalidResponse()
  const id = providerPlayerId(hero.id)
  if (!id) invalidResponse()

  const skillLevels = hero.skill_levels === null || hero.skill_levels === undefined
    ? []
    : Array.isArray(hero.skill_levels)
      ? hero.skill_levels.map(normalizeHeroSkill)
      : invalidResponse()

  const gear = hero.gear === null || hero.gear === undefined
    ? []
    : Array.isArray(hero.gear)
      ? hero.gear.map(normalizeHeroGear)
      : invalidResponse()

  const stars = hero.stars !== null && hero.stars !== undefined
    ? optionalNumber(hero.stars)
    : optionalNumber(hero.star)

  return {
    id,
    name: requiredString(hero.name, 160),
    level: optionalInteger(hero.level, { min: 0 }),
    stars,
    starLabel: optionalString(hero.star_label, 80),
    quality: optionalScalar(hero.quality),
    power: optionalNumber(hero.power),
    position: optionalInteger(hero.position, { min: 0 }),
    skillLevels,
    exclusiveGearLevel: optionalInteger(hero.exclusive_gear_level, { min: 0 }),
    exclusiveGear: normalizeHeroExclusiveGear(hero.exclusive_gear),
    gear,
  } as const
}

function normalizeRanks(value: unknown) {
  const ranks = plainRecord(value)
  if (!ranks) invalidResponse()
  const leaderboards = ranks.leaderboards === null || ranks.leaderboards === undefined
    ? []
    : Array.isArray(ranks.leaderboards)
      ? ranks.leaderboards.map((entry) => {
          const row = plainRecord(entry)
          if (!row) invalidResponse()
          const metricValue = optionalNumber(row.value, false)
          if (metricValue === null) invalidResponse()
          return {
            name: requiredString(row.name, 120),
            value: metricValue,
            kingdomRank: optionalInteger(row.kingdom_rank, { min: 1 }),
          } as const
        })
      : invalidResponse()

  return {
    power: optionalNumber(ranks.power),
    powerRank: optionalInteger(ranks.power_rank, { min: 1 }),
    kills: optionalNumber(ranks.kills),
    killsRank: optionalInteger(ranks.kills_rank, { min: 1 }),
    townCenterLevel: optionalInteger(ranks.town_center_level, { min: 1 }),
    townCenterRank: optionalInteger(ranks.town_center_rank, { min: 1 }),
    mysticTrial: optionalNumber(ranks.mystic_trial),
    mysticRank: optionalInteger(ranks.mystic_rank, { min: 1 }),
    leaderboards,
  } as const
}

function normalizeGovernorGear(value: unknown) {
  const governorGear = plainRecord(value)
  if (!governorGear) invalidResponse()
  const hidden = optionalBoolean(governorGear.hidden)
  if (hidden === null) invalidResponse()

  const items = governorGear.items === null || governorGear.items === undefined
    ? []
    : Array.isArray(governorGear.items)
      ? governorGear.items.map((itemValue) => {
          const item = plainRecord(itemValue)
          if (!item) invalidResponse()
          const equipmentId = providerPlayerId(item.equipid)
          if (!equipmentId) invalidResponse()
          const slotValue = optionalScalar(item.slot)
          if (slotValue === null) invalidResponse()
          const gems = item.gems === null || item.gems === undefined
            ? []
            : Array.isArray(item.gems)
              ? item.gems.map((gemValue) => {
                  const gem = plainRecord(gemValue)
                  if (!gem) invalidResponse()
                  const gemSlot = optionalScalar(gem.slot)
                  const gemId = providerPlayerId(gem.id)
                  if (gemSlot === null || !gemId) invalidResponse()
                  return { slot: String(gemSlot), id: gemId } as const
                })
              : invalidResponse()

          return {
            slot: String(slotValue),
            name: requiredString(item.name, 160),
            equipmentId,
            quality: optionalScalar(item.quality),
            tier: optionalInteger(item.tier, { min: 0 }),
            star: optionalInteger(item.star, { min: 0 }),
            strengthLevel: optionalInteger(item.strength_level, { min: 0 }),
            score: optionalNumber(item.score),
            combat: optionalNumber(item.combat),
            icon: normalizedAssetUrl(item.icon),
            gems,
          } as const
        })
      : invalidResponse()

  if (hidden && items.length > 0) invalidResponse()

  return {
    hidden,
    message: optionalString(governorGear.message, 240),
    items,
  } as const
}

function normalizeMightPulsePlayerIntelligence(
  value: unknown,
  request: PlayerLookupRequest,
  providerFetchedAt: string,
): NormalizedPlayerIntelligence {
  const wrapper = plainRecord(value)
  const player = plainRecord(wrapper?.player)
  if (!wrapper || !player) invalidResponse()

  const include = Array.isArray(wrapper.include)
    ? wrapper.include.map((entry) => typeof entry === 'string' ? entry : invalidResponse())
    : invalidResponse()
  for (const requiredSection of ['base', 'heroes', 'ranks', 'gov_gear']) {
    if (!include.includes(requiredSection)) invalidResponse()
  }

  const identity = normalizeMightPulsePlayer(value, request, providerFetchedAt)
  const heroes = Array.isArray(wrapper.heroes)
    ? wrapper.heroes.map(normalizeHero)
    : invalidResponse()

  return {
    identity,
    base: {
      power: optionalNumber(player.power),
      vip: optionalInteger(player.vip, { min: 0 }),
      x: optionalNumber(player.x, false),
      y: optionalNumber(player.y, false),
      kills: optionalNumber(player.kills),
      office: optionalString(player.office, 120),
      online: optionalBoolean(player.online),
      lastActiveAt: optionalTemporal(player.last_active_at),
      lastLoginAt: optionalTemporal(player.last_login),
      language: optionalString(player.language, 80),
      shieldEndsAt: optionalTemporal(player.shield_endtime),
      burnEndsAt: optionalTemporal(player.burn_endtime),
      alliance: normalizeAllianceIntelligence(player.alliance),
    },
    heroes,
    ranks: normalizeRanks(wrapper.ranks),
    governorGear: normalizeGovernorGear(wrapper.gov_gear),
    providerCachedAt: optionalString(wrapper.cached_at, 80),
    providerAgeSeconds: optionalNumber(wrapper.age_seconds),
    providerFresh: optionalBoolean(wrapper.fresh),
  }
}

function configuredTimeout(value: string | undefined): number {
  if (value === undefined || value.trim() === '') return DEFAULT_MIGHTPULSE_TIMEOUT_MS
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1_000 || parsed > MAX_CONFIGURED_TIMEOUT_MS) {
    throw new PlayerProviderError(
      503,
      'PLAYER_PROVIDER_UNAVAILABLE',
      'The player provider is not configured.',
      true,
    )
  }
  return parsed
}

function configuredBaseUrl(value: string | undefined): string {
  const candidate = value?.trim() || DEFAULT_BASE_URL
  try {
    const url = new URL(candidate)
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error('invalid')
    return url.toString().replace(/\/$/u, '')
  } catch {
    throw new PlayerProviderError(
      503,
      'PLAYER_PROVIDER_UNAVAILABLE',
      'The player provider is not configured.',
      true,
    )
  }
}

function mapHttpFailure(status: number): never {
  if (status === 404) {
    throw new PlayerProviderError(404, 'PLAYER_NOT_FOUND', 'Player not found.')
  }
  if (status === 429) {
    throw new PlayerProviderError(
      429,
      'PLAYER_LOOKUP_RATE_LIMITED',
      'The player lookup is temporarily busy. Try again later.',
      true,
    )
  }
  if (status === 401) {
    throw new PlayerProviderError(
      503,
      'PLAYER_PROVIDER_UNAVAILABLE',
      'The player lookup service is temporarily unavailable.',
      true,
    )
  }
  if (status === 400) {
    throw new PlayerProviderError(
      502,
      'PLAYER_PROVIDER_INVALID_REQUEST',
      'The player provider rejected the lookup request.',
    )
  }
  if (status >= 500) {
    throw new PlayerProviderError(
      503,
      'PLAYER_PROVIDER_UNAVAILABLE',
      'The player lookup service is temporarily unavailable.',
      true,
    )
  }
  throw new PlayerProviderError(
    502,
    'PLAYER_PROVIDER_INVALID_RESPONSE',
    'The player lookup service returned an unexpected response.',
    true,
  )
}

function createConfiguredMightPulsePlayerProvider(
  options: MightPulseProviderOptions,
  baseUrl: string,
): PlayerIntelligenceProvider {
  const apiKey = options.apiKey ?? process.env.MIGHTPULSE_API_KEY?.trim()
  const timeoutMs = options.timeoutMs ?? configuredTimeout(process.env.MIGHTPULSE_TIMEOUT_MS)
  const fetchImplementation = options.fetchImplementation ?? fetch
  const now = options.now ?? (() => new Date())


  async function fetchPlayerPayload(
    request: PlayerLookupRequest,
    include: string,
  ): Promise<unknown> {
    if (!apiKey) {
      throw new PlayerProviderError(
        503,
        'PLAYER_PROVIDER_UNAVAILABLE',
        'The player provider is not configured.',
        true,
      )
    }

    const url = new URL(baseUrl + '/players/' + encodeURIComponent(request.playerId))
    url.searchParams.set('include', include)
    let response: Response
    try {
      response = await fetchImplementation(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer ' + apiKey,
        },
        signal: AbortSignal.timeout(timeoutMs),
      })
    } catch (error) {
      if (
        (error instanceof DOMException && error.name === 'TimeoutError')
        || (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError'))
      ) {
        throw new PlayerProviderError(
          504,
          'PLAYER_PROVIDER_TIMEOUT',
          'The player lookup timed out. Try again later.',
          true,
        )
      }
      throw new PlayerProviderError(
        502,
        'PLAYER_PROVIDER_UNREACHABLE',
        'The player lookup service could not be reached.',
        true,
      )
    }

    if (!response.ok) mapHttpFailure(response.status)
    if (!(response.headers.get('content-type') ?? '').toLowerCase().includes('application/json')) {
      invalidResponse()
    }
    return response.json().catch(() => invalidResponse())
  }

  return {
    async lookupPlayer(request): Promise<NormalizedPlayer> {
      const payload = await fetchPlayerPayload(request, 'base')
      return normalizeMightPulsePlayer(payload, request, now().toISOString())
    },

    async lookupPlayerIntelligence(request): Promise<NormalizedPlayerIntelligence> {
      const payload = await fetchPlayerPayload(request, 'base,heroes,ranks,gov_gear')
      return normalizeMightPulsePlayerIntelligence(payload, request, now().toISOString())
    },
  }

export function createMightPulsePlayerProvider(
  options: MightPulseRuntimeOptions = {},
): PlayerIntelligenceProvider {
  return createConfiguredMightPulsePlayerProvider(options, DEFAULT_BASE_URL)
}

export function createMightPulsePlayerProviderForTest(
  options: MightPulseProviderOptions,
): PlayerIntelligenceProvider {
  return createConfiguredMightPulsePlayerProvider(options, configuredBaseUrl(options.baseUrl))
}

export {
  classifyInvalidAvatarShape,
  normalizeAvatarUrl,
  normalizeMightPulsePlayer,
  normalizeMightPulsePlayerIntelligence,
}
