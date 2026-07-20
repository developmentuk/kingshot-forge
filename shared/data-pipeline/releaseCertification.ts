import { sortedUniqueWarningIds } from './warningIdentity.js'

export interface ReleaseCertificationInput {
  validationIds: readonly string[]
  storedIds: readonly string[]
  reviewIds: readonly string[]
  publicationIds: readonly string[]
  auditIds: readonly string[]
  importRunIds: readonly string[]
  relationshipIds: readonly string[]
  searchRefreshIds: readonly string[]
  rollbackIds: readonly string[]
  publicationVersion: string | null
}

export interface ReleaseCertificationReport extends ReleaseCertificationInput {
  status: 'PASS' | 'FAIL'
  checks: Readonly<Record<string, boolean>>
}

function sameIds(left: readonly string[], right: readonly string[]): boolean {
  const a = sortedUniqueWarningIds(left)
  const b = sortedUniqueWarningIds(right)
  return a.length === left.length && b.length === right.length && a.length === b.length && a.every((id, index) => id === b[index])
}

export function certifyRelease(input: ReleaseCertificationInput): ReleaseCertificationReport {
  const checks = {
    validationStored: sameIds(input.validationIds, input.storedIds),
    storedReview: sameIds(input.storedIds, input.reviewIds),
    reviewPublication: sameIds(input.reviewIds, input.publicationIds),
    publicationAudit: sameIds(input.publicationIds, input.auditIds),
  }
  return { ...input, checks, status: Object.values(checks).every(Boolean) ? 'PASS' : 'FAIL' }
}
