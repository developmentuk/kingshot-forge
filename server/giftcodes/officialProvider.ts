import { createHash } from 'node:crypto'
import type {
  GiftCodeProviderCapabilities,
  GiftCodeProviderResult,
  GiftCodeRedemptionProvider,
  GiftCodeRedemptionRequest,
} from './provider.ts'

export const OFFICIAL_GIFT_CODE_PROVIDER_ID = 'official-kingshot'

export type OfficialProviderConfig = Readonly<{
  playerUrl: string
  codeUrl: string
  signingKey: string
  timeoutMs: number
  enabled: boolean
}>

export type OfficialProviderFetch = (
  input: string,
  init: RequestInit,
) => Promise<Response>

export const officialGiftCodeProviderCapabilities:
  GiftCodeProviderCapabilities = Object.freeze({
    executionMode: 'external',
    redemptionSupport: 'live',
    externalRequestsAllowed: true,
    requiresVerifiedCharacter: true,
    requiresConsent: true,
    supportsBatchRedemption: false,
    supportsHealthScoring: true,
  })

const SAFE_MESSAGES = Object.freeze({
  success: 'The provider confirmed redemption.',
  already: 'This Governor already claimed the code.',
  expired: 'The provider reports that this code has expired.',
  invalid: 'The provider did not accept this code.',
  player: 'The provider could not validate this Governor.',
  retry: 'The provider asked Forge to try again later.',
  unavailable: 'The redemption provider is temporarily unavailable.',
  unknown: 'The provider returned an unexpected result.',
})

function readBoolean(value: string | undefined) {
  return value === 'true'
}

export function readOfficialProviderConfig(
  environment: NodeJS.ProcessEnv = process.env,
): OfficialProviderConfig | null {
  const playerUrl = environment.KINGSHOT_REDEMPTION_PLAYER_URL?.trim()
  const codeUrl = environment.KINGSHOT_REDEMPTION_CODE_URL?.trim()
  const signingKey = environment.KINGSHOT_REDEMPTION_SIGNING_KEY?.trim()
  const timeoutMs = Number(environment.KINGSHOT_REDEMPTION_TIMEOUT_MS ?? 15_000)

  if (
    !playerUrl ||
    !codeUrl ||
    !signingKey ||
    !Number.isInteger(timeoutMs) ||
    timeoutMs < 1_000 ||
    timeoutMs > 60_000
  ) {
    return null
  }

  return Object.freeze({
    playerUrl,
    codeUrl,
    signingKey,
    timeoutMs,
    enabled: readBoolean(environment.KINGSHOT_REDEMPTION_ENABLED),
  })
}

function encodeSigningValue(value: unknown) {
  return typeof value === 'object' && value !== null
    ? JSON.stringify(value)
    : String(value)
}

export function createSignedFields(
  fields: Readonly<Record<string, string>>,
  signingKey: string,
) {
  const encoded = Object.keys(fields)
    .sort()
    .map((key) => `${key}=${encodeSigningValue(fields[key])}`)
    .join('&')

  return {
    ...fields,
    sign: createHash('md5')
      .update(`${encoded}${signingKey}`, 'utf8')
      .digest('hex'),
  }
}

function result(
  input: Omit<GiftCodeProviderResult, 'safeMessage'> & {
    safeMessage: string
  },
): GiftCodeProviderResult {
  return Object.freeze(input)
}

export function normaliseOfficialResponse(
  response: unknown,
): GiftCodeProviderResult {
  if (response === null || typeof response !== 'object') {
    return result({
      status: 'failed',
      externalRequestSent: true,
      requestDisposition: 'unknown',
      providerReference: null,
      failureCategory: 'transient_provider',
      retryAfterSeconds: 30,
      safeDiagnosticCode: 'malformed_response',
      safeMessage: SAFE_MESSAGES.unknown,
    })
  }

  const payload = response as Record<string, unknown>
  const message = String(payload.msg ?? '').trim().toUpperCase().replace(/\.$/, '')
  const errorCode = Number(payload.err_code)

  if (message === 'SUCCESS') {
    return result({ status: 'succeeded', externalRequestSent: true, requestDisposition: 'sent', providerReference: null, failureCategory: null, retryAfterSeconds: null, safeDiagnosticCode: 'confirmed', safeMessage: SAFE_MESSAGES.success })
  }
  if (message === 'RECEIVED' && errorCode === 40008 || message === 'SAME TYPE EXCHANGE' && errorCode === 40011 || message === 'USED' && errorCode === 40005) {
    return result({ status: 'already_claimed', externalRequestSent: true, requestDisposition: 'sent', providerReference: null, failureCategory: null, retryAfterSeconds: null, safeDiagnosticCode: 'already_claimed', safeMessage: SAFE_MESSAGES.already })
  }
  if (message === 'TIME ERROR' && errorCode === 40007) {
    return result({ status: 'expired', externalRequestSent: true, requestDisposition: 'sent', providerReference: null, failureCategory: 'permanent', retryAfterSeconds: null, safeDiagnosticCode: 'expired', safeMessage: SAFE_MESSAGES.expired })
  }
  if (message === 'CDK NOT FOUND' && errorCode === 40014) {
    return result({ status: 'failed', externalRequestSent: true, requestDisposition: 'sent', providerReference: null, failureCategory: 'permanent', retryAfterSeconds: null, safeDiagnosticCode: 'invalid_code', safeMessage: SAFE_MESSAGES.invalid })
  }
  if (message === 'STOVE_LV ERROR' || message === 'RECHARGE_MONEY ERROR' || message === 'RECHARGE_MONEY_VIP ERROR' || message === 'NOT LOGIN') {
    return result({ status: 'failed', externalRequestSent: true, requestDisposition: 'sent', providerReference: null, failureCategory: 'invalid_request', retryAfterSeconds: null, safeDiagnosticCode: 'invalid_player', safeMessage: SAFE_MESSAGES.player })
  }
  if (message === 'TIMEOUT RETRY' || message.includes('SIGN ERROR')) {
    return result({ status: 'failed', externalRequestSent: true, requestDisposition: 'unknown', providerReference: null, failureCategory: 'transient_provider', retryAfterSeconds: 30, safeDiagnosticCode: message.includes('SIGN') ? 'signing_rejected' : 'provider_retry', safeMessage: SAFE_MESSAGES.retry })
  }

  return result({ status: 'failed', externalRequestSent: true, requestDisposition: 'unknown', providerReference: null, failureCategory: 'transient_provider', retryAfterSeconds: 30, safeDiagnosticCode: 'unknown_response', safeMessage: SAFE_MESSAGES.unknown })
}

function timeoutSignal(timeoutMs: number) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  return { controller, timeout }
}

function sessionHeaders(cookie: string | null) {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/x-www-form-urlencoded',
    Origin: 'https://kingshot-giftcode.centurygame.com',
    Referer: 'https://kingshot-giftcode.centurygame.com/',
    ...(cookie ? { Cookie: cookie } : {}),
  }
}

function readCookie(response: Response, current: string | null) {
  const values = typeof response.headers.getSetCookie === 'function'
    ? response.headers.getSetCookie()
    : (response.headers.get('set-cookie') ?? '').split(',')
  const cookies = new Map<string, string>()
  if (current) for (const item of current.split('; ')) {
    const [name, value] = item.split('=', 2)
    if (name && value) cookies.set(name, value)
  }
  for (const item of values) {
    const [pair] = item.split(';', 1)
    const [name, value] = pair.split('=', 2)
    if (name && value) cookies.set(name, value)
  }
  return [...cookies.entries()].map(([name, value]) => `${name}=${value}`).join('; ') || null
}

async function requestJson(
  fetcher: OfficialProviderFetch,
  url: string,
  fields: Readonly<Record<string, string>>,
  config: OfficialProviderConfig,
  cookie: string | null,
) {
  const { controller, timeout } = timeoutSignal(config.timeoutMs)
  try {
    const body = new URLSearchParams(fields).toString()
    const response = await fetcher(url, { method: 'POST', headers: sessionHeaders(cookie), body, signal: controller.signal })
    const payload = await response.json().catch(() => null)
    return { response, payload, cookie: readCookie(response, cookie) }
  } finally {
    clearTimeout(timeout)
  }
}

export function createOfficialGiftCodeProvider(
  config: OfficialProviderConfig | null = readOfficialProviderConfig(),
  fetcher: OfficialProviderFetch = fetch,
): GiftCodeRedemptionProvider {
  return Object.freeze({
    id: OFFICIAL_GIFT_CODE_PROVIDER_ID,
    productionReady: config !== null,
    capabilities: officialGiftCodeProviderCapabilities,
    async redeem(request: GiftCodeRedemptionRequest) {
      if (!config || !config.enabled) {
        return result({ status: 'not_supported', externalRequestSent: false, requestDisposition: 'not_sent', providerReference: null, failureCategory: 'permanent', retryAfterSeconds: null, safeDiagnosticCode: 'provider_not_configured', safeMessage: 'Automatic redemption is not configured.' })
      }

      try {
        const player = createSignedFields({ fid: request.playerId, time: String(Math.floor(Date.now() / 1000)) }, config.signingKey)
        const playerResponse = await requestJson(fetcher, config.playerUrl, player, config, null)
        if (!playerResponse.response.ok || (playerResponse.payload as Record<string, unknown> | null)?.msg !== 'success') {
          return result({ status: 'failed', externalRequestSent: true, requestDisposition: 'sent', providerReference: null, failureCategory: 'invalid_request', retryAfterSeconds: null, safeDiagnosticCode: 'invalid_player', safeMessage: SAFE_MESSAGES.player })
        }
        const code = createSignedFields({ fid: request.playerId, cdk: request.code, time: String(Date.now()) }, config.signingKey)
        const codeResponse = await requestJson(fetcher, config.codeUrl, code, config, playerResponse.cookie)
        return normaliseOfficialResponse(codeResponse.payload)
      } catch (error) {
        return result({ status: 'failed', externalRequestSent: false, requestDisposition: 'unknown', providerReference: null, failureCategory: 'transient_provider', retryAfterSeconds: 30, safeDiagnosticCode: error instanceof DOMException && error.name === 'AbortError' ? 'timeout' : 'network_error', safeMessage: SAFE_MESSAGES.unavailable })
      }
    },
  })
}

export const officialGiftCodeProviderSkeleton = createOfficialGiftCodeProvider(null)
