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
  hasNewVerifiedSignIn,
  lookupKingshotPlayer,
  PLAYER_PROVIDER_FRESHNESS_TTL_MS,
  PLAYER_PROVIDER_MANUAL_REFRESH_MIN_INTERVAL_MS,
  quotaClassForPlayerRefresh,
  resolvePlayerRefresh,
} from '../server/player-identity/linkedPlayerService.ts'
import { PlayerAccountAttemptThrottle } from '../server/player-identity/playerAccountAttemptThrottle.ts'
import {
  getPostSignInPlayerSyncInFlight,
  hasPostSignInPlayerSyncAttempted,
  syncLinkedPlayerAfterSignIn,
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
assert.equal(
  isPlayerIntelligenceRuntimeEnabled({ MIGHTPULSE_PLAYER_INTELLIGENCE_ENABLED: 'true' }),
  true,
)
assert.equal(
  isPlayerIntelligenceRuntimeEnabled({ MIGHTPULSE_PLAYER_INTELLIGENCE_ENABLED: ' TRUE ' }),
  true,
)
assert.equal(
  isPlayerIntelligenceRuntimeEnabled({ MIGHTPULSE_PLAYER_INTELLIGENCE_ENABLED: 'false' }),
  false,
)
assert.equal(isPlayerIntelligenceRuntimeEnabled({}), false)

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
const allowedQuotaRepository = {
  async reserve(input) {
    syncedQuotaInput = input
    return {
      allowed: true,
      duplicate: false,
      reservationId: '00000000-0000-0000-0000-000000000002',
      minuteUsed: 3,
      dayUsed: 120,
      minuteLimit: 60,
      dayLimit: 5000,
      normalDayLimit: 4500,
    }
  },
}
const intelligenceResult = await syncLinkedPlayerIntelligence(
  'user-intelligence',
  'sign-in',
  {
    repository: allowedRepository,
    quotaRepository: allowedQuotaRepository,
    verifiedLastSignInAt: fetchedAt,
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
assert.equal(intelligenceResult.allianceAuthority.memberRole, 'r4')
assert.equal(intelligenceResult.allianceAuthority.adminActive, true)

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
          lastRefreshedAt: fetchedAt,
        }
      },
      async applySync() {
        throw new Error('same sign-in must not apply')
      },
    },
    quotaRepository: {
      async reserve() {
        replayQuotaCalls += 1
        throw new Error('same sign-in freshness check must not reserve quota')
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
assert.equal(replayQuotaCalls, 0)
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
          reservationId: '00000000-0000-0000-0000-000000000002',
          minuteUsed: 3,
          dayUsed: 120,
          minuteLimit: 60,
          dayLimit: 5000,
          normalDayLimit: 4500,
        }
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
assert.equal(crossInstanceDuplicate.source, 'cache')
assert.equal(crossInstanceQuotaCalls, 1)
assert.equal(crossInstanceProviderCalls, 0)
assert.equal(crossInstanceApplyCalls, 0)

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
            reservationId: null,
            minuteUsed: 60,
            dayUsed: 4500,
            minuteLimit: 60,
            dayLimit: 5000,
            normalDayLimit: 4500,
          }
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

const migrationSql = await readFile(
  new URL(
    '../supabase/migrations/20260830131000_mightpulse_001b_player_intelligence_foundation.sql',
    import.meta.url,
  ),
  'utf8',
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
  /p_idempotency_key text default null/iu,
)
assert.match(
  migrationSql,
  /duplicate boolean/iu,
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
assert.ok(getPostSignInPlayerSyncInFlight('user-sign-in-sync'))
assert.equal(concurrentSignInFetchCalls, 1)
releasePostSignInSync()
assert.equal(await concurrentFirst, 'updated')
assert.equal(await concurrentSecond, 'updated')
assert.equal(concurrentSignInFetchCalls, 1)
assert.equal(getPostSignInPlayerSyncInFlight('user-sign-in-sync'), null)

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

assert.equal(
  await syncLinkedPlayerAfterSignIn(
    signInSession,
    async () => Response.json({
      status: 'success',
      code: 'NO_LINKED_PLAYER',
      data: null,
    }),
  ),
  'no-linked-player',
)
assert.equal(
  await syncLinkedPlayerAfterSignIn(
    signInSession,
    async () => new Response('provider unavailable', { status: 503 }),
  ),
  'unavailable',
)
assert.equal(
  await syncLinkedPlayerAfterSignIn(
    signInSession,
    async () => { throw new Error('synthetic network failure') },
  ),
  'unavailable',
)

console.log('MightPulse provider, avatar diagnostics, freshness, verified sign-in refresh, preservation and ownership-boundary tests passed.')
