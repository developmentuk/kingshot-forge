import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import {
  createMightPulseAllianceProvider,
  createMightPulseAllianceProviderForTest,
} from '../server/alliance-intelligence/mightPulseAllianceProvider.ts'
import {
  MIGHTPULSE_API_BASE_URL,
} from '../server/mightpulse/mightPulseTransport.ts'

const secret = 'synthetic-alliance-test-secret-never-log'
const fetchedAt = '2026-08-31T15:00:00.000Z'

function validMember(overrides = {}) {
  return {
    uid: 900001,
    governor_id: '125500338',
    fid: '125500338',
    nick_name: 'Synthetic Governor',
    power: 987654321,
    town_center_level: 35,
    kills: 7654321,
    alliance_rank: 4,
    alliance_rank_label: 'R4',
    kid: 850,
    avatar_url: '/avatars/synthetic-governor.png',
    last_active_at: '2026-08-31T14:59:00.000Z',
    online: true,
    ...overrides,
  }
}

function validPayload(
  overrides = {},
  allianceOverrides = {},
  memberOverrides = {},
) {
  return {
    ok: true,
    include: ['info', 'roster'],
    fresh: {
      info: true,
      roster: true,
    },
    cached_at: {
      info: '2026-08-31T14:55:00.000Z',
      roster: '2026-08-31T14:54:00.000Z',
    },
    age_seconds: {
      info: 300,
      roster: 360,
    },
    alliance: {
      aid: 4242,
      name: 'Synthetic Alliance',
      abbr: 'SyN',
      kid: 850,
      power: 1234567890,
      count: 2,
      leader_name: 'Synthetic Leader',
      leader_uid: 900000,
      leader_governor_id: '125500337',
      flag_url: '/alliance/synthetic.png',
      power_rank: 3,
      ...allianceOverrides,
    },
    members: [
      validMember(memberOverrides),
      validMember({
        uid: 900002,
        governor_id: '125500339',
        fid: '125500339',
        nick_name: 'Synthetic Member',
        power: 456789012,
        town_center_level: 34,
        kills: 1234567,
        alliance_rank: 2,
        alliance_rank_label: 'R2',
        avatar_url: 'https://cdn.example.test/member.png',
        last_active_at: 1788188000,
        online: false,
      }),
    ],
    ...overrides,
  }
}

function providerFor(response, capture) {
  return createMightPulseAllianceProviderForTest({
    apiKey: secret,
    baseUrl: 'https://api.mightpulse.test/v1',
    now: () => new Date(fetchedAt),
    fetchImplementation: async (url, init) => {
      capture?.(url, init)
      return response
    },
  })
}

async function expectAllianceError(
  provider,
  statusCode,
  code,
  request = { kingdomId: 850, tag: 'SyN' },
) {
  await assert.rejects(
    () => provider.lookupAlliance(request),
    (error) =>
      error?.statusCode === statusCode
      && error?.code === code
      && !String(error?.message ?? '').includes(secret),
  )
}

let requestUrl
let requestInit
const normalized = await providerFor(
  Response.json(validPayload()),
  (url, init) => {
    requestUrl = url
    requestInit = init
  },
).lookupAlliance({
  kingdomId: 850,
  tag: 'SyN',
})

assert.equal(requestUrl.origin, 'https://api.mightpulse.test')
assert.equal(requestUrl.pathname, '/v1/alliances/850/SyN')
assert.equal(requestUrl.searchParams.get('include'), 'info,roster')
assert.equal(requestInit.method, 'GET')
assert.equal(requestInit.headers.Accept, 'application/json')
assert.equal(requestInit.headers.Authorization, 'Bearer ' + secret)

assert.equal(normalized.provider, 'mightpulse')
assert.equal(normalized.providerFetchedAt, fetchedAt)
assert.equal(normalized.providerCachedAt, '2026-08-31T14:54:00.000Z')
assert.equal(normalized.providerAgeSeconds, 360)
assert.equal(normalized.providerFresh, true)
assert.equal(normalized.freshnessShape, 'sectioned')
assert.equal(normalized.infoFresh, true)
assert.equal(normalized.rosterFresh, true)
assert.deepEqual(normalized.alliance, {
  providerAllianceId: '4242',
  kingdomId: 850,
  tag: 'SyN',
  name: 'Synthetic Alliance',
  power: 1234567890,
  memberCount: 2,
  leaderName: 'Synthetic Leader',
  leaderInternalUid: '900000',
  leaderPlayerId: '125500337',
  flagUrl: 'https://mightpulse.com/alliance/synthetic.png',
  powerRank: 3,
})
assert.equal(normalized.members.length, 2)
const offsetTimestamp = '2026-08-31T16:54:00+02:00'
const offsetNormalized = await providerFor(Response.json(validPayload({ cached_at: { info: offsetTimestamp, roster: offsetTimestamp } }))).lookupAlliance({ kingdomId: 850, tag: 'SyN' })
assert.equal(offsetNormalized.providerCachedAt, offsetTimestamp)
for (const cachedAt of ['2026-02-30T12:00:00Z', '2026-04-31T12:00:00Z', '2025-02-29T12:00:00Z', '2100-02-29T12:00:00Z', '2026-13-01T12:00:00Z', '2026-01-01T12:00:00', '2026-01-01', ' 2026-01-01T12:00:00Z', '2026-01-01T12:00:00Z ', 'infinity', '-infinity', 123, true, {}]) {
  await expectAllianceError(providerFor(Response.json(validPayload({ cached_at: { info: cachedAt, roster: '2026-08-31T14:54:00.000Z' } }))), 502, 'ALLIANCE_PROVIDER_INVALID_RESPONSE')
}
assert.deepEqual(normalized.members[0], {
  providerInternalUid: '900001',
  playerId: '125500338',
  providerFid: '125500338',
  name: 'Synthetic Governor',
  kingdomId: 850,
  power: 987654321,
  townCenterLevel: 35,
  kills: 7654321,
  allianceRank: 4,
  allianceRankLabel: 'R4',
  avatarUrl: 'https://mightpulse.com/avatars/synthetic-governor.png',
  lastActiveAt: '2026-08-31T14:59:00.000Z',
  online: true,
})

for (const [fresh, infoFresh, rosterFresh, providerFresh] of [
  [{ info: true, roster: false }, true, false, false],
  [{ info: false, roster: true }, false, true, false],
  [{ info: false, roster: false }, false, false, false],
]) {
  const section = await providerFor(Response.json(validPayload({ fresh }))).lookupAlliance({ kingdomId: 850, tag: 'SyN' })
  assert.equal(section.freshnessShape, 'sectioned')
  assert.equal(section.infoFresh, infoFresh)
  assert.equal(section.rosterFresh, rosterFresh)
  assert.equal(section.providerFresh, providerFresh)
}

for (const freshness of [
  { info: true },
  { roster: true },
]) {
  const malformedFreshnessPayload = validPayload({
      fresh: freshness,
      cached_at: freshness.info
        ? { info: '2026-08-31T14:55:00.000Z' }
        : { roster: '2026-08-31T14:54:00.000Z' },
      age_seconds: freshness.info
        ? { info: 300 }
        : { roster: 360 },
  })
  await expectAllianceError(providerFor(Response.json(malformedFreshnessPayload)), 502, 'ALLIANCE_PROVIDER_INVALID_RESPONSE')
}

const explicitlyFresh = await providerFor(
  Response.json(validPayload()),
).lookupAlliance({ kingdomId: 850, tag: 'SyN' })
assert.equal(explicitlyFresh.providerFresh, true)

const scalarFreshness = await providerFor(
  Response.json(validPayload({
    fresh: true,
    cached_at: '2026-08-31T14:55:00.000Z',
    age_seconds: 300,
  })),
).lookupAlliance({ kingdomId: 850, tag: 'SyN' })
assert.equal(scalarFreshness.providerFresh, true)
assert.equal(scalarFreshness.freshnessShape, 'scalar')
assert.equal(scalarFreshness.infoFresh, null)
assert.equal(scalarFreshness.rosterFresh, null)
assert.equal(scalarFreshness.providerCachedAt, '2026-08-31T14:55:00.000Z')
assert.equal(scalarFreshness.providerAgeSeconds, 300)

for (const age of [0, 2147483647]) {
  const validAge = await providerFor(Response.json(validPayload({ fresh: true, cached_at: '2026-08-31T14:55:00.000Z', age_seconds: age }))).lookupAlliance({ kingdomId: 850, tag: 'SyN' })
  assert.equal(validAge.providerAgeSeconds, age)
}
for (const age of [0.5, -1, 2147483648]) {
  await expectAllianceError(providerFor(Response.json(validPayload({ fresh: true, cached_at: '2026-08-31T14:55:00.000Z', age_seconds: age }))), 502, 'ALLIANCE_PROVIDER_INVALID_RESPONSE')
}
for (const age_seconds of [{ info: 0.5, roster: 360 }, { info: 300, roster: 360.25 }, { info: -1, roster: 360 }, { info: 300, roster: 2147483648 }]) {
  await expectAllianceError(providerFor(Response.json(validPayload({ age_seconds }))), 502, 'ALLIANCE_PROVIDER_INVALID_RESPONSE')
}
const maxSafeFacts = await providerFor(Response.json(validPayload({}, { power: Number.MAX_SAFE_INTEGER, power_rank: 2147483647 }, { power: Number.MAX_SAFE_INTEGER, kills: Number.MAX_SAFE_INTEGER }))).lookupAlliance({ kingdomId: 850, tag: 'SyN' })
assert.equal(maxSafeFacts.alliance.power, Number.MAX_SAFE_INTEGER)
assert.equal(maxSafeFacts.alliance.powerRank, 2147483647)
assert.equal(maxSafeFacts.members[0].power, Number.MAX_SAFE_INTEGER)
assert.equal(maxSafeFacts.members[0].kills, Number.MAX_SAFE_INTEGER)
for (const payload of [
  validPayload({}, { power: 1.5 }), validPayload({}, {}, { power: 1.5 }),
  validPayload({}, {}, { kills: 1.5 }), validPayload({}, { power_rank: 1.5 }),
  validPayload({}, { power_rank: 2147483648 }),
]) await expectAllianceError(providerFor(Response.json(payload)), 502, 'ALLIANCE_PROVIDER_INVALID_RESPONSE')

for (const fresh of [null, undefined]) {
  const unknown = await providerFor(Response.json(validPayload({ fresh }))).lookupAlliance({ kingdomId: 850, tag: 'SyN' })
  assert.equal(unknown.freshnessShape, 'unknown')
  assert.equal(unknown.infoFresh, null)
  assert.equal(unknown.rosterFresh, null)
  assert.equal(unknown.providerFresh, null)
}
for (const fresh of [{ info: true }, { roster: true }, { info: 'true', roster: false }]) {
  await expectAllianceError(providerFor(Response.json(validPayload({ fresh }))), 502, 'ALLIANCE_PROVIDER_INVALID_RESPONSE')
}
for (const [count, length] of [[2, 1], [1, 2]]) {
  const mismatchedCountPayload = validPayload(
    { members: Array.from({ length }, (_, index) => validMember({ governor_id: String(125500338 + index), fid: String(125500338 + index), uid: 900001 + index })) },
    { count },
  )
  await expectAllianceError(providerFor(Response.json(mismatchedCountPayload)), 502, 'ALLIANCE_PROVIDER_INVALID_RESPONSE')
}
const emptyAlliance = await providerFor(Response.json(validPayload({ members: [] }, { count: 0 }))).lookupAlliance({ kingdomId: 850, tag: 'SyN' })
assert.equal(emptyAlliance.alliance.memberCount, 0)
assert.equal(emptyAlliance.members.length, 0)

const unsafeAssets = await providerFor(
  Response.json(validPayload(
    {},
    { flag_url: 'data:text/html,unsafe' },
    { avatar_url: 'http://unsafe.example/avatar.png' },
  )),
).lookupAlliance({ kingdomId: 850, tag: 'SyN' })
assert.equal(unsafeAssets.alliance.flagUrl, null)
assert.equal(unsafeAssets.members[0].avatarUrl, null)

await expectAllianceError(
  providerFor(Response.json(validPayload(
    {},
    { abbr: 'SYN' },
  ))),
  409,
  'ALLIANCE_PROVIDER_IDENTITY_MISMATCH',
)

for (const returnedTag of [' SyN', 'SyN ']) {
  await expectAllianceError(
    providerFor(Response.json(validPayload(
      {},
      { abbr: returnedTag },
    ))),
    409,
    'ALLIANCE_PROVIDER_IDENTITY_MISMATCH',
  )
}

await expectAllianceError(
  providerFor(Response.json(validPayload(
    {},
    { kid: 851 },
  ))),
  409,
  'ALLIANCE_PROVIDER_IDENTITY_MISMATCH',
)

await expectAllianceError(
  providerFor(Response.json(validPayload(
    {},
    {},
    { kid: 851 },
  ))),
  409,
  'ALLIANCE_PROVIDER_IDENTITY_MISMATCH',
)

const duplicateRoster = validPayload()
duplicateRoster.members[1].governor_id = duplicateRoster.members[0].governor_id
await expectAllianceError(
  providerFor(Response.json(duplicateRoster)),
  502,
  'ALLIANCE_PROVIDER_INVALID_RESPONSE',
)

await expectAllianceError(
  providerFor(Response.json(validPayload(
    {},
    {},
    { alliance_rank: 6 },
  ))),
  502,
  'ALLIANCE_PROVIDER_INVALID_RESPONSE',
)

await expectAllianceError(
  providerFor(Response.json(validPayload({
    members: [
      validMember({
        governor_id: null,
      }),
    ],
  }))),
  502,
  'ALLIANCE_PROVIDER_INVALID_RESPONSE',
)

await expectAllianceError(
  providerFor(Response.json(validPayload({
    include: ['info'],
  }))),
  502,
  'ALLIANCE_PROVIDER_INVALID_RESPONSE',
)

await expectAllianceError(
  providerFor(Response.json(validPayload({
    members: {},
  }))),
  502,
  'ALLIANCE_PROVIDER_INVALID_RESPONSE',
)

for (
  const [status, expectedStatus, expectedCode]
  of [
    [400, 502, 'ALLIANCE_PROVIDER_INVALID_REQUEST'],
    [401, 503, 'ALLIANCE_PROVIDER_UNAVAILABLE'],
    [404, 404, 'ALLIANCE_NOT_FOUND'],
    [429, 429, 'ALLIANCE_LOOKUP_RATE_LIMITED'],
    [500, 503, 'ALLIANCE_PROVIDER_UNAVAILABLE'],
  ]
) {
  await expectAllianceError(
    providerFor(
      new Response('synthetic failure', { status }),
    ),
    expectedStatus,
    expectedCode,
  )
}

await expectAllianceError(
  providerFor(
    new Response('not json', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    }),
  ),
  502,
  'ALLIANCE_PROVIDER_INVALID_RESPONSE',
)

await expectAllianceError(
  createMightPulseAllianceProviderForTest({
    apiKey: '',
    baseUrl: 'https://api.mightpulse.test/v1',
  }),
  503,
  'ALLIANCE_PROVIDER_UNAVAILABLE',
)

let constructionFetchCalls = 0
assert.throws(
  () => createMightPulseAllianceProviderForTest({
    apiKey: secret,
    baseUrl: 'https://api.mightpulse.test/v1',
    timeoutMs: 56_000,
    fetchImplementation: async () => {
      constructionFetchCalls += 1
      return Response.json(validPayload())
    },
  }),
  (error) => {
    assert.equal(error.name, 'AllianceProviderError')
    assert.equal(error.statusCode, 503)
    assert.equal(error.code, 'ALLIANCE_PROVIDER_UNAVAILABLE')
    assert.equal(error.retryable, true)
    assert.doesNotMatch(error.message, /56_000|timeout|configuration/iu)
    return true
  },
)
assert.equal(constructionFetchCalls, 0)

await expectAllianceError(
  createMightPulseAllianceProviderForTest({
    apiKey: secret,
    baseUrl: 'https://api.mightpulse.test/v1',
    fetchImplementation: async () => {
      throw new Error('synthetic network failure')
    },
  }),
  502,
  'ALLIANCE_PROVIDER_UNREACHABLE',
)

await expectAllianceError(
  createMightPulseAllianceProviderForTest({
    apiKey: secret,
    baseUrl: 'https://api.mightpulse.test/v1',
    timeoutMs: 5,
    fetchImplementation: async (_url, init) =>
      new Promise((_resolve, reject) => {
        const keepAlive = setTimeout(
          () => reject(
            new Error('timeout signal did not fire'),
          ),
          100,
        )

        init.signal.addEventListener(
          'abort',
          () => {
            clearTimeout(keepAlive)
            reject(init.signal.reason)
          },
          { once: true },
        )
      }),
  }),
  504,
  'ALLIANCE_PROVIDER_TIMEOUT',
)

await expectAllianceError(
  providerFor(Response.json(validPayload())),
  400,
  'ALLIANCE_LOOKUP_INVALID_REQUEST',
  { kingdomId: 0, tag: 'SyN' },
)

await expectAllianceError(
  providerFor(Response.json(validPayload())),
  400,
  'ALLIANCE_LOOKUP_INVALID_REQUEST',
  { kingdomId: 850, tag: ' ' },
)

const previousConfiguredBaseUrl =
  process.env.MIGHTPULSE_API_BASE_URL
process.env.MIGHTPULSE_API_BASE_URL =
  'https://api.mightpulse.com.evil.example/v1'

let runtimeUrl
const runtimeProvider = createMightPulseAllianceProvider({
  apiKey: secret,
  now: () => new Date(fetchedAt),
  fetchImplementation: async (url) => {
    runtimeUrl = url
    return Response.json(validPayload())
  },
})
await runtimeProvider.lookupAlliance({
  kingdomId: 850,
  tag: 'SyN',
})
assert.equal(runtimeUrl.origin, new URL(MIGHTPULSE_API_BASE_URL).origin)
assert.equal(runtimeUrl.pathname, '/v1/alliances/850/SyN')

if (previousConfiguredBaseUrl === undefined) {
  delete process.env.MIGHTPULSE_API_BASE_URL
} else {
  process.env.MIGHTPULSE_API_BASE_URL =
    previousConfiguredBaseUrl
}

const playerProviderSource = await readFile(
  new URL(
    '../server/player-identity/providers/mightPulsePlayerProvider.ts',
    import.meta.url,
  ),
  'utf8',
)
assert.match(
  playerProviderSource,
  /createMightPulseTransport/iu,
)
assert.doesNotMatch(
  playerProviderSource,
  /Authorization:\s*'Bearer '/u,
)
assert.doesNotMatch(
  playerProviderSource,
  /fetchImplementation\(url/iu,
)

const transportSource = await readFile(
  new URL(
    '../server/mightpulse/mightPulseTransport.ts',
    import.meta.url,
  ),
  'utf8',
)
assert.match(
  transportSource,
  /https:\/\/api\.mightpulse\.com\/v1/u,
)
assert.match(
  transportSource,
  /Authorization:\s*'Bearer '/u,
)
assert.doesNotMatch(
  transportSource,
  /process\.env\.MIGHTPULSE_API_BASE_URL/u,
)

const allianceProviderSource = await readFile(
  new URL(
    '../server/alliance-intelligence/mightPulseAllianceProvider.ts',
    import.meta.url,
  ),
  'utf8',
)
assert.doesNotMatch(
  allianceProviderSource,
  /supabase|providerQuota|reserveMightPulseProviderRequest/iu,
)
assert.match(
  allianceProviderSource,
  /include:\s*'info,roster'/u,
)
assert.match(
  allianceProviderSource,
  /rawReturnedTag !== request\.tag/u,
)
assert.doesNotMatch(
  allianceProviderSource,
  /upper\(|toUpperCase\(/u,
)

console.log('MIGHTPULSE-001C-A Alliance provider tests passed.')
