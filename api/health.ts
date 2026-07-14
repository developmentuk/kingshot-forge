import type {
  VercelRequest,
  VercelResponse,
} from '@vercel/node'

export default function handler(
  request: VercelRequest,
  response: VercelResponse,
): void {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')

    response.status(405).json({
      status: 'error',
      message: 'Method not allowed.',
    })

    return
  }

  response.status(200).json({
    status: 'ok',
    service: 'Forge Data Engine',
    timestamp: new Date().toISOString(),
  })
}