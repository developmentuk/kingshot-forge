export type KingdomServer = {
  id: number
  kingdomId: number
  openTime: string
  isExclusive: boolean
  languages: string[] | null
  isVerified: boolean
  addedBy?: string | null
  submittedByName?: string | null
  createdAt?: string
  updatedAt?: string
}

export type KingdomTrackerResponse = {
  status: 'success'
  data: {
    servers: KingdomServer[]
    total: number
    filters: {
      recent: number | null
      limit: number | null
      sort: string
    }
  }
  message: string
}

export type KingdomTrackerErrorResponse = {
  status: 'error' | 'fail'
  message: string
}