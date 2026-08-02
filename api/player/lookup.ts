import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  completeOfficialPlayerLookup,
  createOfficialPlayerChallenge,
  OfficialKingshotProviderError,
} from '../../server/player-identity/officialKingshotPlayerProvider.js'

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

function enforceSameOrigin(request: VercelRequest) {
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
