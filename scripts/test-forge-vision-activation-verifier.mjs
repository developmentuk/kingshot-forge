import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { verifyVisionActivation } from '../shared/platform/vision/activationVerifier.ts'

const fixture = JSON.parse(await readFile(new URL('./fixtures/vision-activation-metadata.valid.json', import.meta.url), 'utf8'))
assert.equal(verifyVisionActivation(fixture, true).ok, true)
const missingTable = { ...fixture, tables: fixture.tables.slice(1) }
assert.equal(verifyVisionActivation(missingTable, true).ok, false)
const badStorage = { ...fixture, storageBucket: { ...fixture.storageBucket, public: true } }
assert.equal(verifyVisionActivation(badStorage, true).ok, false)
console.log('Forge Vision activation verifier tests passed: valid fixture, missing contract, and unsafe storage cases.')
