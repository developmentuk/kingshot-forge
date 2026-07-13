export type KvkSeason = {
  season_id: number
  season_date: string
  kvk_title: string | null
  description: string | null
}

export type KvkMatch = {
  kvk_id: number
  season_id: number
  kingdom_a: number
  kingdom_b: number
  prep_winner: number
  castle_winner: number
  attacker: number
  defender: number
  castle_captured: boolean
  season_date: string
  kvk_title: string | null
  description: string | null
  created_at: string
  updated_at: string
}

export type KvkSeasonsResponse = {
  status: 'success'
  data: KvkSeason[]
  message: string
}

export type KvkMatchesResponse = {
  status: 'success'
  data: KvkMatch[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasMore: boolean
  }
  message: string
}

export type KvkErrorResponse = {
  status: 'error' | 'fail'
  message: string
}