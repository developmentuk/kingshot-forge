import assert from 'node:assert/strict'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const dataRoot = resolve(root, 'public/data/pets')
const spritePath = resolve(root, 'public/media/pets/pets-sprite.webp')
const curveKeys = ['max-50', 'max-60', 'max-70', 'max-80', 'max-100']
const expectedMax = new Map([
  ['max-50', 50],
  ['max-60', 60],
  ['max-70', 70],
  ['max-80', 80],
  ['max-100', 100],
])

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

for (const filename of ['meta.json', 'pets.json', 'schema.json', ...curveKeys.map((key) => `${key}.json`)]) {
  assert.equal(existsSync(resolve(dataRoot, filename)), true, `Missing PETS-001A data file: ${filename}`)
}
assert.equal(existsSync(spritePath), true, 'Missing governed PETS-001A sprite')
assert.ok(statSync(spritePath).size > 0, 'Pet sprite must not be empty')
const spriteHeader = readFileSync(spritePath).subarray(0, 12)
assert.equal(spriteHeader.subarray(0, 4).toString('ascii'), 'RIFF', 'Pet sprite must be a RIFF WebP')
assert.equal(spriteHeader.subarray(8, 12).toString('ascii'), 'WEBP', 'Pet sprite must be a WebP')

const metaDocument = readJson(resolve(dataRoot, 'meta.json'))
const meta = metaDocument._meta
assert.equal(meta.schemaVersion, '1.0.0')
assert.equal(meta.datasetId, 'kingshot-pets')
assert.equal(meta.coverage.petCount, 14)
assert.deepEqual(meta.coverage.generations, [1, 2, 3, 4, 5, 6, 7])
assert.equal(meta.coverage.minMaxLevel, 50)
assert.equal(meta.coverage.maxMaxLevel, 100)
assert.equal(meta.media.available, 13)
assert.deepEqual(meta.media.pending, ['Ironclad War Bear'])
assert.match(meta.media.rightsStatement, /cleared for Kingshot Forge use/u)
assert.deepEqual(Object.keys(metaDocument.curveFiles), curveKeys)
for (const key of curveKeys) assert.equal(metaDocument.curveFiles[key], `/data/pets/${key}.json`)
assert.equal(metaDocument.refinement.confidence, 'community_guidance')
assert.equal(metaDocument.strategy.confidence, 'community_guidance')

const schema = readJson(resolve(dataRoot, 'schema.json'))
assert.equal(schema.$id, 'https://ksforge.app/data/pets/schema.json')
assert.equal(schema.$defs?.pet?.additionalProperties, false)
assert.equal(schema.$defs?.media?.additionalProperties, false)
assert.deepEqual(schema.$defs?.pet?.properties?.curve?.enum, curveKeys)

const pets = readJson(resolve(dataRoot, 'pets.json'))
assert.equal(pets.length, 14)
assert.equal(new Set(pets.map((pet) => pet.key)).size, 14, 'Pet keys must be unique')
assert.equal(new Set(pets.map((pet) => pet.name)).size, 14, 'Pet names must be unique')
assert.deepEqual([...new Set(pets.map((pet) => pet.gen))].sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7])

const spriteCoordinates = new Set()
const pendingPets = []
for (const pet of pets) {
  assert.match(pet.key, /^[a-z0-9-]+$/u)
  assert.ok(Number.isInteger(pet.gen) && pet.gen >= 1 && pet.gen <= 7)
  assert.ok([50, 60, 70, 80, 100].includes(pet.max))
  assert.equal(pet.curve, `max-${pet.max}`)
  assert.equal(pet.unlock.length, 3)
  assert.equal(pet.unlock[2], 'community_observation')
  assert.equal(pet.skill.progression.length, pet.max / 10)
  assert.deepEqual(pet.skill.progression.map((row) => row[0]), Array.from({ length: pet.max / 10 }, (_, index) => index + 1))

  if (pet.media.status === 'available') {
    assert.equal(pet.media.path, '/media/pets/pets-sprite.webp')
    assert.equal(pet.media.filename, 'pets-sprite.webp')
    assert.match(pet.media.originalFilename, /\.png$/u)
    assert.match(pet.media.rights, /cleared for Kingshot Forge use/u)
    assert.equal(pet.media.sprite.length, 2)
    const [column, row] = pet.media.sprite
    assert.ok(Number.isInteger(column) && column >= 0 && column <= 3)
    assert.ok(Number.isInteger(row) && row >= 0 && row <= 3)
    const coordinate = `${column},${row}`
    assert.equal(spriteCoordinates.has(coordinate), false, `Duplicate pet sprite coordinate: ${coordinate}`)
    spriteCoordinates.add(coordinate)
  } else {
    pendingPets.push(pet.name)
    assert.equal(pet.media.status, 'pending')
    assert.equal(pet.media.path, null)
    assert.equal(pet.media.filename, null)
    assert.equal(pet.media.originalFilename, null)
    assert.equal(pet.media.rights, null)
    assert.equal(pet.media.sprite, null)
  }
}
assert.equal(spriteCoordinates.size, 13)
assert.deepEqual(pendingPets, ['Ironclad War Bear'])

for (const key of curveKeys) {
  const curve = readJson(resolve(dataRoot, `${key}.json`))
  const max = expectedMax.get(key)
  assert.equal(curve.max, max)
  assert.equal(curve.rows.length, max - 1, `${key} must include every level from 2 through ${max}`)
  assert.equal(typeof curve.rep, 'string')
  assert.ok(curve.rep.length > 0)
  curve.rows.forEach((row, index) => {
    assert.equal(row.length, 5)
    assert.equal(row[0], index + 2)
    assert.ok(Number.isInteger(row[1]) && row[1] >= 0)
    for (const value of row.slice(2)) assert.ok(value === null || (Number.isInteger(value) && value >= 0))
  })
  const milestones = curve.rows.filter((row) => row[0] % 10 === 0)
  assert.equal(milestones.length, max / 10)
  assert.equal(milestones.at(-1)?.[0], max)
}

const max50 = readJson(resolve(dataRoot, 'max-50.json'))
assert.deepEqual(max50.rows[8], [10, 235, 15, null, null])
assert.deepEqual(max50.rows.at(-1), [50, 1320, 90, 30, 10])

const app = readFileSync(resolve(root, 'src/App.tsx'), 'utf8')
const companionIndex = readFileSync(resolve(root, 'src/pages/CompanionIndexPage.tsx'), 'utf8')
const petPage = readFileSync(resolve(root, 'src/pages/PetCompanionPage.tsx'), 'utf8')
const petLoader = readFileSync(resolve(root, 'src/features/companion/pets/petData.ts'), 'utf8')
assert.match(app, /import PetCompanionPage from "\.\/pages\/PetCompanionPage"/u)
assert.match(app, /path="companion\/pets" element={<PetCompanionPage \/>}/u)
assert.match(app, /path="companion\/pets\/:petKey" element={<PetCompanionPage \/>}/u)
assert.match(companionIndex, /to="\/companion\/pets"/u)
assert.match(companionIndex, />Pet Companion</u)
assert.doesNotMatch(petPage, /fetch\('\/data\/pets\.json'\)/u)
assert.match(petPage, /loadPetDataset\(\)/u)
assert.match(petPage, /pet-companion-art__sprite/u)
assert.match(petLoader, /\/data\/pets\/meta\.json/u)
assert.match(petLoader, /\/data\/pets\/pets\.json/u)
assert.match(petLoader, /expected 13 available artworks and Ironclad War Bear as the only pending artwork/u)

console.log('PETS-001A contract passed: 14 pets, 5 exact progression curves, 13 governed sprite artworks, 1 explicit pending artwork, strict runtime loading, routes and Companion navigation verified.')
