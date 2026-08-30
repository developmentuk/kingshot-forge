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
  providerIdentityObservedAt,
  shouldApplyProviderIdentityRefresh,
  hasNewVerifiedSignIn,
  lookupKingshotPlayer,
  lookupKingshotPlayerGoverned,
  PLAYER_PROVIDER_FRESHNESS_TTL_MS,
  PLAYER_PROVIDER_MANUAL_REFRESH_MIN_INTERVAL_MS,
  quotaClassForPlayerRefresh,
  resolvePlayerRefresh,
  shouldEnforcePlayerProviderQuota,
} from '../server/player-identity/linkedPlayerService.ts'
import {
  PLAYER_ACCOUNT_ATTEMPT_WINDOW_MS,
  PLAYER_SIGN_IN_STATUS_ATTEMPT_LIMIT,
  PlayerAccountAttemptThrottle,
} from '../server/player-identity/playerAccountAttemptThrottle.ts'
import {
  getPostSignInPlayerSyncInFlight,
  getPostSignInPlayerSyncOutcome,
  hasPostSignInPlayerSyncAttempted,
  POST_SIGN_IN_COMPLETION_MAX_ATTEMPTS,
  POST_SIGN_IN_COMPLETION_POLL_INTERVAL_MS,
  postSignInSuppressionExpiresAt,
  shouldSuppressAutomaticRefreshAfterPostSignInSync,
  syncLinkedPlayerAfterSignIn,
  waitForPostSignInPlayerSyncCompletion,
} from '../src/services/postSignInPlayerSyncService.ts'
import {
  isAllianceManagementRank,
  mapMightPulseAllianceRank,
} from '../shared/domains/player-identity/mightPulseAllianceRank.ts'
import {
  hashPlayerIntelligenceSnapshot,
  isPlayerIntelligenceRuntimeEnabled,
  projectPlayerIntelligenceSnapshot,
  quotaClassForPlayerIntelligenceReason,
  syncLinkedPlayerIntelligence,
} from '../server/player-intelligence/playerIntelligenceService.ts'
import {
  isProviderQuotaRuntimeEnabled,
  readMightPulseProviderRequestStatus,
  signInProviderIdempotencyKey,
} from '../server/player-intelligence/providerQuota.ts'
import { readFile } from 'node:fs/promises'

const secret = 'synthetic-test-secret-never-log'
const fetchedAt = '2026-08-29T12:00:00.000Z'

assert.deepEqual(
  [1, 2, 3, 4, 5].map(mapMightPulseAllianceRank),
  ['member', 'recruiter', 'officer', 'r4', 'leader'],
)
assert.equal(mapMightPulseAllianceRank(0), null)
assert.equal(mapMightPulseAllianceRank(6), null)
assert.equal(mapMightPulseAllianceRank(null), null)
assert.equal(isAllianceManagementRank('r4'), true)
assert.equal(isAllianceManagementRank('leader'), true)
assert.equal(isAllianceManagementRank('officer'), false)
assert.equal(isProviderQuotaRuntimeEnabled({}), false)
assert.equal(
  isProviderQuotaRuntimeEnabled({ MIGHTPULSE_PROVIDER_QUOTA_ENABLED: 'true' }),
  true,
)
assert.equal(
  isProviderQuotaRuntimeEnabled({ MIGHTPULSE_PROVIDER_QUOTA_ENABLED: ' TRUE ' }),
  true,
)
assert.equal(
  isProviderQuotaRuntimeEnabled({ MIGHTPULSE_PROVIDER_QUOTA_ENABLED: 'false' }),
  false,
)
assert.equal(
  signInProviderIdempotencyKey('user-sign-in-key', fetchedAt),
  signInProviderIdempotencyKey('user-sign-in-key', fetchedAt),
)
assert.notEqual(
  signInProviderIdempotencyKey('user-sign-in-key', fetchedAt),
  signInProviderIdempotencyKey(
    'user-sign-in-key',
    '2026-08-29T12:01:00.000Z',
  ),
)

assert.equal(shouldEnforcePlayerProviderQuota(), false)
assert.equal(
  shouldEnforcePlayerProviderQuota({
    environment: { MIGHTPULSE_PROVIDER_QUOTA_ENABLED: 'true' },
  }),
  true,
)
assert.equal(
  shouldEnforcePlayerProviderQuota({
    quotaRepositoryProvided: true,
  }),
  true,
)
assert.equal(
  shouldEnforcePlayerProviderQuota({
    quotaEnabled: false,
    quotaRepositoryProvided: true,
    environment: { MIGHTPULSE_PROVIDER_QUOTA_ENABLED: 'true' },
  }),
  false,
)
assert.equal(
  isPlayerIntelligenceRuntimeEnabled({
    MIGHTPULSE_PLAYER_INTELLIGENCE_ENABLED: 'true',
    MIGHTPULSE_PROVIDER_QUOTA_ENABLED: 'true',
  }),
  true,
)
assert.equal(
  isPlayerIntelligenceRuntimeEnabled({
    MIGHTPULSE_PLAYER_INTELLIGENCE_ENABLED: ' TRUE ',
    MIGHTPULSE_PROVIDER_QUOTA_ENABLED: ' TRUE ',
  }),
  true,
)
assert.equal(
  isPlayerIntelligenceRuntimeEnabled({
    MIGHTPULSE_PLAYER_INTELLIGENCE_ENABLED: 'true',
  }),
  false,
)
assert.equal(
  isPlayerIntelligenceRuntimeEnabled({
    MIGHTPULSE_PROVIDER_QUOTA_ENABLED: 'true',
  }),
  false,
)
assert.equal(
  isPlayerIntelligenceRuntimeEnabled({
    MIGHTPULSE_PLAYER_INTELLIGENCE_ENABLED: 'false',
    MIGHTPULSE_PROVIDER_QUOTA_ENABLED: 'true',
  }),
  false,
)
assert.equal(isPlayerIntelligenceRuntimeEnabled({}), false)
assert.equal(
  await readMightPulseProviderRequestStatus(
    'a'.repeat(64),
    {
      async read(idempotencyKey) {
        assert.equal(idempotencyKey, 'a'.repeat(64))
        return 'completed'
      },
    },
  ),
  'completed',
)

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


function validIntelligencePayload(overrides = {}, playerOverrides = {}) {
  return validPayload({
    include: ['base', 'heroes', 'ranks', 'gov_gear'],
    heroes: [{
      id: 101,
      name: 'Synthetic Hero',
      level: 80,
      stars: 5,
      star_label: '5 Star',
      quality: 5,
      power: 1234567,
      position: 1,
      skill_levels: [
        { id: 1001, level: 5 },
        { id: 1002, level: 4 },
      ],
      exclusive_gear_level: 7,
      exclusive_gear: {
        id: 9001,
        name: 'Synthetic Widget',
        level: 7,
        slot: 'exclusive',
        atk_ratio: 0.15,
        hp_ratio: 0.2,
        def_ratio: 0.1,
        power_ratio: 0.05,
        slg_skill_id: 7001,
        pve_skill_id: 7002,
        slg_attr: [{ id: 1, value: 0.08, label: 'Attack' }],
      },
      gear: [{
        eid: 5001,
        sid: 6001,
        slot: 'helmet',
        name: 'Synthetic Helmet',
        enhancement_level: 101,
        refine_level: 12,
        gear_level: 3,
        quality: 6,
        quality_key: 'mythic',
        quality_label: 'Mythic',
        red: true,
        troop: 'infantry',
        troop_label: 'Infantry',
      }],
    }],
    ranks: {
      power: 987654321,
      power_rank: 12,
      kills: 7654321,
      kills_rank: 8,
      town_center_level: 35,
      town_center_rank: 4,
      mystic_trial: 3210,
      mystic_rank: 17,
      leaderboards: [
        { name: 'Pet Power', value: 456789, kingdom_rank: 21 },
      ],
    },
    gov_gear: {
      hidden: false,
      message: null,
      items: [{
        slot: 'helmet',
        name: 'Governor Crown',
        equipid: 4001,
        quality: 6,
        tier: 2,
        star: 3,
        strength_level: 45,
        score: 12345,
        combat: 54321,
        icon: '/cdn/gear/governor-crown.png',
        gems: [{ slot: 1, id: 8001 }],
      }],
    },
    ...overrides,
  }, {
    power: 987654321,
    vip: 11,
    x: 123,
    y: 456,
    kills: 7654321,
    office: 'Minister',
    online: true,
    last_active_at: '2026-08-29T11:59:00.000Z',
    last_login: 1788000000,
    language: 'en',
    shield_endtime: '2026-08-29T14:00:00.000Z',
    burn_endtime: null,
    alliance: {
      aid: 4242,
      abbr: 'SYN',
      name: 'Synthetic Alliance',
      rank: 4,
      rank_label: 'R4',
      power: 1234567890,
      count: 92,
      flag_url: '/cdn/alliance/syn.png',
      leader_name: 'Synthetic Leader',
    },
    ...playerOverrides,
  })
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
  providerCachedAt: '2026-08-29T11:50:00.000Z',
  providerAgeSeconds: 600,
  providerFresh: true,
})
assert.equal(requestUrl.toString(), 'https://api.mightpulse.test/v1/players/125500338?include=base')
assert.equal(requestInit.headers.Authorization, `Bearer ${secret}`)
assert.equal(requestUrl.toString().includes(secret), false)


let intelligenceRequestUrl
const intelligenceProvider = providerFor(
  Response.json(validIntelligencePayload()),
  (url) => { intelligenceRequestUrl = url },
)
const intelligence = await intelligenceProvider.lookupPlayerIntelligence({
  playerId: '125500338',
  expectedKingdomId: 850,
})
assert.equal(
  intelligenceRequestUrl.toString(),
  'https://api.mightpulse.test/v1/players/125500338?include=base%2Cheroes%2Cranks%2Cgov_gear',
)
assert.equal(intelligence.identity.playerId, '125500338')
assert.equal(intelligence.identity.townCenterLevel, 35)
assert.equal(intelligence.base.power, 987654321)
assert.equal(intelligence.base.vip, 11)
assert.equal(intelligence.base.x, 123)
assert.equal(intelligence.base.y, 456)
assert.equal(intelligence.base.online, true)
assert.equal(intelligence.base.alliance.tag, 'SYN')
assert.equal(intelligence.base.alliance.rank, 4)
assert.equal(intelligence.base.alliance.rankLabel, 'R4')
assert.equal(intelligence.base.alliance.flagUrl, 'https://mightpulse.com/cdn/alliance/syn.png')
assert.equal(intelligence.heroes.length, 1)
assert.equal(intelligence.heroes[0].name, 'Synthetic Hero')
assert.equal(intelligence.heroes[0].skillLevels[1].level, 4)
assert.equal(intelligence.heroes[0].exclusiveGear.name, 'Synthetic Widget')
assert.equal(intelligence.heroes[0].exclusiveGear.strategyAttributes[0].label, 'Attack')
assert.equal(intelligence.heroes[0].gear[0].red, true)
assert.equal(intelligence.ranks.powerRank, 12)
assert.equal(intelligence.ranks.leaderboards[0].kingdomRank, 21)
assert.equal(intelligence.governorGear.hidden, false)
assert.equal(intelligence.governorGear.items[0].equipmentId, '4001')
assert.equal(
  intelligence.governorGear.items[0].icon,
  'https://mightpulse.com/cdn/gear/governor-crown.png',
)
assert.equal(intelligence.providerCachedAt, '2026-08-29T11:50:00.000Z')
assert.equal(intelligence.providerAgeSeconds, 600)
assert.equal(intelligence.providerFresh, true)

const intelligenceSnapshot = projectPlayerIntelligenceSnapshot(intelligence)
const intelligenceHash = hashPlayerIntelligenceSnapshot(intelligenceSnapshot)
assert.match(intelligenceHash, /^[0-9a-f]{64}$/u)
assert.equal(
  hashPlayerIntelligenceSnapshot(intelligenceSnapshot),
  intelligenceHash,
)
assert.equal(
  JSON.stringify(intelligenceSnapshot).includes('providerFetchedAt'),
  false,
)
assert.deepEqual(
  quotaClassForPlayerIntelligenceReason('sign-in'),
  { category: 'player_sign_in', priority: 'high' },
)
assert.deepEqual(
  quotaClassForPlayerIntelligenceReason('manual'),
  { category: 'player_manual', priority: 'high' },
)
assert.deepEqual(
  quotaClassForPlayerIntelligenceReason('automatic'),
  { category: 'player_automatic', priority: 'low' },
)

let syncedQuotaInput
let syncedApplyInput
let intelligenceProviderCalls = 0
const allowedRepository = {
  async loadPrimaryLinkedPlayer(userId) {
    assert.equal(userId, 'user-intelligence')
    return {
      playerAccountId: '00000000-0000-0000-0000-000000000001',
      playerId: '125500338',
      kingdomId: 850,
      lastRefreshedAt: '2026-08-29T11:00:00.000Z',
    }
  },
  async applySync(input) {
    syncedApplyInput = input
    return {
      observationId: '00000000-0000-0000-0000-000000000003',
      allianceAuthority: {
        allianceId: '00000000-0000-0000-0000-000000000004',
        membershipId: '00000000-0000-0000-0000-000000000005',
        memberRole: input.memberRole,
        adminActive: input.memberRole === 'r4' || input.memberRole === 'leader',
      },
    }
  },
}
let failedQuotaAttempts = 0
const allowedQuotaRepository = {
  async reserve(input) {
    syncedQuotaInput = input
    return {
      allowed: true,
      duplicate: false,
      state: 'reserved',
      reservationId: '00000000-0000-0000-0000-000000000002',
      attemptToken: '00000000-0000-0000-0000-000000000006',
      minuteUsed: 3,
      dayUsed: 120,
      minuteLimit: 60,
      dayLimit: 5000,
      normalDayLimit: 4500,
    }
  },
  async fail(input) {
    failedQuotaAttempts += 1
    assert.deepEqual(input, {
      reservationId: '00000000-0000-0000-0000-000000000002',
      attemptToken: '00000000-0000-0000-0000-000000000006',
    })
    return true
  },
}
const intelligenceResult = await syncLinkedPlayerIntelligence(
  'user-intelligence',
  'sign-in',
  {
    repository: allowedRepository,
    quotaRepository: allowedQuotaRepository,
    verifiedLastSignInAt: fetchedAt,
    nowMs: Date.parse(fetchedAt),
    provider: {
      async lookupPlayer() {
        throw new Error('identity-only lookup must not be used by intelligence sync')
      },
      async lookupPlayerIntelligence(request) {
        intelligenceProviderCalls += 1
        assert.deepEqual(request, {
          playerId: '125500338',
          expectedKingdomId: 850,
        })
        return intelligence
      },
    },
  },
)
assert.equal(intelligenceProviderCalls, 1)
assert.equal(intelligenceResult.source, 'provider')
assert.deepEqual(
  syncedQuotaInput,
  {
    category: 'player_sign_in',
    priority: 'high',
    idempotencyKey: signInProviderIdempotencyKey(
      'user-intelligence',
      fetchedAt,
    ),
  },
)
assert.equal(intelligenceResult.quota.duplicate, false)
assert.equal(intelligenceResult.contentSha256, intelligenceHash)
assert.equal(
  intelligenceResult.observationId,
  '00000000-0000-0000-0000-000000000003',
)
assert.equal(
  JSON.stringify(syncedApplyInput).includes(secret),
  false,
)
assert.equal(syncedApplyInput.userId, 'user-intelligence')
assert.equal(
  syncedApplyInput.playerAccountId,
  '00000000-0000-0000-0000-000000000001',
)
assert.equal(syncedApplyInput.requestReason, 'sign-in')
assert.equal(syncedApplyInput.contentSha256, intelligenceHash)
assert.equal(syncedApplyInput.applyAllianceAuthority, true)
assert.equal(syncedApplyInput.allianceTag, 'SYN')
assert.equal(syncedApplyInput.allianceName, 'Synthetic Alliance')
assert.equal(syncedApplyInput.memberRole, 'r4')
assert.equal(
  syncedApplyInput.authorityObservedAt,
  '2026-08-29T11:50:00.000Z',
)
assert.equal(
  syncedApplyInput.quotaReservationId,
  '00000000-0000-0000-0000-000000000002',
)
assert.equal(
  syncedApplyInput.quotaAttemptToken,
  '00000000-0000-0000-0000-000000000006',
)
assert.equal(failedQuotaAttempts, 0)
assert.equal(intelligenceResult.allianceAuthority.memberRole, 'r4')
assert.equal(intelligenceResult.allianceAuthority.adminActive, true)

let ageOnlyApplyInput
const ageOnlyResult = await syncLinkedPlayerIntelligence(
  'user-intelligence',
  'manual',
  {
    repository: {
      ...allowedRepository,
      async applySync(input) {
        ageOnlyApplyInput = input
        return {
          observationId: '00000000-0000-0000-0000-000000000007',
          allianceAuthority: input.applyAllianceAuthority
            ? {
                allianceId: '00000000-0000-0000-0000-000000000004',
                membershipId: '00000000-0000-0000-0000-000000000005',
                memberRole: input.memberRole,
                adminActive: input.memberRole === 'r4' || input.memberRole === 'leader',
              }
            : null,
        }
      },
    },
    quotaRepository: allowedQuotaRepository,
    nowMs: Date.parse(fetchedAt),
    provider: {
      async lookupPlayer() {
        throw new Error('identity-only lookup must not be used by intelligence sync')
      },
      async lookupPlayerIntelligence() {
        return {
          ...intelligence,
          providerCachedAt: null,
          providerAgeSeconds: 600,
        }
      },
    },
  },
)
assert.equal(ageOnlyApplyInput.applyAllianceAuthority, true)
assert.equal(
  ageOnlyApplyInput.authorityObservedAt,
  '2026-08-29T11:50:00.000Z',
)
assert.equal(ageOnlyResult.allianceAuthority.memberRole, 'r4')

let incompleteRankApplyInput
const incompleteRankResult = await syncLinkedPlayerIntelligence(
  'user-intelligence',
  'manual',
  {
    repository: {
      ...allowedRepository,
      async applySync(input) {
        incompleteRankApplyInput = input
        return {
          observationId: '00000000-0000-0000-0000-000000000009',
          allianceAuthority: input.applyAllianceAuthority
            ? {
                allianceId: '00000000-0000-0000-0000-000000000004',
                membershipId: '00000000-0000-0000-0000-000000000005',
                memberRole: 'r4',
                adminActive: true,
              }
            : null,
        }
      },
    },
    quotaRepository: allowedQuotaRepository,
    nowMs: Date.parse(fetchedAt),
    provider: {
      async lookupPlayer() {
        throw new Error('identity-only lookup must not be used by intelligence sync')
      },
      async lookupPlayerIntelligence() {
        return {
          ...intelligence,
          base: {
            ...intelligence.base,
            alliance: {
              ...intelligence.base.alliance,
              rank: null,
            },
          },
        }
      },
    },
  },
)
assert.equal(incompleteRankApplyInput.applyAllianceAuthority, true)
assert.equal(incompleteRankApplyInput.allianceTag, 'SYN')
assert.equal(incompleteRankApplyInput.memberRole, null)
assert.equal(
  incompleteRankApplyInput.authorityObservedAt,
  '2026-08-29T11:50:00.000Z',
)
assert.equal(incompleteRankResult.allianceAuthority.memberRole, 'r4')
assert.equal(incompleteRankResult.allianceAuthority.adminActive, true)

let noEvidenceApplyInput
const noEvidenceResult = await syncLinkedPlayerIntelligence(
  'user-intelligence',
  'manual',
  {
    repository: {
      ...allowedRepository,
      async applySync(input) {
        noEvidenceApplyInput = input
        return {
          observationId: '00000000-0000-0000-0000-000000000008',
          allianceAuthority: input.applyAllianceAuthority
            ? {
                allianceId: '00000000-0000-0000-0000-000000000004',
                membershipId: '00000000-0000-0000-0000-000000000005',
                memberRole: input.memberRole,
                adminActive: input.memberRole === 'r4' || input.memberRole === 'leader',
              }
            : null,
        }
      },
    },
    quotaRepository: allowedQuotaRepository,
    provider: {
      async lookupPlayer() {
        throw new Error('identity-only lookup must not be used by intelligence sync')
      },
      async lookupPlayerIntelligence() {
        return {
          ...intelligence,
          providerCachedAt: null,
          providerAgeSeconds: null,
        }
      },
    },
  },
)
assert.equal(noEvidenceApplyInput.applyAllianceAuthority, false)
assert.equal(noEvidenceApplyInput.authorityObservedAt, null)
assert.equal(noEvidenceResult.allianceAuthority, null)

async function authorityInputFor(providerValue) {
  let applyInput
  await syncLinkedPlayerIntelligence(
    'user-intelligence',
    'manual',
    {
      repository: {
        ...allowedRepository,
        async applySync(input) {
          applyInput = input
          return {
            observationId: '00000000-0000-0000-0000-000000000010',
            allianceAuthority: input.applyAllianceAuthority ? {
              allianceId: 'alliance',
              membershipId: 'membership',
              memberRole: input.memberRole,
              adminActive: input.memberRole === 'r4' || input.memberRole === 'leader',
            } : null,
          }
        },
      },
      quotaRepository: allowedQuotaRepository,
      nowMs: Date.parse(fetchedAt),
      provider: {
        async lookupPlayer() { throw new Error('identity-only lookup must not be used') },
        async lookupPlayerIntelligence() { return providerValue },
      },
    },
  )
  return applyInput
}

const staleObservation = await authorityInputFor({
  ...intelligence,
  providerCachedAt: new Date(
    Date.parse(fetchedAt) - PLAYER_PROVIDER_FRESHNESS_TTL_MS - 1,
  ).toISOString(),
  providerAgeSeconds: null,
  providerFresh: true,
})
assert.equal(staleObservation.applyAllianceAuthority, false)
assert.equal(staleObservation.authorityObservedAt, null)
assert.equal(staleObservation.normalizedSnapshot.identity.playerId, '125500338')

const staleAgeObservation = await authorityInputFor({
  ...intelligence,
  providerCachedAt: null,
  providerAgeSeconds: 60 * 60 + 1,
})
assert.equal(staleAgeObservation.applyAllianceAuthority, false)
assert.equal(staleAgeObservation.authorityObservedAt, null)

const contradictoryRecentCachedAt = await authorityInputFor({
  ...intelligence,
  providerCachedAt: new Date(Date.parse(fetchedAt) - (5 * 60 * 1_000)).toISOString(),
  providerAgeSeconds: 2 * 60 * 60,
})
assert.equal(contradictoryRecentCachedAt.applyAllianceAuthority, false)
assert.equal(contradictoryRecentCachedAt.authorityObservedAt, null)
assert.equal(contradictoryRecentCachedAt.normalizedSnapshot.identity.playerId, '125500338')

const contradictoryStaleCachedAt = await authorityInputFor({
  ...intelligence,
  providerCachedAt: new Date(Date.parse(fetchedAt) - (2 * 60 * 60 * 1_000)).toISOString(),
  providerAgeSeconds: 5 * 60,
})
assert.equal(contradictoryStaleCachedAt.applyAllianceAuthority, false)
assert.equal(contradictoryStaleCachedAt.authorityObservedAt, null)

const bothFreshObservation = await authorityInputFor({
  ...intelligence,
  providerCachedAt: new Date(Date.parse(fetchedAt) - (10 * 60 * 1_000)).toISOString(),
  providerAgeSeconds: 15 * 60,
})
assert.equal(bothFreshObservation.applyAllianceAuthority, true)
assert.equal(
  bothFreshObservation.authorityObservedAt,
  new Date(Date.parse(fetchedAt) - (15 * 60 * 1_000)).toISOString(),
)

const exactTtlObservation = await authorityInputFor({
  ...intelligence,
  providerCachedAt: new Date(
    Date.parse(fetchedAt) - PLAYER_PROVIDER_FRESHNESS_TTL_MS,
  ).toISOString(),
  providerAgeSeconds: null,
})
assert.equal(exactTtlObservation.applyAllianceAuthority, true)

const futureCachedAtObservation = await authorityInputFor({
  ...intelligence,
  providerCachedAt: new Date(Date.parse(fetchedAt) + 1_000).toISOString(),
  providerAgeSeconds: null,
})
assert.equal(futureCachedAtObservation.applyAllianceAuthority, false)
assert.equal(futureCachedAtObservation.authorityObservedAt, null)

const invalidAgeObservation = await authorityInputFor({
  ...intelligence,
  providerCachedAt: null,
  providerAgeSeconds: Number.NaN,
})
assert.equal(invalidAgeObservation.applyAllianceAuthority, false)
assert.equal(invalidAgeObservation.authorityObservedAt, null)

const contradictoryFreshnessObservation = await authorityInputFor({
  ...intelligence,
  providerFresh: false,
})
assert.equal(contradictoryFreshnessObservation.applyAllianceAuthority, false)
assert.equal(contradictoryFreshnessObservation.authorityObservedAt, null)

let replayQuotaCalls = 0
let replayProviderCalls = 0
const replayResult = await syncLinkedPlayerIntelligence(
  'user-intelligence',
  'sign-in',
  {
    repository: {
      ...allowedRepository,
      async loadPrimaryLinkedPlayer() {
        return {
          playerAccountId: '00000000-0000-0000-0000-000000000001',
          playerId: '125500338',
          kingdomId: 850,
          // Simulate a base refresh that happened after this sign-in marker.
          // Rich sign-in completion must still be decided by its ledger row.
          lastRefreshedAt: '2026-08-29T12:05:00.000Z',
        }
      },
      async applySync() {
        throw new Error('completed rich sign-in must not apply')
      },
    },
    quotaRepository: {
      async reserve(input) {
        replayQuotaCalls += 1
        assert.deepEqual(input, {
          category: 'player_sign_in',
          priority: 'high',
          idempotencyKey: signInProviderIdempotencyKey(
            'user-intelligence',
            fetchedAt,
          ),
        })
        return {
          allowed: false,
          duplicate: true,
          state: 'completed',
          reservationId: '00000000-0000-0000-0000-000000000002',
          attemptToken: null,
          minuteUsed: 3,
          dayUsed: 120,
          minuteLimit: 60,
          dayLimit: 5000,
          normalDayLimit: 4500,
        }
      },
      async fail() {
        throw new Error('completed rich sign-in must not be failed')
      },
    },
    verifiedLastSignInAt: fetchedAt,
    provider: {
      async lookupPlayer() {
        throw new Error('identity-only lookup must not run')
      },
      async lookupPlayerIntelligence() {
        replayProviderCalls += 1
        return intelligence
      },
    },
  },
)
assert.equal(replayResult.source, 'cache')
assert.equal(replayQuotaCalls, 1)
assert.equal(replayProviderCalls, 0)

let crossInstanceQuotaCalls = 0
let crossInstanceProviderCalls = 0
let crossInstanceApplyCalls = 0
const crossInstanceDuplicate = await syncLinkedPlayerIntelligence(
  'user-intelligence',
  'sign-in',
  {
    repository: {
      ...allowedRepository,
      async applySync() {
        crossInstanceApplyCalls += 1
        throw new Error('duplicate sign-in must not apply')
      },
    },
    quotaRepository: {
      async reserve(input) {
        crossInstanceQuotaCalls += 1
        assert.equal(
          input.idempotencyKey,
          signInProviderIdempotencyKey('user-intelligence', fetchedAt),
        )
        return {
          allowed: false,
          duplicate: true,
          state: 'in_progress',
          reservationId: '00000000-0000-0000-0000-000000000002',
          attemptToken: null,
          minuteUsed: 3,
          dayUsed: 120,
          minuteLimit: 60,
          dayLimit: 5000,
          normalDayLimit: 4500,
        }
      },
      async fail() {
        throw new Error('duplicate reservation must not be failed')
      },
    },
    verifiedLastSignInAt: fetchedAt,
    provider: {
      async lookupPlayer() {
        throw new Error('identity-only lookup must not run')
      },
      async lookupPlayerIntelligence() {
        crossInstanceProviderCalls += 1
        return intelligence
      },
    },
  },
)
assert.equal(crossInstanceDuplicate.source, 'in-progress')
assert.equal(crossInstanceQuotaCalls, 1)
assert.equal(crossInstanceProviderCalls, 0)
assert.equal(crossInstanceApplyCalls, 0)
assert.notEqual(crossInstanceDuplicate.source, 'provider')

let deniedProviderCalls = 0
await assert.rejects(
  () => syncLinkedPlayerIntelligence(
    'user-intelligence',
    'automatic',
    {
      repository: {
        ...allowedRepository,
        async applySync() {
          throw new Error('quota-denied sync must not apply')
        },
      },
      quotaRepository: {
        async reserve() {
          return {
            allowed: false,
            duplicate: false,
            state: 'quota_exhausted',
            reservationId: null,
            attemptToken: null,
            minuteUsed: 60,
            dayUsed: 4500,
            minuteLimit: 60,
            dayLimit: 5000,
            normalDayLimit: 4500,
          }
        },
        async fail() {
          throw new Error('quota-exhausted reservation must not be failed')
        },
      },
      provider: {
        async lookupPlayer() {
          throw new Error('identity-only lookup must not run')
        },
        async lookupPlayerIntelligence() {
          deniedProviderCalls += 1
          return intelligence
        },
      },
    },
  ),
  (error) => {
    assert.equal(error.statusCode, 429)
    assert.equal(error.code, 'PLAYER_PROVIDER_QUOTA_EXHAUSTED')
    return true
  },
)
assert.equal(deniedProviderCalls, 0)

let inconsistentApplied = false
await assert.rejects(
  () => syncLinkedPlayerIntelligence(
    'user-intelligence',
    'intelligence',
    {
      repository: {
        ...allowedRepository,
        async applySync() {
          inconsistentApplied = true
          throw new Error('inconsistent response must not apply')
        },
      },
      quotaRepository: allowedQuotaRepository,
      provider: {
        async lookupPlayer() {
          throw new Error('identity-only lookup must not run')
        },
        async lookupPlayerIntelligence() {
          return {
            ...intelligence,
            identity: {
              ...intelligence.identity,
              playerId: '999999999',
            },
          }
        },
      },
    },
  ),
  (error) => {
    assert.equal(error.statusCode, 502)
    assert.equal(error.code, 'PLAYER_PROVIDER_INVALID_RESPONSE')
    return true
  },
)
assert.equal(inconsistentApplied, false)
assert.equal(failedQuotaAttempts, 1)

const completedDuplicate = await syncLinkedPlayerIntelligence(
  'user-intelligence',
  'sign-in',
  {
    repository: {
      ...allowedRepository,
      async applySync() {
        throw new Error('completed duplicate must not apply')
      },
    },
    quotaRepository: {
      async reserve() {
        return {
          allowed: false,
          duplicate: true,
          state: 'completed',
          reservationId: '00000000-0000-0000-0000-000000000002',
          attemptToken: null,
          minuteUsed: 3,
          dayUsed: 120,
          minuteLimit: 60,
          dayLimit: 5000,
          normalDayLimit: 4500,
        }
      },
      async fail() {
        throw new Error('completed duplicate must not be failed')
      },
    },
    verifiedLastSignInAt: fetchedAt,
    provider: {
      async lookupPlayer() {
        throw new Error('identity-only lookup must not run')
      },
      async lookupPlayerIntelligence() {
        throw new Error('completed duplicate must not call provider')
      },
    },
  },
)
assert.equal(completedDuplicate.source, 'cache')

const migrationSql = await readFile(
  new URL(
    '../supabase/migrations/20260830131000_mightpulse_001b_player_intelligence_foundation.sql',
    import.meta.url,
  ),
  'utf8',
)

assert.equal(
  (migrationSql.match(/\bbegin;/giu) ?? []).length,
  1,
)
assert.equal(
  (migrationSql.match(/\bcommit;/giu) ?? []).length,
  1,
)
assert.equal(
  (
    migrationSql.match(
      /create or replace function public\.reserve_provider_request\(/giu,
    ) ?? []
  ).length,
  1,
)
assert.equal(
  (
    migrationSql.match(
      /create table if not exists public\.player_alliance_provider_state/giu,
    ) ?? []
  ).length,
  1,
)
assert.equal(
  (
    migrationSql.match(
      /create table if not exists public\.alliance_provider_authority_overrides/giu,
    ) ?? []
  ).length,
  1,
)
assert.match(
  migrationSql,
  /normalized_tag := upper\(nullif\(btrim\(p_alliance_tag\), ''\)\);/u,
)
assert.equal(
  (
    migrationSql.match(
      /create or replace function public\.sync_mightpulse_alliance_membership\(/giu,
    ) ?? []
  ).length,
  1,
)
assert.equal(
  (
    migrationSql.match(
      /create or replace function public\.apply_mightpulse_player_intelligence_sync\(/giu,
    ) ?? []
  ).length,
  1,
)
assert.doesNotMatch(
  migrationSql,
  /reserve_provider_request\(text, text, text\)/iu,
)
assert.match(
  migrationSql,
  /create table if not exists public\.player_intelligence_observations/iu,
)
assert.match(
  migrationSql,
  /create trigger reject_player_intelligence_observation_mutation/iu,
)
assert.match(
  migrationSql,
  /create trigger reject_player_intelligence_observation_mutation\s*before update\s*on public\.player_intelligence_observations/iu,
)
assert.doesNotMatch(
  migrationSql,
  /before update or delete\s*on public\.player_intelligence_observations/iu,
)
assert.doesNotMatch(
  migrationSql,
  /grant[^;]*delete[^;]*player_intelligence_observations/iu,
)
assert.match(
  migrationSql,
  /create or replace function public\.reserve_provider_request/iu,
)
assert.match(
  migrationSql,
  /pg_advisory_xact_lock/iu,
)
assert.match(
  migrationSql,
  /interval '24 hours'/iu,
)
assert.match(
  migrationSql,
  /normal_day_limit := 4500/iu,
)
assert.match(
  migrationSql,
  /provider_quota_reservations_idempotency_idx/iu,
)
assert.match(
  migrationSql,
  /create table if not exists public\.provider_quota_reservations[\s\S]*idempotency_key text null[\s\S]*reserved_at timestamptz not null default clock_timestamp\(\)[\s\S]*\);[\s\S]*comment on table public\.provider_quota_reservations/iu,
)
assert.doesNotMatch(
  migrationSql,
  /idempotency_key ~ '\^\[0-9a-f\]\+/iu,
)
assert.match(
  migrationSql,
  /p_idempotency_key text default null/iu,
)
assert.match(
  migrationSql,
  /duplicate boolean/iu,
)
assert.match(
  migrationSql,
  /reservation_state text/iu,
)
assert.match(
  migrationSql,
  /attempt_token uuid/iu,
)
assert.match(
  migrationSql,
  /lease_expires_at timestamptz not null/iu,
)
assert.match(
  migrationSql,
  /status text not null default 'pending'/iu,
)
assert.match(
  migrationSql,
  /create table if not exists public\.provider_quota_attempts/iu,
)
assert.match(
  migrationSql,
  /attempted_at timestamptz not null default clock_timestamp\(\)/iu,
)
assert.match(
  migrationSql,
  /provider_quota_attempts_provider_time_idx/iu,
)
assert.match(
  migrationSql,
  /insert into public\.provider_quota_attempts/iu,
)
assert.match(
  migrationSql,
  /from public\.provider_quota_attempts attempt[\s\S]*attempt\.attempted_at > now_at - interval '60 seconds'/iu,
)
assert.match(
  migrationSql,
  /from public\.provider_quota_attempts attempt[\s\S]*attempt\.attempted_at > now_at - interval '24 hours'/iu,
)
assert.doesNotMatch(
  migrationSql,
  /attempt_count integer/iu,
)
assert.doesNotMatch(
  migrationSql,
  /sum\(reservation\.attempt_count\)/iu,
)
assert.match(
  migrationSql,
  /create or replace function public\.complete_provider_request/iu,
)
assert.match(
  migrationSql,
  /create or replace function public\.fail_provider_request/iu,
)
assert.match(
  migrationSql,
  /existing_row\.status = 'pending'[\s\S]*existing_row\.lease_expires_at > now_at/iu,
)
assert.match(
  migrationSql,
  /create or replace function public\.sync_mightpulse_alliance_membership/iu,
)
assert.match(
  migrationSql,
  /'mightpulse_rank_changed'/iu,
)
assert.match(
  migrationSql,
  /'mightpulse_admin_synced'/iu,
)
assert.match(
  migrationSql,
  /create table if not exists public\.alliance_provider_authority_overrides/iu,
)
assert.match(
  migrationSql,
  /'mightpulse_manual_suspension_preserved'/iu,
)
assert.match(
  migrationSql,
  /'mightpulse_admin_suspension_preserved'/iu,
)
assert.match(
  migrationSql,
  /authority_override_history public\.alliance_provider_authority_overrides/iu,
)
assert.match(
  migrationSql,
  /authority_state\.player_account_id is null[\s\S]*previous_admin\.role in \('r4', 'leader'\)/iu,
)
assert.match(
  migrationSql,
  /authority_state\.player_account_id is not null[\s\S]*authority_state\.alliance_tag = normalized_tag[\s\S]*authority_state\.member_role in \('r4', 'leader'\)[\s\S]*previous_admin\.revoked_at >= authority_state\.provider_fetched_at/iu,
)
assert.match(
  migrationSql,
  /previous_admin\.revoked_at > greatest\([\s\S]*authority_override_history\.cleared_at[\s\S]*authority_override_history\.suspended_until[\s\S]*authority_override_history\.updated_at/iu,
)
assert.match(
  migrationSql,
  /create table if not exists public\.player_alliance_provider_state/iu,
)
assert.match(
  migrationSql,
  /p_observed_at <= authority_state\.provider_observed_at/iu,
)
assert.match(
  migrationSql,
  /provider_observed_at = excluded\.provider_observed_at/iu,
)
assert.match(
  migrationSql,
  /p_fetched_at timestamptz/iu,
)
assert.match(
  migrationSql,
  /create or replace function public\.apply_mightpulse_player_intelligence_sync/iu,
)
assert.match(
  migrationSql,
  /update public\.player_accounts[\s\S]*insert into public\.player_intelligence_observations[\s\S]*sync_mightpulse_alliance_membership/iu,
)
assert.match(
  migrationSql,
  /p_quota_reservation_id uuid/iu,
)
assert.match(
  migrationSql,
  /p_quota_attempt_token uuid/iu,
)
const linkedPlayerServiceSource = await readFile(
  new URL('../server/player-identity/linkedPlayerService.ts', import.meta.url),
  'utf8',
)
assert.match(
  linkedPlayerServiceSource,
  /lookupPlayerSingleFlight[\s\S]*ownerLookup\?: PlayerLookupOwner/iu,
)
assert.match(
  linkedPlayerServiceSource,
  /createQuotaGovernedPlayerLookupOwner[\s\S]*reserveMightPulseProviderRequest[\s\S]*completeMightPulseProviderRequest[\s\S]*failMightPulseProviderRequest/iu,
)
assert.match(
  linkedPlayerServiceSource,
  /lookupKingshotPlayerWithOwner[\s\S]*createQuotaGovernedPlayerLookupOwner/iu,
)
assert.doesNotMatch(
  linkedPlayerServiceSource,
  /if \(input\.enforceQuota === true\)[\s\S]*reserveMightPulseProviderRequest[\s\S]*lookupKingshotPlayer\(/iu,
)

const userManagementServiceSource = await readFile(
  new URL('../server/identity/userManagementService.ts', import.meta.url),
  'utf8',
)
assert.match(
  userManagementServiceSource,
  /lookupKingshotPlayerGoverned[\s\S]*category: 'player_manual'[\s\S]*priority: 'high'/iu,
)

const playerIntelligenceServiceSource = await readFile(
  new URL(
    '../server/player-intelligence/playerIntelligenceService.ts',
    import.meta.url,
  ),
  'utf8',
)
assert.doesNotMatch(
  playerIntelligenceServiceSource,
  /hasNewVerifiedSignIn/u,
)
assert.match(
  playerIntelligenceServiceSource,
  /PLAYER_SIGN_IN_MARKER_REQUIRED/u,
)
assert.match(
  migrationSql,
  /update public\.provider_quota_reservations[\s\S]*attempt_token = p_quota_attempt_token[\s\S]*status = 'pending'[\s\S]*get diagnostics quota_completed = row_count/iu,
)
assert.match(
  migrationSql,
  /can_manage_members = true/iu,
)
assert.match(
  migrationSql,
  /can_manage_events = true/iu,
)
assert.doesNotMatch(
  migrationSql,
  /grant[^;]*player_intelligence_observations[^;]*authenticated/iu,
)
assert.doesNotMatch(
  migrationSql,
  /grant[^;]*alliance_provider_authority_overrides[^;]*authenticated/iu,
)

const hiddenGovernorGear = await providerFor(Response.json(validIntelligencePayload({
  gov_gear: {
    hidden: true,
    message: 'Governor Gear is hidden.',
    items: [],
  },
}))).lookupPlayerIntelligence({
  playerId: '125500338',
  expectedKingdomId: 850,
})
assert.equal(hiddenGovernorGear.governorGear.hidden, true)
assert.equal(hiddenGovernorGear.governorGear.items.length, 0)
assert.equal(hiddenGovernorGear.governorGear.message, 'Governor Gear is hidden.')

await assert.rejects(
  () => providerFor(Response.json(validIntelligencePayload({
    include: ['base', 'heroes', 'ranks'],
  }))).lookupPlayerIntelligence({
    playerId: '125500338',
    expectedKingdomId: 850,
  }),
  (error) => error.statusCode === 502 && error.code === 'PLAYER_PROVIDER_INVALID_RESPONSE',
)

await assert.rejects(
  () => providerFor(Response.json(validIntelligencePayload({
    gov_gear: {
      hidden: true,
      message: 'Hidden but inconsistent.',
      items: [{
        slot: 'helmet',
        name: 'Should not be present',
        equipid: 1,
        gems: [],
      }],
    },
  }))).lookupPlayerIntelligence({
    playerId: '125500338',
    expectedKingdomId: 850,
  }),
  (error) => error.statusCode === 502 && error.code === 'PLAYER_PROVIDER_INVALID_RESPONSE',
)

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

let adminLookupQuotaReservations = 0
let adminLookupQuotaCompletions = 0
let adminLookupProviderCalls = 0
const governedAdminLookup = await lookupKingshotPlayerGoverned(
  '125500338',
  850,
  {
    provider: {
      async lookupPlayer() {
        adminLookupProviderCalls += 1
        return normalizedPlayer
      },
    },
    quotaEnabled: true,
    category: 'player_manual',
    priority: 'high',
    quotaRepository: {
      async reserve(input) {
        adminLookupQuotaReservations += 1
        assert.deepEqual(input, {
          category: 'player_manual',
          priority: 'high',
          idempotencyKey: null,
        })
        return {
          allowed: true,
          duplicate: false,
          state: 'reserved',
          reservationId: '00000000-0000-0000-0000-000000000016',
          attemptToken: '00000000-0000-0000-0000-000000000017',
          minuteUsed: 1,
          dayUsed: 1,
          minuteLimit: 60,
          dayLimit: 5000,
          normalDayLimit: 4500,
        }
      },
      async complete(input) {
        adminLookupQuotaCompletions += 1
        assert.deepEqual(input, {
          reservationId: '00000000-0000-0000-0000-000000000016',
          attemptToken: '00000000-0000-0000-0000-000000000017',
        })
        return true
      },
      async fail() {
        throw new Error('successful administrator lookup must not fail quota')
      },
    },
  },
)
assert.equal(governedAdminLookup, normalizedPlayer)
assert.equal(adminLookupQuotaReservations, 1)
assert.equal(adminLookupQuotaCompletions, 1)
assert.equal(adminLookupProviderCalls, 1)

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

assert.equal(
  hasNewVerifiedSignIn(
    new Date(nowMs).toISOString(),
    new Date(nowMs - 60_000).toISOString(),
  ),
  true,
)
assert.equal(
  hasNewVerifiedSignIn(
    new Date(nowMs).toISOString(),
    new Date(nowMs).toISOString(),
  ),
  false,
)
assert.equal(hasNewVerifiedSignIn(null, recentAccount.last_refreshed_at), false)

let signInProviderCalls = 0
const signInProvider = {
  async lookupPlayer() {
    signInProviderCalls += 1
    return normalizedPlayer
  },
}
const verifiedSignInRefresh = await resolvePlayerRefresh({
  action: 'revalidate',
  existingAccount: {
    ...recentAccount,
    last_refreshed_at: new Date(nowMs - 60_000).toISOString(),
  },
  playerId: '125500338',
  kingdomId: 850,
  refreshReason: 'sign-in',
  verifiedLastSignInAt: new Date(nowMs).toISOString(),
  provider: signInProvider,
  nowMs,
})
assert.equal(verifiedSignInRefresh.source, 'provider')
assert.equal(signInProviderCalls, 1)

const repeatedSignInRefresh = await resolvePlayerRefresh({
  action: 'revalidate',
  existingAccount: {
    ...recentAccount,
    last_refreshed_at: new Date(nowMs).toISOString(),
  },
  playerId: '125500338',
  kingdomId: 850,
  refreshReason: 'sign-in',
  verifiedLastSignInAt: new Date(nowMs).toISOString(),
  provider: signInProvider,
  nowMs,
})
assert.equal(repeatedSignInRefresh.source, 'cache')
assert.equal(signInProviderCalls, 1)

const unverifiedSignInRefresh = await resolvePlayerRefresh({
  action: 'revalidate',
  existingAccount: {
    ...recentAccount,
    last_refreshed_at: new Date(nowMs - 60_000).toISOString(),
  },
  playerId: '125500338',
  kingdomId: 850,
  refreshReason: 'sign-in',
  verifiedLastSignInAt: null,
  provider: signInProvider,
  nowMs,
})
assert.equal(unverifiedSignInRefresh.source, 'cache')
assert.equal(signInProviderCalls, 1)

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


assert.deepEqual(
  quotaClassForPlayerRefresh('link', 'automatic'),
  { category: 'player_link', priority: 'high' },
)
assert.deepEqual(
  quotaClassForPlayerRefresh('revalidate', 'sign-in'),
  { category: 'player_sign_in', priority: 'high' },
)
assert.deepEqual(
  quotaClassForPlayerRefresh('revalidate', 'manual'),
  { category: 'player_manual', priority: 'high' },
)
assert.deepEqual(
  quotaClassForPlayerRefresh('revalidate', 'automatic'),
  { category: 'player_automatic', priority: 'low' },
)

let identityQuotaInput
let identityQuotaProviderCalls = 0
const identityQuotaProvider = {
  async lookupPlayer() {
    identityQuotaProviderCalls += 1
    return normalizedPlayer
  },
}
const identityQuotaRepository = {
  async reserve(input) {
    identityQuotaInput = input
    return {
      allowed: true,
      duplicate: false,
      state: 'reserved',
      reservationId: '00000000-0000-0000-0000-000000000010',
      attemptToken: '00000000-0000-0000-0000-000000000012',
      minuteUsed: 1,
      dayUsed: 1,
      minuteLimit: 60,
      dayLimit: 5000,
      normalDayLimit: 4500,
    }
  },
}

const quotaGovernedLink = await resolvePlayerRefresh({
  action: 'link',
  existingAccount: null,
  playerId: '125500338',
  kingdomId: 850,
  provider: identityQuotaProvider,
  userId: 'user-base-quota',
  quotaRepository: identityQuotaRepository,
  enforceQuota: true,
  nowMs,
})
assert.equal(quotaGovernedLink.source, 'provider')
assert.deepEqual(
  identityQuotaInput,
  {
    category: 'player_link',
    priority: 'high',
    idempotencyKey: null,
  },
)
assert.equal(identityQuotaProviderCalls, 1)

const quotaGovernedManual = await resolvePlayerRefresh({
  action: 'revalidate',
  existingAccount: {
    ...recentAccount,
    last_refreshed_at: new Date(
      nowMs - PLAYER_PROVIDER_MANUAL_REFRESH_MIN_INTERVAL_MS,
    ).toISOString(),
  },
  playerId: '125500338',
  kingdomId: 850,
  provider: identityQuotaProvider,
  forceProviderRefresh: true,
  refreshReason: 'manual',
  userId: 'user-base-quota',
  quotaRepository: identityQuotaRepository,
  enforceQuota: true,
  nowMs,
})
assert.equal(quotaGovernedManual.source, 'provider')
assert.equal(identityQuotaInput.category, 'player_manual')
assert.equal(identityQuotaInput.priority, 'high')
assert.equal(identityQuotaProviderCalls, 2)

let baseSignInProviderCalls = 0
let baseSignInCompletionCalls = 0
const baseSignInRefresh = await resolvePlayerRefresh({
  action: 'revalidate',
  existingAccount: {
    ...recentAccount,
    last_refreshed_at: new Date(nowMs - 60_000).toISOString(),
  },
  playerId: '125500338',
  kingdomId: 850,
  provider: {
    async lookupPlayer() {
      baseSignInProviderCalls += 1
      return normalizedPlayer
    },
  },
  refreshReason: 'sign-in',
  verifiedLastSignInAt: fetchedAt,
  userId: 'user-base-quota',
  quotaRepository: {
    async reserve(input) {
      assert.deepEqual(input, {
        category: 'player_sign_in',
        priority: 'high',
        idempotencyKey: signInProviderIdempotencyKey(
          'user-base-quota',
          fetchedAt,
        ),
      })
      return {
        allowed: true,
        duplicate: false,
        state: 'reserved',
        reservationId: '00000000-0000-0000-0000-000000000011',
        attemptToken: '00000000-0000-0000-0000-000000000013',
        minuteUsed: 2,
        dayUsed: 2,
        minuteLimit: 60,
        dayLimit: 5000,
        normalDayLimit: 4500,
      }
    },
    async complete() {
      baseSignInCompletionCalls += 1
      return true
    },
  },
  enforceQuota: true,
  nowMs,
})
assert.equal(baseSignInRefresh.source, 'provider')
assert.equal(baseSignInProviderCalls, 1)
assert.equal(baseSignInCompletionCalls, 0)
assert.equal(
  baseSignInRefresh.quotaReservation?.reservationId,
  '00000000-0000-0000-0000-000000000011',
)

let duplicateBaseSignInProviderCalls = 0
let duplicateBaseSignInReservations = 0
const duplicateBaseSignInRefresh = assert.rejects(
  () => resolvePlayerRefresh({
    action: 'revalidate',
    existingAccount: {
      ...recentAccount,
      last_refreshed_at: new Date(nowMs - 60_000).toISOString(),
    },
    playerId: '125500338',
    kingdomId: 850,
    provider: {
      async lookupPlayer() {
        duplicateBaseSignInProviderCalls += 1
        return normalizedPlayer
      },
    },
    refreshReason: 'sign-in',
    verifiedLastSignInAt: fetchedAt,
    userId: 'user-base-quota',
    quotaRepository: {
      async reserve(input) {
        duplicateBaseSignInReservations += 1
        assert.deepEqual(input, {
          category: 'player_sign_in',
          priority: 'high',
          idempotencyKey: signInProviderIdempotencyKey(
            'user-base-quota',
            fetchedAt,
          ),
        })
        return {
          allowed: false,
          duplicate: true,
          state: 'in_progress',
          reservationId: '00000000-0000-0000-0000-000000000011',
          attemptToken: null,
          minuteUsed: 2,
          dayUsed: 2,
          minuteLimit: 60,
          dayLimit: 5000,
          normalDayLimit: 4500,
        }
      },
    },
    enforceQuota: true,
    nowMs,
  }),
  (error) => {
    assert.equal(error.code, 'PLAYER_PROVIDER_REQUEST_IN_PROGRESS')
    return true
  },
)
await duplicateBaseSignInRefresh
assert.equal(duplicateBaseSignInReservations, 1)
assert.equal(duplicateBaseSignInProviderCalls, 0)

let completedBaseSignInProviderCalls = 0
const completedBaseSignInRefresh = await resolvePlayerRefresh({
  action: 'revalidate',
  existingAccount: {
    ...recentAccount,
    last_refreshed_at: new Date(nowMs - 60_000).toISOString(),
  },
  playerId: '125500338',
  kingdomId: 850,
  provider: {
    async lookupPlayer() {
      completedBaseSignInProviderCalls += 1
      return normalizedPlayer
    },
  },
  refreshReason: 'sign-in',
  verifiedLastSignInAt: fetchedAt,
  userId: 'user-base-quota',
  quotaRepository: {
    async reserve() {
      return {
        allowed: false,
        duplicate: true,
        state: 'completed',
        reservationId: '00000000-0000-0000-0000-000000000011',
        attemptToken: null,
        minuteUsed: 2,
        dayUsed: 2,
        minuteLimit: 60,
        dayLimit: 5000,
        normalDayLimit: 4500,
      }
    },
  },
  enforceQuota: true,
  nowMs,
})
assert.equal(completedBaseSignInRefresh.source, 'cache')
assert.equal(completedBaseSignInProviderCalls, 0)

let singleFlightQuotaReservations = 0
let singleFlightQuotaCompletions = 0
let singleFlightQuotaFailures = 0
let singleFlightProviderCalls = 0
let releaseSingleFlightProvider
const singleFlightProvider = {
  async lookupPlayer() {
    singleFlightProviderCalls += 1
    return new Promise((resolve) => {
      releaseSingleFlightProvider = () => resolve(normalizedPlayer)
    })
  },
}
const singleFlightQuotaRepository = {
  async reserve(input) {
    singleFlightQuotaReservations += 1
    assert.deepEqual(input, {
      category: 'player_automatic',
      priority: 'low',
      idempotencyKey: null,
    })
    return {
      allowed: true,
      duplicate: false,
      state: 'reserved',
      reservationId: '00000000-0000-0000-0000-000000000014',
      attemptToken: '00000000-0000-0000-0000-000000000015',
      minuteUsed: 1,
      dayUsed: 1,
      minuteLimit: 60,
      dayLimit: 5000,
      normalDayLimit: 4500,
    }
  },
  async complete(input) {
    singleFlightQuotaCompletions += 1
    assert.deepEqual(input, {
      reservationId: '00000000-0000-0000-0000-000000000014',
      attemptToken: '00000000-0000-0000-0000-000000000015',
    })
    return true
  },
  async fail() {
    singleFlightQuotaFailures += 1
    return true
  },
}

const singleFlightRefreshInput = {
  action: 'revalidate',
  existingAccount: {
    ...recentAccount,
    last_refreshed_at: new Date(
      nowMs - PLAYER_PROVIDER_FRESHNESS_TTL_MS,
    ).toISOString(),
  },
  playerId: '125500338',
  kingdomId: 850,
  provider: singleFlightProvider,
  refreshReason: 'automatic',
  userId: 'single-flight-quota-user',
  quotaRepository: singleFlightQuotaRepository,
  enforceQuota: true,
  nowMs,
}
const singleFlightFirst = resolvePlayerRefresh(singleFlightRefreshInput)
const singleFlightSecond = resolvePlayerRefresh(singleFlightRefreshInput)
await Promise.resolve()
await Promise.resolve()
assert.equal(singleFlightQuotaReservations, 1)
assert.equal(singleFlightProviderCalls, 1)
releaseSingleFlightProvider()
const [singleFlightFirstResult, singleFlightSecondResult] = await Promise.all([
  singleFlightFirst,
  singleFlightSecond,
])
assert.equal(singleFlightFirstResult.source, 'provider')
assert.equal(singleFlightSecondResult.source, 'provider')
assert.equal(singleFlightQuotaReservations, 1)
assert.equal(singleFlightProviderCalls, 1)
assert.equal(singleFlightQuotaCompletions, 1)
assert.equal(singleFlightQuotaFailures, 0)

let priorityIsolationProviderCalls = 0
let lowPriorityReservations = 0
let highPriorityReservations = 0
let releaseLowPriorityReservation
const priorityIsolationProvider = {
  async lookupPlayer() {
    priorityIsolationProviderCalls += 1
    return normalizedPlayer
  },
}
const lowPriorityRequest = resolvePlayerRefresh({
  ...singleFlightRefreshInput,
  provider: priorityIsolationProvider,
  quotaRepository: {
    async reserve(input) {
      lowPriorityReservations += 1
      assert.deepEqual(input, {
        category: 'player_automatic',
        priority: 'low',
        idempotencyKey: null,
      })
      return new Promise((resolve) => {
        releaseLowPriorityReservation = () => resolve({
          allowed: false,
          duplicate: false,
          state: 'quota_exhausted',
          reservationId: null,
          attemptToken: null,
          minuteUsed: 1,
          dayUsed: 4500,
          minuteLimit: 60,
          dayLimit: 5000,
          normalDayLimit: 4500,
        })
      })
    },
  },
})
await Promise.resolve()
await Promise.resolve()
assert.equal(lowPriorityReservations, 1)

const highPriorityResult = await resolvePlayerRefresh({
  ...singleFlightRefreshInput,
  provider: priorityIsolationProvider,
  refreshReason: 'manual',
  quotaRepository: {
    async reserve(input) {
      highPriorityReservations += 1
      assert.deepEqual(input, {
        category: 'player_manual',
        priority: 'high',
        idempotencyKey: null,
      })
      return {
        allowed: true,
        duplicate: false,
        state: 'reserved',
        reservationId: '00000000-0000-0000-0000-000000000018',
        attemptToken: '00000000-0000-0000-0000-000000000019',
        minuteUsed: 2,
        dayUsed: 4501,
        minuteLimit: 60,
        dayLimit: 5000,
        normalDayLimit: 4500,
      }
    },
    async complete() {
      return true
    },
    async fail() {
      throw new Error('successful high-priority lookup must not fail quota')
    },
  },
})
assert.equal(highPriorityResult.source, 'provider')
assert.equal(highPriorityReservations, 1)
assert.equal(priorityIsolationProviderCalls, 1)

const lowPriorityRejection = assert.rejects(
  lowPriorityRequest,
  (error) => {
    assert.equal(error.statusCode, 429)
    assert.equal(error.code, 'PLAYER_PROVIDER_QUOTA_EXHAUSTED')
    return true
  },
)
releaseLowPriorityReservation()
await lowPriorityRejection
assert.equal(priorityIsolationProviderCalls, 1)

await assert.rejects(
  () => resolvePlayerRefresh({
    action: 'revalidate',
    existingAccount: {
      ...recentAccount,
      last_refreshed_at: new Date(
        nowMs - PLAYER_PROVIDER_FRESHNESS_TTL_MS,
      ).toISOString(),
    },
    playerId: '125500338',
    kingdomId: 850,
    provider: identityQuotaProvider,
    refreshReason: 'automatic',
    userId: 'user-base-quota',
    quotaRepository: {
      async reserve() {
        return {
          allowed: false,
          duplicate: false,
          state: 'quota_exhausted',
          reservationId: null,
          attemptToken: null,
          minuteUsed: 60,
          dayUsed: 4500,
          minuteLimit: 60,
          dayLimit: 5000,
          normalDayLimit: 4500,
        }
      },
    },
    enforceQuota: true,
    nowMs,
  }),
  (error) => {
    assert.equal(error.statusCode, 429)
    assert.equal(error.code, 'PLAYER_PROVIDER_QUOTA_EXHAUSTED')
    return true
  },
)
assert.equal(identityQuotaProviderCalls, 2)

assert.equal(PLAYER_SIGN_IN_STATUS_ATTEMPT_LIMIT, 168)
assert.equal(PLAYER_SIGN_IN_STATUS_ATTEMPT_LIMIT, 4 * 42)
assert.equal(PLAYER_ACCOUNT_ATTEMPT_WINDOW_MS, 5 * 60 * 1000)
const statusThrottle = new PlayerAccountAttemptThrottle(
  PLAYER_SIGN_IN_STATUS_ATTEMPT_LIMIT,
  PLAYER_ACCOUNT_ATTEMPT_WINDOW_MS,
)
for (let index = 0; index < PLAYER_SIGN_IN_STATUS_ATTEMPT_LIMIT; index += 1) {
  statusThrottle.enforce('status-poll-user', nowMs + index)
}
assert.throws(
  () => statusThrottle.enforce(
    'status-poll-user',
    nowMs + PLAYER_SIGN_IN_STATUS_ATTEMPT_LIMIT,
  ),
  (error) => {
    assert.equal(error.statusCode, 429)
    assert.equal(error.code, 'PLAYER_ACCOUNT_RATE_LIMITED')
    return true
  },
)

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

const baseFreshnessPlayer = {
  ...normalizedPlayer,
  providerCachedAt: new Date(Date.parse(fetchedAt) - (5 * 60 * 1_000)).toISOString(),
  providerAgeSeconds: 2 * 60 * 60,
  providerFresh: true,
}
assert.equal(
  providerIdentityObservedAt(baseFreshnessPlayer),
  new Date(Date.parse(fetchedAt) - (2 * 60 * 60 * 1_000)).toISOString(),
)
assert.equal(
  shouldApplyProviderIdentityRefresh(
    baseFreshnessPlayer,
    new Date(Date.parse(fetchedAt) - (60 * 60 * 1_000)).toISOString(),
  ),
  false,
)
assert.equal(
  shouldApplyProviderIdentityRefresh(
    baseFreshnessPlayer,
    null,
  ),
  true,
)
const futureBaseCachedAtPlayer = {
  ...normalizedPlayer,
  providerCachedAt: new Date(Date.parse(fetchedAt) + 1_000).toISOString(),
  providerAgeSeconds: 10 * 60,
}
assert.equal(
  providerIdentityObservedAt(futureBaseCachedAtPlayer),
  new Date(Date.parse(fetchedAt) - (10 * 60 * 1_000)).toISOString(),
)
const futureOnlyBaseCachedAtPlayer = {
  ...normalizedPlayer,
  providerCachedAt: new Date(Date.parse(fetchedAt) + 1_000).toISOString(),
  providerAgeSeconds: null,
}
assert.equal(providerIdentityObservedAt(futureOnlyBaseCachedAtPlayer), null)
assert.equal(
  shouldApplyProviderIdentityRefresh(
    futureOnlyBaseCachedAtPlayer,
    recentAccount.last_refreshed_at,
  ),
  false,
)
const orderedBaseRefreshFields = createProviderRefreshFields(
  baseFreshnessPlayer,
  providerIdentityObservedAt(baseFreshnessPlayer),
)
assert.equal(
  orderedBaseRefreshFields.last_refreshed_at,
  new Date(Date.parse(fetchedAt) - (2 * 60 * 60 * 1_000)).toISOString(),
)

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

const staleNewLinkPlayer = {
  ...normalizedPlayer,
  providerCachedAt: new Date(Date.parse(fetchedAt) - (2 * 60 * 60 * 1_000)).toISOString(),
  providerAgeSeconds: 90 * 60,
}
const staleNewLink = createNewLinkedPlayerFields(
  staleNewLinkPlayer,
  'user-stale-new-link',
)
assert.equal(
  staleNewLink.last_refreshed_at,
  new Date(Date.parse(fetchedAt) - (2 * 60 * 60 * 1_000)).toISOString(),
)

const newLink = createNewLinkedPlayerFields(normalizedPlayer, 'user-synthetic')
assert.equal(newLink.player_level, null)
assert.equal(newLink.town_center_level, 29)
assert.equal(newLink.verification_status, 'linked')
assert.equal(newLink.verification_method, 'none')
assert.equal(newLink.is_public, false)
assert.equal(newLink.verified_by, null)
assert.equal(newLink.verified_at, null)

let signInRequest
const signInSession = /** @type {import('@supabase/supabase-js').Session} */ ({
  access_token: 'synthetic-session-access-token',
  expires_at: 1788010000,
  user: {
    id: 'user-sign-in-sync',
    last_sign_in_at: fetchedAt,
  },
})
assert.equal(hasPostSignInPlayerSyncAttempted(signInSession), false)

let releasePostSignInSync
let concurrentSignInFetchCalls = 0
const concurrentFirst = syncLinkedPlayerAfterSignIn(
  signInSession,
  async () => {
    concurrentSignInFetchCalls += 1
    return new Promise((resolve) => {
      releasePostSignInSync = () => resolve(
        Response.json({ status: 'success', data: { id: 'synthetic-player' } }),
      )
    })
  },
)
const concurrentSecond = syncLinkedPlayerAfterSignIn(
  signInSession,
  async () => {
    concurrentSignInFetchCalls += 1
    return Response.json({ status: 'success', data: { id: 'duplicate' } })
  },
)
assert.equal(hasPostSignInPlayerSyncAttempted(signInSession), true)
assert.ok(getPostSignInPlayerSyncInFlight(signInSession))
assert.equal(concurrentSignInFetchCalls, 1)
releasePostSignInSync()
assert.equal(await concurrentFirst, 'updated')
assert.equal(await concurrentSecond, 'updated')
assert.equal(concurrentSignInFetchCalls, 1)
assert.equal(getPostSignInPlayerSyncInFlight(signInSession), null)
assert.equal(
  getPostSignInPlayerSyncOutcome(signInSession),
  'updated',
)
assert.equal(
  shouldSuppressAutomaticRefreshAfterPostSignInSync(
    getPostSignInPlayerSyncOutcome(signInSession),
  ),
  true,
)

const suppressionNowMs = Date.parse('2026-08-30T22:00:00.000Z')
assert.equal(
  postSignInSuppressionExpiresAt(
    '2026-08-30T21:59:00.000Z',
    suppressionNowMs,
    PLAYER_PROVIDER_FRESHNESS_TTL_MS,
  ),
  Date.parse('2026-08-30T22:59:00.000Z'),
)
assert.equal(
  postSignInSuppressionExpiresAt(
    '2026-08-30T21:01:00.000Z',
    suppressionNowMs,
    PLAYER_PROVIDER_FRESHNESS_TTL_MS,
  ),
  Date.parse('2026-08-30T22:01:00.000Z'),
)
assert.equal(
  postSignInSuppressionExpiresAt(
    '2026-08-30T20:59:00.000Z',
    suppressionNowMs,
    PLAYER_PROVIDER_FRESHNESS_TTL_MS,
  ),
  Date.parse('2026-08-30T21:59:00.000Z'),
)
assert.equal(
  postSignInSuppressionExpiresAt(
    null,
    suppressionNowMs,
    PLAYER_PROVIDER_FRESHNESS_TTL_MS,
  ),
  suppressionNowMs,
)

const markerRaceOldSession = /** @type {import('@supabase/supabase-js').Session} */ ({
  ...signInSession,
  user: {
    ...signInSession.user,
    id: 'user-sign-in-marker-race',
    last_sign_in_at: '2026-08-29T12:30:00.000Z',
  },
})
const markerRaceNewSession = /** @type {import('@supabase/supabase-js').Session} */ ({
  ...markerRaceOldSession,
  user: {
    ...markerRaceOldSession.user,
    last_sign_in_at: '2026-08-29T12:31:00.000Z',
  },
})
let markerRaceFetchCalls = 0
let releaseMarkerRaceOld
const markerRaceOld = syncLinkedPlayerAfterSignIn(
  markerRaceOldSession,
  async () => {
    markerRaceFetchCalls += 1
    return new Promise((resolve) => {
      releaseMarkerRaceOld = () => resolve(
        Response.json({
          status: 'success',
          data: { id: 'old-marker-player' },
        }),
      )
    })
  },
)
assert.ok(getPostSignInPlayerSyncInFlight(markerRaceOldSession))

const markerRaceNew = syncLinkedPlayerAfterSignIn(
  markerRaceNewSession,
  async () => {
    markerRaceFetchCalls += 1
    return Response.json({
      status: 'success',
      data: { id: 'new-marker-player' },
    })
  },
)
assert.equal(markerRaceFetchCalls, 2)
assert.ok(getPostSignInPlayerSyncInFlight(markerRaceNewSession))
assert.equal(await markerRaceNew, 'updated')
releaseMarkerRaceOld()
assert.equal(await markerRaceOld, 'updated')
assert.equal(markerRaceFetchCalls, 2)
assert.equal(
  getPostSignInPlayerSyncInFlight(markerRaceOldSession),
  null,
)
assert.equal(
  getPostSignInPlayerSyncInFlight(markerRaceNewSession),
  null,
)
assert.equal(
  getPostSignInPlayerSyncOutcome(markerRaceOldSession),
  'updated',
)
assert.equal(
  getPostSignInPlayerSyncOutcome(markerRaceNewSession),
  'updated',
)

let settledDuplicateFetchCalls = 0
assert.equal(
  await syncLinkedPlayerAfterSignIn(
    signInSession,
    async () => {
      settledDuplicateFetchCalls += 1
      return Response.json({
        status: 'success',
        data: { id: 'must-not-run' },
      })
    },
  ),
  'already-attempted',
)
assert.equal(settledDuplicateFetchCalls, 0)

const postSignInResult = await syncLinkedPlayerAfterSignIn(
  {
    ...signInSession,
    user: {
      ...signInSession.user,
      last_sign_in_at: '2026-08-29T12:05:00.000Z',
    },
  },
  async (url, init) => {
    signInRequest = { url, init }
    return Response.json({ status: 'success', data: { id: 'synthetic-player' } })
  },
)
assert.equal(postSignInResult, 'updated')
assert.equal(signInRequest.url, '/api/player/account')
assert.equal(signInRequest.init.method, 'POST')
assert.equal(
  signInRequest.init.headers.Authorization,
  'Bearer synthetic-session-access-token',
)
assert.deepEqual(
  JSON.parse(signInRequest.init.body),
  { action: 'revalidate', refreshReason: 'sign-in' },
)

const inProgressSession = {
  ...signInSession,
  user: {
    ...signInSession.user,
    last_sign_in_at: '2026-08-29T12:07:30.000Z',
  },
}
assert.equal(
  await syncLinkedPlayerAfterSignIn(
    inProgressSession,
    async () => Response.json({
      status: 'success',
      code: 'PLAYER_INTELLIGENCE_IN_PROGRESS',
      data: null,
    }),
  ),
  'in-progress',
)
assert.equal(
  getPostSignInPlayerSyncOutcome(inProgressSession),
  'in-progress',
)
assert.equal(
  shouldSuppressAutomaticRefreshAfterPostSignInSync(
    getPostSignInPlayerSyncOutcome(inProgressSession),
  ),
  false,
)
assert.ok(
  (POST_SIGN_IN_COMPLETION_MAX_ATTEMPTS - 1)
    * POST_SIGN_IN_COMPLETION_POLL_INTERVAL_MS
    > 120_000,
)

let completionPollCalls = 0
let completionSleepCalls = 0
assert.equal(
  await waitForPostSignInPlayerSyncCompletion(
    inProgressSession,
    {
      intervalMs: 1,
      maxAttempts: 3,
      sleepImplementation: async (milliseconds) => {
        assert.equal(milliseconds, 1)
        completionSleepCalls += 1
      },
      fetchImplementation: async (url, init) => {
        completionPollCalls += 1
        assert.equal(url, '/api/player/account')
        assert.deepEqual(
          JSON.parse(init.body),
          { action: 'sign-in-status' },
        )
        return completionPollCalls < 3
          ? Response.json({
              status: 'success',
              code: 'PLAYER_INTELLIGENCE_IN_PROGRESS',
              data: null,
            })
          : Response.json({
              status: 'success',
              code: 'PLAYER_INTELLIGENCE_CACHED',
              data: null,
            })
      },
    },
  ),
  true,
)
assert.equal(completionPollCalls, 3)
assert.equal(completionSleepCalls, 2)

let disabledLedgerStatusCalls = 0
assert.equal(
  await waitForPostSignInPlayerSyncCompletion(
    inProgressSession,
    {
      intervalMs: 1,
      maxAttempts: 3,
      sleepImplementation: async () => {},
      fetchImplementation: async () => {
        disabledLedgerStatusCalls += 1
        return Response.json({
          status: 'success',
          code: 'PLAYER_INTELLIGENCE_STATUS_DISABLED',
          data: null,
        })
      },
    },
  ),
  true,
)
assert.equal(disabledLedgerStatusCalls, 1)

let transientPollCalls = 0
assert.equal(
  await waitForPostSignInPlayerSyncCompletion(
    inProgressSession,
    {
      intervalMs: 1,
      maxAttempts: 4,
      sleepImplementation: async () => {},
      fetchImplementation: async () => {
        transientPollCalls += 1
        if (transientPollCalls === 1) {
          return new Response('temporary failure', { status: 503 })
        }
        if (transientPollCalls === 2) {
          return new Response('{malformed', {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        }
        return transientPollCalls === 3
          ? Response.json({
              status: 'success',
              code: 'PLAYER_INTELLIGENCE_IN_PROGRESS',
              data: null,
            })
          : Response.json({
              status: 'success',
              code: 'PLAYER_INTELLIGENCE_CACHED',
              data: null,
            })
      },
    },
  ),
  true,
)
assert.equal(transientPollCalls, 4)

let terminalRetryCalls = 0
assert.equal(
  await waitForPostSignInPlayerSyncCompletion(
    inProgressSession,
    {
      intervalMs: 1,
      maxAttempts: 2,
      sleepImplementation: async () => {},
      fetchImplementation: async (url, init) => {
        terminalRetryCalls += 1
        assert.equal(url, '/api/player/account')
        const requestBody = JSON.parse(init.body)
        if (terminalRetryCalls === 1) {
          assert.deepEqual(requestBody, { action: 'sign-in-status' })
          return Response.json({
            status: 'success',
            code: 'PLAYER_INTELLIGENCE_STATUS_MISSING',
            data: null,
          })
        }
        assert.deepEqual(
          requestBody,
          { action: 'revalidate', refreshReason: 'sign-in' },
        )
        return Response.json({
          status: 'success',
          data: { id: 'retried-idempotently' },
        })
      },
    },
  ),
  true,
)
assert.equal(terminalRetryCalls, 2)

let failedTakeoverCalls = 0
assert.equal(
  await waitForPostSignInPlayerSyncCompletion(
    inProgressSession,
    {
      intervalMs: 1,
      maxAttempts: 5,
      sleepImplementation: async () => {},
      fetchImplementation: async (url, init) => {
        failedTakeoverCalls += 1
        assert.equal(url, '/api/player/account')
        const requestBody = JSON.parse(init.body)
        if (failedTakeoverCalls === 1) {
          assert.deepEqual(requestBody, { action: 'sign-in-status' })
          return Response.json({
            status: 'success',
            code: 'PLAYER_INTELLIGENCE_FAILED',
            data: null,
          })
        }
        assert.equal(failedTakeoverCalls, 2)
        assert.deepEqual(
          requestBody,
          { action: 'revalidate', refreshReason: 'sign-in' },
        )
        return new Response('provider unavailable', { status: 503 })
      },
    },
  ),
  true,
)
assert.equal(failedTakeoverCalls, 2)

let repeatedFailedStatusCalls = 0
assert.equal(
  await waitForPostSignInPlayerSyncCompletion(
    inProgressSession,
    {
      intervalMs: 1,
      maxAttempts: 5,
      sleepImplementation: async () => {},
      fetchImplementation: async (url, init) => {
        repeatedFailedStatusCalls += 1
        assert.equal(url, '/api/player/account')
        const requestBody = JSON.parse(init.body)
        if (repeatedFailedStatusCalls === 1) {
          assert.deepEqual(requestBody, { action: 'sign-in-status' })
          return Response.json({
            status: 'success',
            code: 'PLAYER_INTELLIGENCE_FAILED',
            data: null,
          })
        }
        if (repeatedFailedStatusCalls === 2) {
          assert.deepEqual(
            requestBody,
            { action: 'revalidate', refreshReason: 'sign-in' },
          )
          return Response.json({
            status: 'success',
            code: 'PLAYER_INTELLIGENCE_IN_PROGRESS',
            data: null,
          })
        }
        assert.deepEqual(requestBody, { action: 'sign-in-status' })
        return Response.json({
          status: 'success',
          code: 'PLAYER_INTELLIGENCE_FAILED',
          data: null,
        })
      },
    },
  ),
  true,
)
assert.equal(repeatedFailedStatusCalls, 3)

let timeoutPollCalls = 0
assert.equal(
  await waitForPostSignInPlayerSyncCompletion(
    inProgressSession,
    {
      intervalMs: 1,
      maxAttempts: 3,
      sleepImplementation: async () => {},
      fetchImplementation: async () => {
        timeoutPollCalls += 1
        return Response.json({
          status: 'success',
          code: 'PLAYER_INTELLIGENCE_IN_PROGRESS',
          data: null,
        })
      },
    },
  ),
  false,
)
assert.equal(timeoutPollCalls, 3)

assert.equal(
  await syncLinkedPlayerAfterSignIn(
    {
      ...signInSession,
      user: {
        ...signInSession.user,
        last_sign_in_at: '2026-08-29T12:10:00.000Z',
      },
    },
    async () => Response.json({
      status: 'success',
      code: 'NO_LINKED_PLAYER',
      data: null,
    }),
  ),
  'no-linked-player',
)
const noLinkedSession = {
  ...signInSession,
  user: {
    ...signInSession.user,
    last_sign_in_at: '2026-08-29T12:10:00.000Z',
  },
}
assert.equal(
  getPostSignInPlayerSyncOutcome(noLinkedSession),
  'no-linked-player',
)
assert.equal(
  shouldSuppressAutomaticRefreshAfterPostSignInSync(
    getPostSignInPlayerSyncOutcome(noLinkedSession),
  ),
  true,
)
assert.equal(
  await syncLinkedPlayerAfterSignIn(
    {
      ...signInSession,
      user: {
        ...signInSession.user,
        last_sign_in_at: '2026-08-29T12:15:00.000Z',
      },
    },
    async () => new Response('provider unavailable', { status: 503 }),
  ),
  'unavailable',
)
const unavailableSession = {
  ...signInSession,
  user: {
    ...signInSession.user,
    last_sign_in_at: '2026-08-29T12:15:00.000Z',
  },
}
assert.equal(
  getPostSignInPlayerSyncOutcome(unavailableSession),
  'unavailable',
)
assert.equal(
  shouldSuppressAutomaticRefreshAfterPostSignInSync(
    getPostSignInPlayerSyncOutcome(unavailableSession),
  ),
  false,
)
assert.equal(
  await syncLinkedPlayerAfterSignIn(
    {
      ...signInSession,
      user: {
        ...signInSession.user,
        last_sign_in_at: '2026-08-29T12:20:00.000Z',
      },
    },
    async () => { throw new Error('synthetic network failure') },
  ),
  'unavailable',
)

const playerAccountApiSource = await readFile(
  new URL('../api/player/account.ts', import.meta.url),
  'utf8',
)
assert.match(
  playerAccountApiSource,
  /PLAYER_INTELLIGENCE_IN_PROGRESS/u,
)
assert.match(
  playerAccountApiSource,
  /result\.source === 'in-progress'/u,
)
const signInStatusActionIndex = playerAccountApiSource.indexOf(
  "if (input.action === 'sign-in-status')",
)
const signInStatusThrottleIndex = playerAccountApiSource.indexOf(
  'signInStatusThrottle.enforce(actor.userId)',
  signInStatusActionIndex,
)
const signInStatusQuotaGuardIndex = playerAccountApiSource.indexOf(
  'if (!isProviderQuotaRuntimeEnabled())',
  signInStatusActionIndex,
)
const signInStatusReadIndex = playerAccountApiSource.indexOf(
  'readMightPulseProviderRequestStatus(',
  signInStatusActionIndex,
)
const accountThrottleIndex = playerAccountApiSource.indexOf(
  'attemptThrottle.enforce(actor.userId)',
  signInStatusActionIndex,
)
const richSyncIndex = playerAccountApiSource.indexOf(
  'syncLinkedPlayerIntelligence(',
  signInStatusActionIndex,
)
assert.ok(signInStatusActionIndex >= 0)
assert.ok(signInStatusThrottleIndex > signInStatusActionIndex)
assert.ok(signInStatusQuotaGuardIndex > signInStatusThrottleIndex)
assert.ok(signInStatusReadIndex > signInStatusQuotaGuardIndex)
assert.ok(accountThrottleIndex > signInStatusReadIndex)
assert.ok(richSyncIndex > accountThrottleIndex)
assert.match(
  playerAccountApiSource,
  /const signInStatusThrottle = new PlayerAccountAttemptThrottle\([\s\S]*PLAYER_SIGN_IN_STATUS_ATTEMPT_LIMIT[\s\S]*PLAYER_ACCOUNT_ATTEMPT_WINDOW_MS/u,
)
assert.match(
  playerAccountApiSource,
  /if \(input\.action === 'sign-in-status'\)[\s\S]*readMightPulseProviderRequestStatus\([\s\S]*signInProviderIdempotencyKey\(/u,
)
assert.match(
  playerAccountApiSource,
  /if \(!isProviderQuotaRuntimeEnabled\(\)\)[\s\S]*PLAYER_INTELLIGENCE_STATUS_DISABLED[\s\S]*return[\s\S]*readMightPulseProviderRequestStatus\(/u,
)
assert.doesNotMatch(
  playerAccountApiSource,
  /baseSignInProviderIdempotencyKey/u,
)
assert.doesNotMatch(
  linkedPlayerServiceSource,
  /baseSignInProviderIdempotencyKey/u,
)
assert.match(
  playerAccountApiSource,
  /PLAYER_PROVIDER_REQUEST_IN_PROGRESS'[\s\S]*status: 'success'[\s\S]*code: 'PLAYER_INTELLIGENCE_IN_PROGRESS'/u,
)

const accountPersistenceIndex = linkedPlayerServiceSource.indexOf(
  "const result = existing",
)
const accountPersistenceResultIndex = linkedPlayerServiceSource.indexOf(
  'const { data, error } = result',
  accountPersistenceIndex,
)
const deferredCompletionIndex = linkedPlayerServiceSource.indexOf(
  'await completeMightPulseProviderRequest(',
  accountPersistenceResultIndex,
)
const persistenceFailureIndex = linkedPlayerServiceSource.indexOf(
  'await failMightPulseProviderRequest(',
  accountPersistenceResultIndex,
)
assert.ok(accountPersistenceIndex >= 0)
assert.ok(accountPersistenceResultIndex > accountPersistenceIndex)
assert.ok(persistenceFailureIndex > accountPersistenceResultIndex)
assert.ok(deferredCompletionIndex > persistenceFailureIndex)
assert.match(
  linkedPlayerServiceSource,
  /if \(resolution\.quotaReservation\) \{[\s\S]*await failMightPulseProviderRequest\([\s\S]*if \(error\.code === '23505'\)/u,
)
assert.match(
  linkedPlayerServiceSource,
  /const \{ data, error \} = result[\s\S]*if \(error\)[\s\S]*if \(resolution\.quotaReservation\)[\s\S]*await completeMightPulseProviderRequest\(/u,
)
assert.match(
  linkedPlayerServiceSource,
  /\.or\([\s\S]*last_refreshed_at\.is\.null,last_refreshed_at\.lte\.\$\{providerObservedAt\}[\s\S]*\.maybeSingle\(\)/u,
)
assert.match(
  linkedPlayerServiceSource,
  /return safeAccount\(data \?\? existing\)/u,
)

const firstAuthorityGuardMigrationSql = await readFile(
  new URL(
    '../supabase/migrations/20260830200500_mightpulse_001b_first_authority_watermark_guard.sql',
    import.meta.url,
  ),
  'utf8',
)
assert.match(
  firstAuthorityGuardMigrationSql,
  /authority_state\.player_account_id is null[\s\S]*current_membership\.id is not null[\s\S]*p_authority_observed_at <= current_membership\.updated_at/u,
)
assert.match(
  firstAuthorityGuardMigrationSql,
  /p_authority_observed_at <= current_membership\.updated_at then[\s\S]*alliance_id := current_membership\.alliance_id[\s\S]*membership_id := current_membership\.id[\s\S]*member_role := current_membership\.member_role/u,
)
assert.match(
  firstAuthorityGuardMigrationSql,
  /elsif nullif\(btrim\(p_alliance_tag\), ''\) is not null/u,
)

assert.doesNotMatch(
  firstAuthorityGuardMigrationSql,
  /or \(\s*p_provider_cached_at is not null\s*and p_provider_cached_at > p_provider_fetched_at\s*\)/u,
)
assert.match(
  firstAuthorityGuardMigrationSql,
  /identity_observed_at := case[\s\S]*p_provider_cached_at <= p_provider_fetched_at[\s\S]*p_provider_age_seconds is not null then[\s\S]*least\([\s\S]*p_provider_cached_at,[\s\S]*p_provider_fetched_at - make_interval\(secs => p_provider_age_seconds\)[\s\S]*\)/u,
)
assert.match(
  firstAuthorityGuardMigrationSql,
  /when p_provider_cached_at is not null[\s\S]*p_provider_cached_at <= p_provider_fetched_at then[\s\S]*p_provider_cached_at[\s\S]*when p_provider_age_seconds is not null then[\s\S]*p_provider_fetched_at - make_interval\(secs => p_provider_age_seconds\)/u,
)
assert.match(
  firstAuthorityGuardMigrationSql,
  /insert into public\.player_intelligence_observations \([\s\S]*provider_cached_at,[\s\S]*values \([\s\S]*p_provider_cached_at,/u,
)

const incompleteRankWatermarkMigrationSql = await readFile(
  new URL(
    '../supabase/migrations/20260830193000_mightpulse_001b_incomplete_rank_watermark.sql',
    import.meta.url,
  ),
  'utf8',
)
assert.match(
  incompleteRankWatermarkMigrationSql,
  /create or replace function public\.advance_mightpulse_alliance_authority_watermark\(/u,
)
assert.match(
  incompleteRankWatermarkMigrationSql,
  /p_observed_at > authority_state\.provider_observed_at/u,
)
assert.match(
  incompleteRankWatermarkMigrationSql,
  /alliance_tag = public\.player_alliance_provider_state\.alliance_tag[\s\S]*member_role = public\.player_alliance_provider_state\.member_role/u,
)
assert.match(
  incompleteRankWatermarkMigrationSql,
  /nullif\(btrim\(p_alliance_tag\), ''\) is not null[\s\S]*p_member_role is null[\s\S]*advance_mightpulse_alliance_authority_watermark/u,
)
assert.match(
  incompleteRankWatermarkMigrationSql,
  /grant execute on function public\.advance_mightpulse_alliance_authority_watermark\([\s\S]*to service_role/u,
)
assert.doesNotMatch(
  incompleteRankWatermarkMigrationSql,
  /grant execute on function public\.advance_mightpulse_alliance_authority_watermark\([\s\S]*to authenticated/u,
)

const providerRequestStatusMigrationSql = await readFile(
  new URL(
    '../supabase/migrations/20260830183000_mightpulse_001b_provider_request_status.sql',
    import.meta.url,
  ),
  'utf8',
)
assert.match(
  providerRequestStatusMigrationSql,
  /create or replace function public\.get_provider_request_status\(/u,
)
assert.match(
  providerRequestStatusMigrationSql,
  /security definer/u,
)
assert.match(
  providerRequestStatusMigrationSql,
  /return coalesce\(current_status, 'missing'\)/u,
)
assert.match(
  providerRequestStatusMigrationSql,
  /grant execute on function public\.get_provider_request_status\([\s\S]*to service_role/u,
)
assert.doesNotMatch(
  providerRequestStatusMigrationSql,
  /grant execute[\s\S]*to authenticated/u,
)

const expiredProviderStatusMigrationSql = await readFile(
  new URL(
    '../supabase/migrations/20260830204500_mightpulse_001b_expired_provider_status.sql',
    import.meta.url,
  ),
  'utf8',
)
assert.match(
  expiredProviderStatusMigrationSql,
  /create or replace function public\.get_provider_request_status\(/u,
)
assert.match(
  expiredProviderStatusMigrationSql,
  /reservation\.status = 'pending'[\s\S]*reservation\.lease_expires_at <= clock_timestamp\(\)[\s\S]*then 'failed'/u,
)
assert.match(
  expiredProviderStatusMigrationSql,
  /return coalesce\(current_status, 'missing'\)/u,
)
assert.match(
  expiredProviderStatusMigrationSql,
  /grant execute on function public\.get_provider_request_status\([\s\S]*to service_role/u,
)
assert.doesNotMatch(
  expiredProviderStatusMigrationSql,
  /grant execute[\s\S]*to authenticated/u,
)

const playerIdentityContextSource = await readFile(
  new URL('../src/context/PlayerIdentityContext.tsx', import.meta.url),
  'utf8',
)
assert.match(
  playerIdentityContextSource,
  /const signInResult = signInSync[\s\S]*getPostSignInPlayerSyncOutcome\(session\)/u,
)
assert.match(
  playerIdentityContextSource,
  /shouldSuppressAutomaticRefreshAfterPostSignInSync\(signInResult\)/u,
)
assert.match(
  playerIdentityContextSource,
  /Date\.now\(\) < existingSignInSuppression\.expiresAt/u,
)
assert.match(
  playerIdentityContextSource,
  /expiresAt: postSignInSuppressionExpiresAt\([\s\S]*currentAccount\.last_refreshed_at,[\s\S]*REFRESH_STALE_MS/u,
)
assert.doesNotMatch(
  playerIdentityContextSource,
  /existingSignInSuppression\.handledAt/u,
)
assert.match(
  playerIdentityContextSource,
  /signInResult === 'in-progress'[\s\S]*signInResult === 'unavailable'[\s\S]*suppressAutomaticRefresh = await waitForPostSignInPlayerSyncCompletion\(\s*session,[\s\S]*currentAccount = completedAccount/u,
)
const postSignInSyncServiceSource = await readFile(
  new URL('../src/services/postSignInPlayerSyncService.ts', import.meta.url),
  'utf8',
)
assert.match(
  postSignInSyncServiceSource,
  /let takeoverAttempted = false/u,
)
assert.match(
  postSignInSyncServiceSource,
  /if \(result === 'retry-idempotent'\) \{[\s\S]*if \(takeoverAttempted\)[\s\S]*return true[\s\S]*takeoverAttempted = true[\s\S]*performLinkedPlayerSignInSync/u,
)
assert.match(
  postSignInSyncServiceSource,
  /if \(retryResult === 'unavailable'\) \{[\s\S]*return true/u,
)
const repeatedSuppressionIndex = playerIdentityContextSource.indexOf(
  'const sameHandledSignIn =',
)
const repeatedSuppressionReturnIndex = playerIdentityContextSource.indexOf(
  'Date.now() - existingSignInSuppression.handledAt < REFRESH_STALE_MS',
  repeatedSuppressionIndex,
)
const signInResultIndex = playerIdentityContextSource.indexOf(
  'const signInResult = signInSync',
)
const completionWaitIndex = playerIdentityContextSource.indexOf(
  'waitForPostSignInPlayerSyncCompletion(',
  signInResultIndex,
)
const suppressionMarkerIndex = playerIdentityContextSource.indexOf(
  'suppressedInitialSignInRefresh.current = {',
  signInResultIndex,
)
const ordinaryRefreshIndex = playerIdentityContextSource.indexOf(
  'const lastRefresh = Date.parse',
  signInResultIndex,
)
assert.ok(repeatedSuppressionIndex >= 0)
assert.ok(repeatedSuppressionReturnIndex > repeatedSuppressionIndex)
assert.ok(signInResultIndex > repeatedSuppressionReturnIndex)
assert.ok(completionWaitIndex > signInResultIndex)
assert.ok(suppressionMarkerIndex > completionWaitIndex)
assert.ok(ordinaryRefreshIndex > suppressionMarkerIndex)
assert.match(
  playerIdentityContextSource,
  /const signInSuppressionKey = session && user[\s\S]*const sameHandledSignIn = signInSuppressionKey !== null[\s\S]*Date\.now\(\) - existingSignInSuppression\.handledAt < REFRESH_STALE_MS[\s\S]*return/u,
)
assert.match(
  playerIdentityContextSource,
  /session[\s\S]*signInSuppressionKey !== null[\s\S]*!sameHandledSignIn[\s\S]*hasPostSignInPlayerSyncAttempted\(session\)/u,
)
assert.match(
  playerIdentityContextSource,
  /if \(suppressAutomaticRefresh\) \{[\s\S]*suppressedInitialSignInRefresh\.current = \{[\s\S]*key: signInSuppressionKey,[\s\S]*handledAt: Date\.now\(\),[\s\S]*return/u,
)
assert.doesNotMatch(
  playerIdentityContextSource,
  /suppressedInitialSignInRefresh\.current = signInMarker/u,
)
assert.doesNotMatch(
  playerIdentityContextSource,
  /\.select\('last_refreshed_at'\)/u,
)
assert.match(
  playerIdentityContextSource,
  /function handlePlayerUpdate\(\) \{\s*void loadPlayerIdentity\(\)\s*\}/u,
)
assert.doesNotMatch(
  playerIdentityContextSource,
  /function handlePlayerUpdate\(\) \{\s*void refreshPlayerIdentity\('automatic'\)\s*\}/u,
)

console.log('MightPulse provider, avatar diagnostics, freshness, verified sign-in refresh, preservation and ownership-boundary tests passed.')
