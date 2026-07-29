import { createHash, randomUUID } from 'node:crypto'
import { getSupabaseAdmin } from '../database/supabaseAdmin.js'
import { createOfficialGiftCodeProvider, OFFICIAL_GIFT_CODE_PROVIDER_ID, readOfficialProviderConfig } from './officialProvider.js'
import { createGiftCodeIdempotencyIdentity } from './workflow/idempotency.js'

const CONSENT_VERSION = 'giftcode-redemption-v1'
const POLICY_TEXT = 'Forge Auto Redeem submits the linked Player ID, linked kingdom ID and selected active Gift Codes to the Kingshot provider, records normalized outcomes and timestamps, never requests a game password, and only processes codes after explicit opt-in and an automatic or user-triggered run.'
const POLICY_DIGEST = createHash('sha256').update(POLICY_TEXT).digest('hex')
const MAX_CODES_PER_RUN = 20
const MIN_DELAY_MS = 750
export const CONTROLLED_VALIDATION_CODE = 'HAPPYEMOJIDAY'

type PlayerRow = Readonly<Record<string, unknown>>
type ActiveCode = Readonly<{ id: string; code: string; expiresAt: string | null; version: string }>

type RedemptionRequestSummary = Readonly<{
  code_publication_id: string
  status: string
  result_code: string | null
  created_at: string
}>

export type GiftCodeProviderOperations = Readonly<{
  providerId: string
  environment: string
  configured: boolean
  configEnabled: boolean
  health: Readonly<{
    enabled: boolean
    circuitState: string
    status: string
    reason: string
    changedAt: string | null
    updatedAt: string | null
  }> | null
}>

export type GiftCodeAdminMetrics = Readonly<{
  activeCodes: number
  eligibleCodes: number
  totalRequests: number
  totalAttempts: number
  redeemed: number
  alreadyClaimed: number
  failed: number
  skipped: number
  transientFailures: number
  recentSuccessRate: number | null
  lastSuccessfulProviderCall: string | null
  lastFailure: string | null
}>

function now() { return new Date().toISOString() }
function configured() { return readOfficialProviderConfig() }
function isVerified(value: unknown) { return value === 'verified' || value === 'community_verified' || value === 'officially_verified' }
function hasValidKingdom(value: unknown) {
  const kingdom = typeof value === 'number' ? value : Number(value)
  return Number.isInteger(kingdom) && kingdom >= 1 && kingdom <= 9999
}

async function fetchWithTimeout(input: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}
function safePlayer(row: PlayerRow | null) {
  if (!row) return null
  return { id: row.id, name: row.player_name, playerId: row.player_id, kingdom: row.kingdom_id, verificationStatus: row.verification_status }
}

async function ownedPlayer(userId: string) {
  const { data, error } = await getSupabaseAdmin().from('player_accounts').select('id,user_id,player_id,player_name,kingdom_id,verification_status,updated_at').eq('user_id', userId).eq('is_primary', true).maybeSingle()
  if (error) throw error
  return data as PlayerRow | null
}

async function activeCodes(): Promise<ActiveCode[]> {
  const base = process.env.SUPABASE_URL?.trim() ?? process.env.VITE_SUPABASE_URL?.trim()
  const key = process.env.SUPABASE_PUBLISHABLE_KEY?.trim() ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()
  if (!base || !key) return []
  try {
    const response = await fetchWithTimeout(`${base.replace(/\/$/, '')}/functions/v1/kingshot-gift-codes`, { headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/json' } }, 10_000)
    if (!response.ok) return []
    const contentType = response.headers.get('content-type') ?? ''
    if (!contentType.toLowerCase().includes('application/json')) return []
    const body = await response.json().catch(() => null) as Record<string, unknown> | null
    const data = body?.data as Record<string, unknown> | undefined
    const rows = Array.isArray(data?.giftCodes) ? data.giftCodes : []
    return normaliseActiveCodes(rows)
  } catch {
    return []
  }
}

function normaliseActiveCodes(rows: unknown[]): ActiveCode[] {
  const current = Date.now()
  return rows.flatMap((raw): ActiveCode[] => {
    if (!raw || typeof raw !== 'object') return []
    const row = raw as Record<string, unknown>
    const id = String(row.id ?? '').trim()
    const code = String(row.code ?? '').trim()
    const expiresAt = typeof row.expiresAt === 'string' ? row.expiresAt : null
    if (!id || !code || (expiresAt && Date.parse(expiresAt) <= current)) return []
    return [{ id, code, expiresAt, version: expiresAt ?? String(row.createdAt ?? 'active') }]
  })
}

async function currentConsent(userId: string, playerAccountId: string) {
  const { data, error } = await getSupabaseAdmin().from('gift_code_redemption_consents').select('id,user_id,player_account_id,character_ref,character_revision,provider_id,environment,provider_mode,purpose,policy_version,policy_digest,granted_at,revoked_at,expires_at,version').eq('user_id', userId).eq('player_account_id', playerAccountId).eq('provider_id', OFFICIAL_GIFT_CODE_PROVIDER_ID).eq('policy_version', CONSENT_VERSION).is('revoked_at', null).order('granted_at', { ascending: false }).limit(1).maybeSingle()
  if (error) throw error
  return data as PlayerRow | null
}

async function providerHealth() {
  const { data, error } = await getSupabaseAdmin().from('gift_code_provider_health').select('provider_enabled,circuit_state,health_status,reason_code,changed_at,updated_at').eq('provider_id', OFFICIAL_GIFT_CODE_PROVIDER_ID).eq('environment', 'production').maybeSingle()
  if (error) throw error
  return data as PlayerRow | null
}

function providerReady(config: ReturnType<typeof configured>, health: PlayerRow | null) {
  return Boolean(config?.enabled && health?.provider_enabled === true && health.circuit_state === 'closed')
}

function eligibility(input: { player: PlayerRow | null; consent: PlayerRow | null; providerReady: boolean; codeCount: number }) {
  const reasons: string[] = []
  if (!input.player) reasons.push('player_required')
  if (input.player && !isVerified(input.player.verification_status)) reasons.push('player_verification_required')
  if (input.player && !hasValidKingdom(input.player.kingdom_id)) reasons.push('player_kingdom_required')
  if (!input.consent) reasons.push('consent_required')
  if (!input.providerReady) reasons.push('provider_not_configured')
  if (input.codeCount === 0) reasons.push('no_active_codes')
  return { eligible: reasons.length === 0, reasons }
}

export async function getAutoRedeemContext(userId: string | null) {
  const codes = await activeCodes()
  if (!userId) return { authenticated: false, provider: { configured: configured() !== null, enabled: false }, player: null, consent: null, codes: { active: codes.length, ready: 0, processed: 0 }, eligibility: { eligible: false, reasons: ['authentication_required'] } }
  const player = await ownedPlayer(userId)
  const consent = player ? await currentConsent(userId, String(player.id)) : null
  const health = await providerHealth()
  let processed = 0
  if (player) {
    const { data, error } = await getSupabaseAdmin().from('gift_code_redemption_requests').select('code_publication_id').eq('user_id', userId).eq('player_account_id', String(player.id)).in('status', ['succeeded', 'already_claimed', 'expired', 'failed_terminal'])
    if (error) throw error
    const handled = new Set((data ?? []).map((row) => row.code_publication_id))
    processed = codes.filter((code) => handled.has(code.id)).length
  }
  const provider = configured()
  const ready = Math.max(0, codes.length - processed)
  return { authenticated: true, provider: { configured: provider !== null, configEnabled: Boolean(provider?.enabled), enabled: providerReady(provider, health), health: health ? { status: health.health_status, reason: health.reason_code, circuitState: health.circuit_state } : { status: 'disabled', reason: 'provider_health_not_enabled', circuitState: 'open' } }, player: safePlayer(player), consent: consent ? { grantedAt: consent.granted_at, version: consent.policy_version } : null, codes: { active: codes.length, ready, processed }, eligibility: eligibility({ player, consent, providerReady: providerReady(provider, health), codeCount: ready }) }
}

export async function grantConsent(userId: string) {
  const player = await ownedPlayer(userId)
  if (!player || !isVerified(player.verification_status)) throw Object.assign(new Error('A verified linked Governor is required.'), { statusCode: 409 })
  if (!hasValidKingdom(player.kingdom_id)) throw Object.assign(new Error('The linked Governor needs a verified kingdom before Auto Redeem can be enabled.'), { statusCode: 409 })
  const grantedAt = now()
  const { data, error } = await getSupabaseAdmin().from('gift_code_redemption_consents').insert({ user_id: userId, player_account_id: player.id, character_ref: player.id, character_revision: Math.max(1, Math.floor(Date.parse(String(player.updated_at ?? grantedAt)) / 1000)), provider_id: OFFICIAL_GIFT_CODE_PROVIDER_ID, environment: 'production', provider_mode: 'automatic_selection', purpose: 'official_gift_code_redemption', policy_version: CONSENT_VERSION, policy_digest: POLICY_DIGEST, evidence_version: 'gift-centre-0.7.5', evidence_metadata: { surface: 'gift-centre', user_triggered: true }, granted_at: grantedAt }).select('id,granted_at,policy_version').single()
  if (error) throw error
  return data
}

export async function revokeConsent(userId: string) {
  const player = await ownedPlayer(userId)
  if (!player) return
  const { error } = await getSupabaseAdmin().from('gift_code_redemption_consents').update({ revoked_at: now(), updated_at: now(), version: 2 }).eq('user_id', userId).eq('player_account_id', player.id).eq('provider_id', OFFICIAL_GIFT_CODE_PROVIDER_ID).is('revoked_at', null)
  if (error) throw error
}

function providerToAttempt(provider: Awaited<ReturnType<ReturnType<typeof createOfficialGiftCodeProvider>['redeem']>>) {
  if (provider.status === 'succeeded') return { outcome: 'provider_success', resultCode: 'provider_success', requestResultCode: 'provider_success', requestDisposition: 'sent', requestStatus: 'succeeded', retryable: false }
  if (provider.status === 'already_claimed') return { outcome: 'provider_already_claimed', resultCode: 'already_claimed', requestResultCode: 'already_claimed', requestDisposition: 'sent', requestStatus: 'already_claimed', retryable: false }
  if (provider.status === 'expired') return { outcome: 'provider_terminal_failure', resultCode: 'provider_terminal_failure', requestResultCode: 'request_expired', requestDisposition: 'sent', requestStatus: 'expired', retryable: false }
  if (provider.safeDiagnosticCode === 'invalid_code') return { outcome: 'provider_terminal_failure', resultCode: 'invalid_code', requestDisposition: 'sent', requestStatus: 'failed_terminal', retryable: false }
  if (provider.safeDiagnosticCode === 'rate_limited') return { outcome: 'provider_retryable_failure', resultCode: 'rate_limited', requestResultCode: 'rate_limited', requestDisposition: 'sent', requestStatus: 'failed_retryable', retryable: true }
  if (provider.safeDiagnosticCode === 'invalid_player' || provider.safeDiagnosticCode === 'kingdom_mismatch' || provider.safeDiagnosticCode === 'ineligible_player' || provider.safeDiagnosticCode === 'kingdom_required') return { outcome: 'provider_terminal_failure', resultCode: 'invalid_player', requestDisposition: provider.externalRequestSent ? 'sent' : 'not_sent', requestStatus: 'failed_terminal', retryable: false }
  if (provider.safeDiagnosticCode === 'code_limit_reached') return { outcome: 'provider_terminal_failure', resultCode: 'provider_terminal_failure', requestDisposition: 'sent', requestStatus: 'failed_terminal', retryable: false }
  if (provider.externalRequestSent) return { outcome: 'provider_ambiguous', resultCode: 'provider_ambiguous', requestDisposition: 'unknown', requestStatus: 'ambiguous', retryable: false }
  return { outcome: 'provider_retryable_failure', resultCode: 'provider_retryable_failure', requestDisposition: 'not_sent', requestStatus: 'failed_retryable', retryable: true }
}

async function waitBetween(previous: number) { const remaining = MIN_DELAY_MS - (Date.now() - previous); if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining)) }

export async function redeemAvailable(userId: string, options: { allowedCodes?: readonly string[] } = {}) {
  const context = await getAutoRedeemContext(userId)
  if (!context.eligibility.eligible) throw Object.assign(new Error(context.eligibility.reasons.join(',')), { statusCode: 409 })
  const player = await ownedPlayer(userId)
  const consent = player ? await currentConsent(userId, String(player.id)) : null
  if (!player || !consent) throw Object.assign(new Error('Redemption consent is required.'), { statusCode: 409 })
  if (!hasValidKingdom(player.kingdom_id)) throw Object.assign(new Error('The linked Governor needs a verified kingdom before redemption.'), { statusCode: 409 })
  const availableCodes = await activeCodes()
  const codes = (options.allowedCodes
    ? availableCodes.filter((code) => options.allowedCodes?.includes(code.code))
    : availableCodes).slice(0, MAX_CODES_PER_RUN)
  if (codes.length === 0) throw Object.assign(new Error('The requested validation code is not active.'), { statusCode: 409 })
  const admin = getSupabaseAdmin()
  const { data: run, error: runError } = await admin.from('gift_code_redemption_runs').insert({ user_id: userId, player_account_id: player.id, requested_code_count: codes.length }).select('id').single()
  if (runError || !run) throw Object.assign(new Error('Another redemption run may already be in progress.'), { statusCode: 409 })
  const provider = createOfficialGiftCodeProvider()
  const results: Record<string, unknown>[] = []
  let previousRequest = 0
  for (const code of codes) {
    const identity = createGiftCodeIdempotencyIdentity({ environment: 'production', providerId: OFFICIAL_GIFT_CODE_PROVIDER_ID, operation: 'redeem', verifiedCharacterInternalId: String(player.id), giftCodePublicationId: code.id, publicationVersion: code.version })
    if (!identity.ok) continue
    const { data: request, error: requestError } = await admin.from('gift_code_redemption_requests').insert({ run_id: run.id, user_id: userId, player_account_id: player.id, character_ref: player.id, character_revision: consent.character_revision, consent_id: consent.id, provider_id: OFFICIAL_GIFT_CODE_PROVIDER_ID, provider_mode: 'automatic_selection', environment: 'production', code_publication_id: code.id, publication_version: code.version, idempotency_version: 'giftcode-redemption:v2', idempotency_hash: identity.hash }).select('id').single()
    if (requestError || !request) continue
    const queuedAt = now()
    const { error: queueError } = await admin.from('gift_code_redemption_requests').update({ status: 'queued', optimistic_version: 2, updated_at: queuedAt }).eq('id', request.id)
    if (queueError) throw queueError
    const processingAt = now()
    const leaseOwner = `run:${run.id}`
    const { error: processingError } = await admin.from('gift_code_redemption_requests').update({ status: 'processing', optimistic_version: 3, lease_owner: leaseOwner, lease_acquired_at: processingAt, lease_expires_at: new Date(Date.now() + 20_000).toISOString(), updated_at: processingAt }).eq('id', request.id)
    if (processingError) throw processingError
    await waitBetween(previousRequest); previousRequest = Date.now()
    const attemptId = randomUUID()
    await admin.from('gift_code_redemption_attempts').insert({ id: attemptId, request_id: request.id, user_id: userId, ordinal: 1, provider_id: OFFICIAL_GIFT_CODE_PROVIDER_ID, lease_owner: `run:${run.id}`, started_at: now(), deadline_at: new Date(Date.now() + 20_000).toISOString(), code_publication_id: code.id, publication_version: code.version, code_snapshot: code.code })
    const providerResult = await provider.redeem({ attemptId, playerAccountId: String(player.id), playerId: String(player.player_id), kingdomId: String(player.kingdom_id), giftCodeId: code.id, giftCodeVersion: code.version, code: code.code, idempotencyKey: identity.hash, consentVersion: CONSENT_VERSION })
    const mapped = providerToAttempt(providerResult)
    await admin.from('gift_code_redemption_attempts').update({ outcome: mapped.outcome, request_disposition: mapped.requestDisposition, result_code: mapped.resultCode, safe_diagnostic_code: providerResult.safeDiagnosticCode, retryable: mapped.retryable, completed_at: now(), version: 1 }).eq('id', attemptId)
    const completedAt = now()
    const { error: completionError } = await admin.from('gift_code_redemption_requests').update({ status: mapped.requestStatus, result_code: mapped.requestResultCode ?? mapped.resultCode, completed_attempts: 1, optimistic_version: 4, lease_owner: null, lease_acquired_at: null, lease_expires_at: null, next_attempt_at: mapped.retryable && providerResult.retryAfterSeconds ? new Date(Date.now() + providerResult.retryAfterSeconds * 1000).toISOString() : null, updated_at: completedAt, terminal_at: mapped.requestStatus === 'succeeded' || mapped.requestStatus === 'already_claimed' || mapped.requestStatus === 'expired' || mapped.requestStatus === 'failed_terminal' || mapped.requestStatus === 'ambiguous' ? completedAt : null }).eq('id', request.id)
    if (completionError) throw completionError
    results.push({ code: code.code, status: providerResult.status, retryable: mapped.retryable, message: providerResult.safeMessage, attemptedAt: now() })
  }
  const failed = results.some((item) => item.status === 'failed' || item.status === 'not_supported')
  await admin.from('gift_code_redemption_runs').update({ status: results.length === 0 ? 'failed' : failed ? 'partial' : 'completed', processed_code_count: results.length, completed_at: now(), updated_at: now() }).eq('id', run.id)
  return { runId: run.id, results }
}

export async function redeemControlledValidationCode(userId: string) {
  return redeemAvailable(userId, { allowedCodes: [CONTROLLED_VALIDATION_CODE] })
}

const automaticRunInFlight = new Set<string>()
export async function triggerAutomaticRedemption(userId: string, trigger: 'login' | 'player_refresh' | 'scheduled' | 'new_code' = 'login') {
  if (automaticRunInFlight.has(userId)) return { skipped: true, reason: 'run_in_progress', trigger }
  automaticRunInFlight.add(userId)
  try {
    const context = await getAutoRedeemContext(userId)
    if (!context.eligibility.eligible || !context.consent) return { skipped: true, reason: context.eligibility.reasons.join(','), trigger }
    try { return { skipped: false, trigger, ...(await redeemAvailable(userId)) } }
    catch (error) { console.warn('[giftcodes:auto]', { userId, trigger, name: error instanceof Error ? error.name : 'UnknownError' }); return { skipped: true, reason: 'automatic_run_failed', trigger } }
  } finally { automaticRunInFlight.delete(userId) }
}

export async function redemptionHistory(userId: string) {
  const { data, error } = await getSupabaseAdmin().from('gift_code_redemption_runs').select('id,player_account_id,status,requested_code_count,processed_code_count,started_at,completed_at,created_at,updated_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(20)
  if (error) throw error
  const runs = data ?? []
  if (runs.length === 0) return []
  const runIds = runs.map((run) => run.id)
  const { data: requests, error: requestError } = await getSupabaseAdmin().from('gift_code_redemption_requests').select('run_id,code_publication_id,publication_version,status,result_code,terminal_at').in('run_id', runIds).order('created_at', { ascending: true })
  if (requestError) throw requestError
  const byRun = new Map<string, unknown[]>()
  for (const request of requests ?? []) {
    const list = byRun.get(String(request.run_id)) ?? []
    list.push(request)
    byRun.set(String(request.run_id), list)
  }
  return runs.map((run) => ({ ...run, requests: byRun.get(String(run.id)) ?? [] }))
}

export async function getProviderOperations() {
  const config = configured()
  const health = await providerHealth()
  return { providerId: OFFICIAL_GIFT_CODE_PROVIDER_ID, environment: 'production', configured: config !== null, configEnabled: Boolean(config?.enabled), health: health ? { enabled: health.provider_enabled === true, circuitState: String(health.circuit_state ?? 'open'), status: String(health.health_status ?? 'unknown'), reason: String(health.reason_code ?? 'provider_health_unavailable'), changedAt: String(health.changed_at ?? '') || null, updatedAt: String(health.updated_at ?? '') || null } : null } satisfies GiftCodeProviderOperations
}

export async function getAdminGiftCodeCatalogue() {
  // Catalogue reads are deliberately independent from provider health. An
  // unavailable provider must not hide the canonical active-code feed.
  const codes = await activeCodes()
  const { data: requests, error } = await getSupabaseAdmin()
    .from('gift_code_redemption_requests')
    .select('code_publication_id,status,result_code,created_at')
    .order('created_at', { ascending: false })
    .limit(500)
  if (error) throw error

  const byCode = new Map<string, RedemptionRequestSummary[]>()
  for (const request of (requests ?? []) as RedemptionRequestSummary[]) {
    const list = byCode.get(String(request.code_publication_id)) ?? []
    list.push(request)
    byCode.set(String(request.code_publication_id), list)
  }

  const catalogue = codes.map((code) => {
    const history = byCode.get(code.id) ?? []
    const terminal = history.filter((item) => ['succeeded', 'already_claimed', 'expired', 'failed_terminal'].includes(item.status))
    const retryable = history.filter((item) => item.status === 'failed_retryable')
    return {
      id: code.id,
      code: code.code,
      version: code.version,
      expiresAt: code.expiresAt,
      lifecycle: 'active' as const,
      source: 'kingshot-gift-codes',
      approval: 'canonical-feed',
      eligibility: 'provider-gated' as const,
      attempts: history.length,
      completed: terminal.length,
      rewarded: history.filter((item) => item.status === 'succeeded').length,
      alreadyClaimed: history.filter((item) => item.status === 'already_claimed').length,
      failed: history.filter((item) => ['failed_terminal', 'ambiguous'].includes(item.status)).length,
      skipped: history.filter((item) => item.status === 'expired').length,
      retryable: retryable.length,
      lastOutcome: history[0]?.result_code ?? history[0]?.status ?? null,
      lastAttemptAt: history[0]?.created_at ?? null,
    }
  })

  return { totals: { activeCodes: catalogue.length, recordedRequests: requests?.length ?? 0 }, catalogue }
}

export async function getAdminGiftCodeMetrics(): Promise<GiftCodeAdminMetrics> {
  const [codes, requestsResult, attemptsResult] = await Promise.all([
    activeCodes(),
    getSupabaseAdmin().from('gift_code_redemption_requests').select('status,result_code,created_at').order('created_at', { ascending: false }).limit(500),
    getSupabaseAdmin().from('gift_code_redemption_attempts').select('outcome,result_code,created_at').order('created_at', { ascending: false }).limit(500),
  ])
  if (requestsResult.error) throw requestsResult.error
  if (attemptsResult.error) throw attemptsResult.error
  const requests = requestsResult.data ?? []
  const attempts = attemptsResult.data ?? []
  const redeemed = requests.filter((item) => item.status === 'succeeded').length
  const alreadyClaimed = requests.filter((item) => item.status === 'already_claimed').length
  const failed = requests.filter((item) => ['failed_terminal', 'ambiguous'].includes(item.status)).length
  const skipped = requests.filter((item) => item.status === 'expired').length
  const transientFailures = requests.filter((item) => item.status === 'failed_retryable').length
  const completed = redeemed + alreadyClaimed + failed + skipped
  return {
    activeCodes: codes.length,
    eligibleCodes: 0,
    totalRequests: requests.length,
    totalAttempts: attempts.length,
    redeemed,
    alreadyClaimed,
    failed,
    skipped,
    transientFailures,
    recentSuccessRate: completed > 0 ? redeemed / completed : null,
    lastSuccessfulProviderCall: requests.find((item) => item.status === 'succeeded')?.created_at ?? null,
    lastFailure: requests.find((item) => ['failed_terminal', 'failed_retryable', 'ambiguous'].includes(item.status))?.created_at ?? null,
  }
}

export async function setProviderOperations(actorId: string, enabled: boolean, reasonCode: string) {
  const config = configured()
  // The environment kill switch is authoritative. Admin state cannot enable
  // a provider while the release flag is false.
  if (enabled && !config?.enabled) {
    const current = await providerHealth()
    return current ?? { provider_enabled: false, circuit_state: 'open', health_status: 'disabled', reason_code: 'environment_disabled', changed_at: null, updated_at: null }
  }
  const status = enabled ? 'unknown' : 'disabled'
  const { data, error } = await getSupabaseAdmin().from('gift_code_provider_health').upsert({ provider_id: OFFICIAL_GIFT_CODE_PROVIDER_ID, environment: 'production', provider_enabled: enabled, circuit_state: enabled ? 'closed' : 'open', health_status: status, health_score: enabled ? null : null, reason_code: reasonCode.trim() || (enabled ? 'admin_enabled' : 'admin_paused'), changed_by: actorId, changed_at: now(), updated_at: now() }, { onConflict: 'provider_id,environment' }).select('provider_enabled,circuit_state,health_status,reason_code,changed_at,updated_at').single()
  if (error) throw error
  return data
}

export const autoRedeemPolicy = Object.freeze({ version: CONSENT_VERSION, text: POLICY_TEXT })
