import type {
  DatasetDefinition,
  DatasetPermissionAction,
  DatasetPermissionContext,
} from '../datasets'

export interface PermissionDecision {
  allowed: boolean
  action: DatasetPermissionAction
  datasetId: string
  recordId?: string
  reason: string
  matchedRoles: string[]
}

export interface DatasetPermissionRequest {
  action: DatasetPermissionAction
  definition: DatasetDefinition
  userId: string | null
  roles: string[]
  recordId?: string
}

export interface DatasetPermissionServiceOptions {
  allowUnconfiguredRead?: boolean
  allowUnconfiguredActions?: DatasetPermissionAction[]
}

export class DatasetPermissionDeniedError extends Error {
  readonly decision: PermissionDecision

  constructor(decision: PermissionDecision) {
    super(
      `Permission denied for "${decision.action}" on dataset ` +
        `"${decision.datasetId}": ${decision.reason}`,
    )
    this.name = 'DatasetPermissionDeniedError'
    this.decision = decision
  }
}

export function createPermissionContext(
  request: DatasetPermissionRequest,
): DatasetPermissionContext {
  return {
    userId: request.userId,
    roles: [...request.roles],
    datasetId: request.definition.id,
    recordId: request.recordId,
  }
}
