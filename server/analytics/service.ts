import { createHash } from 'node:crypto'
import { getSupabaseAdmin } from '../database/supabaseAdmin.js'
import type { ForgeActor } from '../auth/requireForgeActor.js'

export const ANALYTICS_EVENTS = ['login','logout','page_view','route_change','search_opened','search_query','search_result_clicked','zero_result_search','building_viewed','progression_viewed','hero_viewed','hero_companion_opened','snapshot_saved','progression_updated','giftcode_copied','redeem_started','redeem_success','redeem_failed','render_started','render_completed','import_started','validation_completed','publication_completed','rollback_started','application_started','application_submitted','creator_profile_viewed','api_error','javascript_error'] as const
const EVENT_SET = new Set<string>(ANALYTICS_EVENTS)
const ALLOWED_PROPERTIES = new Set(['route','from_route','to_route','dataset','feature','query_length','result_count','result_position','latency_ms','duration_ms','status','method','endpoint_group','error_code','device_type','browser','screen_size','source','success'])

export type AnalyticsInput = { event?: unknown; properties?: unknown; sessionId?: unknown; occurredAt?: unknown }

function safeProperties(value: unknown): Record<string, string | number | boolean> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return Object.entries(value as Record<string, unknown>).filter(([key, item]) => ALLOWED_PROPERTIES.has(key) && (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean')).slice(0, 20).reduce<Record<string, string | number | boolean>>((result, [key, item]) => { result[key] = item as string | number | boolean; return result }, {})
}

export async function recordEvent(input: AnalyticsInput, requestMeta: { userAgent?: string; referer?: string }): Promise<void> {
  if (typeof input.event !== 'string' || !EVENT_SET.has(input.event) || typeof input.sessionId !== 'string' || input.sessionId.length < 20 || input.sessionId.length > 80) return
  const properties = safeProperties(input.properties)
  const userAgent = requestMeta.userAgent?.slice(0, 240) ?? null
  const deviceType = properties.device_type ?? (userAgent?.match(/mobile|android|iphone/i) ? 'mobile' : 'desktop')
  const sessionHash = createHash('sha256').update(input.sessionId).digest('hex')
  const { error } = await getSupabaseAdmin().from('forge_analytics_events').insert({ event_name: input.event, session_hash: sessionHash, properties, device_type: String(deviceType).slice(0, 32), user_agent_family: userAgent?.match(/(Chrome|Firefox|Safari|Edge|Opera)/i)?.[1] ?? null, traffic_source: typeof properties.source === 'string' ? properties.source : null, route: typeof properties.route === 'string' ? properties.route : null, occurred_at: typeof input.occurredAt === 'string' ? input.occurredAt : new Date().toISOString() })
  if (error) throw error
}

export async function getReport(actor: ForgeActor) {
  if (!actor.permissionKeys.includes('cms.view')) throw Object.assign(new Error('Analytics access is restricted.'), { statusCode: 403 })
  const since = new Date(Date.now() - 30 * 86400000).toISOString()
  const { data, error } = await getSupabaseAdmin().from('forge_analytics_events').select('event_name,session_hash,properties,device_type,user_agent_family,traffic_source,route,occurred_at').gte('occurred_at', since).order('occurred_at', { ascending: false }).limit(10000)
  if (error) throw error
  const rows = data ?? []
  const count = (name: string) => rows.filter((row) => row.event_name === name).length
  const grouped = (field: 'route' | 'device_type' | 'user_agent_family' | 'traffic_source') => Object.entries(rows.reduce<Record<string, number>>((acc, row) => { const value = row[field] ?? 'unknown'; acc[value] = (acc[value] ?? 0) + 1; return acc }, {})).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([label, value]) => ({ label, value }))
  const searches = rows.filter((row) => row.event_name === 'search_query')
  return { periodDays: 30, dailyUsers: new Set(rows.filter((row) => row.occurred_at >= new Date(Date.now() - 86400000).toISOString()).map((row) => row.session_hash)).size, weeklyUsers: new Set(rows.filter((row) => row.occurred_at >= new Date(Date.now() - 7 * 86400000).toISOString()).map((row) => row.session_hash)).size, monthlyUsers: new Set(rows.map((row) => row.session_hash)).size, eventCounts: Object.fromEntries(ANALYTICS_EVENTS.map((event) => [event, count(event)])), mostViewedPages: grouped('route'), devices: grouped('device_type'), browsers: grouped('user_agent_family'), trafficSources: grouped('traffic_source'), search: { total: searches.length, zeroResults: count('zero_result_search'), averageQueryLength: searches.length ? Math.round(searches.reduce((sum, row) => sum + Number(row.properties?.query_length ?? 0), 0) / searches.length) : 0, clickedPositions: rows.filter((row) => row.event_name === 'search_result_clicked').map((row) => Number(row.properties?.result_position ?? 0)).filter(Boolean) }, errors: rows.filter((row) => row.event_name === 'api_error' || row.event_name === 'javascript_error').slice(0, 20), recentPublication: rows.filter((row) => row.event_name === 'publication_completed' || row.event_name === 'rollback_started').slice(0, 20) }
}
