import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { calculatePetUpgradePlan } from '../src/features/companion/pets/petPlanner.ts'

const root = process.cwd()

function loadCurve(filename, key) {
  const rawCurve = JSON.parse(readFileSync(resolve(root, `public/data/pets/${filename}`), 'utf8'))
  return {
    key,
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
}

const max50 = loadCurve('max-50.json', 'max-50')
assert.deepEqual(calculatePetUpgradePlan(max50, 1, 20), {
  currentLevel: 1,
  targetLevel: 20,
  levelsCrossed: 19,
  milestoneLevels: [10, 20],
  petFood: 4933,
  growthManual: 45,
  nutrientPotion: 0,
  promotionMedallion: 0,
})

assert.deepEqual(calculatePetUpgradePlan(max50, 20, 50), {
  currentLevel: 20,
  targetLevel: 50,
  levelsCrossed: 30,
  milestoneLevels: [30, 40, 50],
  petFood: 24100,
  growthManual: 195,
  nutrientPotion: 60,
  promotionMedallion: 10,
})

assert.deepEqual(calculatePetUpgradePlan(max50, 50, 50), {
  currentLevel: 50,
  targetLevel: 50,
  levelsCrossed: 0,
  milestoneLevels: [],
  petFood: 0,
  growthManual: 0,
  nutrientPotion: 0,
  promotionMedallion: 0,
})

const sanitised = calculatePetUpgradePlan(max50, -10, 999)
assert.equal(sanitised.currentLevel, 1)
assert.equal(sanitised.targetLevel, 50)
assert.equal(sanitised.petFood, 29033)

const max100 = loadCurve('max-100.json', 'max-100')
assert.deepEqual(calculatePetUpgradePlan(max100, 90, 100), {
  currentLevel: 90,
  targetLevel: 100,
  levelsCrossed: 10,
  milestoneLevels: [100],
  petFood: 212500,
  growthManual: 730,
  nutrientPotion: 135,
  promotionMedallion: 100,
})

const petPage = readFileSync(resolve(root, 'src/pages/PetCompanionPage.tsx'), 'utf8')
assert.match(petPage, /calculatePetUpgradePlan/u)
assert.match(petPage, /Upgrade cost planner/u)
assert.match(petPage, /Derived from the exact published rows crossed/u)
assert.match(petPage, /Totals only cover the selected level range/u)
assert.match(petPage, /Growth Manuals/u)
assert.match(petPage, /Nutrient Potions/u)
assert.match(petPage, /Promotion Medallions/u)
assert.match(petPage, /key=\{pet\.key\}/u, 'Planner must reset when navigating between pet detail routes.')

const petGuide = readFileSync(resolve(root, 'src/features/guides/articles/petSystem.tsx'), 'utf8')
assert.match(petGuide, /Pet Companion & Upgrade Planner/u)
assert.match(petGuide, /to: '\/companion\/pets'/u)
assert.match(petGuide, /<Link to="\/companion\/pets">Pet Companion & Upgrade Planner<\/Link>/u)

console.log('PETS-001B upgrade planner contracts passed: exact Lv.50/Lv.100 row-range maths, milestone materials, input sanitisation and guide-to-Companion integration verified.')
