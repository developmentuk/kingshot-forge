export type PlayerTransferStatus =
  | 'open'
  | 'considering'
  | 'not_moving'

export type PlayerProfile = {
  id: string
  player_account_id: string
  forge_id: string

  alliance_name: string | null
  town_center_level: string | null
  vip_level: number | null

  about_me: string | null
  play_style: string | null
  main_language: string | null

  transfer_status: PlayerTransferStatus
  activities: string[]

  is_public: boolean

  created_at: string
  updated_at: string
}