import type {
  DatasetDefinition,
  DatasetPermissionAction,
} from '../datasets/index.js'
import type {
  EditorialAction,
} from '../editorial/index.js'
import {
  DatasetPermissionService,
} from './DatasetPermissionService.js'
import type {
  DatasetPermissionRequest,
  PermissionDecision,
} from './contracts.js'

export type EditorialPermissionOperation =
  | 'create_draft'
  | 'save_draft'
  | 'submit_for_review'
  | 'return_to_draft'
  | 'approve'
  | 'reject'
  | 'publish'
  | 'archive'
  | 'restore'
  | 'rollback'
  | 'view_history'

const operationActions: Record<
  EditorialPermissionOperation,
  DatasetPermissionAction
> = {
  create_draft: 'create',
  save_draft: 'update',
  submit_for_review: 'review',
  return_to_draft: 'review',
  approve: 'approve',
  reject: 'approve',
  publish: 'publish',
  archive: 'archive',
  restore: 'restore',
  rollback: 'restore',
  view_history: 'read',
}

const auditActionOperations: Partial<
  Record<
    EditorialAction,
    EditorialPermissionOperation
  >
> = {
  draft_created: 'create_draft',
  draft_saved: 'save_draft',
  submitted_for_review: 'submit_for_review',
  returned_to_draft: 'return_to_draft',
  approved: 'approve',
  rejected: 'reject',
  published: 'publish',
  archived: 'archive',
  restored: 'restore',
  rolled_back: 'rollback',
}

export interface EditorialPermissionRequest {
  operation: EditorialPermissionOperation
  definition: DatasetDefinition
  userId: string | null
  roles: string[]
  recordId?: string
}

export class EditorialPermissionService {
  private readonly permissionService:
    DatasetPermissionService

  constructor(
    permissionService =
      new DatasetPermissionService(),
  ) {
    this.permissionService = permissionService
  }

  evaluate(
    request: EditorialPermissionRequest,
  ): Promise<PermissionDecision> {
    return this.permissionService.evaluate(
      this.toDatasetRequest(request),
    )
  }

  can(
    request: EditorialPermissionRequest,
  ): Promise<boolean> {
    return this.permissionService.can(
      this.toDatasetRequest(request),
    )
  }

  assert(
    request: EditorialPermissionRequest,
  ): Promise<PermissionDecision> {
    return this.permissionService.assert(
      this.toDatasetRequest(request),
    )
  }

  assertAuditAction(
    action: EditorialAction,
    request: Omit<
      EditorialPermissionRequest,
      'operation'
    >,
  ): Promise<PermissionDecision> {
    const operation =
      auditActionOperations[action]

    if (!operation) {
      throw new Error(
        `No permission operation is mapped for editorial action "${action}".`,
      )
    }

    return this.assert({
      ...request,
      operation,
    })
  }

  private toDatasetRequest(
    request: EditorialPermissionRequest,
  ): DatasetPermissionRequest {
    return {
      action: operationActions[
        request.operation
      ],
      definition: request.definition,
      userId: request.userId,
      roles: request.roles,
      recordId: request.recordId,
    }
  }
}
