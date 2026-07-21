import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getEntityResolver } from '../../server/entity-identity/runtime.js'
import type { ResolutionMode } from '../../shared/entity-identity/contracts.js'

const MAX_IDS = 100
const MODES = new Set<ResolutionMode>(['internal', 'editorial', 'published', 'public-route', 'search'])

export default async function handler(request: VercelRequest, response: VercelResponse): Promise<void> {
  if (request.method !== 'POST') { response.status(405).json({ status: 'error', code: 'METHOD_NOT_ALLOWED' }); return }
  const ids: string[] = Array.isArray(request.body?.forge_ids) ? (request.body.forge_ids as unknown[]).filter((value: unknown): value is string => typeof value === 'string') : []
  if (!ids.length || ids.length > MAX_IDS) { response.status(400).json({ status: 'error', code: 'INVALID_BATCH_SIZE' }); return }
  const mode = typeof request.body?.mode === 'string' && MODES.has(request.body.mode as ResolutionMode) ? request.body.mode as ResolutionMode : 'published'
  const unique: string[] = [...new Set(ids)]
  const resolved = new Map(await Promise.all(unique.map(async (id: string) => [id, await getEntityResolver().resolve(id, mode, { actorId: null })] as const)))
  response.status(200).json({ status: 'success', data: ids.map((id) => resolved.get(id)) })
}
