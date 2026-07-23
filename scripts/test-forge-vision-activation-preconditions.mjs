import assert from 'node:assert/strict'
import { evaluateActivationPreconditions } from '../shared/platform/vision/activationPrecondition.ts'

const good = {
  approvedSha: 'a'.repeat(40), headSha: 'a'.repeat(40), branch: 'feature/vision-mapper', workingTreeClean: true,
  descendsFromActivationPackage: true, expectedBranch: 'feature/vision-mapper', activationPackageCommit: 'b'.repeat(40),
  migrationDigests: { one: '1', two: '2' }, expectedMigrationDigests: { one: '1', two: '2' },
}
assert.equal(evaluateActivationPreconditions(good).ok, true)
assert.match(evaluateActivationPreconditions({ ...good, approvedSha: undefined }).errors.join('\n'), /externally approved/)
assert.match(evaluateActivationPreconditions({ ...good, headSha: 'c'.repeat(40) }).errors.join('\n'), /HEAD differs/)
assert.match(evaluateActivationPreconditions({ ...good, workingTreeClean: false }).errors.join('\n'), /working tree/)
assert.match(evaluateActivationPreconditions({ ...good, descendsFromActivationPackage: false }).errors.join('\n'), /does not descend/)
assert.match(evaluateActivationPreconditions({ ...good, migrationDigests: { one: 'changed', two: '2' } }).errors.join('\n'), /digest mismatch/)
console.log('Forge Vision activation precondition tests passed: external SHA, HEAD, cleanliness, ancestry, branch and digest gates.')
