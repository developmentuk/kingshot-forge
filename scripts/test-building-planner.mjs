import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const plannerModel = readFileSync('src/features/buildings/buildingPlanner.ts', 'utf8')
const plannerUi = readFileSync('src/features/buildings/BuildingPlanner.tsx', 'utf8')
const plannerPage = readFileSync('src/pages/BuildingCalculatorsPage.tsx', 'utf8')
const buildingsPage = readFileSync('src/pages/BuildingsBrowserPage.tsx', 'utf8')
const buildingData = readFileSync('src/features/buildings/buildingData.ts', 'utf8')
const app = readFileSync('src/App.tsx', 'utf8')
const navigation = readFileSync('src/navigation/workspaceRegistry.ts', 'utf8')

assert.match(plannerModel, /sortBuildingProgression\(progression\)/u, 'Planner must use canonical Buildings progression order')
assert.match(plannerModel, /rowKind !== 'base-state'/u, 'Base-state rows must not be counted as upgrades')
assert.match(plannerModel, /semantics\.rowKind === 'transition'/u, 'Level 30 transition rows must be modelled explicitly')
assert.match(plannerModel, /phase: 'transition'/u)
assert.match(plannerModel, /phase: 'truegold'/u)
assert.match(plannerModel, /model\.steps\.slice\(fromIndex \+ 1, toIndex \+ 1\)/u, 'Planner must total all steps after current through target')
assert.match(plannerModel, /raw\.baseTimeSeconds \/ \(1 \+ speed \/ 100\)/u, 'Construction-speed estimate formula is missing')
assert.match(plannerModel, /Math\.ceil\(raw\.bread \* basicResourceMultiplier\)/u)
assert.match(plannerModel, /Math\.ceil\(raw\.wood \* basicResourceMultiplier\)/u)
assert.match(plannerModel, /Math\.ceil\(raw\.stone \* basicResourceMultiplier\)/u)
assert.match(plannerModel, /Math\.ceil\(raw\.iron \* basicResourceMultiplier\)/u)
assert.match(plannerModel, /truegold: raw\.truegold/u, 'Truegold must not receive the basic-resource reduction')
assert.match(plannerModel, /temperedTruegold: raw\.temperedTruegold/u, 'Tempered Truegold must not receive the basic-resource reduction')
assert.match(plannerModel, /targetPower - currentPower/u, 'Power gain must be cumulative target minus current, not a sum')
assert.match(plannerModel, /missingPowerCoverage/u, 'Incomplete power coverage must remain visible')

for (const token of [
  'Construction speed bonus',
  'Basic resource reduction',
  'Resources required',
  'Published base time',
  'Estimated time with bonus',
  'Known power gain',
  'Show per-step breakdown',
  'Prerequisites',
  'Transition steps between Level 30 and TG1 are included',
]) {
  assert.match(plannerUi, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'u'), `Planner UI is missing ${token}`)
}

assert.match(plannerPage, /fetchDataset\('buildings'/u, 'Standalone planner must consume the published Buildings projection')
assert.match(plannerPage, /normaliseBuildings\(result\.records\)/u)
assert.match(plannerPage, /searchParams\.get\('building'\)/u, 'Building pages must be able to preselect the standalone planner')
assert.match(buildingsPage, /<BuildingPlanner buildings=\{buildings\} initialBuildingKey=\{building\.key\} embedded/u)
assert.match(buildingsPage, /\/calculators\/buildings\?building=\$\{building\.key\}/u)
assert.match(buildingsPage, /Open Building Planner/u)
assert.match(buildingsPage, /Buildings compendium/u)
assert.match(buildingsPage, /Plan upgrades/u)
assert.match(buildingsPage, /Use the calculator above for totals/u)
assert.match(buildingData, /normaliseBuildings/u, 'Pages and planner must share one canonical normaliser')
assert.match(app, /path="calculators\/buildings"/u)
assert.match(navigation, /label: 'Building Planner'/u)
assert.match(navigation, /path: '\/calculators\/buildings'/u)

console.log('Building Planner calculation, published-data and contextual-link contracts passed.')
