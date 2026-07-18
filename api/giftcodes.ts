import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ForgeAuthenticationError, requireForgeActor } from '../server/auth/requireForgeActor.js'
import { autoRedeemPolicy, getAutoRedeemContext, getProviderOperations, grantConsent, redeemAvailable, redeemControlledValidationCode, redemptionHistory, revokeConsent, setProviderOperations } from '../server/giftcodes/autoRedeemService.js'

function body(request: VercelRequest) { return request.body && typeof request.body === 'object' ? request.body as Record<string, unknown> : {} }
function fail(response: VercelResponse, status: number, message: string) { response.status(status).json({ status: 'error', message }) }

export default async function handler(request: VercelRequest, response: VercelResponse): Promise<void> {
  try {
    const action = typeof request.query.action === 'string' ? request.query.action : 'context'
    if (request.method === 'GET' && action === 'policy') { response.status(200).json({ status: 'success', data: autoRedeemPolicy }); return }
    if (request.method === 'GET' && action === 'context') {
      const actor = await requireForgeActor(request)
      response.status(200).json({ status: 'success', data: await getAutoRedeemContext(actor.userId) }); return
    }
    const actor = await requireForgeActor(request)
    if (request.method === 'GET' && action === 'history') { response.status(200).json({ status: 'success', data: await redemptionHistory(actor.userId) }); return }
    if (action === 'operations') {
      if (actor.role !== 'owner' && actor.role !== 'admin') { fail(response, 403, 'Administrator access is required.'); return }
      if (request.method === 'GET') { response.status(200).json({ status: 'success', data: await getProviderOperations() }); return }
      if (request.method === 'POST') {
        const input = body(request)
        if (typeof input.enabled !== 'boolean') { fail(response, 400, 'The enabled field must be boolean.'); return }
        response.status(200).json({ status: 'success', data: await setProviderOperations(actor.userId, input.enabled, typeof input.reasonCode === 'string' ? input.reasonCode : '') }); return
      }
    }
    if (request.method === 'POST' && action === 'consent') { response.status(201).json({ status: 'success', data: await grantConsent(actor.userId) }); return }
    if (request.method === 'DELETE' && action === 'consent') { await revokeConsent(actor.userId); response.status(204).end(); return }
    if (request.method === 'POST' && action === 'redeem') {
      const input = body(request)
      if (Object.keys(input).length > 0) { fail(response, 400, 'Auto Redeem does not accept client-controlled code or identity fields.'); return }
      response.status(200).json({ status: 'success', data: await redeemAvailable(actor.userId) }); return
    }
    if (request.method === 'POST' && action === 'redeem-controlled-validation') {
      if (actor.role !== 'owner' && actor.role !== 'admin') { fail(response, 403, 'Administrator access is required.'); return }
      const input = body(request)
      if (Object.keys(input).length > 0) { fail(response, 400, 'Controlled validation does not accept client-controlled code or identity fields.'); return }
      response.status(200).json({ status: 'success', data: await redeemControlledValidationCode(actor.userId) }); return
    }
    response.setHeader('Allow', 'GET, POST, DELETE'); fail(response, 405, 'Method not allowed.')
  } catch (error) {
    if (error instanceof ForgeAuthenticationError) { fail(response, error.statusCode, error.message); return }
    const statusCode = typeof error === 'object' && error && 'statusCode' in error && typeof error.statusCode === 'number' ? error.statusCode : 500
    console.error('[giftcodes]', { method: request.method, action: request.query.action, name: error instanceof Error ? error.name : 'UnknownError' })
    fail(response, statusCode, statusCode === 500 ? 'The Gift Centre service is temporarily unavailable.' : error instanceof Error ? error.message : 'The request could not be completed.')
  }
}
