import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { calculatePetUpgradePlan } from '../src/features/companion/pets/petPlanner.ts'

const root = process.cwd()
const rawCurve = JSON.parse(readFileSync(resolve(root, 'public/data/pets/max-50.json'), 'utf8'))
const curve = {
  key: 'max-50',
  maxLevel: rawCurve.max,
  sourceRepresentative: rawCurve.rep,
  levelProgression: rawCurve.rows.map(([level, petFood, growthManual, nutrientPotion, promotionMedallion]) => ({
    level,
    petFood,
    growthManual,
    nutrientPotion,
    promotionMedallion,
  })),
  advancementMilestones: rawCurve.rows
    .filter(([level]) => level % 10 === 0)
    .map(([level, petFood, growthManual, nutrientPotion, promotionMedallion]) => ({
      level,
      petFood,
      growthManual,
      nutrientPotion,
      promotionMedallion,
    })),
}

assert.deepEqual(calculatePetUpgradePlan(curve, 1, 20), {
  currentLevel: 1,
  targetLevel: 20,
  levelsCrossed: 19,
  milestoneLevels: [10, 20],
  petFood: 4933,
  growthManual: 45,
  nutrientPotion: 0,
  promotionMedallion: 0,
})

assert.deepEqual(calculatePetUpgradePlan(curve, 20, 50), {
  currentLevel: 20,
  targetLevel: 50,
  levelsCrossed: 30,
  milestoneLevels: [30, 40, 50],
  petFood: 24100,
  growthManual: 195,
  nutrientPotion: 60,
  promotionMedallion: 10,
})

assert.deepEqual(calculatePetUpgradePlan(curve, 50, 50), {
  currentLevel: 50,
  targetLevel: 50,
  levelsCrossed: 0,
  milestoneLevels: [],
  petFood: 0,
  growthManual: 0,
  nutrientPotion: 0,
  promotionMedallion: 0,
})

const sanitised = calculatePetUpgradePlan(curve, -10, 999)
assert.equal(sanitised.currentLevel, 1)
assert.equal(sanitised.targetLevel, 50)
assert.equal(sanitised.petFood, 29033)

const petPage = readFileSync(resolve(root, 'src/pages/PetCompanionPage.tsx'), 'utf8')
assert.match(petPage, /calculatePetUpgradePlan/u)
assert.match(petPage, /Upgrade cost planner/u)
assert.match(petPage, /Derived from the exact published rows crossed/u)
assert.match(petPage, /Growth Manuals/u)
assert.match(petPage, /Nutrient Potions/u)
assert.match(petPage, /Promotion Medallions/u)
assert.match(petPage, /key=\{pet\.key\}/u, 'Planner must reset when navigating between pet detail routes.')
assert.doesNotMatch(petPage, /extrapolat/iu, 'Planner UI should not suggest extrapolated pet costs.')

console.log('PETS-001B upgrade planner contracts passed: exact row-range maths, milestone materials, input sanitisation and Companion integration verified.')
