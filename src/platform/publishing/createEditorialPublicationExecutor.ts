import type {
  EditorialTransitionResult,
  EditorialWorkflowService,
} from '../editorial'
import type {
  PublicationExecutor,
} from './contracts'

export function createEditorialPublicationExecutor(
  workflowService: EditorialWorkflowService,
): PublicationExecutor {
  return async ({ item }) => {
    const result: EditorialTransitionResult =
      await workflowService.publish({
        datasetId: item.datasetId,
        recordId: item.recordId,
        actorId: item.requestedBy,
        expectedVersion: item.expectedVersion,
        note: item.note,
      })

    return {
      publishedVersionId: result.version.id,
      metadata: {
        publishedVersion:
          result.version.version,
        auditEventId:
          result.auditEvent.id,
      },
    }
  }
}
