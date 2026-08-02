import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import type { KingshotPlayer } from '../../src/types/player.js'

const OFFICIAL_PROVIDER_ID = 'century-games-gift-centre'
const DEFAULT_PROVIDER_HOST = 'https://ks-giftcode.centurygame.com'
const CHALLENGE_TTL_MS = 5 * 60 * 1000
const RECEIPT_TTL_MS = 10 * 60 * 1000
const MAX_JSON_BYTES = 750_000
const MAX_TOKEN_LENGTH = 16_000

type JsonRecord = Readonly<Record<string, unknown>>

type ChallengePayload = Readonly<{
  version: 1
  kind: 'challenge'
  provider: typeof OFFICIAL_PROVIDER_ID
  playerId: string
  kingdomId: number
  cookieHeader: string
  issuedAt: number
  expiresAt: number
  nonce: string
}>

type ReceiptPayload = Readonly<{
  version: 1
  kind: 'receipt'
  provider: typeof OFFICIAL_PROVIDER_ID
  player: KingshotPlayer
  issuedAt: number
  expiresAt: number
  nonce: string
}>

export type OfficialPlayerChallenge = Readonly<{
  challengeToken: string
  captchaImage: string
  expiresAt: string
  provider: typeof OFFICIAL_PROVIDER_ID
}>

export type OfficialPlayerLookupResult = Readonly<{
  player: KingshotPlayer
  lookupReceipt: string
  provider: typeof OFFICIAL_PROVIDER_ID
  observedAt: string
}>

export class OfficialKingshotProviderError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'OfficialKingshotProviderError'
  }
}

function record(value: unknown): JsonRecord | null {
  return value && typeof value === 'object' ? value as JsonRecord : null
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function number(value: unknown): number {
  return typeof value === 'number' ? value : Number(value)
}

function validatePlayerId(value: unknown): string {
  const playerId = typeof value === 'string' ? value.trim().replace(/\s+/gu, '') : ''
  if (!/^\d{1,20}$/u.test(playerId)) {
    throw new OfficialKingshotProviderError(422, 'PLAYER_ID_INVALID', 'Enter a valid Kingshot Player ID.')
  }
  return playerId
}

function validateKingdomId(value: unknown): number {
  const kingdomId = typeof value === 'number' ? value : Number(String(value ?? '').trim())
  if (!Number.isInteger(kingdomId) || kingdomId < 1 || kingdomId > 9999) {
    throw new OfficialKingshotProviderError(422, 'STATE_INVALID', 'Enter a valid Kingshot State between 1 and 9999.')
  }
  return kingdomId
}

function validateCaptchaCode(value: unknown): string {
  const captchaCode = typeof value === 'string' ? value.trim() : ''
  if (!/^[a-zA-Z0-9]{4}$/u.test(captchaCode)) {
    throw new OfficialKingshotProviderError(422, 'CAPTCHA_INVALID', 'Enter the four characters shown in the verification image.')
  }
  return captchaCode
}

function providerConfig() {
  const configuredHost = process.env.KINGSHOT_PLAYER_API_HOST?.trim() || DEFAULT_PROVIDER_HOST
  let host: URL
  try {
    host = new URL(configuredHost)
  } catch {
    throw new OfficialKingshotProviderError(503, 'PROVIDER_CONFIG_INVALID', 'The official Kingshot player provider is not configured safely.')
  }
  if (host.protocol !== 'https:' || host.hostname !== 'ks-giftcode.centurygame.com') {
    throw new OfficialKingshotProviderError(503, 'PROVIDER_CONFIG_INVALID', 'The official Kingshot player provider is not configured safely.')
  }

  const signatureSalt = process.env.KINGSHOT_PLAYER_SIGNATURE_SALT?.trim() || ''
  const tokenSecret = process.env.KINGSHOT_PLAYER_PROVIDER_SECRET?.trim() || ''
  if (!signatureSalt || tokenSecret.length < 32) {
    throw new OfficialKingshotProviderError(503, 'PROVIDER_NOT_CONFIGURED', 'The official Kingshot player provider is not configured.')
  }

  return { host: host.origin, signatureSalt, tokenSecret }
}

function signToken(payload: ChallengePayload | ReceiptPayload, secret: string) {
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
  const signature = createHmac('sha256', secret)
    .update(`${payload.kind}.${encoded}`)
    .digest('base64url')
  return `${encoded}.${signature}`
}

function verifyToken<T extends ChallengePayload | ReceiptPayload>(token: unknown, expectedKind: T['kind'], secret: string, now = Date.now()): T {
  if (typeof token !== 'string' || token.length < 20 || token.length > MAX_TOKEN_LENGTH) {
    throw new OfficialKingshotProviderError(422, 'TOKEN_INVALID', 'The player verification request is invalid. Start again.')
  }

  const [encoded, suppliedSignature, extra] = token.split('.')
  if (!encoded || !suppliedSignature || extra) {
    throw new OfficialKingshotProviderError(422, 'TOKEN_INVALID', 'The player verification request is invalid. Start again.')
  }

  const expectedSignature = createHmac('sha256', secret)
    .update(`${expectedKind}.${encoded}`)
    .digest('base64url')
  const supplied = Buffer.from(suppliedSignature)
  const expected = Buffer.from(expectedSignature)
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    throw new OfficialKingshotProviderError(422, 'TOKEN_INVALID', 'The player verification request is invalid. Start again.')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'))
  } catch {
    throw new OfficialKingshotProviderError(422, 'TOKEN_INVALID', 'The player verification request is invalid. Start again.')
  }

  const payload = record(parsed)
  const expiresAt = number(payload?.expiresAt)
  if (
    payload?.version !== 1 ||
    payload.kind !== expectedKind ||
    payload.provider !== OFFICIAL_PROVIDER_ID ||
    !Number.isFinite(expiresAt) ||
    expiresAt < now
  ) {
    throw new OfficialKingshotProviderError(422, 'TOKEN_EXPIRED', 'The verification image has expired. Start the lookup again.')
  }

  return parsed as T
}

function extractCookieHeader(headers: Headers) {
  const extendedHeaders = headers as Headers & { getSetCookie?: () => string[] }
  const setCookies = extendedHeaders.getSetCookie?.() ?? []
  const values = setCookies.length > 0
    ? setCookies
    : [headers.get('set-cookie')].filter((value): value is string => Boolean(value))
  const cookieHeader = values
    .map((value) => value.split(';', 1)[0]?.trim())
    .filter((value): value is string => Boolean(value))
    .join('; ')
  return cookieHeader.slice(0, 4096)
}

async function readJsonResponse(response: Response): Promise<unknown> {
  const responseText = await response.text()
  if (Buffer.byteLength(responseText, 'utf8') > MAX_JSON_BYTES) {
    throw new OfficialKingshotProviderError(503, 'PROVIDER_RESPONSE_TOO_LARGE', 'The official Kingshot player provider returned an oversized response.')
  }
  try {
    return JSON.parse(responseText)
  } catch {
    throw new OfficialKingshotProviderError(503, 'PROVIDER_RESPONSE_INVALID', 'The official Kingshot player provider returned an unreadable response.')
  }
}

function normalizeCaptchaImage(value: unknown) {
  const image = text(value)
  if (!image || image.length > 700_000) {
    throw new OfficialKingshotProviderError(503, 'CAPTCHA_UNAVAILABLE', 'The official verification image is unavailable.')
  }
  if (/^data:image\/(?:png|jpeg|jpg|gif|webp);base64,[a-zA-Z0-9+/=]+$/u.test(image)) return image
  if (/^[a-zA-Z0-9+/=]+$/u.test(image)) return `data:image/png;base64,${image}`
  throw new OfficialKingshotProviderError(503, 'CAPTCHA_INVALID', 'The official verification image is invalid.')
}

function safeImageUrl(value: unknown): string | null {
  const candidate = text(value)
  if (!candidate) return null
  try {
    const url = candidate.startsWith('//') ? new URL(`https:${candidate}`) : new URL(candidate)
    return url.protocol === 'https:' ? url.toString() : null
  } catch {
    return null
  }
}

function failureFromProvider(status: number, payload: unknown): OfficialKingshotProviderError {
  const root = record(payload)
  const message = text(root?.msg) || text(root?.message)
  const lower = message.toLowerCase()
  if (lower.includes('captcha') || lower.includes('verify')) {
    return new OfficialKingshotProviderError(422, 'CAPTCHA_REJECTED', 'The verification characters were not accepted. Start again with a new image.')
  }
  if (lower.includes('not found') || lower.includes('player') && lower.includes('invalid')) {
    return new OfficialKingshotProviderError(404, 'PLAYER_NOT_FOUND', 'Player not found.')
  }
  if (status === 429 || lower.includes('frequent') || lower.includes('rate')) {
    return new OfficialKingshotProviderError(429, 'PROVIDER_RATE_LIMITED', 'The official Kingshot player provider is temporarily busy. Try again later.')
  }
  return new OfficialKingshotProviderError(503, 'PROVIDER_UNAVAILABLE', 'The official Kingshot player provider is temporarily unavailable.')
}

export function normalizeOfficialKingshotPlayer(payload: unknown, requestedPlayerId: string, requestedKingdomId: number): KingshotPlayer {
  const root = record(payload)
  const data = record(root?.data)
  const code = number(root?.code)
  if (code !== 0 || !data) throw failureFromProvider(400, payload)

  const returnedPlayerId = typeof data.fid === 'number' && Number.isSafeInteger(data.fid)
    ? String(data.fid)
    : text(data.fid)
  const name = text(data.nickname)
  const kingdom = number(data.state_id)
  const level = number(data.furnace_level ?? data.town_hall_level)

  if (
    returnedPlayerId !== requestedPlayerId ||
    !name ||
    !Number.isInteger(kingdom) || kingdom < 1 || kingdom > 9999 ||
    !Number.isFinite(level) || level < 0
  ) {
    throw new OfficialKingshotProviderError(502, 'PLAYER_RESPONSE_INVALID', 'The official Kingshot player provider returned an invalid player record.')
  }
  if (kingdom !== requestedKingdomId) {
    throw new OfficialKingshotProviderError(409, 'STATE_MISMATCH', `This Player ID belongs to State ${kingdom}, not State ${requestedKingdomId}.`)
  }

  const rendered = `Town Center ${level}`
  return {
    playerId: returnedPlayerId,
    name,
    kingdom,
    level,
    levelRendered: rendered,
    levelRenderedDetailed: rendered,
    levelImage: null,
    profilePhoto: safeImageUrl(data.avatar_image),
  }
}

export async function createOfficialPlayerChallenge(playerIdInput: unknown, kingdomIdInput: unknown, now = Date.now()): Promise<OfficialPlayerChallenge> {
  const playerId = validatePlayerId(playerIdInput)
  const kingdomId = validateKingdomId(kingdomIdInput)
  const { host, tokenSecret } = providerConfig()

  let response: Response
  try {
    response = await fetch(`${host}/api/captcha`, {
      method: 'GET',
      headers: { Accept: 'application/json', 'User-Agent': 'Kingshot-Forge/1.0' },
      signal: AbortSignal.timeout(10_000),
    })
  } catch {
    throw new OfficialKingshotProviderError(503, 'CAPTCHA_UNREACHABLE', 'The official verification image could not be reached.')
  }

  const payload = await readJsonResponse(response)
  if (!response.ok) throw failureFromProvider(response.status, payload)
  const root = record(payload)
  const data = record(root?.data)
  const captchaImage = normalizeCaptchaImage(data?.img)
  const issuedAt = now
  const expiresAt = now + CHALLENGE_TTL_MS
  const challengeToken = signToken({
    version: 1,
    kind: 'challenge',
    provider: OFFICIAL_PROVIDER_ID,
    playerId,
    kingdomId,
    cookieHeader: extractCookieHeader(response.headers),
    issuedAt,
    expiresAt,
    nonce: randomBytes(16).toString('hex'),
  }, tokenSecret)

  return {
    challengeToken,
    captchaImage,
    expiresAt: new Date(expiresAt).toISOString(),
    provider: OFFICIAL_PROVIDER_ID,
  }
}

export function createOfficialPlayerLookupReceipt(player: KingshotPlayer, now = Date.now()) {
  const { tokenSecret } = providerConfig()
  return signToken({
    version: 1,
    kind: 'receipt',
    provider: OFFICIAL_PROVIDER_ID,
    player,
    issuedAt: now,
    expiresAt: now + RECEIPT_TTL_MS,
    nonce: randomBytes(16).toString('hex'),
  }, tokenSecret)
}

export async function completeOfficialPlayerLookup(challengeTokenInput: unknown, captchaCodeInput: unknown, now = Date.now()): Promise<OfficialPlayerLookupResult> {
  const captchaCode = validateCaptchaCode(captchaCodeInput)
  const { host, signatureSalt, tokenSecret } = providerConfig()
  const challenge = verifyToken<ChallengePayload>(challengeTokenInput, 'challenge', tokenSecret, now)
  const timestamp = Math.floor(now / 1000)
  const signText = `fid=${challenge.playerId}&time=${timestamp}${signatureSalt}`
  const signature = createHash('md5').update(signText).digest('hex')
  const formData = new URLSearchParams({
    fid: challenge.playerId,
    time: String(timestamp),
    sign: signature,
    captcha_code: captchaCode,
  })

  let response: Response
  try {
    response = await fetch(`${host}/api/player`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        Origin: host,
        Referer: `${host}/`,
        'User-Agent': 'Kingshot-Forge/1.0',
        ...(challenge.cookieHeader ? { Cookie: challenge.cookieHeader } : {}),
      },
      body: formData,
      signal: AbortSignal.timeout(12_000),
    })
  } catch {
    throw new OfficialKingshotProviderError(503, 'PROVIDER_UNREACHABLE', 'The official Kingshot player provider could not be reached.')
  }

  const payload = await readJsonResponse(response)
  if (!response.ok) throw failureFromProvider(response.status, payload)
  const player = normalizeOfficialKingshotPlayer(payload, challenge.playerId, challenge.kingdomId)
  return {
    player,
    lookupReceipt: createOfficialPlayerLookupReceipt(player, now),
    provider: OFFICIAL_PROVIDER_ID,
    observedAt: new Date(now).toISOString(),
  }
}

export function verifyOfficialPlayerLookupReceipt(receiptInput: unknown, requestedPlayerIdInput: unknown, requestedKingdomIdInput: unknown, now = Date.now()) {
  const requestedPlayerId = validatePlayerId(requestedPlayerIdInput)
  const requestedKingdomId = validateKingdomId(requestedKingdomIdInput)
  const { tokenSecret } = providerConfig()
  const receipt = verifyToken<ReceiptPayload>(receiptInput, 'receipt', tokenSecret, now)
  if (receipt.player.playerId !== requestedPlayerId || receipt.player.kingdom !== requestedKingdomId) {
    throw new OfficialKingshotProviderError(409, 'RECEIPT_MISMATCH', 'The verified player result does not match the requested Player ID and State.')
  }
  return receipt.player
}
