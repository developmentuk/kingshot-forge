import type {
  ScheduledPublication,
  ScheduledPublicationFilter,
} from '../contracts.js'

export interface ScheduledPublicationRepository {
  get(
    scheduleId: string,
  ): Promise<ScheduledPublication | undefined>

  list(
    filter?: ScheduledPublicationFilter,
  ): Promise<ScheduledPublication[]>

  create(
    schedule: ScheduledPublication,
  ): Promise<void>

  update(
    schedule: ScheduledPublication,
    expectedStatus: ScheduledPublication['status'],
  ): Promise<void>

  findActiveForVersion(
    versionId: string,
  ): Promise<ScheduledPublication | undefined>
}
