import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ForgeAuthenticationError, requireForgeActor } from '../../server/auth/requireForgeActor.js'
import { getOperationsApplication, listApplications, recruitmentMetrics, RecruitmentError, reviewAction } from '../../server/recruitment/service.js'

function body(request: VercelRequest) { return request.body && typeof request.body === 'object' ? request.body as Record<string, unknown> : {} }
function fail(response: VercelResponse, status: number, message: string) { response.status(status).json({ status: 'error', message }) }

export default async function handler(request: VercelRequest, response: VercelResponse) {
  try {
    const actor = await requireForgeActor(request)
    const id = typeof request.query.applicationId === 'string' ? request.query.applicationId : null
    if (request.method === 'GET' && request.query.action === 'metrics') { response.status(200).json({ status: 'success', data: await recruitmentMetrics(actor) }); return }
    if (request.method === 'GET' && id) { response.status(200).json({ status: 'success', data: await getOperationsApplication(actor, id) }); return }
    if (request.method === 'GET') { response.status(200).json({ status: 'success', data: await listApplications(actor, { search: typeof request.query.search === 'string' ? request.query.search : undefined, status: typeof request.query.status === 'string' ? request.query.status : undefined, role: typeof request.query.role === 'string' ? request.query.role : undefined, page: typeof request.query.page === 'string' ? request.query.page : undefined, pageSize: typeof request.query.pageSize === 'string' ? request.query.pageSize : undefined }) }); return }
    if (request.method === 'POST' && id) {
      const input = body(request)
      if (input.action === 'assign_reviewer') input.reviewerUserId = actor.userId
      response.status(200).json({ status: 'success', data: await reviewAction(actor, id, typeof input.action === 'string' ? input.action : '', input) }); return
    }
    response.setHeader('Allow', 'GET, POST'); fail(response, 405, 'Method not allowed.')
  } catch (error) {
    if (error instanceof ForgeAuthenticationError || error instanceof RecruitmentError) { fail(response, error.statusCode, error.message); return }
    console.error('[operations-applications]', error instanceof Error ? error.message : 'Unknown error'); fail(response, 500, 'The Operations application service is temporarily unavailable.')
  }
}
