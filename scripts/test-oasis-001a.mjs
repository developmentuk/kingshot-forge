import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { loadSourceStagedOasisIslandDataset } from '../server/data-engine/loadSourceStagedOasisIslandDataset.ts'
import { normaliseOasisBuildings } from '../src/features/oasis-island/oasisIslandData.ts'

const root = process.cwd()
const sourcePath = resolve(root, 'server/data-engine/sources/kingshot_oasis_island_buildings.json')
const imagePath = resolve(root, 'public/assets/oasis-island')
const source = JSON.parse(readFileSync(sourcePath, 'utf8'))
const images = readdirSync(imagePath).filter((file) => file.toLowerCase().endsWith('.png'))

assert.equal(source._meta?.dataset, 'kingshot-oasis-island-buildings')
assert.equal(source.buildings?.length, 55)
assert.equal(images.length, 111)
assert.equal(source.imageInventory?.length, 111)
assert.equal(source._meta?.coverage?.mappedPngAssets, 111)

const app = readFileSync(resolve(root, 'src/App.tsx'), 'utf8')
const page = readFileSync(resolve(root, 'src/features/oasis-island/OasisIslandPage.tsx'), 'utf8')
const loader = readFileSync(resolve(root, 'server/data-engine/loadSourceStagedOasisIslandDataset.ts'), 'utf8')
assert.match(app, /path="oasis-island"/u)
assert.match(app, /path="oasis-island\/buildings\/:buildingId"/u)
assert.doesNotMatch(page, /fetchPublishedDataset\('oasis-island'/u)
assert.match(page, /Oasis Island is not published yet/u)
assert.match(page, /island-chest-route-optimizer/u)
assert.match(loader, /source-staging; not a Supabase publication/u)
assert.match(readFileSync(resolve(root, 'shared/data-engine/datasets.ts'), 'utf8'), /'items',\s*\] as const/u)

const staged = await loadSourceStagedOasisIslandDataset()
const projected = normaliseOasisBuildings(staged)
assert.equal(projected.length, source.buildings.length)

const byId = new Map(projected.map((record) => [record.id, record]))
const sourceFields = ['id', 'name', 'aliases', 'recordType', 'availabilityCategory', 'rarity', 'footprint', 'typeLimit', 'maxLevel', 'function', 'levels', 'maxEffects', 'maxProsperity', 'unlock', 'upgradeMechanic', 'images']
for (const sourceRecord of source.buildings) {
  const record = byId.get(sourceRecord.id)
  assert.ok(record, `Missing staged record: ${sourceRecord.id}`)
  for (const field of sourceFields) {
    assert.deepEqual(record[field], sourceRecord[field], `${sourceRecord.id}.${field} changed during staging`)
  }
  const expectedImages = (sourceRecord.images?.files ?? []).map((file) => `/assets/oasis-island/${encodeURIComponent(file)}`)
  assert.deepEqual(record.imageUrls, expectedImages, `${sourceRecord.id}.imageUrls mapping changed`)
  assert.deepEqual(record.images, sourceRecord.images, `${sourceRecord.id}.rich image metadata changed`)
  assert.deepEqual(record.imageVariantUrls, Object.fromEntries(Object.entries(sourceRecord.images?.levelVariants ?? {}).map(([level, files]) => [level, (Array.isArray(files) ? files : [files]).map((file) => `/assets/oasis-island/${encodeURIComponent(file)}`)])), `${sourceRecord.id}.level image variants changed`)
  assert.deepEqual(record.verification?.history, sourceRecord.verification ?? null, `${sourceRecord.id}.raw verification history changed`)
}

assert.equal(projected.find((record) => record.id === 'amphitheater').footprint.display, '3x3')
assert.equal(projected.find((record) => record.id === 'braveshrine').footprint.display, '4x4')
assert.equal(projected.find((record) => record.id === 'construction-hut').footprint.display, '3x3')
assert.equal(projected.find((record) => record.id === 'dinosaur-fossils').footprint, null)
assert.equal(projected.find((record) => record.id === 'dinosaur-fossils').imageUrls.length, 1)

const sleeping = byId.get('sleeping-drakethrone')
assert.equal(sleeping.levels.length, 10)
assert.equal(sleeping.levels[0].buffs.length, 4)
assert.deepEqual(sleeping.levels[0].buffs.map((buff) => buff.valuePct), [2, 2, 2, 2])
assert.deepEqual(sleeping.levels[9].buffs.map((buff) => buff.valuePct), [20, 20, 20, 20])
assert.equal(sleeping.maxProsperity, 50000)
assert.match(sleeping.imageUrls[0], /Sleeping%20Drakethrone/u)

const court = byId.get('court-of-knowledge')
assert.equal(court.levels.length, 20)
assert.equal(court.levels[19].buffs[0].label, 'Squads Attack')
assert.equal(court.levels[19].prosperity, 20000)

const constructionHut = byId.get('construction-hut')
assert.equal(constructionHut.levels[4].buffs[0].label, 'Construction Speed')
assert.equal(constructionHut.levels[4].buffs[0].valuePct, 6)
assert.equal(constructionHut.levels[4].prosperity, 2500)

const passing = byId.get('passing-of-the-sword')
assert.deepEqual(passing.levels[0].buffs.map((buff) => buff.label), ['Squads Defence', 'Squads Attack'])

const fountain = byId.get('fountain-of-life')
assert.equal(fountain.levels[7].buffsUnlocked[0].valuePct, 40)
assert.equal(fountain.levels[7].buffsUnlocked[0].effect, 'replaces_previous_10pct')

const oasisSpring = byId.get('oasis-spring')
assert.deepEqual(oasisSpring.levels.map((level) => level.buffs[0].valuePct), [0.6, 1.6, 2.4, 3.2, 4])

const dinosaurFossils = byId.get('dinosaur-fossils')
assert.equal(dinosaurFossils.maxEffects[0].label, 'Training Speed')
assert.equal(dinosaurFossils.maxEffects[0].valuePct, 15)
assert.equal(projected.find((record) => record.id === 'construction-hut').imageUrls.length, 0)
assert.equal(projected.find((record) => record.id === 'construction-hut').images.missing, true)

console.log(`OASIS-001A contract passed: ${source.buildings.length} records, ${images.length} PNG assets, source-to-public fidelity and named record regressions verified.`)
