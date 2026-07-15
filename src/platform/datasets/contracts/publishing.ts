export type DatasetPublicationStatus =
  | 'draft'
  | 'in_review'
  | 'approved'
  | 'published'
  | 'archived'

export type DatasetPublicationTransition =
  | 'submit_for_review'
  | 'return_to_draft'
  | 'approve'
  | 'reject'
  | 'publish'
  | 'archive'
  | 'restore'

export interface DatasetPublicationEvent {
  transition: DatasetPublicationTransition
  fromStatus: DatasetPublicationStatus
  toStatus: DatasetPublicationStatus
  actorId: string
  occurredAt: string
  note?: string
}

export interface DatasetPublishingPolicy {
  workflow: 'direct' | 'review_required'
  allowScheduledPublishing?: boolean
  allowRollback?: boolean
  retainVersions?: number | null
}
