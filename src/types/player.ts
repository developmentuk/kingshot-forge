export type KingshotPlayer = {
  playerId: string
  name: string
  kingdom: number
  level: number
  levelRendered: string
  levelRenderedDetailed: string
  levelImage: string | null
  profilePhoto: string | null
}

export type PlayerInfoResponse = {
  status: 'success'
  data: KingshotPlayer
  message: string
  timestamp: string
}

export type PlayerInfoErrorResponse = {
  status: 'error' | 'fail'
  message: string
  meta?: {
    code?: string
    errorKey?: string
  }
  timestamp?: string
}
