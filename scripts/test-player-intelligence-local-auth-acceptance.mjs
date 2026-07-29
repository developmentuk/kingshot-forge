import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import {
  createMemoryStorage,
  resolveLocalAuthEnvironment,
  runPlayerIntelligenceLocalAuthAcceptance,
} from './run-player-intelligence-local-auth-acceptance.mjs'

const approvedSha = 'b'.repeat(40)
const playerId = '140387849'
const now = Math.floor(Date.now() / 1000)
const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url')
const accessToken = `${encode({ alg: 'none', typ: 'JWT' })}.${encode({ sub: 'synthetic-user', role: 'authenticated', exp: now + 3600 })}.synthetic-signature`
const publishableKey = 'sb_publishable_synthetic_test_key'

const storage = createMemoryStorage()
storage.setItem('temporary', 'value')
assert.equal(storage.getItem('temporary'), 'value')
storage.removeItem('temporary')
assert.equal(storage.getItem('temporary'), null)
storage.setItem('temporary', 'value')
storage.clear()
assert.equal(storage.size(), 0)

const resolved = resolveLocalAuthEnvironment({
  environment: {},
  cwd: process.cwd(),
  loadEnvImpl: () => ({
    VITE_SUPABASE_URL: 'https://hrvdhjscwitqpwjhnjkm.supabase.co/',
    VITE_SUPABASE_PUBLISHABLE_KEY: publishableKey,
  }),
})
assert.equal(resolved.baseUrl, 'https://hrvdhjscwitqpwjhnjkm.supabase.co/')
assert.equal(resolved.publishableKey, publishableKey)

let capturedStorage
let redirectUrl
let exchangeCount = 0
let signOutCount = 0
let acceptanceCount = 0
let evidenceCount = 0
const fakeClient = {
  auth: {
    async signInWithOAuth({ provider, options }) {
      assert.equal(provider, 'google')
      assert.equal(options.skipBrowserRedirect, true)
      assert.equal(options.queryParams.prompt, 'select_account')
      redirectUrl = options.redirectTo
      capturedStorage.setItem('pkce-verifier', 'synthetic-verifier')
      return { data: { url: 'https://accounts.example.test/authorise' }, error: null }
    },
    async exchangeCodeForSession(code) {
      exchangeCount += 1
      assert.equal(code, 'single-use-code')
      assert.equal(capturedStorage.getItem('pkce-verifier'), 'synthetic-verifier')
      capturedStorage.setItem('session', 'must-be-cleared')
      return { data: { session: { access_token: accessToken, refresh_token: 'synthetic-refresh-token' } }, error: null }
    },
    async signOut(options) {
      signOutCount += 1
      assert.deepEqual(options, { scope: 'local' })
      return { error: null }
    },
  },
}

const result = await runPlayerIntelligenceLocalAuthAcceptance({
  args: ['--execute', '--player-id', playerId, '--approved-sha', approvedSha],
  environment: {},
  cwd: process.cwd(),
  createClientImpl: (_url, key, options) => {
    assert.equal(key, publishableKey)
    assert.equal(options.auth.flowType, 'pkce')
    assert.equal(options.auth.persistSession, true)
    assert.equal(options.auth.autoRefreshToken, false)
    assert.equal(options.auth.detectSessionInUrl, false)
    capturedStorage = options.auth.storage
    return fakeClient
  },
  loadEnvImpl: () => ({
    VITE_SUPABASE_URL: 'https://hrvdhjscwitqpwjhnjkm.supabase.co/',
    VITE_SUPABASE_PUBLISHABLE_KEY: publishableKey,
  }),
  browserLauncher: async (authoriseUrl) => {
    assert.equal(authoriseUrl, 'https://accounts.example.test/authorise')
    assert.ok(redirectUrl.startsWith('http://localhost:'))
    const response = await fetch(`${redirectUrl}?code=single-use-code`)
    assert.equal(response.status, 200)
    const html = await response.text()
    assert.match(html, /Acceptance complete/)
    assert.equal(html.includes(playerId), false)
    assert.equal(html.includes(accessToken), false)
  },
  acceptanceRunner: async ({ args, environment }) => {
    acceptanceCount += 1
    assert.deepEqual(args.slice(0, 2), ['--execute', '--player-id'])
    assert.equal(args[2], playerId)
    assert.equal(environment.PLAYER_INTEL_ACCEPTANCE_APPROVED, 'YES')
    assert.equal(environment.PLAYER_INTEL_ACCEPTANCE_ACCESS_TOKEN, accessToken)
    assert.equal(environment.SUPABASE_PUBLISHABLE_KEY, publishableKey)
    return {
      status: 'passed',
      runId: randomUUID(),
      requestCount: 1,
      externalRequestMade: true,
      databaseConnectionMade: false,
      persistencePerformed: false,
      rawPayloadRecorded: false,
      playerValuesRecorded: false,
    }
  },
  evidenceWriter: (payload) => {
    evidenceCount += 1
    const serialised = JSON.stringify(payload)
    assert.equal(serialised.includes(playerId), false)
    assert.equal(serialised.includes(accessToken), false)
    assert.equal(serialised.includes('synthetic-refresh-token'), false)
    return '/tmp/synthetic-redacted-evidence.json'
  },
  repositoryGate: ({ approvedSha: sha }) => {
    assert.equal(sha, approvedSha)
    return { branch: 'research/player-intelligence-discovery', sha, clean: true }
  },
  localAuth: {
    listenHost: '127.0.0.1',
    redirectHost: 'localhost',
    port: 0,
    callbackPath: '/player-intelligence-acceptance/callback',
    authTimeoutMs: 5_000,
  },
})

assert.equal(exchangeCount, 1)
assert.equal(signOutCount, 1)
assert.equal(acceptanceCount, 1)
assert.equal(evidenceCount, 1)
assert.equal(result.status, 'passed')
assert.equal(result.authenticationFlow, 'pkce_loopback_memory_only')
assert.equal(result.browserSessionPersisted, false)
assert.equal(result.credentialsDisplayed, false)
assert.equal(result.temporarySessionRevoked, true)
assert.equal(capturedStorage.size(), 0)
const serialised = JSON.stringify(result)
assert.equal(serialised.includes(playerId), false)
assert.equal(serialised.includes(accessToken), false)
assert.equal(serialised.includes('synthetic-refresh-token'), false)

let cancelledAcceptanceCount = 0
await assert.rejects(
  runPlayerIntelligenceLocalAuthAcceptance({
    args: ['--execute', '--player-id', playerId, '--approved-sha', approvedSha],
    environment: {},
    createClientImpl: (_url, _key, options) => {
      capturedStorage = options.auth.storage
      return {
        auth: {
          async signInWithOAuth({ options: oauthOptions }) {
            redirectUrl = oauthOptions.redirectTo
            capturedStorage.setItem('pkce-verifier', 'clear-me')
            return { data: { url: 'https://accounts.example.test/authorise' }, error: null }
          },
          async exchangeCodeForSession() {
            throw new Error('must not exchange a cancelled callback')
          },
          async signOut() {
            throw new Error('must not sign out when no session was created')
          },
        },
      }
    },
    loadEnvImpl: () => ({
      VITE_SUPABASE_URL: 'https://hrvdhjscwitqpwjhnjkm.supabase.co/',
      VITE_SUPABASE_PUBLISHABLE_KEY: publishableKey,
    }),
    browserLauncher: async () => {
      const response = await fetch(`${redirectUrl}?error=access_denied`)
      assert.equal(response.status, 400)
    },
    acceptanceRunner: async () => {
      cancelledAcceptanceCount += 1
    },
    evidenceWriter: () => {
      throw new Error('cancelled auth must not write evidence')
    },
    repositoryGate: () => ({ branch: 'research/player-intelligence-discovery', sha: approvedSha, clean: true }),
    localAuth: {
      listenHost: '127.0.0.1',
      redirectHost: 'localhost',
      port: 0,
      callbackPath: '/player-intelligence-acceptance/callback',
      authTimeoutMs: 5_000,
    },
  }),
  (error) => {
    assert.equal(error.code, 'authentication_cancelled')
    return true
  },
)
assert.equal(cancelledAcceptanceCount, 0)
assert.equal(capturedStorage.size(), 0)

let revokeFailureSignOutCount = 0
let revokeFailureEvidenceCount = 0
await assert.rejects(
  runPlayerIntelligenceLocalAuthAcceptance({
    args: ['--execute', '--player-id', playerId, '--approved-sha', approvedSha],
    environment: {},
    createClientImpl: (_url, _key, options) => {
      capturedStorage = options.auth.storage
      return {
        auth: {
          async signInWithOAuth({ options: oauthOptions }) {
            redirectUrl = oauthOptions.redirectTo
            capturedStorage.setItem('pkce-verifier', 'clear-on-revoke-failure')
            return { data: { url: 'https://accounts.example.test/authorise' }, error: null }
          },
          async exchangeCodeForSession() {
            capturedStorage.setItem('session', 'must-still-be-cleared')
            return { data: { session: { access_token: accessToken, refresh_token: 'synthetic-refresh-token' } }, error: null }
          },
          async signOut(options) {
            revokeFailureSignOutCount += 1
            assert.deepEqual(options, { scope: 'local' })
            return { error: new Error('synthetic revocation failure') }
          },
        },
      }
    },
    loadEnvImpl: () => ({
      VITE_SUPABASE_URL: 'https://hrvdhjscwitqpwjhnjkm.supabase.co/',
      VITE_SUPABASE_PUBLISHABLE_KEY: publishableKey,
    }),
    browserLauncher: async () => {
      const response = await fetch(`${redirectUrl}?code=single-use-code`)
      assert.equal(response.status, 500)
      const html = await response.text()
      assert.match(html, /Acceptance stopped safely/)
      assert.equal(html.includes(playerId), false)
      assert.equal(html.includes(accessToken), false)
    },
    acceptanceRunner: async () => ({
      status: 'passed',
      runId: randomUUID(),
      requestCount: 1,
      externalRequestMade: true,
      databaseConnectionMade: false,
      persistencePerformed: false,
      rawPayloadRecorded: false,
      playerValuesRecorded: false,
    }),
    evidenceWriter: (payload) => {
      revokeFailureEvidenceCount += 1
      const safe = JSON.stringify(payload)
      assert.equal(payload.temporarySessionRevoked, false)
      assert.equal(safe.includes(playerId), false)
      assert.equal(safe.includes(accessToken), false)
      assert.equal(safe.includes('synthetic-refresh-token'), false)
      return '/tmp/synthetic-revoke-failure-evidence.json'
    },
    repositoryGate: () => ({ branch: 'research/player-intelligence-discovery', sha: approvedSha, clean: true }),
    localAuth: {
      listenHost: '127.0.0.1',
      redirectHost: 'localhost',
      port: 0,
      callbackPath: '/player-intelligence-acceptance/callback',
      authTimeoutMs: 5_000,
    },
  }),
  (error) => {
    assert.equal(error.code, 'temporary_session_revoke_failed')
    assert.equal(error.result.temporarySessionRevoked, false)
    return true
  },
)
assert.equal(revokeFailureSignOutCount, 2)
assert.equal(revokeFailureEvidenceCount, 1)
assert.equal(capturedStorage.size(), 0)

await assert.rejects(
  runPlayerIntelligenceLocalAuthAcceptance({
    args: ['--player-id', playerId, '--approved-sha', approvedSha],
  }),
  /explicit --execute flag/,
)

console.log('Player intelligence local-auth acceptance tests passed.')
