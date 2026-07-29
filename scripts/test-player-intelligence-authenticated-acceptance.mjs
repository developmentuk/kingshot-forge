import assert from 'node:assert/strict'
import { readFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { runPlayerIntelligenceAcceptance } from './run-player-intelligence-authenticated-acceptance.mjs'

const approvedSha = 'a'.repeat(40)
const baseUrl = 'https://hrvdhjscwitqpwjhnjkm.supabase.co/'
const runId = '11111111-1111-4111-8111-111111111111'
const correlationId = '22222222-2222-4222-8222-222222222222'
const playerId = '140387849'
const playerName = 'Synthetic Governor'
const evidenceDir = mkdtempSync(join(tmpdir(), 'player-intel-acceptance-test-'))
const nowMs = Date.parse('2026-07-29T18:00:00.000Z')

function jwt(payload) {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url')
  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode(payload)}.synthetic-signature`
}

const accessToken = jwt({ sub: 'synthetic-user-id', role: 'authenticated', exp: Math.floor(nowMs / 1000) + 3600 })
const publishableKey = jwt({ role: 'anon', exp: Math.floor(nowMs / 1000) + 86400 })
const environment = {
  PLAYER_INTEL_ACCEPTANCE_APPROVED: 'YES',
  PLAYER_INTEL_ACCEPTANCE_ACCESS_TOKEN: accessToken,
  SUPABASE_PUBLISHABLE_KEY: publishableKey,
  PLAYER_INTEL_ACCEPTANCE_EVIDENCE_DIR: evidenceDir,
}
const repositoryGate = ({ approvedSha: sha }) => {
  assert.equal(sha, approvedSha)
  return { branch: 'research/player-intelligence-discovery', sha, clean: true }
}
const executeArgs = ['--execute', '--player-id', playerId, '--approved-sha', approvedSha, '--base-url', baseUrl, '--run-id', runId, '--correlation-id', correlationId]
const successPayload = { status: 'success', data: { playerId, name: playerName, kingdom: 850, level: 30, internalUid: 'must-never-be-recorded' } }

let fetchCount = 0
let capturedUrl
let capturedInit
let monotonic = 100
const result = await runPlayerIntelligenceAcceptance({
  args: executeArgs,
  environment,
  repositoryGate,
  now: () => new Date(nowMs),
  monotonicNow: () => (monotonic += 25),
  fetchImpl: async (url, init) => {
    fetchCount += 1
    capturedUrl = new URL(url)
    capturedInit = init
    return new Response(JSON.stringify(successPayload), {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'public, max-age=300, s-maxage=300',
        'cf-cache-status': 'DYNAMIC',
        etag: 'sensitive-etag-value',
      },
    })
  },
})
assert.equal(fetchCount, 1)
assert.equal(capturedUrl.pathname, '/functions/v1/kingshot-player')
assert.equal(capturedUrl.searchParams.get('playerId'), playerId)
const headers = new Headers(capturedInit.headers)
assert.equal(headers.get('authorization'), `Bearer ${accessToken}`)
assert.equal(headers.get('apikey'), publishableKey)
assert.equal(headers.get('x-correlation-id'), correlationId)
assert.equal(capturedInit.method, 'GET')
assert.equal(capturedInit.redirect, 'manual')
assert.equal(result.status, 'passed')
assert.equal(result.requestCount, 1)
assert.equal(result.returnedPlayerIdMatched, true)
assert.deepEqual(result.validatedFields, ['playerId', 'name', 'kingdom', 'level'])
assert.equal(result.response.etagPresent, true)
assert.equal('rawPayload' in result, false)
const serialised = JSON.stringify(result)
assert.equal(serialised.includes(playerId), false)
assert.equal(serialised.includes(playerName), false)
assert.equal(serialised.includes('synthetic-user-id'), false)
assert.equal(serialised.includes('must-never-be-recorded'), false)
assert.equal(serialised.includes(accessToken), false)
assert.equal(serialised.includes(publishableKey), false)
const evidence = readFileSync(result.evidencePath, 'utf8')
assert.equal(evidence.includes(playerId), false)
assert.equal(evidence.includes(playerName), false)
assert.equal(evidence.includes('synthetic-user-id'), false)
assert.equal(evidence.includes('must-never-be-recorded'), false)
assert.equal(evidence.includes(accessToken), false)
assert.equal(evidence.includes(publishableKey), false)
assert.equal(evidence.includes('sensitive-etag-value'), false)

let planFetches = 0
const plan = await runPlayerIntelligenceAcceptance({
  args: ['--plan', '--player-id', playerId, '--approved-sha', approvedSha, '--run-id', runId, '--correlation-id', correlationId],
  environment: {},
  fetchImpl: async () => { planFetches += 1; throw new Error('plan must not fetch') },
})
assert.equal(plan.status, 'planned')
assert.equal(plan.externalRequestMade, false)
assert.equal(plan.requestCount, 0)
assert.equal(planFetches, 0)
assert.equal(JSON.stringify(plan).includes(playerId), false)

let unapprovedFetches = 0
await assert.rejects(
  runPlayerIntelligenceAcceptance({
    args: executeArgs,
    environment: { ...environment, PLAYER_INTEL_ACCEPTANCE_APPROVED: 'NO' },
    repositoryGate,
    now: () => new Date(nowMs),
    fetchImpl: async () => { unapprovedFetches += 1; return new Response('{}') },
  }),
  /PLAYER_INTEL_ACCEPTANCE_APPROVED=YES/,
)
assert.equal(unapprovedFetches, 0)

let mismatchFetches = 0
await assert.rejects(
  runPlayerIntelligenceAcceptance({
    args: executeArgs,
    environment: { ...environment, PLAYER_INTEL_ACCEPTANCE_EVIDENCE_DIR: mkdtempSync(join(tmpdir(), 'player-intel-mismatch-')) },
    repositoryGate,
    now: () => new Date(nowMs),
    monotonicNow: (() => { let value = 0; return () => (value += 10) })(),
    fetchImpl: async () => {
      mismatchFetches += 1
      return new Response(JSON.stringify({ status: 'success', data: { playerId: '999999999', name: 'Wrong Player', kingdom: 850, level: 30 } }), { status: 200, headers: { 'content-type': 'application/json' } })
    },
  }),
  (error) => {
    assert.equal(error.code, 'mismatched_player_id')
    assert.equal(error.acceptanceResult.requestCount, 1)
    const safe = JSON.stringify(error.acceptanceResult)
    assert.equal(safe.includes('999999999'), false)
    assert.equal(safe.includes('Wrong Player'), false)
    return true
  },
)
assert.equal(mismatchFetches, 1)

let rateFetches = 0
await assert.rejects(
  runPlayerIntelligenceAcceptance({
    args: executeArgs,
    environment: { ...environment, PLAYER_INTEL_ACCEPTANCE_EVIDENCE_DIR: mkdtempSync(join(tmpdir(), 'player-intel-rate-')) },
    repositoryGate,
    now: () => new Date(nowMs),
    monotonicNow: (() => { let value = 0; return () => (value += 10) })(),
    fetchImpl: async () => {
      rateFetches += 1
      return new Response(JSON.stringify({ status: 'error' }), { status: 429, headers: { 'content-type': 'application/json', 'retry-after': '120' } })
    },
  }),
  (error) => {
    assert.equal(error.code, 'source_rate_limited')
    assert.equal(error.acceptanceResult.failure.response.retryAfter, '120')
    return true
  },
)
assert.equal(rateFetches, 1)

await assert.rejects(
  runPlayerIntelligenceAcceptance({
    args: executeArgs,
    environment: { ...environment, PLAYER_INTEL_ACCEPTANCE_ACCESS_TOKEN: jwt({ sub: 'user', role: 'authenticated', exp: Math.floor(nowMs / 1000) - 1 }) },
    repositoryGate,
    now: () => new Date(nowMs),
  }),
  /expired or too close to expiry/,
)

await assert.rejects(
  runPlayerIntelligenceAcceptance({
    args: executeArgs,
    environment: { ...environment, SUPABASE_PUBLISHABLE_KEY: 'sb_secret_refuse-this-key' },
    repositoryGate,
    now: () => new Date(nowMs),
  }),
  /refuses a secret or service-role/,
)

await assert.rejects(
  runPlayerIntelligenceAcceptance({
    args: executeArgs,
    environment: { ...environment, SUPABASE_PUBLISHABLE_KEY: accessToken },
    repositoryGate,
    now: () => new Date(nowMs),
  }),
  /separate publishable key/,
)

console.log('Player intelligence authenticated acceptance tests passed.')
