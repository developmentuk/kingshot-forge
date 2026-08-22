import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ForgeAuthenticationError, requireForgeActor, type ForgeActorRole } from '../../server/auth/requireForgeActor.js'
import { getSupabaseAdmin } from '../../server/database/supabaseAdmin.js'
import { readSingleQueryParameter } from '../../server/http/requestQuery.js'
import { canManageSearch, resolveSearchPermissionContext, SearchSimulationError } from '../../server/search/admin.js'
import { getSearchIndexCache, getSearchRefreshService, invalidateSearchIndex } from '../../server/search/runtime.js'
import { getSearchProjectionRepository } from '../../server/search/repository.js'
import { PUBLISHED_DATASET_KEYS } from '../../shared/data-engine/datasets.js'
import { buildSearchOperationalDiagnostics } from '../../shared/search/index.js'
import { parseQuery, SearchRequestError } from '../search.js'

export default async function handler(request: VercelRequest, response: VercelResponse): Promise<void> {
  try {
    const actor = await requireForgeActor(request)
    if (!canManageSearch(actor)) { response.status(403).json({ status: 'error', error: { code: 'PERMISSION_DENIED', message: 'Search Explorer administration is restricted to authorised administrators.' } }); return }
    if (request.method === 'GET') { await handleQuery(request, response, actor); return }
    if (request.method === 'POST') { await handleMutation(request, response, actor); return }
    response.setHeader('Allow', 'GET, POST'); response.status(405).json({ status: 'error', error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed.' } })
  } catch (error) {
    if (error instanceof ForgeAuthenticationError) { response.status(error.statusCode).json({ status: 'error', error: { code: 'UNAUTHENTICATED', message: error.message } }); return }
    if (error instanceof SearchSimulationError) { response.status(error.statusCode).json({ status: 'error', error: { code: 'SIMULATION_DENIED', message: error.message } }); return }
    if (error instanceof SearchRequestError) { response.status(400).json({ status: 'error', error: { code: error.code.toUpperCase(), message: error.message } }); return }
    response.status(500).json({ status: 'error', error: { code: 'SEARCH_ADMIN_UNAVAILABLE', message: 'The Search administration service is temporarily unavailable.' } })
  }
}

async function handleQuery(request: VercelRequest, response: VercelResponse, actor: Parameters<typeof resolveSearchPermissionContext>[0]): Promise<void> {
  const query = parseQuery(request); const simulatedRole = readSingleQueryParameter(request.url, 'simulate') ?? undefined
  const permissions = await resolveSearchPermissionContext(actor, simulatedRole, async (role) => loadRolePermissions(role))
  if (simulatedRole) await getSearchProjectionRepository().recordPermissionSimulation({ real_actor_id: actor.userId, simulated_role: simulatedRole, simulated_permissions: permissions.permissions ?? [], occurred_at: new Date().toISOString() })
  const result = await getSearchIndexCache().query({ ...query, permissions })
  const health = await getSearchIndexCache().health()
  const diagnostics = await buildSearchOperationalDiagnostics(getSearchProjectionRepository())
  response.status(200).json({ status: 'success', data: { query: result.query, results: result.results, simulation: { realActorId: actor.userId, simulatedRole: simulatedRole ?? actor.role }, index: health, diagnostics } })
}

async function handleMutation(request: VercelRequest, response: VercelResponse, actor: Parameters<typeof resolveSearchPermissionContext>[0]): Promise<void> {
  const body = request.body as { action?: string; mode?: string; datasets?: unknown; confirm?: boolean }
  if (body.action === 'invalidate') { await invalidateSearchIndex(); response.status(200).json({ status: 'success', data: { invalidated: true, actorId: actor.userId } }); return }
  if (body.action !== 'refresh') { response.status(400).json({ status: 'error', error: { code: 'INVALID_ACTION', message: 'Supported actions are refresh and invalidate.' } }); return }
  const mode = body.mode === 'full' || body.mode === 'dataset' || body.mode === 'record' || body.mode === 'relationships' ? body.mode : null
  const datasets = Array.isArray(body.datasets) ? body.datasets.filter((dataset): dataset is string => typeof dataset === 'string') : [...PUBLISHED_DATASET_KEYS]
  if (!mode || datasets.some((dataset) => !PUBLISHED_DATASET_KEYS.includes(dataset as typeof PUBLISHED_DATASET_KEYS[number]))) { response.status(400).json({ status: 'error', error: { code: 'INVALID_REFRESH', message: 'Refresh mode or dataset selection is invalid.' } }); return }
  if (mode === 'full' && body.confirm !== true) { response.status(400).json({ status: 'error', error: { code: 'CONFIRMATION_REQUIRED', message: 'Full rebuild requires explicit confirmation.' } }); return }
  const run = await getSearchRefreshService().refresh(mode, datasets)
  await invalidateSearchIndex()
  response.status(200).json({ status: 'success', data: { run, actorId: actor.userId } })
}

async function loadRolePermissions(role: ForgeActorRole): Promise<readonly string[]> {
  const { data, error } = await getSupabaseAdmin().from('forge_role_permissions').select('permission_key').eq('role', role)
  if (error) throw new Error(error.message)
  return (data ?? []).map((item) => String(item.permission_key))
}
