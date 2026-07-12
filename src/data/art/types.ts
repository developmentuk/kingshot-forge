export type ArtCategory =
  | 'Cats'
  | 'Animals'
  | 'Characters'
  | 'Announcements'
  | 'Battle'
  | 'KvK'
  | 'Alliance'
  | 'Flags'
  | 'Pixel Art'
  | 'Nature'
  | 'Funny'
  | 'Gaming'
  | 'Seasonal'
  | 'Other'

export type ArtSize =
  | 'Compact'
  | 'Medium'
  | 'Large'
  | 'Extra Large'

export type ArtSource =
  | 'Kingshot Forge'
  | 'Community Submission'
  | 'Alliance Submission'

export type ArtStatus =
  | 'Published'
  | 'Draft'
  | 'Needs Testing'
  | 'Archived'

export type ArtTemplate = {
  id: string
  title: string
  category: ArtCategory
  description: string
  tags: string[]
  art: string

  size: ArtSize
  source: ArtSource
  status: ArtStatus

  author?: string
  alliance?: string
  submittedBy?: string

  addedAt: string
  updatedAt?: string

  featured?: boolean
  compact?: boolean
  testedInKingshot?: boolean
}