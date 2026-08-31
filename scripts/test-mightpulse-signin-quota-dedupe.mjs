import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { completeAuthCallback } from '../src/auth/callbackFlow.ts'
import {
  getPostSignInPlayerSyncInFlight,
  hasPostSignInPlayerSyncAttempted,
  syncLinkedPlayerAfterSignIn,
} from '../src/services/postSignInPlayerSyncService.ts'

const session = {
  access_token: 'fixture-access-token',
  expires_at: 1_800_000_000,
  user: {
    id: 'fixture-mightpulse-dedupe-user',
    last_sign_in_at: '2026-08-31T13:14:00.000Z',
  },
}

let fetchCalls = 0
let releaseFetch
const fetchGate = new Promise((resolve) => {
  releaseFetch = resolve
})

const fetchImplementation = async (url, options) => {
  fetchCalls += 1
  assert.equal(url, '/api/player/account')
  const body = JSON.parse(String(options?.body ?? '{}'))
  assert.equal(body.action, 'revalidate')
  assert.equal(body.refreshReason, 'sign-in')

  await fetchGate
  return {
    ok: true,
    status: 200,
    async json() {
      return {
        status: 'success',
        code: 'PLAYER_INTELLIGENCE_SYNCED',
        data: null,
      }
    },
  }
}

let primedSync
const callbackResult = await completeAuthCallback({
  search: '?code=fixture-code&returnTo=%2Fmy-forge',
  existingSession: null,
  exchangeCode: async () => session,
  onExchangedSession: (resolvedSession) => {
    primedSync = syncLinkedPlayerAfterSignIn(
      resolvedSession,
      fetchImplementation,
    )
  },
})

assert.equal(callbackResult.destination, '/my-forge')
assert.equal(callbackResult.session, session)
assert.equal(
  hasPostSignInPlayerSyncAttempted(session),
  true,
  'callback must mark the genuine sign-in sync before navigation',
)
assert.ok(
  getPostSignInPlayerSyncInFlight(session),
  'callback must expose the in-flight sign-in sync to PlayerIdentityContext',
)
assert.equal(
  fetchCalls,
  1,
  'priming the callback may start only one sign-in request',
)

const duplicateSync = syncLinkedPlayerAfterSignIn(
  session,
  fetchImplementation,
)
assert.equal(
  fetchCalls,
  1,
  'a second observer of the same genuine sign-in must reuse the in-flight request',
)

releaseFetch()
assert.equal(await primedSync, 'updated')
assert.equal(await duplicateSync, 'updated')
assert.equal(fetchCalls, 1)


const existingSession = {
  ...session,
  user: {
    ...session.user,
    id: 'fixture-existing-session-user',
    last_sign_in_at: '2026-08-31T12:00:00.000Z',
  },
}
let existingSessionHookCalls = 0
let existingSessionExchangeCalls = 0
const existingSessionResult = await completeAuthCallback({
  search: '?code=ignored-code&returnTo=%2Fmy-forge',
  existingSession,
  exchangeCode: async () => {
    existingSessionExchangeCalls += 1
    return session
  },
  onExchangedSession: () => {
    existingSessionHookCalls += 1
  },
})
assert.equal(existingSessionResult.session, existingSession)
assert.equal(existingSessionExchangeCalls, 0)
assert.equal(
  existingSessionHookCalls,
  0,
  'a pre-existing callback session must not be treated as a genuine sign-in',
)
assert.equal(
  hasPostSignInPlayerSyncAttempted(existingSession),
  false,
  'pre-existing callback sessions must not consume Player Intelligence quota',
)

let deniedExistingSessionHookCalls = 0
const deniedExistingSessionResult = await completeAuthCallback({
  search: '?error=access_denied&returnTo=%2Fmy-forge',
  existingSession,
  exchangeCode: async () => {
    throw new Error('must not exchange when an existing session is present')
  },
  onExchangedSession: () => {
    deniedExistingSessionHookCalls += 1
  },
})
assert.equal(deniedExistingSessionResult.session, existingSession)
assert.equal(
  deniedExistingSessionHookCalls,
  0,
  'access_denied with an old persisted session must not prime a sign-in refresh',
)

const nonBlockingSession = {
  ...session,
  user: {
    ...session.user,
    id: 'fixture-non-blocking-user',
  },
}
const nonBlockingResult = await completeAuthCallback({
  search: '?code=fixture-code-2&returnTo=%2Fmy-forge',
  existingSession: null,
  exchangeCode: async () => nonBlockingSession,
  onExchangedSession: () => {
    throw new Error('synthetic post-auth failure')
  },
})
assert.equal(
  nonBlockingResult.session,
  nonBlockingSession,
  'optional post-auth coordination must not block authentication completion',
)

const callbackPageSource = await readFile(
  new URL('../src/pages/AuthCallbackPage.tsx', import.meta.url),
  'utf8',
)
assert.match(
  callbackPageSource,
  /onSessionResolved:\s*\(session\)\s*=>\s*\{[\s\S]*?void syncLinkedPlayerAfterSignIn\(session\)/u,
  'AuthCallbackPage must prime Player Intelligence before navigating',
)
const syncIndex = callbackPageSource.indexOf(
  'void syncLinkedPlayerAfterSignIn(session)',
)
const navigateIndex = callbackPageSource.indexOf(
  'navigate(result.destination, { replace: true })',
)
assert.ok(syncIndex >= 0 && navigateIndex > syncIndex)

console.log('MIGHTPULSE sign-in quota dedupe regression tests passed.')
