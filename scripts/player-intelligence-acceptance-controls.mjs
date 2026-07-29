import { createHash, randomUUID } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdirSync, renameSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export const PLAYER_INTELLIGENCE_ACCEPTANCE = Object.freeze({
  projectRef: 'hrvdhjscwitqpwjhnjkm',
  branch: 'research/player-intelligence-discovery',
  sourceId: 'forge.kingshot-player',
  sourceContractVersion: '1.0.0',
  endpointPath: '/functions/v1/kingshot-player',
  timeoutMs: 15_000,
  maxPayloadBytes: 64 * 1024,
})

const tokenLike = /(bearer\s+)[^\s,]+|(eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)|(sb_(?:secret|service_role)_[A-Za-z0-9_-]+)/gi
const sensitiveKey = /token|secret|cookie|password|authorization|apikey|api_key|player.?id|player.?name|kingdom|profile|level/i

export function redact(value) {
  if (typeof value === 'string') return value.replace(tokenLike, (...parts) => parts[1] ? `${parts[1]}[REDACTED]` : '[REDACTED]')
  if (Array.isArray(value)) return value.map(redact)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sensitiveKey.test(key) ? '[REDACTED]' : redact(item)]))
  }
  return value
}

export function parseArgs(args) {
  const flags = new Set(args.filter((arg) => arg.startsWith('--')))
  const value = (name) => {
    const index = args.indexOf(name)
    return index >= 0 ? args[index + 1] : undefined
  }
  return { flags, value }
}

export function assertSingleMode(flags) {
  const modes = ['--plan', '--execute']
  const selected = modes.filter((mode) => flags.has(mode))
  if (selected.length > 1) throw new Error('Choose one player-intelligence acceptance mode only: --plan or --execute.')
  return selected[0] ?? '--plan'
}

export function assertUuid(value, label) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value ?? '')) {
    throw new Error(`${label} must be a UUID.`)
  }
  return value
}

export function validatePlayerId(value) {
  const playerId = typeof value === 'string' ? value.trim() : ''
  if (!/^\d{1,20}$/u.test(playerId)) throw new Error('Acceptance requires one valid Kingshot Player ID.')
  return playerId
}

export function assertProjectRef(value) {
  if (value !== PLAYER_INTELLIGENCE_ACCEPTANCE.projectRef) throw new Error('Acceptance project reference does not match the approved Supabase project.')
  return value
}

export function projectBaseUrl(projectRef = PLAYER_INTELLIGENCE_ACCEPTANCE.projectRef) {
  assertProjectRef(projectRef)
  return new URL(`https://${projectRef}.supabase.co/`)
}

export function assertProjectBaseUrl(value, projectRef = PLAYER_INTELLIGENCE_ACCEPTANCE.projectRef) {
  let url
  try { url = new URL(value) } catch { throw new Error('Acceptance requires a valid HTTPS Supabase base URL.') }
  const expected = projectBaseUrl(projectRef)
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/' || url.origin !== expected.origin) {
    throw new Error('Acceptance base URL must exactly match the approved Supabase project origin.')
  }
  return url
}

function decodeBase64Url(value) {
  const normalised = value.replace(/-/g, '+').replace(/_/g, '/')
  const padding = '='.repeat((4 - (normalised.length % 4)) % 4)
  return Buffer.from(`${normalised}${padding}`, 'base64').toString('utf8')
}

export function decodeJwtPayload(token) {
  const parts = typeof token === 'string' ? token.split('.') : []
  if (parts.length !== 3) throw new Error('Acceptance access token must be a JWT.')
  try {
    const payload = JSON.parse(decodeBase64Url(parts[1]))
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('invalid payload')
    return payload
  } catch {
    throw new Error('Acceptance access token contains an invalid JWT payload.')
  }
}

export function assertAuthenticatedAccessToken(token, now = new Date()) {
  const payload = decodeJwtPayload(token)
  if (payload.role !== 'authenticated' || typeof payload.sub !== 'string' || !payload.sub.trim()) {
    throw new Error('Acceptance requires a short-lived authenticated-user JWT.')
  }
  if (!Number.isFinite(payload.exp) || payload.exp * 1000 <= now.getTime() + 60_000) {
    throw new Error('Acceptance access token is expired or too close to expiry.')
  }
  return {
    role: 'authenticated',
    expiresAt: new Date(payload.exp * 1000).toISOString(),
  }
}

export function assertPublishableKey(key, accessToken) {
  const value = typeof key === 'string' ? key.trim() : ''
  if (!value) throw new Error('Acceptance requires SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_PUBLISHABLE_KEY.')
  if (value === accessToken) throw new Error('Acceptance requires a separate publishable key and authenticated-user access token.')
  if (/^sb_(?:secret|service_role)_/i.test(value)) throw new Error('Acceptance refuses a secret or service-role Supabase key.')
  if (value.split('.').length === 3) {
    const payload = decodeJwtPayload(value)
    if (payload.role === 'service_role') throw new Error('Acceptance refuses a service-role Supabase key.')
  }
  return value
}

export function repositoryState(cwd = process.cwd()) {
  const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim()
  return {
    branch: git('branch', '--show-current'),
    sha: git('rev-parse', 'HEAD'),
    clean: git('status', '--porcelain') === '',
  }
}

export function assertRepositoryState(state, approvedSha) {
  if (state.branch !== PLAYER_INTELLIGENCE_ACCEPTANCE.branch) throw new Error(`Acceptance requires branch ${PLAYER_INTELLIGENCE_ACCEPTANCE.branch}.`)
  if (!state.clean) throw new Error('Acceptance refuses a dirty repository.')
  if (!/^[0-9a-f]{40}$/i.test(approvedSha ?? '')) throw new Error('Acceptance requires an explicit 40-character --approved-sha.')
  if (state.sha !== approvedSha) throw new Error('Acceptance SHA does not match the approved execution SHA.')
  return state
}

export function assertRepositoryGate({ approvedSha, cwd } = {}) {
  return assertRepositoryState(repositoryState(cwd), approvedSha)
}

export function assertExecutionGuards({ environment, projectRef, baseUrl, playerId, approvedSha, runId, correlationId, now, cwd, repositoryGate = assertRepositoryGate }) {
  if (environment.PLAYER_INTEL_ACCEPTANCE_APPROVED !== 'YES') throw new Error('Execution requires PLAYER_INTEL_ACCEPTANCE_APPROVED=YES.')
  assertProjectRef(projectRef)
  assertProjectBaseUrl(baseUrl, projectRef)
  validatePlayerId(playerId)
  assertUuid(runId, 'Acceptance run ID')
  assertUuid(correlationId, 'Acceptance correlation ID')
  const accessToken = environment.PLAYER_INTEL_ACCEPTANCE_ACCESS_TOKEN
  const actor = assertAuthenticatedAccessToken(accessToken, now)
  const publishableKey = assertPublishableKey(environment.SUPABASE_PUBLISHABLE_KEY ?? environment.VITE_SUPABASE_PUBLISHABLE_KEY, accessToken)
  const repository = repositoryGate({ approvedSha, cwd })
  return { accessToken, publishableKey, actor, repository }
}

export function evidenceDirectory(environment = process.env) {
  const directory = environment.PLAYER_INTEL_ACCEPTANCE_EVIDENCE_DIR || join(tmpdir(), 'kingshot-forge-player-intelligence-acceptance')
  mkdirSync(directory, { recursive: true, mode: 0o700 })
  return directory
}

export function evidencePath(runId, environment = process.env) {
  assertUuid(runId, 'Acceptance run ID')
  return join(evidenceDirectory(environment), `player-intelligence-acceptance-${runId}.json`)
}

export function writeEvidence(payload, environment = process.env) {
  const path = evidencePath(payload.runId, environment)
  const temporary = `${path}.${randomUUID()}.tmp`
  writeFileSync(temporary, `${JSON.stringify(redact(payload), null, 2)}\n`, { encoding: 'utf8', mode: 0o600 })
  renameSync(temporary, path)
  return path
}

export function sha256Bytes(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

export function newRunId() {
  return randomUUID()
}
