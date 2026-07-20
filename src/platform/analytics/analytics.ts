import { FORGE_ANALYTICS_MEASUREMENT_ID } from './forgeAnalytics.js'

export const FORGE_ANALYTICS_EVENTS = [
  'login', 'logout', 'page_view', 'route_change', 'search_opened', 'search_query',
  'search_result_clicked', 'zero_result_search', 'building_viewed', 'progression_viewed',
  'hero_viewed', 'hero_companion_opened', 'snapshot_saved', 'progression_updated',
  'giftcode_copied', 'redeem_started', 'redeem_success', 'redeem_failed', 'render_started',
  'render_completed', 'import_started', 'validation_completed', 'publication_completed',
  'rollback_started', 'application_started', 'application_submitted', 'creator_profile_viewed',
  'api_error', 'javascript_error',
] as const

export type ForgeAnalyticsEvent = typeof FORGE_ANALYTICS_EVENTS[number]
export type AnalyticsValue = string | number | boolean
export type AnalyticsProperties = Readonly<Record<string, AnalyticsValue>>

const SAFE_KEYS = new Set(['route', 'from_route', 'to_route', 'dataset', 'feature', 'query_length', 'result_count', 'result_position', 'latency_ms', 'duration_ms', 'status', 'method', 'endpoint_group', 'error_code', 'device_type', 'browser', 'screen_size', 'source', 'success'])
const MAX_PROPERTY_LENGTH = 120
const SESSION_KEY = 'forge_analytics_session'

function sessionId(): string {
  const existing = window.localStorage.getItem(SESSION_KEY)
  if (existing) return existing
  const next = crypto.randomUUID()
  window.localStorage.setItem(SESSION_KEY, next)
  return next
}

function sanitize(properties: AnalyticsProperties): Record<string, AnalyticsValue> {
  return Object.fromEntries(Object.entries(properties).filter(([key, value]) => SAFE_KEYS.has(key) && (typeof value !== 'string' || value.length <= MAX_PROPERTY_LENGTH)))
}

function ensureGa(): void {
  if (document.querySelector('script[data-forge-ga]')) return
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${FORGE_ANALYTICS_MEASUREMENT_ID}`
  script.dataset.forgeGa = 'true'
  document.head.appendChild(script)
  window.dataLayer = window.dataLayer ?? []
  window.gtag = window.gtag ?? function gtag(...args: unknown[]) { window.dataLayer?.push(args) }
  window.gtag('js', new Date())
  window.gtag('config', FORGE_ANALYTICS_MEASUREMENT_ID, { send_page_view: false })
}

export function track(event: ForgeAnalyticsEvent, properties: AnalyticsProperties = {}): void {
  if (typeof window === 'undefined') return
  ensureGa()
  const safeProperties = sanitize(properties)
  window.gtag?.('event', event, safeProperties)
  const payload = { event, properties: safeProperties, sessionId: sessionId(), occurredAt: new Date().toISOString() }
  void fetch('/api/analytics', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), keepalive: true }).catch(() => undefined)
}

export function trackPageView(path: string, previousPath?: string): void {
  track('page_view', { route: path })
  if (previousPath) track('route_change', { from_route: previousPath, to_route: path })
}

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (command: 'js' | 'config' | 'event', name: string | Date, parameters?: Readonly<Record<string, string | number | boolean>>) => void
  }
}
