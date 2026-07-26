import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { evaluateActivationPreconditions } from '../shared/platform/vision/activationPrecondition.ts'

const good = {
  approvedSha: 'a'.repeat(40), headSha: 'a'.repeat(40), branch: 'feature/vision-mapper', workingTreeClean: true,
  descendsFromActivationPackage: true, expectedBranch: 'feature/vision-mapper', activationPackageCommit: 'b'.repeat(40),
  canonicalMigrationDigests: { one: '1', two: '2' }, expectedMigrationDigests: { one: '1', two: '2' },
  workingTreeMigrationDigests: { one: '1', two: 'crlf' },
  workingTreeDiffersFromCanonical: { one: false, two: true },
  lineEndingOnlyDifference: { one: false, two: true },
}
assert.equal(evaluateActivationPreconditions(good).ok, true)
assert.match(evaluateActivationPreconditions({ ...good, approvedSha: undefined }).errors.join('\n'), /externally approved/)
assert.match(evaluateActivationPreconditions({ ...good, headSha: 'c'.repeat(40) }).errors.join('\n'), /HEAD differs/)
assert.match(evaluateActivationPreconditions({ ...good, branch: 'main' }).errors.join('\n'), /branch must be/)
assert.match(evaluateActivationPreconditions({ ...good, workingTreeClean: false }).errors.join('\n'), /working tree/)
assert.match(evaluateActivationPreconditions({ ...good, descendsFromActivationPackage: false }).errors.join('\n'), /does not descend/)
assert.match(evaluateActivationPreconditions({ ...good, canonicalMigrationDigests: { one: 'changed', two: '2' } }).errors.join('\n'), /canonical migration digest mismatch/)
assert.match(evaluateActivationPreconditions({ ...good, canonicalMigrationDigests: { one: '1' }, canonicalMigrationErrors: ['cannot read tracked Git blob at HEAD: two'] }).errors.join('\n'), /cannot read tracked Git blob/)
assert.match(evaluateActivationPreconditions({ ...good, approvedSha: 'd'.repeat(40) }).errors.join('\n'), /HEAD differs/)

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex')
const canonical = (path) => execFileSync('git', ['show', `HEAD:${path}`], { encoding: null })
const workingTree = (path) => readFileSync(path)
const normalise = (bytes) => Buffer.from(bytes.toString('utf8').replace(/\r\n/g, '\n'), 'utf8')
const assertCanonicalOrLegacyCrlf = ({ path, canonicalDigest, legacyCrlfDigest }) => {
  const canonicalBytes = canonical(path)
  const workingBytes = workingTree(path)
  const workingDigest = sha256(workingBytes)

  assert.equal(sha256(canonicalBytes), canonicalDigest)
  assert.ok(
    workingDigest === canonicalDigest || workingDigest === legacyCrlfDigest,
    `${path} working-tree digest must be canonical LF or the documented legacy CRLF form`,
  )
  assert.equal(sha256(normalise(workingBytes)), canonicalDigest)
}

assertCanonicalOrLegacyCrlf({
  path: 'supabase/migrations/20260722193000_vision_001a_contracts_and_persistence.sql',
  canonicalDigest: '762dab82ccd9cbbbbec499184d8adfc285b9af9a3d40acbbdabe8a25aebacdaa',
  legacyCrlfDigest: '126b863fdc6b7114572083687f1376023ad6d3cb0c1dcecb37fbda40f7acc9ac',
})
assertCanonicalOrLegacyCrlf({
  path: 'supabase/migrations/20260723181223_vision_evidence_storage.sql',
  canonicalDigest: '0b7a3f7a0c8ac2db78bc9d172c7efcdff17ed4c807867ef67af80aadc77104dd',
  legacyCrlfDigest: 'b9535d831c37d3777211608629f974292ff69963bb0c32ac1824f0bd23f7ee16',
})
console.log('Forge Vision activation precondition tests passed: canonical Git blobs, LF/legacy-CRLF diagnostics, missing blobs, external SHA, HEAD, cleanliness, ancestry, branch and digest gates.')
