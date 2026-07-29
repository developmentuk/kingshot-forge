import { pathToFileURL } from 'node:url'
import {
  PLAYER_INTELLIGENCE_ACCEPTANCE,
  assertExecutionGuards,
  assertProjectBaseUrl,
  assertProjectRef,
  assertSingleMode,
  assertUuid,
  newRunId,
  parseArgs,
  projectBaseUrl,
  redact,
  sha256Bytes,
  validatePlayerId,
  writeEvidence,
} from './player-intelligence-acceptance-controls.mjs'

export class PlayerIntelligenceAcceptanceError extends Error {
  constructor(code, message, acceptanceResult) {
    super(message)
    this.name = 'PlayerIntelligenceAcceptanceError'
    this.code = code
    this.acceptanceResult = acceptanceResult
  }
}

function returnedPlayerId(value) {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' && Number.isSafeInteger(value)) return String(value)
  return ''
}

function record(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null
}

function validatePayload(payload, requestedPlayerId) {
  const response = record(payload)
  const data = record(response?.data)
  if (response?.status !== 'success') throw new PlayerIntelligenceAcceptanceError('invalid_source_payload', 'The player service returned an unsuccessful response.')
  if (returnedPlayerId(data?.playerId) !== requestedPlayerId) throw new PlayerIntelligenceAcceptanceError('mismatched_player_id', 'The player service returned a different Player ID.')
  const name = typeof data?.name === 'string' ? data.name.trim() : ''
  const kingdom = typeof data?.kingdom === 'number' ? data.kingdom : Number(data?.kingdom)
  const level = typeof data?.level === 'number' ? data.level : Number(data?.level)
  if (!name || !Number.isInteger(kingdom) || kingdom < 1 || kingdom > 9999 || !Number.isFinite(level) || level < 0) {
    throw new PlayerIntelligenceAcceptanceError('invalid_source_payload', 'The player service returned an invalid basic player record.')
  }
  return ['playerId', 'name', 'kingdom', 'level']
}

function responseMetadata(response) {
  const header = (name) => response.headers.get(name)
  return {
    cacheControl: header('cache-control'),
    age: header('age'),
    cfCacheStatus: header('cf-cache-status'),
    retryAfter: header('retry-after'),
    etagPresent: Boolean(header('etag')),
  }
}

function sourceErrorFor(error) {
  if (error instanceof PlayerIntelligenceAcceptanceError) return error
  const name = error instanceof Error ? error.name : ''
  if (name === 'AbortError' || name === 'TimeoutError') return new PlayerIntelligenceAcceptanceError('source_timeout', 'The player service timed out.')
  return new PlayerIntelligenceAcceptanceError('source_unavailable', 'The player service could not be reached.')
}

function failureResult(base, error, completedAt, durationMs, requestCount, response = null) {
  return {
    ...base,
    status: 'failed',
    completedAt,
    durationMs,
    requestCount,
    externalRequestMade: requestCount === 1,
    databaseConnectionMade: false,
    persistencePerformed: false,
    rawPayloadRecorded: false,
    playerValuesRecorded: false,
    failure: {
      code: error.code ?? 'acceptance_failed',
      message: error.message,
      httpStatus: response?.status ?? null,
      response: response ? responseMetadata(response) : null,
    },
  }
}

export async function runPlayerIntelligenceAcceptance({
  args = process.argv.slice(2),
  environment = process.env,
  fetchImpl = globalThis.fetch,
  cwd = process.cwd(),
  repositoryGate,
  now = () => new Date(),
  monotonicNow = () => performance.now(),
} = {}) {
  const { flags, value } = parseArgs(args)
  const mode = assertSingleMode(flags)
  const projectRef = value('--project-ref') ?? PLAYER_INTELLIGENCE_ACCEPTANCE.projectRef
  assertProjectRef(projectRef)
  const baseUrl = assertProjectBaseUrl(value('--base-url') ?? projectBaseUrl(projectRef).toString(), projectRef)
  const playerId = validatePlayerId(value('--player-id'))
  const runId = value('--run-id') ?? newRunId()
  const correlationId = value('--correlation-id') ?? newRunId()
  assertUuid(runId, 'Acceptance run ID')
  assertUuid(correlationId, 'Acceptance correlation ID')
  const approvedSha = value('--approved-sha')
  const base = {
    mode,
    runId,
    correlationId,
    projectRef,
    sourceId: PLAYER_INTELLIGENCE_ACCEPTANCE.sourceId,
    sourceContractVersion: PLAYER_INTELLIGENCE_ACCEPTANCE.sourceContractVersion,
    endpointOrigin: baseUrl.origin,
    endpointPath: PLAYER_INTELLIGENCE_ACCEPTANCE.endpointPath,
    method: 'GET',
    playerIdAccepted: true,
    requestLimit: 1,
    retriesAllowed: 0,
    timeoutMs: PLAYER_INTELLIGENCE_ACCEPTANCE.timeoutMs,
    maxPayloadBytes: PLAYER_INTELLIGENCE_ACCEPTANCE.maxPayloadBytes,
    databaseConnectionMade: false,
    persistencePerformed: false,
    rawPayloadRecorded: false,
    playerValuesRecorded: false,
  }

  if (mode === '--plan') {
    return {
      ...base,
      status: 'planned',
      approvedSha: approvedSha ?? null,
      requestCount: 0,
      externalRequestMade: false,
      note: 'Plan only. No HTTP request, database connection or persistence action was attempted.',
    }
  }

  const started = now()
  const guards = assertExecutionGuards({
    environment,
    projectRef,
    baseUrl: baseUrl.toString(),
    playerId,
    approvedSha,
    runId,
    correlationId,
    now: started,
    cwd,
    repositoryGate,
  })
  const executionBase = {
    ...base,
    approvedSha,
    repository: guards.repository,
    actor: guards.actor,
    startedAt: started.toISOString(),
  }

  const endpoint = new URL(PLAYER_INTELLIGENCE_ACCEPTANCE.endpointPath, baseUrl)
  endpoint.searchParams.set('playerId', playerId)
  let requestCount = 0
  let response = null
  const startMs = monotonicNow()

  try {
    requestCount += 1
    response = await fetchImpl(endpoint, {
      method: 'GET',
      redirect: 'manual',
      headers: {
        Accept: 'application/json',
        apikey: guards.publishableKey,
        Authorization: `Bearer ${guards.accessToken}`,
        'x-correlation-id': correlationId,
      },
      signal: AbortSignal.timeout(PLAYER_INTELLIGENCE_ACCEPTANCE.timeoutMs),
    })

    if (requestCount !== 1) throw new PlayerIntelligenceAcceptanceError('request_limit_exceeded', 'Acceptance attempted more than one request.')
    if (response.status >= 300 && response.status < 400) throw new PlayerIntelligenceAcceptanceError('redirect_blocked', 'Acceptance refused a redirected response.')
    if (response.status === 401 || response.status === 403) throw new PlayerIntelligenceAcceptanceError('authentication_rejected', 'The authenticated acceptance request was rejected.')
    if (response.status === 429) throw new PlayerIntelligenceAcceptanceError('source_rate_limited', 'The player service is temporarily rate limited.')
    if (!response.ok) throw new PlayerIntelligenceAcceptanceError('source_unavailable', 'The player service returned an unavailable response.')

    const contentType = response.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase() ?? ''
    if (contentType !== 'application/json') throw new PlayerIntelligenceAcceptanceError('invalid_content_type', 'The player service returned an unsupported content type.')
    const declaredLength = Number(response.headers.get('content-length'))
    if (Number.isFinite(declaredLength) && declaredLength > PLAYER_INTELLIGENCE_ACCEPTANCE.maxPayloadBytes) {
      throw new PlayerIntelligenceAcceptanceError('payload_too_large', 'The player service returned an oversized payload.')
    }
    const payloadBytes = new Uint8Array(await response.arrayBuffer())
    if (payloadBytes.byteLength > PLAYER_INTELLIGENCE_ACCEPTANCE.maxPayloadBytes) {
      throw new PlayerIntelligenceAcceptanceError('payload_too_large', 'The player service returned an oversized payload.')
    }
    let payload
    try { payload = JSON.parse(new TextDecoder().decode(payloadBytes)) } catch {
      throw new PlayerIntelligenceAcceptanceError('invalid_source_payload', 'The player service returned invalid JSON.')
    }
    const validatedFields = validatePayload(payload, playerId)
    const completedAt = now().toISOString()
    const result = {
      ...executionBase,
      status: 'passed',
      completedAt,
      durationMs: Math.max(0, Math.round(monotonicNow() - startMs)),
      requestCount,
      externalRequestMade: true,
      httpStatus: response.status,
      payloadContentType: contentType,
      payloadByteLength: payloadBytes.byteLength,
      payloadSha256: sha256Bytes(payloadBytes),
      returnedPlayerIdMatched: true,
      validatedFields,
      response: responseMetadata(response),
    }
    const evidencePath = writeEvidence(result, environment)
    return { ...result, evidencePath }
  } catch (cause) {
    const error = sourceErrorFor(cause)
    const completedAt = now().toISOString()
    const result = failureResult(executionBase, error, completedAt, Math.max(0, Math.round(monotonicNow() - startMs)), requestCount, response)
    const evidencePath = writeEvidence(result, environment)
    throw new PlayerIntelligenceAcceptanceError(error.code, error.message, { ...result, evidencePath })
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runPlayerIntelligenceAcceptance()
    .then((result) => console.log(JSON.stringify(redact(result), null, 2)))
    .catch((error) => {
      console.error(JSON.stringify(redact(error.acceptanceResult ?? { status: 'error', code: error.code ?? 'acceptance_failed', message: error instanceof Error ? error.message : 'Acceptance failed.' }), null, 2))
      process.exitCode = 1
    })
}
