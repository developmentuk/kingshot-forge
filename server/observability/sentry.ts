import * as Sentry from '@sentry/node'

import { sanitizeSentryEvent } from '../../shared/observability/redaction.js'

let initialized = false

function monitoredEnvironment() {
  const environment = process.env.VERCEL_ENV ?? 'local'
  return environment === 'production' || environment === 'preview'
    ? environment
    : null
}

function initServerSentry() {
  if (initialized) return true

  const dsn = process.env.SENTRY_DSN
  const environment = monitoredEnvironment()
  if (!dsn || !environment) return false

  const commitSha = process.env.VERCEL_GIT_COMMIT_SHA ?? 'unknown'

  Sentry.init({
    dsn,
    environment,
    release: `kingshot-forge@${commitSha}`,
    dist: commitSha,
    sendDefaultPii: false,
    normalizeDepth: 5,
    tracesSampleRate: 0.05,
    beforeSend(event) {
      return sanitizeSentryEvent(event)
    },
    beforeSendTransaction(event) {
      return sanitizeSentryEvent(event)
    },
  })

  initialized = true
  return true
}

type ServerExceptionContext = {
  route: string
  method?: string
  statusCode?: number
  actorUserId?: string
}

export async function captureServerException(
  error: unknown,
  context: ServerExceptionContext,
) {
  if (!initServerSentry()) return undefined

  const eventId = Sentry.withScope((scope) => {
    scope.setTag('forge.route', context.route)
    if (context.method) scope.setTag('http.request.method', context.method)
    if (context.statusCode) scope.setTag('http.response.status_code', String(context.statusCode))
    if (context.actorUserId) scope.setUser({ id: context.actorUserId })

    scope.setContext('forge', {
      route: context.route,
      method: context.method,
      statusCode: context.statusCode,
    })

    return Sentry.captureException(error)
  })

  await Sentry.flush(1_500)
  return eventId
}
