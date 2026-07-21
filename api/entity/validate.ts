import type { VercelRequest, VercelResponse } from '@vercel/node'
import { isValidForgeId, parseForgeId } from '../../shared/entity-identity/forgeId.js'
import { entityTypeRegistry } from '../../shared/entity-identity/registry.js'

export default function handler(request: VercelRequest, response: VercelResponse): void {
  if (request.method !== 'GET' && request.method !== 'POST') { response.status(405).json({ status: 'error', code: 'METHOD_NOT_ALLOWED' }); return }
  const value = request.method === 'GET' ? request.query.forge_id : request.body?.forge_id
  const parsed = parseForgeId(value)
  const definition = parsed ? entityTypeRegistry.byNamespace(parsed.namespace) : null
  response.status(200).json({ status: 'success', data: { valid: isValidForgeId(value), forge_id: parsed?.forgeId ?? null, namespace: parsed?.namespace ?? null, local_key: parsed?.localKey ?? null, entity_type: definition?.key ?? null, enabled: definition?.enabled ?? false } })
}
