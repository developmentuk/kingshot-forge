import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ForgeAuthenticationError, requireForgeActor } from '../../server/auth/requireForgeActor.js'
import { LinkedPlayerServiceError } from '../../server/player-identity/linkedPlayerService.js'
import { saveOcrFallbackAccount } from '../../server/player-identity/ocrFallbackService.js'

export default async function handler(request: VercelRequest, response: VercelResponse): Promise<void> {
  if (request.method !== 'POST') { response.setHeader('Allow', 'POST'); response.status(405).json({ status: 'error', message: 'Method not allowed.' }); return }
  try {
    const actor = await requireForgeActor(request)
    const input = request.body && typeof request.body === 'object' ? request.body as Record<string, unknown> : {}
    const data = await saveOcrFallbackAccount(actor.userId, input as never)
    response.status(200).json({ status: 'success', data })
  } catch (error) {
    if (error instanceof ForgeAuthenticationError || error instanceof LinkedPlayerServiceError) { response.status(error.statusCode).json({ status: 'error', message: error.message }); return }
    console.error('[player-ocr-fallback]', error instanceof Error ? error.name : 'UnknownError')
    response.status(500).json({ status: 'error', message: 'The OCR fallback could not be saved safely.' })
  }
}
