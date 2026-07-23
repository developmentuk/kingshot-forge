export type ActivationPreconditionInput = {
  approvedSha?: string
  headSha: string
  branch: string
  workingTreeClean: boolean
  descendsFromActivationPackage: boolean
  expectedBranch: string
  activationPackageCommit: string
  canonicalMigrationDigests: Record<string, string>
  expectedMigrationDigests: Record<string, string>
  canonicalMigrationErrors?: string[]
  workingTreeMigrationDigests?: Record<string, string | null>
  workingTreeDiffersFromCanonical?: Record<string, boolean | null>
  lineEndingOnlyDifference?: Record<string, boolean | null>
}

const shaPattern = /^[0-9a-f]{40}$/i

export function evaluateActivationPreconditions(input: ActivationPreconditionInput) {
  const errors: string[] = []
  if (!input.approvedSha || !shaPattern.test(input.approvedSha)) errors.push('an externally approved 40-character execution SHA is required')
  if (input.approvedSha && input.approvedSha.toLowerCase() !== input.headSha.toLowerCase()) errors.push('HEAD differs from the externally approved execution SHA')
  if (input.branch !== input.expectedBranch) errors.push(`branch must be ${input.expectedBranch}`)
  if (!input.workingTreeClean) errors.push('working tree is not clean')
  if (!input.descendsFromActivationPackage) errors.push(`HEAD does not descend from activation-package commit ${input.activationPackageCommit}`)
  for (const error of input.canonicalMigrationErrors ?? []) errors.push(error)
  for (const [path, expected] of Object.entries(input.expectedMigrationDigests)) {
    const actual = input.canonicalMigrationDigests[path]
    if (actual && actual.toLowerCase() !== expected.toLowerCase()) errors.push(`canonical migration digest mismatch: ${path}`)
    if (!actual && !(input.canonicalMigrationErrors ?? []).some((error) => error.includes(path))) {
      errors.push(`canonical migration digest unavailable: ${path}`)
    }
  }
  return { ok: errors.length === 0, errors }
}
