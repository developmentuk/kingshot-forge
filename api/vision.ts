import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireForgeActor, ForgeAuthenticationError } from '../server/auth/requireForgeActor.js'
import { visionAuthoring, VisionPermissionError, VisionPersistenceUnavailableError } from '../server/vision/authoringService.js'

export default async function handler(request: VercelRequest, response: VercelResponse): Promise<void> {
  if (!['GET', 'POST'].includes(request.method ?? '')) { response.setHeader('Allow', 'GET, POST'); response.status(405).json({ status: 'error', message: 'Method not allowed.' }); return }
  try { const actor = await requireForgeActor(request); const action = request.method === 'GET' ? 'list' : String(request.body?.action ?? ''); const data = await visionAuthoring(actor, action, (request.body ?? {}) as Record<string, unknown>); response.status(200).json({ status: 'success', data }) }
  catch (error) { const status = error instanceof ForgeAuthenticationError ? 401 : error instanceof VisionPermissionError ? 403 : error instanceof VisionPersistenceUnavailableError ? 503 : 500; response.status(status).json({ status: 'error', message: error instanceof Error ? error.message : 'Vision Studio is unavailable.' }) }
}
