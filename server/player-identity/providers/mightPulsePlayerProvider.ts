import {
  PlayerProviderError,
  type NormalizedPlayer,
  type PlayerLookupRequest,
  type PlayerProvider,
} from './playerProvider.js'
import { isTownCenterRawLevel } from '../../../shared/domains/player-identity/townCenterLevel.js'

const DEFAULT_BASE_URL = 'https://api.mightpulse.com/v1'
const TRUSTED_MIGHTPULSE_ORIGIN = 'https://api.mightpulse.com'
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
      ? new URL(candidate, TRUSTED_MIGHTPULSE_ORIGIN)
      : new URL(candidate)
    if (isRootRelative && url.origin !== TRUSTED_MIGHTPULSE_ORIGIN) {
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
): PlayerProvider {
  const apiKey = options.apiKey ?? process.env.MIGHTPULSE_API_KEY?.trim()
  const timeoutMs = options.timeoutMs ?? configuredTimeout(process.env.MIGHTPULSE_TIMEOUT_MS)
  const fetchImplementation = options.fetchImplementation ?? fetch
  const now = options.now ?? (() => new Date())

  return {
    async lookupPlayer(request): Promise<NormalizedPlayer> {
      if (!apiKey) {
        throw new PlayerProviderError(
          503,
          'PLAYER_PROVIDER_UNAVAILABLE',
          'The player provider is not configured.',
          true,
        )
      }

      const url = new URL(`${baseUrl}/players/${encodeURIComponent(request.playerId)}`)
      url.searchParams.set('include', 'base')
      let response: Response
      try {
        response = await fetchImplementation(url, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${apiKey}`,
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
      const payload = await response.json().catch(() => invalidResponse())
      return normalizeMightPulsePlayer(payload, request, now().toISOString())
    },
  }
}

export function createMightPulsePlayerProvider(
  options: MightPulseRuntimeOptions = {},
): PlayerProvider {
  return createConfiguredMightPulsePlayerProvider(options, DEFAULT_BASE_URL)
}

export function createMightPulsePlayerProviderForTest(
  options: MightPulseProviderOptions,
): PlayerProvider {
  return createConfiguredMightPulsePlayerProvider(options, configuredBaseUrl(options.baseUrl))
}

export {
  classifyInvalidAvatarShape,
  normalizeAvatarUrl,
  normalizeMightPulsePlayer,
}
