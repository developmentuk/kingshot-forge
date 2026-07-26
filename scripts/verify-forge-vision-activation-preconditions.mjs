import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { evaluateActivationPreconditions } from '../shared/platform/vision/activationPrecondition.ts'

const repoRoot = new URL('../', import.meta.url)
const manifest = JSON.parse(await readFile(new URL('../docs/operations/FORGE-VISION-ACTIVATION-MANIFEST.json', import.meta.url), 'utf8'))
const args = process.argv.slice(2)
const approvedIndex = args.indexOf('--approved-sha')
const approvedSha = approvedIndex >= 0 ? args[approvedIndex + 1] : undefined
const correctionMigrations = manifest.persistenceCorrections ?? []
const correctionDigests = Object.fromEntries(correctionMigrations.map((migration) => [migration.path, migration.canonicalSha256]))
const expectedMigrationDigests = { ...manifest.migrationSha256, ...correctionDigests }

function git(...gitArgs) {
  return execFileSync('git', gitArgs, { cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
}

function canonicalBlob(path) {
  try {
    execFileSync('git', ['cat-file', '-e', `HEAD:${path}`], { cwd: repoRoot, stdio: 'ignore' })
    return execFileSync('git', ['show', `HEAD:${path}`], { cwd: repoRoot, encoding: null, stdio: ['ignore', 'pipe', 'pipe'] })
  } catch {
    throw new Error(`cannot read tracked Git blob at HEAD: ${path}`)
  }
}

function digestBytes(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

function canonicalDigest(path) {
  return digestBytes(canonicalBlob(path))
}

function workingTreeDigest(path) {
  try {
    return readFileSync(new URL(`../${path}`, import.meta.url))
  } catch {
    return null
  }
}

const headSha = git('rev-parse', 'HEAD')
const branch = git('branch', '--show-current')
const workingTreeClean = git('status', '--porcelain') === ''
const descendsFromActivationPackage = (() => {
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', manifest.activationPackageCommit, 'HEAD'], { cwd: repoRoot, stdio: 'ignore' })
    return true
  } catch {
    return false
  }
})()
const canonicalMigrationDigests = {}
const canonicalMigrationErrors = []
const workingTreeMigrationDigests = {}
const normalisedWorkingTreeMigrationDigests = {}
for (const path of Object.keys(expectedMigrationDigests)) {
  try {
    canonicalMigrationDigests[path] = canonicalDigest(path)
  } catch (error) {
    canonicalMigrationErrors.push(error instanceof Error ? error.message : String(error))
  }
  const workingTreeBytes = workingTreeDigest(path)
  workingTreeMigrationDigests[path] = workingTreeBytes ? digestBytes(workingTreeBytes) : null
  normalisedWorkingTreeMigrationDigests[path] = workingTreeBytes
    ? digestBytes(Buffer.from(workingTreeBytes.toString('utf8').replace(/\r\n/g, '\n'), 'utf8'))
    : null
}
const workingTreeDiffersFromCanonical = Object.fromEntries(Object.keys(expectedMigrationDigests).map((path) => [
  path,
  canonicalMigrationDigests[path] && workingTreeMigrationDigests[path]
    ? canonicalMigrationDigests[path] !== workingTreeMigrationDigests[path]
    : null,
]))
const lineEndingOnlyDifference = Object.fromEntries(Object.keys(expectedMigrationDigests).map((path) => [
  path,
  canonicalMigrationDigests[path] && workingTreeMigrationDigests[path] && normalisedWorkingTreeMigrationDigests[path]
    ? canonicalMigrationDigests[path] === normalisedWorkingTreeMigrationDigests[path]
      && canonicalMigrationDigests[path] !== workingTreeMigrationDigests[path]
    : null,
]))
const result = evaluateActivationPreconditions({
  approvedSha,
  headSha,
  branch,
  workingTreeClean,
  descendsFromActivationPackage,
  expectedBranch: manifest.branch,
  activationPackageCommit: manifest.activationPackageCommit,
  canonicalMigrationDigests,
  expectedMigrationDigests,
  canonicalMigrationErrors,
  workingTreeMigrationDigests,
  workingTreeDiffersFromCanonical,
  lineEndingOnlyDifference,
  normalisedWorkingTreeMigrationDigests,
})
console.log(JSON.stringify({
  ...result,
  headSha,
  branch,
  approvedSha: approvedSha ?? null,
  canonicalMigrationDigests,
  workingTreeMigrationDigests,
  workingTreeDiffersFromCanonical,
  lineEndingOnlyDifference,
  normalisedWorkingTreeMigrationDigests,
  canonicalMigrationErrors,
  digestAuthority: 'canonical_git_blob',
}, null, 2))
if (!result.ok) process.exitCode = 1
