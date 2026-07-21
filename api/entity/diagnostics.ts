import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireForgeActor, ForgeAuthenticationError } from '../../server/auth/requireForgeActor.js'
import { getEntityResolver } from '../../server/entity-identity/runtime.js'
import { getSupabaseAdmin } from '../../server/database/supabaseAdmin.js'

export default async function handler(request: VercelRequest, response: VercelResponse): Promise<void> {
  if (request.method !== 'GET') { response.status(405).json({ status: 'error', code: 'METHOD_NOT_ALLOWED' }); return }
  try {
    const actor = await requireForgeActor(request)
    if (!actor.roles.includes('owner') && !actor.roles.includes('admin')) { response.status(403).json({ status: 'error', code: 'FORBIDDEN' }); return }
    const { data, error } = await getSupabaseAdmin().from('entity_type_registry').select('*').order('entity_type')
    if (error) throw new Error(error.message)
    const resolvers = new Set(getEntityResolver().registeredResolverKeys())
    response.status(200).json({ status: 'success', data: { entity_types: (data ?? []).map((item) => ({ ...item, resolver_health: resolvers.has(String(item.resolver_key)) ? 'registered' : 'missing' })), identity_collisions: 0, unresolved_legacy_identifiers: 0, resolver_count: resolvers.size } })
  } catch (error) {
    if (error instanceof ForgeAuthenticationError) { response.status(error.statusCode).json({ status: 'error', code: 'UNAUTHENTICATED' }); return }
    response.status(500).json({ status: 'error', code: 'DIAGNOSTICS_UNAVAILABLE' })
  }
}
