import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ForgeAuthenticationError, requireForgeActor } from '../../server/auth/requireForgeActor.js'
import { readSingleQueryParameter } from '../../server/http/requestQuery.js'
import { assignRole, changeAccountStatus, getUserDetail, linkManagedPlayer, listUsers, lookupManagedPlayer, UserManagementError, roleCatalogue, revokeRole } from '../../server/identity/userManagementService.js'

function body(request: VercelRequest) { return request.body && typeof request.body === 'object' ? request.body as Record<string, unknown> : {} }
function fail(response: VercelResponse, status: number, message: string) { response.status(status).json({ status: 'error', message }) }

export default async function handler(request: VercelRequest, response: VercelResponse): Promise<void> {
  try {
    const actor = await requireForgeActor(request)
    const userId = readSingleQueryParameter(request.url, 'userId')
    const action = readSingleQueryParameter(request.url, 'action')
    if (request.method === 'GET' && action === 'roles') { response.status(200).json({ status: 'success', data: roleCatalogue(actor) }); return }
    if (request.method === 'GET' && userId) { response.status(200).json({ status: 'success', data: await getUserDetail(actor, userId) }); return }
    if (request.method === 'GET') {
      response.status(200).json({ status: 'success', data: await listUsers(actor, {
        search: readSingleQueryParameter(request.url, 'search') ?? undefined,
        role: readSingleQueryParameter(request.url, 'role') ?? undefined,
        status: readSingleQueryParameter(request.url, 'status') ?? undefined,
        page: readSingleQueryParameter(request.url, 'page') ?? undefined,
        pageSize: readSingleQueryParameter(request.url, 'pageSize') ?? undefined,
      }) }); return
    }
    if (request.method === 'POST' && userId) {
      const input = body(request)
      if (input.action === 'assign_role') response.status(200).json({ status: 'success', data: await assignRole(actor, userId, input.role, input.reason) })
      else if (input.action === 'revoke_role') response.status(200).json({ status: 'success', data: await revokeRole(actor, userId, input.role, input.reason) })
      else if (input.action === 'change_status') response.status(200).json({ status: 'success', data: await changeAccountStatus(actor, userId, input.status, input.reason) })
      else if (input.action === 'lookup_player') response.status(200).json({ status: 'success', data: await lookupManagedPlayer(actor, input) })
      else if (input.action === 'link_player') response.status(200).json({ status: 'success', data: await linkManagedPlayer(actor, userId, input) })
      else fail(response, 400, 'A valid identity management action is required.')
      return
    }
    response.setHeader('Allow', 'GET, POST'); fail(response, 405, 'Method not allowed.')
  } catch (error) {
    if (error instanceof ForgeAuthenticationError || error instanceof UserManagementError) { fail(response, error.statusCode, error.message); return }
    console.error('[operations-users]', { method: request.method, name: error instanceof Error ? error.name : 'UnknownError' })
    fail(response, 500, 'The Forge identity service is temporarily unavailable.')
  }
}
