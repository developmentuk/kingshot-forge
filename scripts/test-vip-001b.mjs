import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseVipGuideData } from '../src/features/guides/vipGuideData.ts'
import { calculateVipPlan } from '../src/features/guides/vipPlanner.ts'

const root = process.cwd()
const readJson = (path) => JSON.parse(readFileSync(resolve(root, path), 'utf8'))
const readText = (path) => readFileSync(resolve(root, path), 'utf8')

const levelsSource = readJson('public/data/vip/levels.json')
const metaSource = readJson('public/data/vip/meta.json')
const data = parseVipGuideData(levelsSource, metaSource)

assert.equal(data.levels.length, 12)
assert.equal(data.meta._meta.datasetId, 'kingshot-vip')
assert.equal(data.meta.verificationIssues.length, 4)

const fullPlan = calculateVipPlan(data.levels, 1, 12)
assert.deepEqual(fullPlan.levelsCrossed, [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
assert.equal(fullPlan.requiredVipXp, 4_800_000)
assert.equal(fullPlan.gemEquivalent, 9_600_000)

const midPlan = calculateVipPlan(data.levels, 8, 10)
assert.deepEqual(midPlan.levelsCrossed, [9, 10])
assert.equal(midPlan.requiredVipXp, 950_000)
assert.equal(midPlan.gemEquivalent, 1_900_000)
assert(midPlan.benefitChanges.some((change) => change.key === 'squad_attack' && change.toValue === 12))
assert(midPlan.benefitChanges.some((change) => change.key === 'construction_speed' && change.fromValue === 10 && change.toValue === 20))

const sameOrLower = calculateVipPlan(data.levels, 10, 8)
assert.equal(sameOrLower.requiredVipXp, 0)
assert.equal(sameOrLower.gemEquivalent, 0)
assert.deepEqual(sameOrLower.levelsCrossed, [])
assert.deepEqual(sameOrLower.benefitChanges, [])

const vip12Plan = calculateVipPlan(data.levels, 11, 12)
assert(vip12Plan.benefitChanges.some((change) => change.key === 'squad_attack' && change.status === 'conflicted' && change.toValue === null))
assert(vip12Plan.benefitChanges.some((change) => change.key === 'squad_health' && change.status === 'conflicted' && change.toValue === null))

const vip8PriceMutation = structuredClone(levelsSource)
vip8PriceMutation[7].specialPack.priceAmount = 49.99
assert.throws(() => parseVipGuideData(vip8PriceMutation, metaSource), /VIP 8 special pack price must remain unresolved/)

const vip12AttackMutation = structuredClone(levelsSource)
const attack = vip12AttackMutation[11].benefits.find((benefit) => benefit.key === 'squad_attack')
attack.status = 'source_supported'
attack.value = 16
assert.throws(() => parseVipGuideData(vip12AttackMutation, metaSource), /VIP 12 Squad Attack must remain null\/conflicted/)

const bundleQuantityMutation = structuredClone(levelsSource)
bundleQuantityMutation[0].dailyFreeBundle[0].quantity = 0
assert.throws(() => parseVipGuideData(bundleQuantityMutation, metaSource), /must be a positive integer/)

const bundleRarityMutation = structuredClone(levelsSource)
bundleRarityMutation[11].dailyFreeBundle[0].rarity = 'legendary'
assert.throws(() => parseVipGuideData(bundleRarityMutation, metaSource), /rarity is invalid/)

const trustMutation = structuredClone(metaSource)
trustMutation._meta.trust.cumulativeVipXp = 'published'
assert.throws(() => parseVipGuideData(levelsSource, trustMutation), /not_published_pending_reconciliation/)

const article = readText('src/features/guides/articles/vipProgression.tsx')
const panel = readText('src/features/guides/VipPlannerPanel.tsx')
assert(article.includes('VipPlannerPanel'), 'Existing VIP guide must embed the upgraded planner.')
assert(article.includes('derived sum of the published per-level requirements'), 'VIP guide must disclose derived-total semantics.')
assert(!article.includes('does not contain a VIP benefits'), 'Obsolete no-benefits copy must not survive VIP-001B.')
assert(panel.includes("'/data/vip/levels.json'"), 'Planner must load governed VIP levels at runtime.')
assert(panel.includes("'/data/vip/meta.json'"), 'Planner must load governed VIP metadata at runtime.')
assert(panel.includes('currency not stated'), 'Planner must not infer Special Pack currency.')

console.log('VIP-001B guide and planner contracts passed: governed runtime parsing, derived progression maths, benefit comparison and conflict containment verified.')
