export type ReadinessStatus =
  | 'implemented'
  | 'partial'
  | 'missing'
  | 'not-applicable'
  | 'not-audited'

export type ReadinessCapability =
  | 'import'
  | 'adapter'
  | 'browser'
  | 'viewer'
  | 'editor'
  | 'validation'
  | 'publishing'
  | 'version-history'
  | 'search'
  | 'filters'
  | 'public-api'
  | 'public-pages'
  | 'mobile'
  | 'verification'

export type CapabilityReadiness = {
  capability: ReadinessCapability
  status: ReadinessStatus
  evidence?: string
  note?: string
}

export type ReadinessScore = {
  implemented: number
  partial: number
  missing: number
  notAudited: number
  applicable: number
  percentage: number
}

const STATUS_WEIGHT: Record<Exclude<ReadinessStatus, 'not-applicable' | 'not-audited'>, number> = {
  implemented: 1,
  partial: 0.5,
  missing: 0,
}

export function calculateReadiness(
  capabilities: readonly CapabilityReadiness[],
): ReadinessScore {
  const applicable = capabilities.filter(
    ({ status }) => status !== 'not-applicable',
  )

  const scored = applicable.filter(
    ({ status }) => status !== 'not-audited',
  )

  const points = scored.reduce((total, { status }) => {
    if (status === 'not-applicable' || status === 'not-audited') return total
    return total + STATUS_WEIGHT[status]
  }, 0)

  return {
    implemented: capabilities.filter(({ status }) => status === 'implemented').length,
    partial: capabilities.filter(({ status }) => status === 'partial').length,
    missing: capabilities.filter(({ status }) => status === 'missing').length,
    notAudited: capabilities.filter(({ status }) => status === 'not-audited').length,
    applicable: applicable.length,
    percentage: scored.length === 0 ? 0 : Math.round((points / scored.length) * 100),
  }
}
