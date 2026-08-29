import assert from 'node:assert/strict'
import {
  createMightPulsePlayerProvider,
} from '../server/player-identity/providers/mightPulsePlayerProvider.ts'
import {
  createNewLinkedPlayerFields,
  createProviderRefreshFields,
  lookupKingshotPlayer,
  PLAYER_PROVIDER_FRESHNESS_TTL_MS,
  resolvePlayerRefresh,
} from '../server/player-identity/linkedPlayerService.ts'

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
      town_center_level: 30,
      avatar_url: 'https://cdn.example.test/avatar.png',
      ...playerOverrides,
    },
    ...overrides,
  }
}

function providerFor(response, capture) {
  return createMightPulsePlayerProvider({
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
  townCenterLevel: 30,
  avatarUrl: 'https://cdn.example.test/avatar.png',
  provider: 'mightpulse',
  providerFetchedAt: fetchedAt,
})
assert.equal(requestUrl.toString(), 'https://api.mightpulse.test/v1/players/125500338?include=base')
assert.equal(requestInit.headers.Authorization, `Bearer ${secret}`)
assert.equal(requestUrl.toString().includes(secret), false)

const noAvatar = await providerFor(Response.json(validPayload({}, { avatar_url: undefined })))
  .lookupPlayer({ playerId: '125500338', expectedKingdomId: 850 })
assert.equal(noAvatar.avatarUrl, null)
const unsafeAvatar = await providerFor(Response.json(validPayload({}, { avatar_url: 'data:text/html,unsafe' })))
  .lookupPlayer({ playerId: '125500338', expectedKingdomId: 850 })
assert.equal(unsafeAvatar.avatarUrl, null)
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
  validPayload({}, { town_center_level: '30' }),
  validPayload({}, { town_center_level: 31 }),
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
  createMightPulsePlayerProvider({
    apiKey: '',
    baseUrl: 'https://api.mightpulse.test/v1',
  }),
  503,
  'PLAYER_PROVIDER_UNAVAILABLE',
)

await expectProviderError(
  createMightPulsePlayerProvider({
    apiKey: secret,
    baseUrl: 'https://api.mightpulse.test/v1',
    fetchImplementation: async () => { throw new Error('synthetic network failure') },
  }),
  502,
  'PLAYER_PROVIDER_UNREACHABLE',
)

await expectProviderError(
  createMightPulsePlayerProvider({
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

const stale = await resolvePlayerRefresh({
  action: 'revalidate',
  existingAccount: { ...recentAccount, last_refreshed_at: new Date(nowMs - PLAYER_PROVIDER_FRESHNESS_TTL_MS).toISOString() },
  playerId: '125500338',
  kingdomId: 850,
  provider: countingProvider,
  nowMs,
})
assert.equal(stale.source, 'provider')
assert.equal(providerCalls, 1)

await resolvePlayerRefresh({
  action: 'revalidate',
  existingAccount: recentAccount,
  playerId: '125500338',
  kingdomId: 850,
  provider: countingProvider,
  forceProviderRefresh: true,
  nowMs,
})
assert.equal(providerCalls, 2)

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
assert.equal(newLink.verified_by, null)
assert.equal(newLink.verified_at, null)

console.log('MightPulse provider, freshness, preservation and ownership-boundary tests passed.')
