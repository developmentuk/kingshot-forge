import type {
  PublicationQueueFilter,
  PublicationQueueItem,
} from '../contracts.js'

export interface PublicationQueueRepository {
  get(itemId: string):
    Promise<PublicationQueueItem | undefined>

  list(
    filter?: PublicationQueueFilter,
  ): Promise<PublicationQueueItem[]>

  create(
    item: PublicationQueueItem,
  ): Promise<void>

  update(
    item: PublicationQueueItem,
    expectedStatus: PublicationQueueItem['status'],
  ): Promise<void>

  findActiveForVersion(
    versionId: string,
  ): Promise<PublicationQueueItem | undefined>
}
