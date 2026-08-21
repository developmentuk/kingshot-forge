import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { calculateVoyagePlan } from '../src/features/guides/voyagePlanner.ts'

const root = process.cwd()
const readText = (path) => readFileSync(resolve(root, path), 'utf8')
const guidePage = readText('src/pages/VoyageOfLightGuidePage.tsx')
const guideRouter = readText('src/features/guides/GuideArticlePage.tsx')
const guidesHub = readText('src/pages/GuidesHubPage.tsx')

assert.deepEqual(calculateVoyagePlan({
  currentVoyages: 0,
  targetVoyages: 60,
  activeTeams: 1,
  compasses: 0,
}), {
  remainingVoyages: 60,
  dispatchRounds: 60,
  baselineHours: 480,
  compassHoursAvailable: 0,
  fullyAcceleratedVoyages: 0,
  partialVoyageHoursReduced: 0,
  compassesForImmediateCompletion: 480,
})

assert.deepEqual(calculateVoyagePlan({
  currentVoyages: 20,
  targetVoyages: 60,
  activeTeams: 4,
  compasses: 10,
}), {
  remainingVoyages: 40,
  dispatchRounds: 10,
  baselineHours: 80,
  compassHoursAvailable: 10,
  fullyAcceleratedVoyages: 1,
  partialVoyageHoursReduced: 2,
  compassesForImmediateCompletion: 320,
})

assert.deepEqual(calculateVoyagePlan({
  currentVoyages: 120,
  targetVoyages: 60,
  activeTeams: 9,
  compasses: 9999,
}), {
  remainingVoyages: 0,
  dispatchRounds: 0,
  baselineHours: 0,
  compassHoursAvailable: 0,
  fullyAcceleratedVoyages: 0,
  partialVoyageHoursReduced: 0,
  compassesForImmediateCompletion: 0,
})

const sanitised = calculateVoyagePlan({ currentVoyages: -5, targetVoyages: 5.9, activeTeams: 0, compasses: -20 })
assert.equal(sanitised.remainingVoyages, 5)
assert.equal(sanitised.dispatchRounds, 5)
assert.equal(sanitised.baselineHours, 40)

for (const path of [
  '/data/voyage-of-light/event.json',
  '/data/voyage-of-light/meta.json',
  '/data/voyage-of-light/strategy.json',
]) assert(guidePage.includes(path), `Voyage guide must load governed public source ${path}`)

assert(guidePage.includes("premiumRule.status !== 'conflicted' || premiumRule.outcome !== null"), 'Player loader must fail closed if the Premium merge outcome is canonicalised')
assert(guidePage.includes("strategyValue.confidence !== 'community_guidance'"), 'Player loader must enforce strategy trust classification')
assert(!guidePage.includes('75%'), 'Player-facing guide must not publish the disputed Premium merge probability')
assert(guidePage.includes('idealised planning estimate'), 'Planner must disclose its timing assumption')
assert(guideRouter.includes("guideSlug === 'kingshot-voyage-of-light-guide'"), 'Generic guide route must resolve the Voyage guide')
assert(guidesHub.includes("path: '/guides/kingshot-voyage-of-light-guide'"), 'Guides hub must publish the Voyage guide')
assert(guidesHub.includes('guideCatalogue'), 'Guide search and counts must include the Voyage guide')

console.log('VOYAGE-001B player guide and planner contracts passed.')
