import * as Sentry from '@sentry/react'

import {
  sanitizeBreadcrumb,
  sanitizeSentryEvent,
} from '../../shared/observability/redaction'

let initialized = false

function isMonitoredEnvironment(environment: string) {
  return environment === 'production' || environment === 'preview'
}

export function initSentry() {
  if (initialized) return true
  if (!__SENTRY_DSN__ || !isMonitoredEnvironment(__DEPLOYMENT_ENV__)) return false

  Sentry.init({
    dsn: __SENTRY_DSN__,
    environment: __DEPLOYMENT_ENV__,
    release: __SENTRY_RELEASE__,
    dist: __COMMIT_SHA__,
    sendDefaultPii: false,
    maxBreadcrumbs: 50,
    normalizeDepth: 5,
    integrations: [
      Sentry.browserTracingIntegration(),
    ],
    tracesSampleRate: 0.05,
    tracePropagationTargets: [
      /^\//,
      /^https:\/\/ksforge\.app\/api\//,
      /^https:\/\/[^/]+\.vercel\.app\/api\//,
    ],
    beforeBreadcrumb(breadcrumb) {
      return sanitizeBreadcrumb(breadcrumb)
    },
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

export function setSentryUser(userId: string | null | undefined) {
  if (!initialized) return
  Sentry.setUser(userId ? { id: userId } : null)
}

export function captureClientException(error: unknown, context?: Record<string, unknown>) {
  if (!initialized) return undefined
  return Sentry.captureException(error, {
    extra: context,
  })
}

export function isSentryEnabled() {
  return initialized
}
