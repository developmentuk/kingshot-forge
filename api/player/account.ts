import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ForgeAuthenticationError, requireForgeActor } from '../../server/auth/requireForgeActor.js'
import { LinkedPlayerServiceError, linkOrRevalidatePlayerAccount } from '../../server/player-identity/linkedPlayerService.js'

function body(request: VercelRequest) {
  return request.body && typeof request.body === 'object' ? request.body as Record<string, unknown> : {}
}

function fail(response: VercelResponse, status: number, message: string) {
  response.status(status).json({ status: 'error', message })
}

export default async function handler(request: VercelRequest, response: VercelResponse): Promise<void> {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    fail(response, 405, 'Method not allowed.')
    return
  }
  try {
    const actor = await requireForgeActor(request)
    const input = body(request)
    const action = input.action === 'revalidate' ? 'revalidate' : input.action === 'link' ? 'link' : null
    if (!action) { fail(response, 400, 'A valid player action is required.'); return }
    const data = await linkOrRevalidatePlayerAccount(actor.userId, {
      action,
      playerId: input.playerId,
      kingdomId: input.kingdomId ?? input.state,
    })
    response.status(200).json({ status: 'success', data })
  } catch (error) {
    if (error instanceof ForgeAuthenticationError || error instanceof LinkedPlayerServiceError) {
      fail(response, error.statusCode, error.message)
      return
    }
    console.error('[player-account]', { method: request.method, name: error instanceof Error ? error.name : 'UnknownError' })
    fail(response, 500, 'The player verification service is temporarily unavailable.')
  }
}
