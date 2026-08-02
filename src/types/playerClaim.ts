export type IndexedPlayerRecord = {
  playerId: string
  playerName: string
  kingdomId: number
  townCenterLevel: number | null
  profilePhoto: string | null
  verificationStatus: string
  verificationMethod: string
  isPublic: boolean
  allianceName: string | null
  currentPower: number | null
  observedAt: string
}

export type PlayerClaimSearchResult = {
  match: 'not_found' | 'owned' | 'claimed_elsewhere' | 'state_mismatch'
  claimable: boolean
  player: IndexedPlayerRecord | null
  message: string
}

export type PlayerClaimApiResponse<T> = {
  status: 'success'
  data: T
  message?: string
  timestamp?: string
}

export type PlayerClaimApiError = {
  status?: 'error' | 'fail'
  message?: string
}
