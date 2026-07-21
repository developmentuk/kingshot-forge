import type { VercelRequest, VercelResponse } from '@vercel/node'
import { entityTypeRegistry } from '../../shared/entity-identity/registry.js'

export default function handler(request: VercelRequest, response: VercelResponse): void {
  if (request.method !== 'GET') { response.status(405).json({ status: 'error', code: 'METHOD_NOT_ALLOWED' }); return }
  response.status(200).json({ status: 'success', data: entityTypeRegistry.listEnabled() })
}
