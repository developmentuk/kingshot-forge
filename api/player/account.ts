import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ForgeAuthenticationError, requireForgeActor } from '../../server/auth/requireForgeActor.js'
import { captureServerException } from '../../server/observability/sentry.js'
import { LinkedPlayerServiceError, linkOrRevalidatePlayerAccount } from '../../server/player-identity/linkedPlayerService.js'

function body(request: VercelRequest) {
  return request.body && typeof request.body === 'object' ? request.body as Record<string, unknown> : {}
}

function fail(response: VercelResponse, status: number, message: string, code?: string) {
  response.status(status).json({ status: 'error', ...(code ? { code } : {}), message })
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

  let actorUserId: string | undefined

  try {
    const actor = await requireForgeActor(request)
    actorUserId = actor.userId
    const input = body(request)
    const action = input.action === 'revalidate' ? 'revalidate' : input.action === 'link' ? 'link' : null
    if (!action) { fail(response, 400, 'A valid player action is required.'); return }
    const data = await linkOrRevalidatePlayerAccount(actor.userId, {
      action,
      playerId: input.playerId,
      kingdomId: input.kingdomId ?? input.state,
      forceProviderRefresh: input.forceProviderRefresh === true,
    })
    response.status(200).json(data === null
      ? { status: 'success', code: 'NO_LINKED_PLAYER', data: null }
      : { status: 'success', data })
  } catch (error) {
    if (error instanceof ForgeAuthenticationError || error instanceof LinkedPlayerServiceError) {
      fail(
        response,
        error.statusCode,
        error.message,
        error instanceof LinkedPlayerServiceError ? error.code : undefined,
      )
      return
    }

    console.error('[player-account]', { method: request.method, name: error instanceof Error ? error.name : 'UnknownError' })
    await captureServerException(error, {
      route: '/api/player/account',
      method: request.method,
      statusCode: 500,
      actorUserId,
    })
    fail(response, 500, 'The player verification service is temporarily unavailable.')
  }
}
