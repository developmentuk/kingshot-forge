import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import {
  buildLaunchTiming,
  createEmptyMarchTimeProfile,
  formatMarchDuration,
  parseMarchDuration,
  resolveMarchTime,
} from '../src/features/castle-command/castleCommandDomain.ts'
import { getHowlerDefinition } from '../src/features/castle-command/howlerData.ts'
import { loadPetDataset } from '../src/features/companion/pets/petData.ts'

function testDurationParsing() {
  assert.equal(parseMarchDuration('1:05'), 65)
  assert.equal(parseMarchDuration('0:45'), 45)
  assert.equal(parseMarchDuration('1:02:03'), 3723)
  assert.equal(parseMarchDuration('75'), 75)
  assert.equal(parseMarchDuration('1:60'), null)
  assert.equal(parseMarchDuration('bad'), null)
  assert.equal(formatMarchDuration(65), '1:05')
  assert.equal(formatMarchDuration(3723), '1:02:03')
}

function testObservationLedHowlerResolution() {
  const profile = createEmptyMarchTimeProfile()
  profile.castle.normalSeconds = 70

  const fallback = resolveMarchTime(profile.castle, true)
  assert.deepEqual(fallback, {
    seconds: 70,
    source: 'normal-fallback',
    needsHowlerCalibration: true,
  })

  profile.castle.howlerSeconds = 57
  const observed = resolveMarchTime(profile.castle, true)
  assert.deepEqual(observed, {
    seconds: 57,
    source: 'howler-observed',
    needsHowlerCalibration: false,
  })

  const normal = resolveMarchTime(profile.castle, false)
  assert.deepEqual(normal, {
    seconds: 70,
    source: 'normal',
    needsHowlerCalibration: false,
  })
}

function testLaunchTiming() {
  const impactAt = new Date('2026-08-29T14:32:00.000Z')
  const timing = buildLaunchTiming({
    impactAt,
    marchSeconds: 69,
    rallyPreparationSeconds: 300,
  })

  assert.ok(timing)
  assert.equal(timing.rallyStartAt.toISOString(), '2026-08-29T14:25:51.000Z')
  assert.equal(timing.marchDepartureAt.toISOString(), '2026-08-29T14:30:51.000Z')
  assert.equal(timing.impactAt.toISOString(), '2026-08-29T14:32:00.000Z')
}

async function testGovernedHowlerData() {
  const fetcher = async (path) => {
    const filePath = resolve(process.cwd(), `public${path}`)
    try {
      const body = await readFile(filePath, 'utf8')
      return new Response(body, {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    } catch {
      return new Response('Not found', { status: 404 })
    }
  }

  const dataset = await loadPetDataset(fetcher)
  const howler = getHowlerDefinition(dataset)

  assert.ok(howler)
  assert.equal(howler.petName, 'Grizzly Bear')
  assert.equal(howler.skillName, 'The Howler')
  assert.equal(howler.cooldown, '20 hours')
  assert.deepEqual(
    howler.levels.map((row) => row.marchSpeedPercent),
    [15, 17, 19, 21, 23, 25, 27, 30],
  )
  assert.deepEqual(
    howler.levels.map((row) => row.lethalityReductionPercent),
    [1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5],
  )
}

testDurationParsing()
testObservationLedHowlerResolution()
testLaunchTiming()
await testGovernedHowlerData()

console.log('CASTLE-COMMAND-001A tests passed')
