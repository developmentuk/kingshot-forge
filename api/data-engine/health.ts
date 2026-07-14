import { getServerEnvironmentStatus } from '../../server/database/environment'

export default function handler(request: Request): Response {
  if (request.method !== 'GET') {
    return Response.json(
      {
        status: 'error',
        message: 'Method not allowed',
      },
      {
        status: 405,
        headers: {
          Allow: 'GET',
        },
      },
    )
  }

  const environment = getServerEnvironmentStatus()

  const healthy =
    environment.supabaseUrlConfigured &&
    environment.supabaseServerKeyConfigured

  return Response.json(
    {
      status: healthy ? 'ok' : 'configuration-error',
      service: 'Forge Data Engine',
      environment: {
        supabaseUrlConfigured:
          environment.supabaseUrlConfigured,

        supabaseServerKeyConfigured:
          environment.supabaseServerKeyConfigured,
      },
      timestamp: new Date().toISOString(),
    },
    {
      status: healthy ? 200 : 503,
    },
  )
}