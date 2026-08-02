import type { KingshotPlayer } from './player'

export type OfficialPlayerChallenge = {
  challengeToken: string
  captchaImage: string
  expiresAt: string
  provider: 'century-games-gift-centre'
}

export type OfficialPlayerChallengeResponse = {
  status: 'success'
  data: OfficialPlayerChallenge
  message: string
  timestamp: string
}

export type OfficialPlayerLookupResponse = {
  status: 'success'
  data: KingshotPlayer
  lookupReceipt: string
  provider: 'century-games-gift-centre'
  message: string
  timestamp: string
}
