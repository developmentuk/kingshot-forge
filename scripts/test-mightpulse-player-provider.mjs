import assert from 'node:assert/strict'
import {
  createMightPulsePlayerProvider,
  classifyInvalidAvatarShape,
  createMightPulsePlayerProviderForTest,
  normalizeAvatarUrl,
} from '../server/player-identity/providers/mightPulsePlayerProvider.ts'
import {
  createNewLinkedPlayerFields,
  createProviderRefreshFields,
  lookupKingshotPlayer,
  PLAYER_PROVIDER_FRESHNESS_TTL_MS,
  PLAYER_PROVIDER_MANUAL_REFRESH_MIN_INTERVAL_MS,
  resolvePlayerRefresh,
} from '../server/player-identity/linkedPlayerService.ts'
import { PlayerAccountAttemptThrottle } from '../server/player-identity/playerAccountAttemptThrottle.ts'

const secret = 'synthetic-test-secret-never-log'
const fetchedAt = '2026-08-29T12:00:00.000Z'

function validPayload(overrides = {}, playerOverrides = {}) {
  return {
    ok: true,
    governor_id: '125500338',
    id_type: 'governor_id',
    include: ['base'],
    fresh: true,
    cached_at: '2026-08-29T11:50:00.000Z',
    age_seconds: 600,
    player: {
      uid: 987654,
      governor_id: '125500338',
      nick_name: 'Synthetic Governor',
      kid: 850,
      town_center_level: 35,
      avatar_url: 'https://cdn.example.test/avatar.png',
      ...playerOverrides,
    },
    ...overrides,
  }
}

function providerFor(response, capture) {
  return createMightPulsePlayerProviderForTest({
    apiKey: secret,
    baseUrl: 'https://api.mightpulse.test/v1',
    now: () => new Date(fetchedAt),
    fetchImplementation: async (url, init) => {
      capture?.(url, init)
      return response
    },
  })
}

async function expectProviderError(provider, statusCode, code) {
  await assert.rejects(
    () => provider.lookupPlayer({ playerId: '125500338', expectedKingdomId: 850 }),
    (error) => {
      assert.equal(error.statusCode, statusCode)
      assert.equal(error.code, code)
      assert.equal(String(error).includes(secret), false)
      assert.equal(JSON.stringify(error).includes(secret), false)
      return true
    },
  )
}

let requestUrl
let requestInit
const validProvider = providerFor(
  Response.json(validPayload()),
  (url, init) => { requestUrl = url; requestInit = init },
)
const valid = await validProvider.lookupPlayer({ playerId: '125500338', expectedKingdomId: 850 })
assert.deepEqual(valid, {
  playerId: '125500338',
  name: 'Synthetic Governor',
  kingdomId: 850,
  townCenterLevel: 35,
  avatarUrl: 'https://cdn.example.test/avatar.png',
  provider: 'mightpulse',
  providerFetchedAt: fetchedAt,
})
assert.equal(requestUrl.toString(), 'https://api.mightpulse.test/v1/players/125500338?include=base')
assert.equal(requestInit.headers.Authorization, `Bearer ${secret}`)
assert.equal(requestUrl.toString().includes(secret), false)

const previousConfiguredBaseUrl = process.env.MIGHTPULSE_API_BASE_URL
process.env.MIGHTPULSE_API_BASE_URL = 'https://api.mightpulse.com.evil.example/v1'
let runtimeRequestUrl
const runtimeProvider = createMightPulsePlayerProvider({
  apiKey: secret,
  now: () => new Date(fetchedAt),
  fetchImplementation: async (url) => {
    runtimeRequestUrl = url
    return Response.json(validPayload())
  },
})
await runtimeProvider.lookupPlayer({ playerId: '125500338', expectedKingdomId: 850 })
assert.equal(runtimeRequestUrl.origin, 'https://api.mightpulse.com')
assert.equal(runtimeRequestUrl.pathname, '/v1/players/125500338')
if (previousConfiguredBaseUrl === undefined) delete process.env.MIGHTPULSE_API_BASE_URL
else process.env.MIGHTPULSE_API_BASE_URL = previousConfiguredBaseUrl

assert.deepEqual(normalizeAvatarUrl(undefined), {
  url: null,
  status: 'missing',
  reason: 'not_provided',
})
assert.deepEqual(normalizeAvatarUrl(null), {
  url: null,
  status: 'missing',
  reason: 'not_provided',
})
assert.deepEqual(normalizeAvatarUrl('   '), {
  url: null,
  status: 'missing',
  reason: 'empty',
})
assert.deepEqual(normalizeAvatarUrl('https://cdn.example.test/avatar.png'), {
  url: 'https://cdn.example.test/avatar.png',
  status: 'accepted',
  reason: 'accepted',
})
assert.deepEqual(normalizeAvatarUrl('/avatars/synthetic.png'), {
  url: 'https://mightpulse.com/avatars/synthetic.png',
  status: 'accepted',
  reason: 'accepted',
})
assert.deepEqual(normalizeAvatarUrl('/avatar.png?size=128#profile'), {
  url: 'https://mightpulse.com/avatar.png?size=128#profile',
  status: 'accepted',
  reason: 'accepted',
})
for (const [rawAvatar, expectedShape] of [
  ['//cdn.example.test/avatar.png', 'protocol_relative'],
  ['/avatars/synthetic.png', 'root_relative'],
  ['https%3A%2F%2Fcdn.example.test%2Favatar.png', 'encoded_https'],
  ['"https://cdn.example.test/avatar.png"', 'quoted'],
  ['avatars/synthetic.png', 'relative_path'],
  ['avatar.png', 'relative_path'],
  ['avatar.webp?size=128', 'relative_path'],
  ['synthetic avatar', 'other'],
]) {
  assert.equal(classifyInvalidAvatarShape(rawAvatar), expectedShape)
}
assert.equal(classifyInvalidAvatarShape(null), 'not_applicable')
for (const [rejectedAvatar, expectedReason] of [
  ['data:text/html,unsafe', 'non_https'],
  ['http://cdn.example.test/avatar.png', 'non_https'],
  ['https://user:pass@cdn.example.test/avatar.png', 'credentials'],
  ['//outside.example/avatar.png', 'invalid_url'],
  ['/\\outside.example/avatar.png', 'invalid_url'],
  ['not a url', 'invalid_url'],
  [{ url: 'https://cdn.example.test/avatar.png' }, 'not_string'],
]) {
  const normalizedAvatar = normalizeAvatarUrl(rejectedAvatar)
  assert.equal(normalizedAvatar.status, 'rejected')
  assert.equal(normalizedAvatar.url, null)
  assert.equal(normalizedAvatar.reason, expectedReason)
}

const avatarDiagnostics = []
const originalConsoleInfo = console.info
console.info = (...args) => { avatarDiagnostics.push(args) }
try {
  const noAvatar = await providerFor(Response.json(validPayload({}, { avatar_url: undefined })))
    .lookupPlayer({ playerId: '125500338', expectedKingdomId: 850 })
  assert.equal(noAvatar.avatarUrl, null)

  const unsafeAvatar = await providerFor(Response.json(validPayload({}, { avatar_url: 'data:text/html,unsafe' })))
    .lookupPlayer({ playerId: '125500338', expectedKingdomId: 850 })
  assert.equal(unsafeAvatar.avatarUrl, null)

  const relativeAvatar = await providerFor(Response.json(validPayload({}, { avatar_url: '/avatars/synthetic.png' })))
    .lookupPlayer({ playerId: '125500338', expectedKingdomId: 850 })
  assert.equal(relativeAvatar.avatarUrl, 'https://mightpulse.com/avatars/synthetic.png')
  assert.equal(
    createProviderRefreshFields(relativeAvatar).profile_photo,
    'https://mightpulse.com/avatars/synthetic.png',
  )

  const safeAvatar = await providerFor(Response.json(validPayload({}, { avatar_url: 'https://cdn.example.test/avatar.png' })))
    .lookupPlayer({ playerId: '125500338', expectedKingdomId: 850 })
  assert.equal(safeAvatar.avatarUrl, 'https://cdn.example.test/avatar.png')
} finally {
  console.info = originalConsoleInfo
}
assert.deepEqual(
  avatarDiagnostics.map((args) => args[1]?.avatarStatus),
  ['missing', 'rejected', 'accepted', 'accepted'],
)
assert.deepEqual(
  avatarDiagnostics.map((args) => args[1]?.avatarReason),
  ['not_provided', 'non_https', 'accepted', 'accepted'],
)
assert.deepEqual(
  avatarDiagnostics.map((args) => args[1]?.avatarShape),
  ['not_applicable', 'not_applicable', 'root_relative', 'not_applicable'],
)
const serializedAvatarDiagnostics = JSON.stringify(avatarDiagnostics)
assert.equal(serializedAvatarDiagnostics.includes('https://cdn.example.test/avatar.png'), false)
assert.equal(serializedAvatarDiagnostics.includes('/avatars/synthetic.png'), false)
assert.equal(serializedAvatarDiagnostics.includes('125500338'), false)
assert.equal(serializedAvatarDiagnostics.includes(secret), false)
for (const [rawLevel, expected] of [[31, 31], [34, 34], [35, 35], [40, 40], [84, 84]]) {
  const accepted = await providerFor(Response.json(validPayload({}, { town_center_level: rawLevel })))
    .lookupPlayer({ playerId: '125500338', expectedKingdomId: 850 })
  assert.equal(accepted.townCenterLevel, expected)
}

const noTownCenter = await providerFor(Response.json(validPayload({}, { town_center_level: null })))
  .lookupPlayer({ playerId: '125500338', expectedKingdomId: 850 })
assert.equal(noTownCenter.townCenterLevel, null)
assert.equal('town_center_level' in createProviderRefreshFields(noTownCenter), false)

for (const payload of [
  [],
  { ok: true, governor_id: '125500338', player: null },
  validPayload({ governor_id: '999999999' }),
  validPayload({}, { nick_name: '' }),
  validPayload({}, { kid: 0 }),
  validPayload({}, { kid: 10000 }),
  validPayload({}, { town_center_level: '35' }),
  validPayload({}, { town_center_level: 0 }),
  validPayload({}, { town_center_level: 85 }),
]) {
  await expectProviderError(
    providerFor(Response.json(payload)),
    502,
    'PLAYER_PROVIDER_INVALID_RESPONSE',
  )
}

await expectProviderError(
  providerFor(Response.json(validPayload({}, { kid: 851 }))),
  409,
  'STATE_MISMATCH',
)

for (const [status, expectedStatus, expectedCode] of [
  [400, 502, 'PLAYER_PROVIDER_INVALID_REQUEST'],
  [401, 503, 'PLAYER_PROVIDER_UNAVAILABLE'],
  [404, 404, 'PLAYER_NOT_FOUND'],
  [429, 429, 'PLAYER_LOOKUP_RATE_LIMITED'],
  [500, 503, 'PLAYER_PROVIDER_UNAVAILABLE'],
]) {
  await expectProviderError(
    providerFor(new Response('synthetic failure', { status })),
    expectedStatus,
    expectedCode,
  )
}

await expectProviderError(
  providerFor(new Response('not json', { status: 200, headers: { 'Content-Type': 'text/plain' } })),
  502,
  'PLAYER_PROVIDER_INVALID_RESPONSE',
)

await expectProviderError(
  createMightPulsePlayerProviderForTest({
    apiKey: '',
    baseUrl: 'https://api.mightpulse.test/v1',
  }),
  503,
  'PLAYER_PROVIDER_UNAVAILABLE',
)

await expectProviderError(
  createMightPulsePlayerProviderForTest({
    apiKey: secret,
    baseUrl: 'https://api.mightpulse.test/v1',
    fetchImplementation: async () => { throw new Error('synthetic network failure') },
  }),
  502,
  'PLAYER_PROVIDER_UNREACHABLE',
)

await expectProviderError(
  createMightPulsePlayerProviderForTest({
    apiKey: secret,
    baseUrl: 'https://api.mightpulse.test/v1',
    timeoutMs: 5,
    fetchImplementation: async (_url, init) => new Promise((_resolve, reject) => {
      const keepAlive = setTimeout(() => reject(new Error('timeout signal did not fire')), 100)
      init.signal.addEventListener('abort', () => {
        clearTimeout(keepAlive)
        reject(init.signal.reason)
      }, { once: true })
    }),
  }),
  504,
  'PLAYER_PROVIDER_TIMEOUT',
)

let providerCalls = 0
const normalizedPlayer = {
  playerId: '125500338',
  name: 'Refreshed Governor',
  kingdomId: 850,
  townCenterLevel: 29,
  avatarUrl: null,
  provider: 'mightpulse',
  providerFetchedAt: fetchedAt,
}

let releaseSingleFlight
let singleFlightCalls = 0
const delayedProvider = {
  async lookupPlayer() {
    singleFlightCalls += 1
    return new Promise((resolve) => { releaseSingleFlight = () => resolve(normalizedPlayer) })
  },
}
const firstLookup = lookupKingshotPlayer('125500338', 850, delayedProvider)
const secondLookup = lookupKingshotPlayer('125500338', 850, delayedProvider)
assert.equal(singleFlightCalls, 1)
releaseSingleFlight()
assert.equal(await firstLookup, normalizedPlayer)
assert.equal(await secondLookup, normalizedPlayer)
assert.equal(singleFlightCalls, 1)

const countingProvider = {
  async lookupPlayer() {
    providerCalls += 1
    return normalizedPlayer
  },
}
const nowMs = Date.parse(fetchedAt)
const recentAccount = {
  player_id: '125500338',
  kingdom_id: 850,
  last_refreshed_at: new Date(nowMs - PLAYER_PROVIDER_FRESHNESS_TTL_MS + 1).toISOString(),
  player_level: 47,
  level_rendered: 'Legacy Level 47',
  level_rendered_detailed: 'Legacy presentation',
  level_image: 'https://legacy.example.test/level.png',
  profile_photo: 'https://legacy.example.test/avatar.png',
  verification_status: 'officially_verified',
  verification_method: 'century_games_code',
  verified_at: '2026-08-01T00:00:00.000Z',
}

const cached = await resolvePlayerRefresh({
  action: 'revalidate',
  existingAccount: recentAccount,
  playerId: '125500338',
  kingdomId: 850,
  provider: countingProvider,
  nowMs,
})
assert.equal(cached.source, 'cache')
assert.equal(providerCalls, 0)

const samePlayerLink = await resolvePlayerRefresh({
  action: 'link',
  existingAccount: recentAccount,
  playerId: '125500338',
  kingdomId: 850,
  provider: countingProvider,
  nowMs,
})
assert.equal(samePlayerLink.source, 'cache')
assert.equal(providerCalls, 0)

for (const { existingAccount, forceProviderRefresh } of [
  { existingAccount: recentAccount, forceProviderRefresh: false },
  { existingAccount: { ...recentAccount, last_refreshed_at: new Date(nowMs - PLAYER_PROVIDER_MANUAL_REFRESH_MIN_INTERVAL_MS + 1).toISOString() }, forceProviderRefresh: true },
  { existingAccount: { ...recentAccount, last_refreshed_at: new Date(nowMs - PLAYER_PROVIDER_FRESHNESS_TTL_MS).toISOString() }, forceProviderRefresh: false },
]) {
  await assert.rejects(
    () => resolvePlayerRefresh({
      action: 'link',
      existingAccount,
      playerId: '125500338',
      kingdomId: 851,
      provider: countingProvider,
      forceProviderRefresh,
      nowMs,
    }),
    (error) => {
      assert.equal(error.statusCode, 409)
      assert.equal(error.code, 'STATE_MISMATCH')
      assert.match(error.message, /linked to State 850, not State 851/u)
      return true
    },
  )
  assert.equal(providerCalls, 0)
}

await assert.rejects(
  () => resolvePlayerRefresh({
    action: 'link',
    existingAccount: recentAccount,
    playerId: '999999999',
    kingdomId: 850,
    provider: countingProvider,
    nowMs,
  }),
  (error) => error.statusCode === 409 && error.code === 'PLAYER_ACCOUNT_CONFLICT',
)
assert.equal(providerCalls, 0)

const blockedManual = await resolvePlayerRefresh({
  action: 'revalidate',
  existingAccount: { ...recentAccount, last_refreshed_at: new Date(nowMs - PLAYER_PROVIDER_MANUAL_REFRESH_MIN_INTERVAL_MS + 1).toISOString() },
  playerId: '125500338',
  kingdomId: 850,
  provider: countingProvider,
  forceProviderRefresh: true,
  nowMs,
})
assert.equal(blockedManual.source, 'cache')
assert.equal(providerCalls, 0)

const allowedManual = await resolvePlayerRefresh({
  action: 'revalidate',
  existingAccount: { ...recentAccount, last_refreshed_at: new Date(nowMs - PLAYER_PROVIDER_MANUAL_REFRESH_MIN_INTERVAL_MS).toISOString() },
  playerId: '125500338',
  kingdomId: 850,
  provider: countingProvider,
  forceProviderRefresh: true,
  nowMs,
})
assert.equal(allowedManual.source, 'provider')
assert.equal(providerCalls, 1)

const stale = await resolvePlayerRefresh({
  action: 'revalidate',
  existingAccount: { ...recentAccount, last_refreshed_at: new Date(nowMs - PLAYER_PROVIDER_FRESHNESS_TTL_MS).toISOString() },
  playerId: '125500338',
  kingdomId: 850,
  provider: countingProvider,
  nowMs,
})
assert.equal(stale.source, 'provider')
assert.equal(providerCalls, 2)

const attemptThrottle = new PlayerAccountAttemptThrottle(2, PLAYER_PROVIDER_MANUAL_REFRESH_MIN_INTERVAL_MS)
attemptThrottle.enforce('authenticated-user', nowMs)
attemptThrottle.enforce('authenticated-user', nowMs + 1)
assert.throws(
  () => attemptThrottle.enforce('authenticated-user', nowMs + 2),
  (error) => {
    assert.equal(error.statusCode, 429)
    assert.equal(error.code, 'PLAYER_ACCOUNT_RATE_LIMITED')
    assert.equal(String(error).includes(secret), false)
    assert.equal(JSON.stringify({ code: error.code, message: error.message }).includes(secret), false)
    return true
  },
)
attemptThrottle.enforce('authenticated-user', nowMs + PLAYER_PROVIDER_MANUAL_REFRESH_MIN_INTERVAL_MS)

const evictionThrottle = new PlayerAccountAttemptThrottle(2, 100)
evictionThrottle.enforce('expired-user', 0)
evictionThrottle.enforce('active-user', 50)
assert.equal(evictionThrottle.attempts.size, 2)
evictionThrottle.enforce('sweep-trigger', 100)
assert.equal(evictionThrottle.attempts.has('expired-user'), false)
assert.equal(evictionThrottle.attempts.has('active-user'), true)
assert.equal(evictionThrottle.attempts.has('sweep-trigger'), true)
evictionThrottle.enforce('expired-user', 101)
assert.equal(evictionThrottle.attempts.has('expired-user'), true)

const manyUsersThrottle = new PlayerAccountAttemptThrottle(1, 10)
for (let index = 0; index < 1_000; index += 1) {
  manyUsersThrottle.enforce(`synthetic-user-${index}`, 0)
}
assert.equal(manyUsersThrottle.attempts.size, 1_000)
manyUsersThrottle.enforce('bounded-sweep-trigger', 10)
assert.equal(manyUsersThrottle.attempts.size, 1)
assert.equal(manyUsersThrottle.attempts.has('bounded-sweep-trigger'), true)

const refreshFields = createProviderRefreshFields(normalizedPlayer)
assert.equal('player_level' in refreshFields, false)
assert.equal('level_rendered' in refreshFields, false)
assert.equal('verification_status' in refreshFields, false)
assert.equal('profile_photo' in refreshFields, false)
assert.equal(refreshFields.town_center_level, 29)
const merged = { ...recentAccount, ...refreshFields }
assert.equal(merged.player_level, 47)
assert.equal(merged.level_rendered, 'Legacy Level 47')
assert.equal(merged.level_rendered_detailed, 'Legacy presentation')
assert.equal(merged.level_image, 'https://legacy.example.test/level.png')
assert.equal(merged.profile_photo, 'https://legacy.example.test/avatar.png')
assert.equal(merged.verification_status, 'officially_verified')
assert.equal(merged.verification_method, 'century_games_code')
assert.equal(merged.verified_at, '2026-08-01T00:00:00.000Z')

const newLink = createNewLinkedPlayerFields(normalizedPlayer, 'user-synthetic')
assert.equal(newLink.player_level, null)
assert.equal(newLink.town_center_level, 29)
assert.equal(newLink.verification_status, 'linked')
assert.equal(newLink.verification_method, 'none')
assert.equal(newLink.is_public, false)
assert.equal(newLink.verified_by, null)
assert.equal(newLink.verified_at, null)

console.log('MightPulse provider, avatar diagnostics, freshness, preservation and ownership-boundary tests passed.')
