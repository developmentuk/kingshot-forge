import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  completeOfficialPlayerLookup,
  createOfficialPlayerChallenge,
  OfficialKingshotProviderError,
} from '../../server/player-identity/officialKingshotPlayerProvider.js'

const OFFICIAL_PROVIDER_ORIGIN = 'https://ks-giftcode.centurygame.com'
const OFFICIAL_PROVIDER_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

type FetchState = typeof globalThis & {
  __forgeOfficialProviderFetchInstalled?: boolean
}

function installOfficialProviderFetchProfile() {
  const state = globalThis as FetchState
  if (state.__forgeOfficialProviderFetchInstalled) return

  const nativeFetch = globalThis.fetch.bind(globalThis)
  globalThis.fetch = async (input: string | URL | Request, init?: RequestInit) => {
    const requestUrl = typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url

    if (!requestUrl.startsWith(`${OFFICIAL_PROVIDER_ORIGIN}/`)) {
      return nativeFetch(input, init)
    }

    const headers = new Headers(input instanceof Request ? input.headers : undefined)
    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value))
    }

    headers.set('Accept', 'application/json, text/plain, */*')
    headers.set('Accept-Language', 'en-GB,en;q=0.9')
    headers.set('Referer', `${OFFICIAL_PROVIDER_ORIGIN}/`)
    headers.set('User-Agent', OFFICIAL_PROVIDER_USER_AGENT)
    if ((init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase() !== 'GET') {
      headers.set('Origin', OFFICIAL_PROVIDER_ORIGIN)
    }

    const upstream = await nativeFetch(input, { ...init, headers })
    const contentType = upstream.headers.get('content-type') ?? ''
    if (!contentType.toLowerCase().includes('json')) {
      console.warn('[official-player-provider-response]', {
        status: upstream.status,
        contentType: contentType.slice(0, 120),
        contentLength: upstream.headers.get('content-length') ?? 'unknown',
        server: (upstream.headers.get('server') ?? 'unknown').slice(0, 80),
        location: (upstream.headers.get('location') ?? '').slice(0, 160),
      })
    }
    return upstream
  }

  state.__forgeOfficialProviderFetchInstalled = true
}

installOfficialProviderFetchProfile()

type RateRecord = { count: number; resetAt: number }
const rateLimits = new Map<string, RateRecord>()
const RATE_WINDOW_MS = 5 * 60 * 1000
const RATE_LIMIT = 8

function requestBody(request: VercelRequest) {
  return request.body && typeof request.body === 'object' ? request.body as Record<string, unknown> : {}
}

function fail(response: VercelResponse, status: number, message: string, code?: string) {
  response.status(status).json({ status: 'error', message, meta: code ? { code } : undefined })
}

function requestKey(request: VercelRequest) {
  const forwarded = request.headers['x-forwarded-for']
  const value = Array.isArray(forwarded) ? forwarded[0] : forwarded
  return String(value ?? request.socket.remoteAddress ?? 'unknown').split(',')[0]!.trim()
}

function enforceSameOrigin(request: VercRequest) {
  const origin = typeof request.headers.origin === 'string' ? request.headers.origin : ''
  const host = typeof request.headers.host === 'string' ? request.headers.host : ''
  if (!origin || !host) return
  try {
    if (new URL(origin).host !== host) {
      throw new OfficialKingshotProviderError(403, 'ORIGIN_REJECTED', 'This player verification request is not permitted.')
    }
  } catch (error) {
    if (error instanceof OfficialKingshotProviderError) throw error
    throw new OfficialKingshotProviderError(403, 'ORIGIN_REJECTED', 'This player verification request is not permitted.')
  }
}

function enforceRateLimit(request: VercelRequest) {
  const now = Date.now()
  const key = requestKey(request)
  const current = rateLimits.get(key)
  if (!current || current.resetAt <= now) {
    rateLimits.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return
  }
  if (current.count >= RATE_LIMIT) {
    throw new OfficialKingshotProviderError(429, 'FORGE_RATE_LIMITED', 'Too many player verification requests. Try again in a few minutes.')
  }
  current.count += 1
}

export default async function handler(request: VercelRequest, response: VercelResponse): Promise<void> {
  response.setHeader('Cache-Control', 'no-store')
  response.setHeader('X-Content-Type-Options', 'nosniff')
  response.setHeader('Referrer-Policy', 'no-referrer')
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    fail(response, 405, 'Method not allowed.')
    return
  }

  try {
    enforceSameOrigin(request)
    enforceRateLimit(request)
    const input = requestBody(request)
    if (input.action === 'challenge') {
      const data = await createOfficialPlayerChallenge(input.playerId, input.kingdomId ?? input.state)
      response.status(200).json({ status: 'success', data, message: 'Official verification image created.', timestamp: new Date().toISOString() })
      return
    }
    if (input.action === 'complete') {
      const result = await completeOfficialPlayerLookup(input.challengeToken, input.captchaCode)
      response.status(200).json({
        status: 'success',
        data: result.player,
        lookupReceipt: result.lookupReceipt,
        provider: result.provider,
        message: 'Player found through the official Kingshot service.',
        timestamp: result.observedAt,
      })
      return
    }
    fail(response, 400, 'A valid player verification action is required.')
  } catch (error) {
    if (error instanceof OfficialKingshotProviderError) {
      fail(response, error.statusCode, error.message, error.code)
      return
    }
    console.error('[official-player-lookup]', { name: error instanceof Error ? error.name : 'UnknownError' })
    fail(response, 500, 'The official Kingshot player verification service is temporarily unavailable.')
  }
}
