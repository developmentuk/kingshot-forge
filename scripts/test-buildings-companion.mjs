import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const page = readFileSync('src/pages/BuildingsBrowserPage.tsx', 'utf8')
const illustration = readFileSync('src/components/buildings/BuildingIllustration.tsx', 'utf8')
const styles = readFileSync('src/styles/buildingsBrowser.css', 'utf8')
const loader = readFileSync('server/data-engine/loadPublishedBuildingsDataset.ts', 'utf8')
const contract = readFileSync('shared/data-pipeline/buildingsContract.ts', 'utf8')

for (const buildingKey of [
  'academy',
  'barracks',
  'command-center',
  'embassy',
  'infirmary',
  'range',
  'stable',
  'storehouse',
  'town-center',
  'war-academy',
]) {
  assert.match(illustration, new RegExp(`case '${buildingKey}'`, 'u'), `Missing original Forge illustration for ${buildingKey}`)
}

assert.match(illustration, /original Kingshot Forge companion illustration/u)
assert.match(illustration, /role=\{decorative \? undefined : 'img'\}/u)
assert.match(illustration, /aria-hidden=\{decorative \? true : undefined\}/u)

for (const field of [
  'max_hero_level',
  'training_capacity',
  'training_speed_percent',
  'rally_capacity',
  'troop_deploy_capacity',
  'reinforcement_capacity',
  'ally_help_count',
]) {
  assert.match(page, new RegExp(field, 'u'), `Published Buildings effect ${field} is not exposed by the companion page`)
}

assert.match(page, /BuildingIllustration/u)
assert.match(page, /Standard levels/u)
assert.match(page, /Truegold stages/u)
assert.match(page, /Tempered Truegold/u)
assert.match(page, /Raw base values/u)
assert.match(page, /Missing effects are not guessed/u)
assert.match(page, /owner-approved Buildings publication/u)
assert.match(page, /Open source reference/u)
assert.match(page, /original Kingshot Forge companion illustration/u)
assert.match(page, /fetchDataset\('buildings'/u)
assert.doesNotMatch(page, /from\(['"](?:\.\.\/)*lib\/supabase/u)

assert.match(styles, /\.building-card__image/u)
assert.match(styles, /\.building-detail-hero__art/u)
assert.match(styles, /\.building-overview-grid/u)
assert.match(styles, /\.building-phase-tabs/u)
assert.match(styles, /@media \(max-width: 560px\)/u)

assert.match(loader, /eq\('status', 'published'\)/u)
assert.match(loader, /eq\('is_current', true\)/u)
assert.match(loader, /sortBuildingProgression/u)
assert.match(contract, /max_hero_level/u)
assert.match(contract, /training_capacity/u)
assert.match(contract, /reinforcement_capacity/u)

console.log('Buildings Companion completion contracts passed.')
