export type TransferProfileStatus =
  | 'draft'
  | 'looking'
  | 'paused'
  | 'matched'
  | 'transferred'
  | 'withdrawn'

export type TransferInvitationType =
  | 'unknown'
  | 'ordinary'
  | 'special'
  | 'leading'
  | 'not_required'
  | 'custom'

export type TransferPlayStyle =
  | 'casual'
  | 'active'
  | 'competitive'
  | 'highly_competitive'
  | 'mixed'

export type TransferSpendingStyle =
  | 'f2p'
  | 'low_spender'
  | 'moderate_spender'
  | 'high_spender'
  | 'prefer_not_to_say'

export type TransferProfile = {
  id: string
  user_id: string
  player_account_id: string

  current_kingdom_id: string
  current_kingdom_number: number
  current_alliance_id: string | null

  status: TransferProfileStatus

  player_power: number | null

  main_language: string | null
  additional_languages: string[]

  preferred_event_times_utc: string[]

  play_style: TransferPlayStyle | null
  spending_style: TransferSpendingStyle | null

  preferred_kingdoms: number[]
  avoided_kingdoms: number[]

  preferred_alliance_type: string | null
  preferred_bear_times_utc: string[]

  invitation_type_needed: TransferInvitationType
  custom_invitation_type: string | null

  available_from: string | null
  available_until: string | null

  public_message: string | null
  private_notes: string | null

  discord_username: string | null
  allow_direct_contact: boolean

  is_public: boolean

  last_refreshed_at: string
  created_at: string
  updated_at: string
}