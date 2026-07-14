import type {
  VercelRequest,
  VercelResponse,
} from '@vercel/node'

export default function handler(
  request: VercelRequest,
  response: VercelResponse,
): void {
  try {
    if (request.method !== 'GET') {
      response.setHeader('Allow', 'GET')

      response.status(405).json({
        status: 'error',
        message: 'Method not allowed',
      })

      return
    }

    const supabaseUrlConfigured = Boolean(
      process.env.SUPABASE_URL?.trim(),
    )

    const supabaseServerKeyConfigured = Boolean(
      process.env.SUPABASE_SECRET_KEY?.trim() ||
        process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
    )

    const healthy =
      supabaseUrlConfigured &&
      supabaseServerKeyConfigured

    response.setHeader(
      'Cache-Control',
      'no-store, max-age=0',
    )

    response.status(healthy ? 200 : 503).json({
      status: healthy
        ? 'ok'
        : 'configuration-error',

      service: 'Forge Data Engine',

      environment: {
        supabaseUrlConfigured,
        supabaseServerKeyConfigured,
      },

      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error(
      'Forge Data Engine health check failed:',
      error,
    )

    response.status(500).json({
      status: 'error',
      service: 'Forge Data Engine',
      message: 'Health check failed',
      timestamp: new Date().toISOString(),
    })
  }
}