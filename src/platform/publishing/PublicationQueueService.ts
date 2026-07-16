import type {
  EnqueuePublicationInput,
  PublicationExecutionResult,
  PublicationExecutor,
  PublicationQueueFilter,
  PublicationQueueItem,
  PublicationQueueServiceOptions,
} from './contracts.js'
import {
  PublicationQueueError,
} from './contracts.js'
import type {
  PublicationQueueRepository,
} from './repositories/index.js'

function defaultNow(): string {
  return new Date().toISOString()
}

function defaultCreateId(): string {
  return crypto.randomUUID()
}

function requireText(
  value: string,
  label: string,
): string {
  const trimmed = value.trim()

  if (trimmed.length === 0) {
    throw new PublicationQueueError(
      `${label} is required.`,
    )
  }

  return trimmed
}

function failureMessage(
  error: unknown,
): string {
  return error instanceof Error
    ? error.message
    : 'Publication failed for an unknown reason.'
}

export class PublicationQueueService {
  private readonly repository:
    PublicationQueueRepository
  private readonly executor: PublicationExecutor
  private readonly now: () => string
  private readonly createId: () => string
  private readonly maximumAttempts: number

  constructor(
    repository: PublicationQueueRepository,
    executor: PublicationExecutor,
    options: PublicationQueueServiceOptions = {},
  ) {
    this.repository = repository
    this.executor = executor
    this.now = options.now ?? defaultNow
    this.createId =
      options.createId ?? defaultCreateId
    this.maximumAttempts =
      options.maximumAttempts ?? 3

    if (
      !Number.isInteger(this.maximumAttempts) ||
      this.maximumAttempts < 1
    ) {
      throw new PublicationQueueError(
        'Maximum attempts must be a positive integer.',
      )
    }
  }

  async enqueue(
    input: EnqueuePublicationInput,
  ): Promise<PublicationQueueItem> {
    const datasetId = requireText(
      input.datasetId,
      'Dataset ID',
    )
    const recordId = requireText(
      input.recordId,
      'Record ID',
    )
    const versionId = requireText(
      input.versionId,
      'Version ID',
    )
    const requestedBy = requireText(
      input.requestedBy,
      'Requested by',
    )

    if (
      !Number.isInteger(input.expectedVersion) ||
      input.expectedVersion < 1
    ) {
      throw new PublicationQueueError(
        'Expected version must be a positive integer.',
      )
    }

    const existing =
      await this.repository.findActiveForVersion(
        versionId,
      )

    if (existing) {
      throw new PublicationQueueError(
        `Version "${versionId}" is already queued.`,
        existing.id,
      )
    }

    const item: PublicationQueueItem = {
      id: this.createId(),
      datasetId,
      recordId,
      versionId,
      expectedVersion: input.expectedVersion,
      requestedBy,
      requestedAt: this.now(),
      status: 'pending',
      attempts: 0,
      note: input.note,
      metadata: input.metadata
        ? structuredClone(input.metadata)
        : undefined,
    }

    await this.repository.create(item)

    return structuredClone(item)
  }

  get(
    itemId: string,
  ): Promise<PublicationQueueItem | undefined> {
    return this.repository.get(
      requireText(itemId, 'Queue item ID'),
    )
  }

  list(
    filter: PublicationQueueFilter = {},
  ): Promise<PublicationQueueItem[]> {
    return this.repository.list(filter)
  }

  async processNext():
    Promise<PublicationQueueItem | undefined> {
    const [next] = await this.repository.list({
      status: 'pending',
    })

    if (!next) {
      return undefined
    }

    return this.process(next.id)
  }

  async process(
    itemIdInput: string,
  ): Promise<PublicationQueueItem> {
    const itemId = requireText(
      itemIdInput,
      'Queue item ID',
    )
    const current = await this.requireItem(itemId)

    if (current.status !== 'pending') {
      throw new PublicationQueueError(
        `Only pending items can be processed; ` +
          `"${itemId}" is "${current.status}".`,
        itemId,
      )
    }

    if (current.attempts >= this.maximumAttempts) {
      throw new PublicationQueueError(
        `Publication queue item "${itemId}" has reached ` +
          `the maximum attempt count.`,
        itemId,
      )
    }

    const attemptStartedAt = this.now()
    const processing: PublicationQueueItem = {
      ...current,
      status: 'processing',
      attempts: current.attempts + 1,
      lastAttemptAt: attemptStartedAt,
      failureMessage: undefined,
    }

    await this.repository.update(
      processing,
      'pending',
    )

    try {
      const result = await this.executor({
        item: structuredClone(processing),
      })

      return this.complete(
        processing,
        result,
      )
    } catch (error) {
      return this.fail(
        processing,
        failureMessage(error),
      )
    }
  }

  async retry(
    itemIdInput: string,
  ): Promise<PublicationQueueItem> {
    const itemId = requireText(
      itemIdInput,
      'Queue item ID',
    )
    const current = await this.requireItem(itemId)

    if (current.status !== 'failed') {
      throw new PublicationQueueError(
        `Only failed items can be retried; ` +
          `"${itemId}" is "${current.status}".`,
        itemId,
      )
    }

    if (current.attempts >= this.maximumAttempts) {
      throw new PublicationQueueError(
        `Publication queue item "${itemId}" has reached ` +
          `the maximum attempt count.`,
        itemId,
      )
    }

    const pending: PublicationQueueItem = {
      ...current,
      status: 'pending',
      failureMessage: undefined,
    }

    await this.repository.update(
      pending,
      'failed',
    )

    return structuredClone(pending)
  }

  async cancel(
    itemIdInput: string,
  ): Promise<PublicationQueueItem> {
    const itemId = requireText(
      itemIdInput,
      'Queue item ID',
    )
    const current = await this.requireItem(itemId)

    if (
      current.status !== 'pending' &&
      current.status !== 'failed'
    ) {
      throw new PublicationQueueError(
        `Only pending or failed items can be cancelled; ` +
          `"${itemId}" is "${current.status}".`,
        itemId,
      )
    }

    const cancelled: PublicationQueueItem = {
      ...current,
      status: 'cancelled',
      cancelledAt: this.now(),
    }

    await this.repository.update(
      cancelled,
      current.status,
    )

    return structuredClone(cancelled)
  }

  private async complete(
    processing: PublicationQueueItem,
    result: PublicationExecutionResult,
  ): Promise<PublicationQueueItem> {
    requireText(
      result.publishedVersionId,
      'Published version ID',
    )

    const completed: PublicationQueueItem = {
      ...processing,
      status: 'completed',
      completedAt: this.now(),
      metadata: {
        ...(processing.metadata ?? {}),
        ...(result.metadata ?? {}),
        publishedVersionId:
          result.publishedVersionId,
      },
    }

    await this.repository.update(
      completed,
      'processing',
    )

    return structuredClone(completed)
  }

  private async fail(
    processing: PublicationQueueItem,
    message: string,
  ): Promise<PublicationQueueItem> {
    const failed: PublicationQueueItem = {
      ...processing,
      status: 'failed',
      failureMessage: message,
    }

    await this.repository.update(
      failed,
      'processing',
    )

    return structuredClone(failed)
  }

  private async requireItem(
    itemId: string,
  ): Promise<PublicationQueueItem> {
    const item = await this.repository.get(itemId)

    if (!item) {
      throw new PublicationQueueError(
        `Publication queue item "${itemId}" was not found.`,
        itemId,
      )
    }

    return item
  }
}
