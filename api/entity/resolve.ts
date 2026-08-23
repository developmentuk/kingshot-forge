import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getEntityResolver } from '../../server/entity-identity/runtime.js'
import { readSingleQueryParameter } from '../../server/http/requestQuery.js'
import type { ResolutionMode } from '../../shared/entity-identity/contracts.js'

const MODES = new Set<ResolutionMode>(['internal', 'editorial', 'published', 'public-route', 'search'])

export default async function handler(request: VercelRequest, response: VercelResponse): Promise<void> {
  if (request.method !== 'GET') { response.status(405).json({ status: 'error', code: 'METHOD_NOT_ALLOWED' }); return }
  const forgeId = readSingleQueryParameter(request.url, 'forge_id') ?? ''
  const modeValue = readSingleQueryParameter(request.url, 'mode')
  const mode = typeof modeValue === 'string' && MODES.has(modeValue as ResolutionMode) ? modeValue as ResolutionMode : 'published'
  const result = await getEntityResolver().resolve(forgeId, mode, { actorId: null })
  response.status(result.found ? 200 : 404).json({ status: result.found ? 'success' : 'not_found', data: result })
}
