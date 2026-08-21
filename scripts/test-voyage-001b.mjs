import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parseVoyageGuideData } from '../src/features/guides/voyageGuideData.ts'
import { calculateVoyagePlan } from '../src/features/guides/voyagePlanner.ts'

const root = process.cwd()
const readText = (path) => readFileSync(resolve(root, path), 'utf8')
const readJson = (path) => JSON.parse(readText(path))
const guidePage = readText('src/pages/VoyageOfLightGuidePage.tsx')
const guideRouter = readText('src/features/guides/GuideArticlePage.tsx')
const guidesHub = readText('src/pages/GuidesHubPage.tsx')
const eventDocument = readJson('public/data/voyage-of-light/event.json')
const metaDocument = readJson('public/data/voyage-of-light/meta.json')
const strategyDocument = readJson('public/data/voyage-of-light/strategy.json')

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

const parsed = parseVoyageGuideData(eventDocument, metaDocument, strategyDocument)
assert.equal(parsed.event.eventKey, 'voyage-of-light')
assert.equal(parsed.event.teams.length, 4)
assert.deepEqual(parsed.event.milestones.map((row) => row.voyages), [1, 5, 20, 60, 120, 200, 350])
assert.equal(parsed.strategy.confidence, 'community_guidance')

function expectParserRejection(mutate) {
  const eventValue = structuredClone(eventDocument)
  const metaValue = structuredClone(metaDocument)
  const strategyValue = structuredClone(strategyDocument)
  mutate({ eventValue, metaValue, strategyValue })
  assert.throws(() => parseVoyageGuideData(eventValue, metaValue, strategyValue))
}

expectParserRejection(({ eventValue }) => { eventValue.teams[1].unlock.amount = '2000' })
expectParserRejection(({ eventValue }) => { eventValue.milestones[3].rewards[0].quantity = '2' })
expectParserRejection(({ eventValue }) => { eventValue.treasureTiers[0] = null })
expectParserRejection(({ eventValue }) => { eventValue.mergeRules[1].outcome = { kind: 'fixed', to: 'majestic' } })
expectParserRejection(({ metaValue }) => { metaValue.verificationIssues[0].summary = null })
expectParserRejection(({ strategyValue }) => { strategyValue.playerProfiles[0].guidance = [42] })

for (const path of [
  '/data/voyage-of-light/event.json',
  '/data/voyage-of-light/meta.json',
  '/data/voyage-of-light/strategy.json',
]) assert(guidePage.includes(path), `Voyage guide must load governed public source ${path}`)

assert(guidePage.includes('parseVoyageGuideData'), 'Player page must use the shared fail-closed Voyage parser')
assert(!guidePage.includes('75%'), 'Player-facing guide must not publish the disputed Premium merge probability')
assert(guidePage.includes('idealised planning estimate'), 'Planner must disclose its timing assumption')
assert(guideRouter.includes("guideSlug === 'kingshot-voyage-of-light-guide'"), 'Generic guide route must resolve the Voyage guide')
assert(guidesHub.includes("path: '/guides/kingshot-voyage-of-light-guide'"), 'Guides hub must publish the Voyage guide')
assert(guidesHub.includes('guideCatalogue'), 'Guide search and counts must include the Voyage guide')

console.log('VOYAGE-001B player guide and planner contracts passed: planner maths, source routing, nested fail-closed runtime validation, conflict containment and guide discovery verified.')
