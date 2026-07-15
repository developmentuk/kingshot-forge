import type {
  DatasetDefinition,
  DatasetRecordValues,
} from '../datasets'
import type {
  EditorialHistoryFilter,
  EditorialHistoryResult,
  EditorialRollbackInput,
  EditorialRollbackPreview,
  EditorialTransitionInput,
  EditorialTransitionResult,
  EditorialDraftInput,
  EditorialDraftSaveResult,
} from './index'
import {
  EditorialDraftService,
  EditorialHistoryService,
  EditorialWorkflowService,
} from './services'
import {
  EditorialPermissionService,
  type EditorialPermissionOperation,
} from '../permissions'

export interface EditorialActor {
  userId: string | null
  roles: string[]
}

export class AuthorisedEditorialService {
  private readonly definition: DatasetDefinition
  private readonly draftService: EditorialDraftService
  private readonly workflowService:
    EditorialWorkflowService
  private readonly historyService:
    EditorialHistoryService
  private readonly permissionService:
    EditorialPermissionService

  constructor(
    definition: DatasetDefinition,
    draftService: EditorialDraftService,
    workflowService: EditorialWorkflowService,
    historyService: EditorialHistoryService,
    permissionService =
      new EditorialPermissionService(),
  ) {
    this.definition = definition
    this.draftService = draftService
    this.workflowService = workflowService
    this.historyService = historyService
    this.permissionService = permissionService
  }

  async createDraft(
    input: EditorialDraftInput,
    actor: EditorialActor,
  ): Promise<EditorialDraftSaveResult> {
    await this.assert(
      'create_draft',
      actor,
      input.recordId,
    )
    return this.draftService.saveDraft(input)
  }

  async saveDraft(
    input: EditorialDraftInput,
    actor: EditorialActor,
  ): Promise<EditorialDraftSaveResult> {
    await this.assert(
      input.expectedVersion === null
        ? 'create_draft'
        : 'save_draft',
      actor,
      input.recordId,
    )
    return this.draftService.saveDraft(input)
  }

  async submitForReview(
    input: EditorialTransitionInput,
    actor: EditorialActor,
  ): Promise<EditorialTransitionResult> {
    await this.assert(
      'submit_for_review',
      actor,
      input.recordId,
    )
    return this.workflowService.submitForReview(
      input,
    )
  }

  async returnToDraft(
    input: EditorialTransitionInput,
    actor: EditorialActor,
  ): Promise<EditorialTransitionResult> {
    await this.assert(
      'return_to_draft',
      actor,
      input.recordId,
    )
    return this.workflowService.returnToDraft(
      input,
    )
  }

  async approve(
    input: EditorialTransitionInput,
    actor: EditorialActor,
  ): Promise<EditorialTransitionResult> {
    await this.assert(
      'approve',
      actor,
      input.recordId,
    )
    return this.workflowService.approve(input)
  }

  async reject(
    input: EditorialTransitionInput,
    actor: EditorialActor,
  ): Promise<EditorialTransitionResult> {
    await this.assert(
      'reject',
      actor,
      input.recordId,
    )
    return this.workflowService.reject(input)
  }

  async publish(
    input: EditorialTransitionInput,
    actor: EditorialActor,
  ): Promise<EditorialTransitionResult> {
    await this.assert(
      'publish',
      actor,
      input.recordId,
    )
    return this.workflowService.publish(input)
  }

  async archive(
    input: EditorialTransitionInput,
    actor: EditorialActor,
  ): Promise<EditorialTransitionResult> {
    await this.assert(
      'archive',
      actor,
      input.recordId,
    )
    return this.workflowService.archive(input)
  }

  async restore(
    input: EditorialTransitionInput,
    actor: EditorialActor,
  ): Promise<EditorialTransitionResult> {
    await this.assert(
      'restore',
      actor,
      input.recordId,
    )
    return this.workflowService.restore(input)
  }

  async rollback(
    input: EditorialRollbackInput,
    actor: EditorialActor,
  ): Promise<EditorialTransitionResult> {
    await this.assert(
      'rollback',
      actor,
      input.recordId,
    )
    return this.workflowService.rollback(input)
  }

  async getHistory(
    datasetId: string,
    recordId: string,
    actor: EditorialActor,
    filter: EditorialHistoryFilter = {},
  ): Promise<EditorialHistoryResult> {
    await this.assert(
      'view_history',
      actor,
      recordId,
    )
    return this.historyService.getHistory(
      datasetId,
      recordId,
      filter,
    )
  }

  async previewRollback(
    datasetId: string,
    recordId: string,
    targetVersionId: string,
    actor: EditorialActor,
  ): Promise<EditorialRollbackPreview> {
    await this.assert(
      'rollback',
      actor,
      recordId,
    )
    return this.historyService.previewRollback(
      datasetId,
      recordId,
      targetVersionId,
    )
  }

  private assert(
    operation: EditorialPermissionOperation,
    actor: EditorialActor,
    recordId?: string,
  ) {
    return this.permissionService.assert({
      operation,
      definition: this.definition,
      userId: actor.userId,
      roles: actor.roles,
      recordId,
    })
  }
}

export type {
  DatasetRecordValues,
}
