import assert from 'node:assert/strict'
import {
  isPlayerIdentityAutoRefreshRoute,
  PLAYER_IDENTITY_REFRESH_COOLDOWN_MS,
  PlayerIdentityRefreshCoordinator,
} from '../src/context/playerIdentityRefreshPolicy.ts'

assert.equal(isPlayerIdentityAutoRefreshRoute('/admin/datasets'), false)
assert.equal(isPlayerIdentityAutoRefreshRoute('/admin/data/items'), false)
assert.equal(isPlayerIdentityAutoRefreshRoute('/companion/items/mithril'), false)
assert.equal(isPlayerIdentityAutoRefreshRoute('/my-forge'), true)
assert.equal(isPlayerIdentityAutoRefreshRoute('/my-forge/progression'), true)
assert.equal(isPlayerIdentityAutoRefreshRoute('/alliances/850/manage'), true)
assert.equal(isPlayerIdentityAutoRefreshRoute('/transfer-profile'), true)

const coordinator = new PlayerIdentityRefreshCoordinator()
const userId = 'user-1'
let calls = 0
let release
const first = coordinator.run(userId, 'automatic', async () => {
  calls += 1
  await new Promise((resolve) => { release = resolve })
}, 1_000)
const second = coordinator.run(userId, 'automatic', async () => { calls += 1 }, 1_000)
assert.equal(calls, 1)
release()
assert.equal(await first, true)
assert.equal(await second, true)
assert.equal(calls, 1)

const failing = new PlayerIdentityRefreshCoordinator()
let attempts = 0
const failure = Object.assign(new Error('provider unavailable'), { statusCode: 503 })
await failing.run(userId, 'automatic', async () => {
  attempts += 1
  throw failure
}, 2_000).catch((error) => assert.equal(error, failure))
assert.equal(attempts, 1)
assert.equal(failing.isCoolingDown(userId, 2_000), true)
assert.equal(await failing.run(userId, 'automatic', async () => { attempts += 1 }, 2_000 + PLAYER_IDENTITY_REFRESH_COOLDOWN_MS - 1), false)
assert.equal(await failing.run(userId, 'automatic', async () => { attempts += 1 }, 2_000 + PLAYER_IDENTITY_REFRESH_COOLDOWN_MS), true)
assert.equal(attempts, 2)

const manual = new PlayerIdentityRefreshCoordinator()
await manual.run(userId, 'automatic', async () => { throw failure }, 3_000).catch(() => undefined)
assert.equal(await manual.run(userId, 'manual', async () => { attempts += 1 }, 3_001), true)
manual.markSuccess(userId)
assert.equal(manual.isCoolingDown(userId, 3_002), false)

const rateLimited = new PlayerIdentityRefreshCoordinator()
const rateLimitFailure = Object.assign(new Error('provider rate limited'), { statusCode: 429 })
await rateLimited.run(userId, 'automatic', async () => { throw rateLimitFailure }, 4_000).catch(() => undefined)
assert.equal(rateLimited.isCoolingDown(userId, 4_001), true)

console.log('Player identity resilience policy tests passed.')
