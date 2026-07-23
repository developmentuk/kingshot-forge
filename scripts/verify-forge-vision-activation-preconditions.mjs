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

function git(...gitArgs) {
  return execFileSync('git', gitArgs, { cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
}

function digest(path) {
  return createHash('sha256').update(requireFile(path)).digest('hex')
}

function requireFile(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url))
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
const migrationDigests = Object.fromEntries(Object.keys(manifest.migrationSha256).map((path) => [path, digest(path)]))
const result = evaluateActivationPreconditions({
  approvedSha,
  headSha,
  branch,
  workingTreeClean,
  descendsFromActivationPackage,
  expectedBranch: manifest.branch,
  activationPackageCommit: manifest.activationPackageCommit,
  migrationDigests,
  expectedMigrationDigests: manifest.migrationSha256,
})
console.log(JSON.stringify({ ...result, headSha, branch, approvedSha: approvedSha ?? null, migrationDigests }, null, 2))
if (!result.ok) process.exitCode = 1
