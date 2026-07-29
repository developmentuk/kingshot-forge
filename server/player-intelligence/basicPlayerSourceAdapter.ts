import { createHash } from 'node:crypto'

export const BASIC_PLAYER_SOURCE_ID = 'forge.kingshot-player'
export const BASIC_PLAYER_SOURCE_CONTRACT_VERSION = '1.0.0'
export const DEFAULT_MAX_PLAYER_PAYLOAD_BYTES = 64 * 1024
export const DEFAULT_PLAYER_LOOKUP_TIMEOUT_MS = 15_000

export type PlayerLookupPurpose = 'link_revalidation' | 'private_profile_refresh' | 'support_review'

export type PlayerSourceFailureCode =
  | 'invalid_player_id'
  | 'source_not_configured'
  | 'source_unavailable'
  | 'source_timeout'
  | 'source_rate_limited'
  | 'invalid_content_type'
  | 'payload_too_large'
  | 'invalid_source_payload'
  | 'mismatched_player_id'

export interface BasicPlayerLookupRequest {
  playerId: string
  purpose: PlayerLookupPurpose
  actorId: string
  requestedAt?: string
}

export interface BasicPlayerSourceObservation {
  sourceId: typeof BASIC_PLAYER_SOURCE_ID
  sourceContractVersion: typeof BASIC_PLAYER_SOURCE_CONTRACT_VERSION
  playerId: string
  purpose: PlayerLookupPurpose
  actorId: string
  requestedAt: string
  retrievedAt: string
  httpStatus: number
  payloadContentType: string
  payloadByteLength: number
  payloadSha256: string
  rawPayload: unknown
}

export interface BasicPlayerSnapshotCandidate {
  playerId: string
  playerName: string
  kingdomId: number
  playerLevel: number
  levelRendered: string | null
  levelRenderedDetailed: string | null
  levelImageUrl: string | null
  profileImageUrl: string | null
  observedAt: string
  sourceId: typeof BASIC_PLAYER_SOURCE_ID
  sourceContractVersion: typeof BASIC_PLAYER_SOURCE_CONTRACT_VERSION
  payloadSha256: string
  freshnessStatus: 'fresh'
  confidenceScore: 80
  confidenceRationale: string
}

export interface BasicPlayerProjection {
  playerId: string
  playerName: string
  kingdomId: number
  playerLevel: number
  levelRendered: string | null
  levelRenderedDetailed: string | null
  levelImageUrl: string | null
  profileImageUrl: string | null
  observedAt: string
  source: {
    id: typeof BASIC_PLAYER_SOURCE_ID
    contractVersion: typeof BASIC_PLAYER_SOURCE_CONTRACT_VERSION
    freshnessStatus: 'fresh'
    confidenceScore: 80
    confidenceRationale: string
  }
}

export interface BasicPlayerLookupResult {
  observation: BasicPlayerSourceObservation
  snapshot: BasicPlayerSnapshotCandidate
  projection: BasicPlayerProjection
}

export interface BasicPlayerSourceAdapter {
  readonly sourceId: typeof BASIC_PLAYER_SOURCE_ID
  readonly sourceContractVersion: typeof BASIC_PLAYER_SOURCE_CONTRACT_VERSION
  lookup(request: BasicPlayerLookupRequest): Promise<BasicPlayerLookupResult>
}

type FetchTransport = (input: string | URL | Request, init?: RequestInit) => Promise<Response>

type Clock = () => Date

export interface BasicPlayerSourceAdapterConfig {
  baseUrl: string
  apiKey: string
  fetchTransport?: FetchTransport
  clock?: Clock
  timeoutMs?: number
  maxPayloadBytes?: number
}

type UnknownRecord = Readonly<Record<string, unknown>>

const BASIC_CONFIDENCE_RATIONALE = 'One approved server-side Kingshot lookup source returned a structurally valid record for the requested Player ID.'

export class BasicPlayerSourceAdapterError extends Error {
  readonly code: PlayerSourceFailureCode
  readonly statusCode: number

  constructor(code: PlayerSourceFailureCode, statusCode: number, message: string) {
    super(message)
    this.name = 'BasicPlayerSourceAdapterError'
    this.code = code
    this.statusCode = statusCode
  }
}

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as UnknownRecord : null
}

function validatePlayerId(value: unknown): string {
  const playerId = typeof value === 'string' ? value.trim() : ''
  if (!/^\d{1,20}$/u.test(playerId)) {
    throw new BasicPlayerSourceAdapterError('invalid_player_id', 422, 'Enter a valid Kingshot Player ID.')
  }
  return playerId
}

function validateActorId(value: unknown): string {
  const actorId = typeof value === 'string' ? value.trim() : ''
  if (!actorId || actorId.length > 200) {
    throw new BasicPlayerSourceAdapterError('invalid_source_payload', 500, 'The player lookup request could not be prepared safely.')
  }
  return actorId
}

function validatePurpose(value: unknown): PlayerLookupPurpose {
  if (value === 'link_revalidation' || value === 'private_profile_refresh' || value === 'support_review') return value
  throw new BasicPlayerSourceAdapterError('invalid_source_payload', 500, 'The player lookup purpose is not supported.')
}

function normaliseOptionalHttpsUrl(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null
  if (typeof value !== 'string') {
    throw new BasicPlayerSourceAdapterError('invalid_source_payload', 502, 'The Kingshot player service returned an invalid image reference.')
  }
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:') throw new Error('unsupported protocol')
    return url.toString()
  } catch {
    throw new BasicPlayerSourceAdapterError('invalid_source_payload', 502, 'The Kingshot player service returned an invalid image reference.')
  }
}

function normaliseReturnedPlayerId(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' && Number.isSafeInteger(value)) return String(value)
  return ''
}

function normaliseFiniteNumber(value: unknown): number {
  return typeof value === 'number' ? value : Number(value)
}

export function sha256Payload(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex')
}

export function normaliseBasicPlayerPayload(
  payload: unknown,
  requestedPlayerId: string,
  observedAt: string,
  payloadSha256: string,
): BasicPlayerSnapshotCandidate {
  const response = asRecord(payload)
  const data = asRecord(response?.data)
  const returnedPlayerId = normaliseReturnedPlayerId(data?.playerId)

  if (response?.status !== 'success') {
    throw new BasicPlayerSourceAdapterError('invalid_source_payload', 502, 'The Kingshot player service returned an unsuccessful player record.')
  }
  if (returnedPlayerId !== requestedPlayerId) {
    throw new BasicPlayerSourceAdapterError('mismatched_player_id', 502, 'The Kingshot player service returned a different Player ID.')
  }

  const playerName = typeof data?.name === 'string' ? data.name.trim() : ''
  const kingdomId = normaliseFiniteNumber(data?.kingdom)
  const playerLevel = normaliseFiniteNumber(data?.level)

  if (!playerName || playerName.length > 200) {
    throw new BasicPlayerSourceAdapterError('invalid_source_payload', 502, 'The Kingshot player service returned an invalid player name.')
  }
  if (!Number.isInteger(kingdomId) || kingdomId < 1 || kingdomId > 9999) {
    throw new BasicPlayerSourceAdapterError('invalid_source_payload', 502, 'The Kingshot player service returned an invalid kingdom.')
  }
  if (!Number.isFinite(playerLevel) || playerLevel < 0) {
    throw new BasicPlayerSourceAdapterError('invalid_source_payload', 502, 'The Kingshot player service returned an invalid player level.')
  }

  const levelRendered = typeof data?.levelRendered === 'string' && data.levelRendered.trim()
    ? data.levelRendered.trim()
    : null
  const levelRenderedDetailed = typeof data?.levelRenderedDetailed === 'string' && data.levelRenderedDetailed.trim()
    ? data.levelRenderedDetailed.trim()
    : null

  return {
    playerId: returnedPlayerId,
    playerName,
    kingdomId,
    playerLevel,
    levelRendered,
    levelRenderedDetailed,
    levelImageUrl: normaliseOptionalHttpsUrl(data?.levelImage),
    profileImageUrl: normaliseOptionalHttpsUrl(data?.profilePhoto),
    observedAt,
    sourceId: BASIC_PLAYER_SOURCE_ID,
    sourceContractVersion: BASIC_PLAYER_SOURCE_CONTRACT_VERSION,
    payloadSha256,
    freshnessStatus: 'fresh',
    confidenceScore: 80,
    confidenceRationale: BASIC_CONFIDENCE_RATIONALE,
  }
}

export function toBasicPlayerProjection(snapshot: BasicPlayerSnapshotCandidate): BasicPlayerProjection {
  return {
    playerId: snapshot.playerId,
    playerName: snapshot.playerName,
    kingdomId: snapshot.kingdomId,
    playerLevel: snapshot.playerLevel,
    levelRendered: snapshot.levelRendered,
    levelRenderedDetailed: snapshot.levelRenderedDetailed,
    levelImageUrl: snapshot.levelImageUrl,
    profileImageUrl: snapshot.profileImageUrl,
    observedAt: snapshot.observedAt,
    source: {
      id: snapshot.sourceId,
      contractVersion: snapshot.sourceContractVersion,
      freshnessStatus: snapshot.freshnessStatus,
      confidenceScore: snapshot.confidenceScore,
      confidenceRationale: snapshot.confidenceRationale,
    },
  }
}

function safePositiveInteger(value: number | undefined, fallback: number): number {
  return Number.isSafeInteger(value) && Number(value) > 0 ? Number(value) : fallback
}

function sourceEndpoint(baseUrl: string, playerId: string): URL {
  let root: URL
  try {
    root = new URL(baseUrl)
  } catch {
    throw new BasicPlayerSourceAdapterError('source_not_configured', 503, 'The Kingshot player service is not configured.')
  }
  if (root.protocol !== 'https:' && root.hostname !== 'localhost' && root.hostname !== '127.0.0.1') {
    throw new BasicPlayerSourceAdapterError('source_not_configured', 503, 'The Kingshot player service is not configured safely.')
  }
  const url = new URL('/functions/v1/kingshot-player', `${root.toString().replace(/\/$/u, '')}/`)
  url.searchParams.set('playerId', playerId)
  return url
}

function mapTransportError(error: unknown): BasicPlayerSourceAdapterError {
  const name = error instanceof Error ? error.name : ''
  if (name === 'AbortError' || name === 'TimeoutError') {
    return new BasicPlayerSourceAdapterError('source_timeout', 504, 'The Kingshot player service timed out.')
  }
  return new BasicPlayerSourceAdapterError('source_unavailable', 502, 'The Kingshot player service could not be reached.')
}

export function createBasicPlayerSourceAdapter(config: BasicPlayerSourceAdapterConfig): BasicPlayerSourceAdapter {
  const baseUrl = config.baseUrl.trim()
  const apiKey = config.apiKey.trim()
  if (!baseUrl || !apiKey) {
    throw new BasicPlayerSourceAdapterError('source_not_configured', 503, 'The Kingshot player service is not configured.')
  }

  const fetchTransport = config.fetchTransport ?? fetch
  const clock = config.clock ?? (() => new Date())
  const timeoutMs = safePositiveInteger(config.timeoutMs, DEFAULT_PLAYER_LOOKUP_TIMEOUT_MS)
  const maxPayloadBytes = safePositiveInteger(config.maxPayloadBytes, DEFAULT_MAX_PLAYER_PAYLOAD_BYTES)

  return {
    sourceId: BASIC_PLAYER_SOURCE_ID,
    sourceContractVersion: BASIC_PLAYER_SOURCE_CONTRACT_VERSION,

    async lookup(request: BasicPlayerLookupRequest): Promise<BasicPlayerLookupResult> {
      const playerId = validatePlayerId(request.playerId)
      const purpose = validatePurpose(request.purpose)
      const actorId = validateActorId(request.actorId)
      const requestedAt = request.requestedAt ?? clock().toISOString()
      const url = sourceEndpoint(baseUrl, playerId)

      let response: Response
      try {
        response = await fetchTransport(url, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            apikey: apiKey,
            Authorization: `Bearer ${apiKey}`,
          },
          redirect: 'error',
          signal: AbortSignal.timeout(timeoutMs),
        })
      } catch (error) {
        throw mapTransportError(error)
      }

      if (response.status === 429) {
        throw new BasicPlayerSourceAdapterError('source_rate_limited', 503, 'The Kingshot player service is temporarily rate limited.')
      }
      if (!response.ok) {
        throw new BasicPlayerSourceAdapterError('source_unavailable', 502, 'The Kingshot player service could not validate this Player ID.')
      }

      const contentType = response.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase() ?? ''
      if (contentType !== 'application/json') {
        throw new BasicPlayerSourceAdapterError('invalid_content_type', 502, 'The Kingshot player service returned an unsupported response.')
      }

      const declaredLength = Number(response.headers.get('content-length'))
      if (Number.isFinite(declaredLength) && declaredLength > maxPayloadBytes) {
        throw new BasicPlayerSourceAdapterError('payload_too_large', 502, 'The Kingshot player service returned an oversized response.')
      }

      const payloadBytes = new Uint8Array(await response.arrayBuffer())
      if (payloadBytes.byteLength > maxPayloadBytes) {
        throw new BasicPlayerSourceAdapterError('payload_too_large', 502, 'The Kingshot player service returned an oversized response.')
      }

      let rawPayload: unknown
      try {
        rawPayload = JSON.parse(new TextDecoder().decode(payloadBytes))
      } catch {
        throw new BasicPlayerSourceAdapterError('invalid_source_payload', 502, 'The Kingshot player service returned invalid JSON.')
      }

      const retrievedAt = clock().toISOString()
      const payloadSha256 = sha256Payload(payloadBytes)
      const snapshot = normaliseBasicPlayerPayload(rawPayload, playerId, retrievedAt, payloadSha256)
      const observation: BasicPlayerSourceObservation = {
        sourceId: BASIC_PLAYER_SOURCE_ID,
        sourceContractVersion: BASIC_PLAYER_SOURCE_CONTRACT_VERSION,
        playerId,
        purpose,
        actorId,
        requestedAt,
        retrievedAt,
        httpStatus: response.status,
        payloadContentType: contentType,
        payloadByteLength: payloadBytes.byteLength,
        payloadSha256,
        rawPayload,
      }

      return {
        observation,
        snapshot,
        projection: toBasicPlayerProjection(snapshot),
      }
    },
  }
}
