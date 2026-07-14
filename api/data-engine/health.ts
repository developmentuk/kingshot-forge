import { getServerEnvironmentStatus } from '../../server/database/environment'

export function GET(): Response {
  const environment =
    getServerEnvironmentStatus()

  const healthy =
    environment.supabaseUrlConfigured &&
    environment.supabaseServerKeyConfigured

  return Response.json(
    {
      status: healthy
        ? 'ok'
        : 'configuration-error',

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