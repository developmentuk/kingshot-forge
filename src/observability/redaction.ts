const filteredValue = '[Filtered]'
const maxRedactionDepth = 6

const sensitiveKeyPattern = /(?:authorization|cookie|password|passwd|secret|token|api[-_]?key|service[-_]?role|jwt|session|credential|supabase.*key)/i
const sensitiveUrlParameterPattern = /([?&#](?:access_token|refresh_token|token|code|password|secret|api_key|apikey|key)=)[^&#]*/gi

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export function redactUrl(value: unknown) {
  if (typeof value !== 'string') return value
  return value.replace(sensitiveUrlParameterPattern, `$1${filteredValue}`)
}

export function redactValue(
  value: unknown,
  depth = 0,
  seen = new WeakSet<object>(),
): unknown {
  if (depth >= maxRedactionDepth) return '[Truncated]'
  if (typeof value === 'string') return redactUrl(value)
  if (value === null || typeof value !== 'object') return value
  if (seen.has(value)) return '[Circular]'

  seen.add(value)

  if (Array.isArray(value)) {
    return value.map((entry) => redactValue(entry, depth + 1, seen))
  }

  const redacted: Record<string, unknown> = {}
  for (const [key, entry] of Object.entries(value)) {
    redacted[key] = sensitiveKeyPattern.test(key)
      ? filteredValue
      : redactValue(entry, depth + 1, seen)
  }

  return redacted
}

export function redactHeaders(value: unknown) {
  if (!isRecord(value)) return value

  const redacted: Record<string, unknown> = {}
  for (const [key, entry] of Object.entries(value)) {
    redacted[key] = sensitiveKeyPattern.test(key) ? filteredValue : entry
  }
  return redacted
}

export function sanitizeSentryEvent<T extends Record<string, unknown>>(event: T): T {
  const sanitized = { ...event } as Record<string, unknown>

  if (isRecord(sanitized.request)) {
    sanitized.request = {
      ...sanitized.request,
      url: redactUrl(sanitized.request.url),
      headers: redactHeaders(sanitized.request.headers),
      cookies: sanitized.request.cookies ? filteredValue : sanitized.request.cookies,
      data: redactValue(sanitized.request.data),
    }
  }

  sanitized.extra = redactValue(sanitized.extra)
  sanitized.contexts = redactValue(sanitized.contexts)

  if (isRecord(sanitized.user)) {
    const userId = sanitized.user.id
    sanitized.user = typeof userId === 'string' ? { id: userId } : undefined
  }

  return sanitized as T
}

export function sanitizeBreadcrumb<T extends Record<string, unknown>>(breadcrumb: T): T {
  return {
    ...breadcrumb,
    data: redactValue(breadcrumb.data),
    message: redactUrl(breadcrumb.message),
  }
}
