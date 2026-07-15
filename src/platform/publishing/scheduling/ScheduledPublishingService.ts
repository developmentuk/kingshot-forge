import {
  PublicationQueueService,
} from '../PublicationQueueService.js'
import type {
  ScheduledPublication,
  ScheduledPublicationFilter,
  ScheduledPublicationRunResult,
  SchedulePublicationInput,
  ScheduledPublishingServiceOptions,
} from './contracts.js'
import {
  ScheduledPublicationError,
} from './contracts.js'
import type {
  ScheduledPublicationRepository,
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
    throw new ScheduledPublicationError(
      `${label} is required.`,
    )
  }

  return trimmed
}

function parseDate(
  value: string,
  label: string,
): number {
  const timestamp = Date.parse(value)

  if (Number.isNaN(timestamp)) {
    throw new ScheduledPublicationError(
      `${label} must be a valid date.`,
    )
  }

  return timestamp
}

function errorMessage(
  error: unknown,
): string {
  return error instanceof Error
    ? error.message
    : 'Scheduled publication failed for an unknown reason.'
}

export class ScheduledPublishingService {
  private readonly repository:
    ScheduledPublicationRepository
  private readonly queueService:
    PublicationQueueService
  private readonly now: () => string
  private readonly createId: () => string

  constructor(
    repository: ScheduledPublicationRepository,
    queueService: PublicationQueueService,
    options: ScheduledPublishingServiceOptions = {},
  ) {
    this.repository = repository
    this.queueService = queueService
    this.now = options.now ?? defaultNow
    this.createId =
      options.createId ?? defaultCreateId
  }

  async schedule(
    input: SchedulePublicationInput,
  ): Promise<ScheduledPublication> {
    const scheduledFor = requireText(
      input.scheduledFor,
      'Scheduled time',
    )
    const createdBy = requireText(
      input.createdBy,
      'Created by',
    )
    const scheduledTimestamp = parseDate(
      scheduledFor,
      'Scheduled time',
    )
    const nowTimestamp = parseDate(
      this.now(),
      'Current time',
    )

    if (scheduledTimestamp <= nowTimestamp) {
      throw new ScheduledPublicationError(
        'Scheduled time must be in the future.',
      )
    }

    const existing =
      await this.repository.findActiveForVersion(
        input.publication.versionId,
      )

    if (existing) {
      throw new ScheduledPublicationError(
        `Version "${input.publication.versionId}" is already scheduled.`,
        existing.id,
      )
    }

    const schedule: ScheduledPublication = {
      id: this.createId(),
      publication: structuredClone(
        input.publication,
      ),
      scheduledFor: new Date(
        scheduledTimestamp,
      ).toISOString(),
      createdAt: new Date(
        nowTimestamp,
      ).toISOString(),
      createdBy,
      status: 'scheduled',
      metadata: input.metadata
        ? structuredClone(input.metadata)
        : undefined,
    }

    await this.repository.create(schedule)

    return structuredClone(schedule)
  }

  get(
    scheduleId: string,
  ): Promise<ScheduledPublication | undefined> {
    return this.repository.get(
      requireText(scheduleId, 'Schedule ID'),
    )
  }

  list(
    filter: ScheduledPublicationFilter = {},
  ): Promise<ScheduledPublication[]> {
    return this.repository.list(filter)
  }

  async cancel(
    scheduleIdInput: string,
  ): Promise<ScheduledPublication> {
    const scheduleId = requireText(
      scheduleIdInput,
      'Schedule ID',
    )
    const current =
      await this.requireSchedule(scheduleId)

    if (current.status !== 'scheduled') {
      throw new ScheduledPublicationError(
        `Only scheduled publications can be cancelled; ` +
          `"${scheduleId}" is "${current.status}".`,
        scheduleId,
      )
    }

    const cancelled: ScheduledPublication = {
      ...current,
      status: 'cancelled',
      cancelledAt: this.now(),
    }

    await this.repository.update(
      cancelled,
      'scheduled',
    )

    return structuredClone(cancelled)
  }

  async runDue(
    dueAt = this.now(),
  ): Promise<ScheduledPublicationRunResult[]> {
    const dueTimestamp = parseDate(
      dueAt,
      'Due time',
    )
    const due = await this.repository.list({
      status: 'scheduled',
      dueBefore: new Date(
        dueTimestamp,
      ).toISOString(),
    })

    const results: ScheduledPublicationRunResult[] = []

    for (const schedule of due) {
      results.push(
        await this.queueSchedule(schedule),
      )
    }

    return results
  }

  private async queueSchedule(
    schedule: ScheduledPublication,
  ): Promise<ScheduledPublicationRunResult> {
    try {
      const queueItem =
        await this.queueService.enqueue(
          schedule.publication,
        )
      const queuedAt = this.now()
      const queued: ScheduledPublication = {
        ...schedule,
        status: 'queued',
        queuedAt,
        queueItemId: queueItem.id,
        failureMessage: undefined,
      }

      await this.repository.update(
        queued,
        'scheduled',
      )

      return {
        schedule: structuredClone(queued),
        queueItem,
      }
    } catch (error) {
      const failed: ScheduledPublication = {
        ...schedule,
        status: 'failed',
        failureMessage: errorMessage(error),
      }

      await this.repository.update(
        failed,
        'scheduled',
      )

      return {
        schedule: structuredClone(failed),
      }
    }
  }

  private async requireSchedule(
    scheduleId: string,
  ): Promise<ScheduledPublication> {
    const schedule =
      await this.repository.get(scheduleId)

    if (!schedule) {
      throw new ScheduledPublicationError(
        `Scheduled publication "${scheduleId}" was not found.`,
        scheduleId,
      )
    }

    return schedule
  }
}
