import { createHash } from 'node:crypto'
import type {
  GiftCodeProviderCapabilities,
  GiftCodeProviderResult,
  GiftCodeRedemptionProvider,
  GiftCodeRedemptionRequest,
} from './provider.ts'

export const OFFICIAL_GIFT_CODE_PROVIDER_ID = 'official-kingshot'

export type OfficialProviderConfig = Readonly<{
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
  kingdom: 'The provider could not validate this Governor and kingdom combination. Refresh or relink the Governor details before trying again.',
  ineligible: 'This Governor does not currently meet the provider requirements for this code.',
  exhausted: 'The provider reports that this code can no longer be claimed.',
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
  const codeUrl = environment.KINGSHOT_REDEMPTION_CODE_URL?.trim()
  const signingKey = environment.KINGSHOT_REDEMPTION_SIGNING_KEY?.trim()
  const timeoutMs = Number(environment.KINGSHOT_REDEMPTION_TIMEOUT_MS ?? 15_000)

  if (
    !codeUrl ||
    !signingKey ||
    !Number.isInteger(timeoutMs) ||
    timeoutMs < 1_000 ||
    timeoutMs > 60_000
  ) {
    return null
  }

  return Object.freeze({
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

  if (message === 'SUCCESS' || errorCode === 20000) {
    return result({ status: 'succeeded', externalRequestSent: true, requestDisposition: 'sent', providerReference: null, failureCategory: null, retryAfterSeconds: null, safeDiagnosticCode: 'confirmed', safeMessage: SAFE_MESSAGES.success })
  }
  if ((message === 'RECEIVED' && errorCode === 40008) || (message === 'SAME TYPE EXCHANGE' && errorCode === 40011)) {
    return result({ status: 'already_claimed', externalRequestSent: true, requestDisposition: 'sent', providerReference: null, failureCategory: null, retryAfterSeconds: null, safeDiagnosticCode: 'already_claimed', safeMessage: SAFE_MESSAGES.already })
  }
  if (message === 'TIME ERROR' && errorCode === 40007) {
    return result({ status: 'expired', externalRequestSent: true, requestDisposition: 'sent', providerReference: null, failureCategory: 'permanent', retryAfterSeconds: null, safeDiagnosticCode: 'expired', safeMessage: SAFE_MESSAGES.expired })
  }
  if (message === 'CDK NOT FOUND' && errorCode === 40014) {
    return result({ status: 'failed', externalRequestSent: true, requestDisposition: 'sent', providerReference: null, failureCategory: 'permanent', retryAfterSeconds: null, safeDiagnosticCode: 'invalid_code', safeMessage: SAFE_MESSAGES.invalid })
  }
  if ((message === 'USED' && errorCode === 40005) || errorCode === 40005) {
    return result({ status: 'failed', externalRequestSent: true, requestDisposition: 'sent', providerReference: null, failureCategory: 'permanent', retryAfterSeconds: null, safeDiagnosticCode: 'code_limit_reached', safeMessage: SAFE_MESSAGES.exhausted })
  }
  if (errorCode === 40019 || message.includes('TOO FREQUENT') || message.includes('FREQUENT')) {
    return result({ status: 'failed', externalRequestSent: true, requestDisposition: 'sent', providerReference: null, failureCategory: 'rate_limited', retryAfterSeconds: 60, safeDiagnosticCode: 'rate_limited', safeMessage: SAFE_MESSAGES.retry })
  }
  if (errorCode === 40020 || message.includes('KID_MISMATCH') || message.includes('USER INFO ERROR')) {
    return result({ status: 'failed', externalRequestSent: true, requestDisposition: 'sent', providerReference: null, failureCategory: 'invalid_request', retryAfterSeconds: null, safeDiagnosticCode: 'kingdom_mismatch', safeMessage: SAFE_MESSAGES.kingdom })
  }
  if (errorCode === 40001 || message.includes('ROLE NOT EXIST')) {
    return result({ status: 'failed', externalRequestSent: true, requestDisposition: 'sent', providerReference: null, failureCategory: 'invalid_request', retryAfterSeconds: null, safeDiagnosticCode: 'invalid_player', safeMessage: SAFE_MESSAGES.player })
  }
  if (
    errorCode === 40006 ||
    errorCode === 40010 ||
    errorCode === 40017 ||
    errorCode === 40018 ||
    message === 'STOVE_LV ERROR' ||
    message === 'RECHARGE_MONEY ERROR' ||
    message === 'RECHARGE_MONEY_VIP ERROR'
  ) {
    return result({ status: 'failed', externalRequestSent: true, requestDisposition: 'sent', providerReference: null, failureCategory: 'invalid_request', retryAfterSeconds: null, safeDiagnosticCode: 'ineligible_player', safeMessage: SAFE_MESSAGES.ineligible })
  }
  if (message === 'TIMEOUT RETRY' || errorCode === 40004 || message.includes('SIGN ERROR')) {
    return result({ status: 'failed', externalRequestSent: true, requestDisposition: 'unknown', providerReference: null, failureCategory: 'transient_provider', retryAfterSeconds: 30, safeDiagnosticCode: message.includes('SIGN') ? 'signing_rejected' : 'provider_retry', safeMessage: SAFE_MESSAGES.retry })
  }
  if (message === 'NOT LOGIN') {
    return result({ status: 'failed', externalRequestSent: true, requestDisposition: 'unknown', providerReference: null, failureCategory: 'transient_provider', retryAfterSeconds: 30, safeDiagnosticCode: 'provider_session_rejected', safeMessage: SAFE_MESSAGES.retry })
  }

  return result({ status: 'failed', externalRequestSent: true, requestDisposition: 'unknown', providerReference: null, failureCategory: 'transient_provider', retryAfterSeconds: 30, safeDiagnosticCode: 'unknown_response', safeMessage: SAFE_MESSAGES.unknown })
}

function timeoutSignal(timeoutMs: number) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  return { controller, timeout }
}

function sessionHeaders() {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/x-www-form-urlencoded',
    Origin: 'https://kingshot-giftcode.centurygame.com',
    Referer: 'https://kingshot-giftcode.centurygame.com/',
  }
}

async function requestJson(
  fetcher: OfficialProviderFetch,
  url: string,
  fields: Readonly<Record<string, string>>,
  config: OfficialProviderConfig,
) {
  const { controller, timeout } = timeoutSignal(config.timeoutMs)
  try {
    const body = new URLSearchParams(fields).toString()
    const response = await fetcher(url, { method: 'POST', headers: sessionHeaders(), body, signal: controller.signal })
    const payload = await response.json().catch(() => null)
    return { response, payload }
  } finally {
    clearTimeout(timeout)
  }
}

function validKingdomId(value: string) {
  return /^\d{1,4}$/u.test(value) && Number(value) >= 1 && Number(value) <= 9999
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
      if (!validKingdomId(request.kingdomId)) {
        return result({ status: 'failed', externalRequestSent: false, requestDisposition: 'not_sent', providerReference: null, failureCategory: 'invalid_request', retryAfterSeconds: null, safeDiagnosticCode: 'kingdom_required', safeMessage: SAFE_MESSAGES.kingdom })
      }

      try {
        const code = createSignedFields({
          cdk: request.code,
          fid: request.playerId,
          kid: request.kingdomId,
          time: String(Math.floor(Date.now() / 1000)),
        }, config.signingKey)
        const codeResponse = await requestJson(fetcher, config.codeUrl, code, config)
        if (codeResponse.response.status === 429) {
          return result({ status: 'failed', externalRequestSent: true, requestDisposition: 'sent', providerReference: null, failureCategory: 'rate_limited', retryAfterSeconds: 60, safeDiagnosticCode: 'rate_limited', safeMessage: SAFE_MESSAGES.retry })
        }
        if (!codeResponse.response.ok && codeResponse.payload === null) {
          return result({ status: 'failed', externalRequestSent: true, requestDisposition: 'unknown', providerReference: null, failureCategory: 'transient_provider', retryAfterSeconds: 30, safeDiagnosticCode: `http_${codeResponse.response.status}`, safeMessage: SAFE_MESSAGES.unavailable })
        }
        return normaliseOfficialResponse(codeResponse.payload)
      } catch (error) {
        return result({ status: 'failed', externalRequestSent: false, requestDisposition: 'unknown', providerReference: null, failureCategory: 'transient_provider', retryAfterSeconds: 30, safeDiagnosticCode: error instanceof DOMException && error.name === 'AbortError' ? 'timeout' : 'network_error', safeMessage: SAFE_MESSAGES.unavailable })
      }
    },
  })
}

export const officialGiftCodeProviderSkeleton = createOfficialGiftCodeProvider(null)
