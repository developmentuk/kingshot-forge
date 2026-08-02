import type { VercelRequest, VercelResponse } from '@vercel/node'

const DISABLED_MESSAGE =
  'Public Player Lookup is temporarily unavailable while Forge rebuilds a dependable player index.'

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
): Promise<void> {
  response.setHeader('Cache-Control', 'no-store')
  response.setHeader('X-Content-Type-Options', 'nosniff')
  response.setHeader('Referrer-Policy', 'no-referrer')

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    response.status(405).json({
      status: 'error',
      code: 'METHOD_NOT_ALLOWED',
      message: 'Method not allowed.',
    })
    return
  }

  response.status(503).json({
    status: 'error',
    code: 'PLAYER_LOOKUP_DISABLED',
    message: DISABLED_MESSAGE,
    timestamp: new Date().toISOString(),
  })
}
