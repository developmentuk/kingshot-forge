import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const readJson = (path) => JSON.parse(readFileSync(resolve(root, path), 'utf8'))
const meta = readJson('public/data/vip/meta.json')
const levels = readJson('public/data/vip/levels.json')
const schema = readJson('public/data/vip/schema.json')

assert.equal(meta._meta.datasetId, 'kingshot-vip')
assert.equal(meta._meta.schemaVersion, '1.0.0')
assert.equal(levels.length, 12)
assert.deepEqual(levels.map((row) => row.level), Array.from({ length: 12 }, (_, index) => index + 1))

const expectedXp = [0, 2500, 5000, 12500, 30000, 40000, 60000, 100000, 350000, 600000, 1200000, 2400000]
assert.deepEqual(levels.map((row) => row.xpToReach), expectedXp)
for (const row of levels) assert.equal(row.gemsEquivalent, row.xpToReach * 2, `VIP ${row.level} Gem equivalent must remain 2x VIP XP`)

for (const row of levels.slice(0, 6)) assert.equal(row.specialPack.heroShards.hero, 'Helga')
for (const row of levels.slice(6)) assert.equal(row.specialPack.heroShards.hero, 'Amadeus')
assert.equal(levels.slice(0, 6).reduce((sum, row) => sum + row.specialPack.heroShards.quantity, 0), 1055)
assert.equal(levels.slice(6).reduce((sum, row) => sum + row.specialPack.heroShards.quantity, 0), 975)

assert.equal(levels[7].specialPack.priceAmount, null, 'VIP 8 price must remain unresolved while source claims conflict')
const vip12Attack = levels[11].benefits.find((benefit) => benefit.key === 'squad_attack')
const vip12Health = levels[11].benefits.find((benefit) => benefit.key === 'squad_health')
assert.deepEqual([vip12Attack?.value, vip12Attack?.status], [null, 'conflicted'])
assert.deepEqual([vip12Health?.value, vip12Health?.status], [null, 'conflicted'])
assert.equal(levels[11].benefits.find((benefit) => benefit.key === 'squad_lethality')?.value, 16)

const issueIds = new Set(meta.verificationIssues.map((issue) => issue.id))
for (const id of ['vip8-special-pack-price', 'vip12-squad-attack-health', 'vip12-cumulative-xp-wording', 'amadeus-shard-aggregate']) assert(issueIds.has(id), `Missing verification issue ${id}`)

for (const level of [1, 2, 3, 4, 5]) {
  assert.equal(levels[level - 1].specialPack.savingPercent, null)
  assert.equal(levels[level - 1].specialPack.topupPoints, null)
}
for (const level of [7, 11, 12]) assert.equal(levels[level - 1].specialPack.topupPoints, null)

assert.deepEqual(schema.oneOf?.map((entry) => entry.$ref), ['#/$defs/metaDocument', '#/$defs/levelsDocument'])
assert.equal(schema.$defs?.vipLevel?.additionalProperties, false)
assert.equal(schema.$defs?.specialPack?.additionalProperties, false)
assert.deepEqual(schema.$defs?.levelsDocument?.prefixItems?.map((entry) => entry.allOf?.[1]?.properties?.level?.const), Array.from({ length: 12 }, (_, index) => index + 1))

console.log('VIP-001A contract passed: 12 governed levels, progression baseline, benefit/bundle/pack structure and explicit conflict containment verified.')
