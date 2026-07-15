import type {
  PublicationQueueFilter,
  PublicationQueueItem,
} from '../contracts'
import type {
  PublicationQueueRepository,
} from './PublicationQueueRepository'

function matchesFilter(
  item: PublicationQueueItem,
  filter: PublicationQueueFilter,
): boolean {
  return (
    (!filter.datasetId ||
      item.datasetId === filter.datasetId) &&
    (!filter.recordId ||
      item.recordId === filter.recordId) &&
    (!filter.requestedBy ||
      item.requestedBy === filter.requestedBy) &&
    (!filter.status ||
      item.status === filter.status)
  )
}

function isActive(
  item: PublicationQueueItem,
): boolean {
  return (
    item.status === 'pending' ||
    item.status === 'processing'
  )
}

export class InMemoryPublicationQueueRepository
implements PublicationQueueRepository {
  private readonly items =
    new Map<string, PublicationQueueItem>()

  async get(
    itemId: string,
  ): Promise<PublicationQueueItem | undefined> {
    const item = this.items.get(itemId)
    return item
      ? structuredClone(item)
      : undefined
  }

  async list(
    filter: PublicationQueueFilter = {},
  ): Promise<PublicationQueueItem[]> {
    return [...this.items.values()]
      .filter((item) =>
        matchesFilter(item, filter),
      )
      .sort((left, right) =>
        left.requestedAt.localeCompare(
          right.requestedAt,
        ),
      )
      .map((item) => structuredClone(item))
  }

  async create(
    item: PublicationQueueItem,
  ): Promise<void> {
    if (this.items.has(item.id)) {
      throw new Error(
        `Publication queue item "${item.id}" already exists.`,
      )
    }

    this.items.set(
      item.id,
      structuredClone(item),
    )
  }

  async update(
    item: PublicationQueueItem,
    expectedStatus: PublicationQueueItem['status'],
  ): Promise<void> {
    const current = this.items.get(item.id)

    if (!current) {
      throw new Error(
        `Publication queue item "${item.id}" was not found.`,
      )
    }

    if (current.status !== expectedStatus) {
      throw new Error(
        `Publication queue item "${item.id}" changed from ` +
          `"${expectedStatus}" to "${current.status}".`,
      )
    }

    this.items.set(
      item.id,
      structuredClone(item),
    )
  }

  async findActiveForVersion(
    versionId: string,
  ): Promise<PublicationQueueItem | undefined> {
    const item = [...this.items.values()]
      .find((candidate) =>
        candidate.versionId === versionId &&
        isActive(candidate),
      )

    return item
      ? structuredClone(item)
      : undefined
  }
}
