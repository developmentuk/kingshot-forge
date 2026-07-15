import type {
  ScheduledPublication,
  ScheduledPublicationFilter,
} from '../contracts.js'
import type {
  ScheduledPublicationRepository,
} from './ScheduledPublicationRepository.js'

function matchesFilter(
  schedule: ScheduledPublication,
  filter: ScheduledPublicationFilter,
): boolean {
  const dueBefore = filter.dueBefore
    ? Date.parse(filter.dueBefore)
    : undefined

  return (
    (!filter.datasetId ||
      schedule.publication.datasetId ===
        filter.datasetId) &&
    (!filter.recordId ||
      schedule.publication.recordId ===
        filter.recordId) &&
    (!filter.createdBy ||
      schedule.createdBy === filter.createdBy) &&
    (!filter.status ||
      schedule.status === filter.status) &&
    (
      dueBefore === undefined ||
      Date.parse(schedule.scheduledFor) <= dueBefore
    )
  )
}

export class InMemoryScheduledPublicationRepository
implements ScheduledPublicationRepository {
  private readonly schedules =
    new Map<string, ScheduledPublication>()

  async get(
    scheduleId: string,
  ): Promise<ScheduledPublication | undefined> {
    const schedule = this.schedules.get(scheduleId)
    return schedule
      ? structuredClone(schedule)
      : undefined
  }

  async list(
    filter: ScheduledPublicationFilter = {},
  ): Promise<ScheduledPublication[]> {
    return [...this.schedules.values()]
      .filter((schedule) =>
        matchesFilter(schedule, filter),
      )
      .sort((left, right) =>
        left.scheduledFor.localeCompare(
          right.scheduledFor,
        ),
      )
      .map((schedule) =>
        structuredClone(schedule),
      )
  }

  async create(
    schedule: ScheduledPublication,
  ): Promise<void> {
    if (this.schedules.has(schedule.id)) {
      throw new Error(
        `Scheduled publication "${schedule.id}" already exists.`,
      )
    }

    this.schedules.set(
      schedule.id,
      structuredClone(schedule),
    )
  }

  async update(
    schedule: ScheduledPublication,
    expectedStatus: ScheduledPublication['status'],
  ): Promise<void> {
    const current = this.schedules.get(
      schedule.id,
    )

    if (!current) {
      throw new Error(
        `Scheduled publication "${schedule.id}" was not found.`,
      )
    }

    if (current.status !== expectedStatus) {
      throw new Error(
        `Scheduled publication "${schedule.id}" changed from ` +
          `"${expectedStatus}" to "${current.status}".`,
      )
    }

    this.schedules.set(
      schedule.id,
      structuredClone(schedule),
    )
  }

  async findActiveForVersion(
    versionId: string,
  ): Promise<ScheduledPublication | undefined> {
    const schedule = [...this.schedules.values()]
      .find((candidate) =>
        candidate.publication.versionId === versionId &&
        candidate.status === 'scheduled',
      )

    return schedule
      ? structuredClone(schedule)
      : undefined
  }
}
