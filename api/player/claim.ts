import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  ForgeAuthenticationError,
  requireForgeActor,
} from '../../server/auth/requireForgeActor.js'
import { LinkedPlayerServiceError } from '../../server/player-identity/linkedPlayerService.js'
import {
  createSelfReportedPlayerClaim,
  searchPlayerClaimCandidate,
} from '../../server/player-identity/playerClaimService.js'

type RateRecord = { count: number; resetAt: number }

const rateLimits = new Map<string, RateRecord>()
const RATE_WINDOW_MS = 5 * 60 * 1000
const RATE_LIMIT = 20

function body(request: VercelRequest) {
  return request.body && typeof request.body === 'object'
    ? request.body as Record<string, unknown>
    : {}
}

function fail(response: VercelResponse, status: number, message: string) {
  response.status(status).json({ status: 'error', message })
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
      throw new LinkedPlayerServiceError(403, 'This player claim request is not permitted.')
    }
  } catch (error) {
    if (error instanceof LinkedPlayerServiceError) throw error
    throw new LinkedPlayerServiceError(403, 'This player claim request is not permitted.')
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
    throw new LinkedPlayerServiceError(429, 'Too many player claim requests. Try again in a few minutes.')
  }
  current.count += 1
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
): Promise<void> {
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
    const actor = await requireForgeActor(request)
    const input = body(request)

    if (input.action === 'search') {
      const data = await searchPlayerClaimCandidate(
        actor.userId,
        input.playerId,
        input.kingdomId ?? input.state,
      )
      response.status(200).json({ status: 'success', data })
      return
    }

    if (input.action === 'claim') {
      const data = await createSelfReportedPlayerClaim(actor.userId, input)
      response.status(201).json({
        status: 'success',
        data,
        message: 'Player claim created. It remains unverified until evidence is reviewed.',
      })
      return
    }

    fail(response, 400, 'A valid player claim action is required.')
  } catch (error) {
    if (error instanceof ForgeAuthenticationError || error instanceof LinkedPlayerServiceError) {
      fail(response, error.statusCode, error.message)
      return
    }
    console.error('[player-claim]', {
      method: request.method,
      name: error instanceof Error ? error.name : 'UnknownError',
    })
    fail(response, 500, 'The player claim service is temporarily unavailable.')
  }
}
