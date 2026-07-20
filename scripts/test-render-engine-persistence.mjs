import assert from 'node:assert/strict'
import { createServer } from 'vite'

const vite = await createServer({ appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } })
try {
  const engine = await vite.ssrLoadModule('/src/render-engine/index.ts')
  const storage = { value: null, getItem() { return this.value }, setItem(_key, value) { this.value = value } }
  const profile = engine.makeCalibrationProfile({ name: 'Norway Local', baseDeviceProfile: 'android-default', calibration: engine.DEFAULT_CALIBRATION, deviceOverrides: {}, benchmarkId: 'norway-flag-pixel', now: '2026-07-19T12:00:00.000Z' })
  engine.persistCalibrationProfiles([profile], storage)
  assert.equal(engine.loadCalibrationProfiles(storage).length, 1)
  assert.deepEqual(engine.parseCalibrationProfiles('{malformed'), [])
  assert.deepEqual(engine.parseCalibrationProfiles(JSON.stringify([{ ...profile, calibration: {} }])), [])
  const clone = engine.cloneCalibration(engine.DEFAULT_CALIBRATION)
  clone.ascii.glyphScale = 1.25
  assert.equal(engine.DEFAULT_CALIBRATION.ascii.glyphScale, .96)
  assert.equal(engine.resolveDeviceProfile('android-default', { 'android-default': { cellWidth: 14 } }).cellWidth, 14)
  assert.equal(engine.resolveDeviceProfile('android-default').cellWidth, 10)
  console.log('Render Engine persistence tests passed: save/load, malformed recovery, schema validation, immutable defaults and device overrides.')
} finally {
  await vite.close()
}

