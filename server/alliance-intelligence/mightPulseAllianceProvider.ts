import { isTownCenterRawLevel } from '../../shared/domains/player-identity/townCenterLevel.js'
import {
  createMightPulseTransport,
  createMightPulseTransportForTest,
  MightPulseTransportError,
  type MightPulseTestTransportOptions,
  type MightPulseTransport,
  type MightPulseTransportOptions,
} from '../mightpulse/mightPulseTransport.js'
import {
  AllianceProviderError,
  type AllianceIntelligenceProvider,
  type AllianceProviderLookupRequest,
  type NormalizedAllianceIntelligence,
  type NormalizedAllianceRosterMember,
} from './providers/allianceProvider.js'

const TRUSTED_MIGHTPULSE_ASSET_ORIGIN = 'https://mightpulse.com'
const MAX_ROSTER_MEMBERS = 500

type JsonRecord = Readonly<Record<string, unknown>>

type MightPulseAllianceProviderOptions =
  MightPulseTestTransportOptions
  & Readonly<{ now?: () => Date }>

type MightPulseAllianceRuntimeOptions =
  MightPulseTransportOptions
  & Readonly<{ now?: () => Date }>

function plainRecord(value: unknown): JsonRecord | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
    ? value as JsonRecord
    : null
}

function invalidResponse(): never {
  throw new AllianceProviderError(
    502,
    'ALLIANCE_PROVIDER_INVALID_RESPONSE',
    'The Alliance provider returned an invalid Alliance record.',
    true,
  )
}

function identityMismatch(): never {
  throw new AllianceProviderError(
    409,
    'ALLIANCE_PROVIDER_IDENTITY_MISMATCH',
    'The Alliance provider returned a different Alliance identity.',
  )
}

function providerIdentifier(value: unknown): string {
  if (typeof value === 'string') {
    const candidate = value.trim()
    if (
      candidate.length > 0
      && candidate.length <= 120
      && !/[\u0000-\u001f\u007f]/u.test(candidate)
    ) {
      return candidate
    }
    return ''
  }

  return (
    typeof value === 'number'
    && Number.isSafeInteger(value)
    && value >= 0
  )
    ? String(value)
    : ''
}

function requiredIdentifier(value: unknown): string {
  const identifier = providerIdentifier(value)
  if (!identifier) invalidResponse()
  return identifier
}

function requiredString(
  value: unknown,
  maxLength: number,
): string {
  if (typeof value !== 'string') invalidResponse()

  const candidate = value.trim()
  if (
    !candidate
    || candidate.length > maxLength
    || /[\u0000-\u001f\u007f]/u.test(candidate)
  ) {
    invalidResponse()
  }

  return candidate
}

function nullableString(
  value: unknown,
  maxLength: number,
): string | null {
  if (value === null) return null
  if (value === undefined || typeof value !== 'string') {
    invalidResponse()
  }

  const candidate = value.trim()
  if (
    candidate.length > maxLength
    || /[\u0000-\u001f\u007f]/u.test(candidate)
  ) {
    invalidResponse()
  }

  return candidate || null
}

function nullableIdentifier(value: unknown): string | null {
  if (value === null) return null
  if (value === undefined) invalidResponse()

  const identifier = providerIdentifier(value)
  if (!identifier) invalidResponse()
  return identifier
}

function requiredInteger(
  value: unknown,
  options: Readonly<{
    min?: number
    max?: number
  }> = {},
): number {
  if (!Number.isSafeInteger(value)) invalidResponse()

  const number = Number(value)
  if (
    (options.min !== undefined && number < options.min)
    || (options.max !== undefined && number > options.max)
  ) {
    invalidResponse()
  }

  return number
}

function nullableNumber(
  value: unknown,
  options: Readonly<{
    integer?: boolean
    min?: number
    max?: number
  }> = {},
): number | null {
  if (value === null) return null
  if (
    value === undefined
    || typeof value !== 'number'
    || !Number.isFinite(value)
    || (options.integer === true && !Number.isSafeInteger(value))
    || (options.min !== undefined && value < options.min)
    || (options.max !== undefined && value > options.max)
  ) {
    invalidResponse()
  }

  return value
}

function nullableBoolean(value: unknown): boolean | null {
  if (value === null) return null
  if (value === undefined || typeof value !== 'boolean') {
    invalidResponse()
  }
  return value
}

function nullableTemporal(value: unknown): string | number | null {
  if (value === null) return null

  if (
    typeof value === 'number'
    && Number.isFinite(value)
    && value >= 0
  ) {
    return value
  }

  if (typeof value === 'string') {
    const candidate = value.trim()
    if (
      candidate
      && candidate.length <= 80
      && !/[\u0000-\u001f\u007f]/u.test(candidate)
    ) {
      return candidate
    }
  }

  invalidResponse()
}

function nullableTownCenterLevel(value: unknown): number | null {
  if (value === null) return null
  if (value === undefined || !isTownCenterRawLevel(value)) {
    invalidResponse()
  }
  return value
}

function normalizedAssetUrl(value: unknown): string | null {
  if (value === null) return null
  if (value === undefined || typeof value !== 'string') {
    invalidResponse()
  }

  const candidate = value.trim()
  if (!candidate) return null
  if (candidate.length > 2_048) invalidResponse()

  try {
    const isRootRelative =
      candidate.startsWith('/')
      && !candidate.startsWith('//')

    const url = isRootRelative
      ? new URL(candidate, TRUSTED_MIGHTPULSE_ASSET_ORIGIN)
      : new URL(candidate)

    if (
      url.protocol !== 'https:'
      || url.username
      || url.password
      || !url.hostname
      || (
        isRootRelative
        && url.origin !== TRUSTED_MIGHTPULSE_ASSET_ORIGIN
      )
    ) {
      return null
    }

    return url.toString()
  } catch {
    return null
  }
}

function validateRequest(
  request: AllianceProviderLookupRequest,
): Readonly<{
  kingdomId: number
  tag: string
}> {
  if (
    !Number.isInteger(request.kingdomId)
    || request.kingdomId < 1
    || request.kingdomId > 9_999
  ) {
    throw new AllianceProviderError(
      400,
      'ALLIANCE_LOOKUP_INVALID_REQUEST',
      'A valid Kingdom number is required.',
    )
  }

  if (typeof request.tag !== 'string') {
    throw new AllianceProviderError(
      400,
      'ALLIANCE_LOOKUP_INVALID_REQUEST',
      'A valid Alliance tag is required.',
    )
  }

  const tag = request.tag.trim()
  if (
    tag.length < 2
    || tag.length > 12
    || /[\u0000-\u001f\u007f]/u.test(tag)
  ) {
    throw new AllianceProviderError(
      400,
      'ALLIANCE_LOOKUP_INVALID_REQUEST',
      'A valid Alliance tag is required.',
    )
  }

  return {
    kingdomId: request.kingdomId,
    tag,
  }
}

function optionalInclude(value: unknown): void {
  if (value === undefined || value === null) return
  if (!Array.isArray(value)) invalidResponse()

  const sections = value.map((section) => {
    if (typeof section !== 'string') invalidResponse()
    return section
  })

  if (
    !sections.includes('info')
    || !sections.includes('roster')
  ) {
    invalidResponse()
  }
}

function freshnessValues(
  value: unknown,
): readonly unknown[] {
  if (value === undefined || value === null) return []

  const bySection = plainRecord(value)
  if (!bySection) return [value]

  return ['info', 'roster']
    .filter((section) => section in bySection)
    .map((section) => bySection[section])
}

function normalizedFreshnessTimestamp(
  value: unknown,
): string | null {
  const values = freshnessValues(value)
  if (values.length === 0) return null

  const timestamps = values.map((entry) => {
    if (typeof entry !== 'string') invalidResponse()
    const candidate = entry.trim()
    if (
      !candidate
      || candidate.length > 80
      || !Number.isFinite(Date.parse(candidate))
    ) {
      invalidResponse()
    }
    return candidate
  })

  return timestamps.reduce((oldest, candidate) =>
    Date.parse(candidate) < Date.parse(oldest)
      ? candidate
      : oldest)
}

function normalizedFreshnessAge(
  value: unknown,
): number | null {
  const values = freshnessValues(value)
  if (values.length === 0) return null

  return Math.max(...values.map((entry) => {
    if (
      typeof entry !== 'number'
      || !Number.isFinite(entry)
      || entry < 0
    ) {
      invalidResponse()
    }
    return entry
  }))
}

function normalizedFreshnessFlag(
  value: unknown,
): boolean | null {
  const values = freshnessValues(value)
  if (values.length === 0) return null

  const flags = values.map((entry) => {
    if (typeof entry !== 'boolean') invalidResponse()
    return entry
  })

  return flags.some((entry) => entry === false)
    ? false
    : true
}

function normalizeMember(
  value: unknown,
  request: Readonly<{
    kingdomId: number
    tag: string
  }>,
): NormalizedAllianceRosterMember {
  const member = plainRecord(value)
  if (!member) invalidResponse()

  const kingdomId = requiredInteger(
    member.kid,
    { min: 1, max: 9_999 },
  )
  if (kingdomId !== request.kingdomId) {
    identityMismatch()
  }

  const allianceRank = requiredInteger(
    member.alliance_rank,
    { min: 1, max: 5 },
  )

  return Object.freeze({
    providerInternalUid: requiredIdentifier(member.uid),
    playerId: requiredIdentifier(member.governor_id),
    providerFid: requiredIdentifier(member.fid),
    name: requiredString(member.nick_name, 160),
    kingdomId,
    power: nullableNumber(member.power, { min: 0 }),
    townCenterLevel: nullableTownCenterLevel(
      member.town_center_level,
    ),
    kills: nullableNumber(member.kills, { min: 0 }),
    allianceRank,
    allianceRankLabel: nullableString(
      member.alliance_rank_label,
      80,
    ),
    avatarUrl: normalizedAssetUrl(member.avatar_url),
    lastActiveAt: nullableTemporal(member.last_active_at),
    online: nullableBoolean(member.online),
  })
}

function normalizeAlliancePayload(
  value: unknown,
  request: Readonly<{
    kingdomId: number
    tag: string
  }>,
  providerFetchedAt: string,
): NormalizedAllianceIntelligence {
  const wrapper = plainRecord(value)
  if (!wrapper) invalidResponse()

  if ('ok' in wrapper && wrapper.ok !== true) {
    invalidResponse()
  }

  optionalInclude(wrapper.include)

  const alliance = plainRecord(wrapper.alliance)
  if (!alliance) invalidResponse()

  const returnedKingdomId = requiredInteger(
    alliance.kid,
    { min: 1, max: 9_999 },
  )
  const returnedTag = requiredString(alliance.abbr, 12)

  if (
    returnedKingdomId !== request.kingdomId
    || returnedTag !== request.tag
  ) {
    identityMismatch()
  }

  if (!Array.isArray(wrapper.members)) invalidResponse()
  if (wrapper.members.length > MAX_ROSTER_MEMBERS) {
    invalidResponse()
  }

  const members = wrapper.members.map((member) =>
    normalizeMember(member, request))

  const seenPlayerIds = new Set<string>()
  const seenInternalUids = new Set<string>()
  for (const member of members) {
    if (
      seenPlayerIds.has(member.playerId)
      || seenInternalUids.has(member.providerInternalUid)
    ) {
      invalidResponse()
    }
    seenPlayerIds.add(member.playerId)
    seenInternalUids.add(member.providerInternalUid)
  }

  const memberCount = nullableNumber(
    alliance.count,
    { integer: true, min: 0 },
  )

  return Object.freeze({
    provider: 'mightpulse' as const,
    providerFetchedAt,
    providerCachedAt: normalizedFreshnessTimestamp(
      wrapper.cached_at,
    ),
    providerAgeSeconds: normalizedFreshnessAge(
      wrapper.age_seconds,
    ),
    providerFresh: normalizedFreshnessFlag(wrapper.fresh),
    alliance: Object.freeze({
      providerAllianceId: requiredIdentifier(alliance.aid),
      kingdomId: returnedKingdomId,
      tag: returnedTag,
      name: requiredString(alliance.name, 160),
      power: nullableNumber(alliance.power, { min: 0 }),
      memberCount,
      leaderName: nullableString(alliance.leader_name, 160),
      leaderInternalUid: nullableIdentifier(alliance.leader_uid),
      leaderPlayerId: nullableIdentifier(
        alliance.leader_governor_id,
      ),
      flagUrl: normalizedAssetUrl(alliance.flag_url),
      powerRank: nullableNumber(
        alliance.power_rank,
        { integer: true, min: 1 },
      ),
    }),
    members: Object.freeze(members),
  })
}

function mapTransportFailure(error: unknown): never {
  if (!(error instanceof MightPulseTransportError)) {
    throw error
  }

  if (error.kind === 'timeout') {
    throw new AllianceProviderError(
      504,
      'ALLIANCE_PROVIDER_TIMEOUT',
      'The Alliance lookup timed out. Try again later.',
      true,
    )
  }

  if (error.kind === 'unreachable') {
    throw new AllianceProviderError(
      502,
      'ALLIANCE_PROVIDER_UNREACHABLE',
      'The Alliance lookup service could not be reached.',
      true,
    )
  }

  if (error.kind === 'unconfigured') {
    throw new AllianceProviderError(
      503,
      'ALLIANCE_PROVIDER_UNAVAILABLE',
      'The Alliance provider is not configured.',
      true,
    )
  }

  if (error.kind === 'invalid-request') {
    throw new AllianceProviderError(
      502,
      'ALLIANCE_PROVIDER_INVALID_REQUEST',
      'The Alliance provider request was invalid.',
    )
  }

  if (error.kind === 'invalid-response') {
    invalidResponse()
  }

  const status = error.httpStatus
  if (status === 404) {
    throw new AllianceProviderError(
      404,
      'ALLIANCE_NOT_FOUND',
      'Alliance not found.',
    )
  }
  if (status === 429) {
    throw new AllianceProviderError(
      429,
      'ALLIANCE_LOOKUP_RATE_LIMITED',
      'The Alliance lookup is temporarily busy. Try again later.',
      true,
    )
  }
  if (status === 401) {
    throw new AllianceProviderError(
      503,
      'ALLIANCE_PROVIDER_UNAVAILABLE',
      'The Alliance lookup service is temporarily unavailable.',
      true,
    )
  }
  if (status === 400) {
    throw new AllianceProviderError(
      502,
      'ALLIANCE_PROVIDER_INVALID_REQUEST',
      'The Alliance provider rejected the lookup request.',
    )
  }
  if (status !== null && status >= 500) {
    throw new AllianceProviderError(
      503,
      'ALLIANCE_PROVIDER_UNAVAILABLE',
      'The Alliance lookup service is temporarily unavailable.',
      true,
    )
  }

  invalidResponse()
}

function createConfiguredMightPulseAllianceProvider(
  transport: MightPulseTransport,
  now: () => Date,
): AllianceIntelligenceProvider {
  return {
    async lookupAlliance(
      input: AllianceProviderLookupRequest,
    ): Promise<NormalizedAllianceIntelligence> {
      const request = validateRequest(input)

      let payload: unknown
      try {
        payload = await transport.getJson({
          pathSegments: [
            'alliances',
            String(request.kingdomId),
            request.tag,
          ],
          query: {
            include: 'info,roster',
          },
        })
      } catch (error) {
        mapTransportFailure(error)
      }

      return normalizeAlliancePayload(
        payload,
        request,
        now().toISOString(),
      )
    },
  }
}

export function createMightPulseAllianceProvider(
  options: MightPulseAllianceRuntimeOptions = {},
): AllianceIntelligenceProvider {
  return createConfiguredMightPulseAllianceProvider(
    createMightPulseTransport(options),
    options.now ?? (() => new Date()),
  )
}

export function createMightPulseAllianceProviderForTest(
  options: MightPulseAllianceProviderOptions,
): AllianceIntelligenceProvider {
  return createConfiguredMightPulseAllianceProvider(
    createMightPulseTransportForTest(options),
    options.now ?? (() => new Date()),
  )
}

export {
  normalizeAlliancePayload,
}
