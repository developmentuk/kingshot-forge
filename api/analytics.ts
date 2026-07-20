import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireForgeActor, ForgeAuthenticationError } from '../server/auth/requireForgeActor.js'
import { getReport, recordEvent } from '../server/analytics/service.js'

export default async function handler(request: VercelRequest, response: VercelResponse): Promise<void> {
  try {
    if (request.method === 'POST') { await recordEvent(request.body ?? {}, { userAgent: request.headers['user-agent'], referer: request.headers.referer }); response.status(204).end(); return }
    if (request.method === 'GET') { response.status(200).json({ status: 'success', data: await getReport(await requireForgeActor(request)) }); return }
    response.setHeader('Allow', 'GET, POST'); response.status(405).json({ status: 'error', message: 'Method not allowed.' })
  } catch (error) {
    if (error instanceof ForgeAuthenticationError) { response.status(error.statusCode).json({ status: 'error', message: error.message }); return }
    const status = typeof error === 'object' && error && 'statusCode' in error && typeof error.statusCode === 'number' ? error.statusCode : 500
    response.status(status).json({ status: 'error', message: status === 500 ? 'Analytics service unavailable.' : error instanceof Error ? error.message : 'Analytics unavailable.' })
  }
}
