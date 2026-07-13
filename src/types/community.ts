export type KingdomRecord = {
  id: string
  kingdom_number: number
  display_name: string
  description: string | null
  primary_language: string | null
  recruitment_status:
    | 'unknown'
    | 'closed'
    | 'limited'
    | 'recruiting'
    | 'transfer_only'
  transfer_status:
    | 'unknown'
    | 'closed'
    | 'preparing'
    | 'applications_open'
    | 'invites_in_progress'
    | 'completed'
  discord_invite_url: string | null
  recruitment_channel_url: string | null
  is_verified: boolean
  created_by: string | null
  verified_by: string | null
  verified_at: string | null
  created_at: string
  updated_at: string
}

export type KingdomMember = {
  membership_id: string
  kingdom_id: string
  kingdom_number: number
  joined_at: string

  player_account_id: string
  player_id: string
  player_name: string
  player_level: number | null
  level_rendered: string | null
  level_rendered_detailed: string | null
  level_image: string | null
  profile_photo: string | null
  verification_status:
    | 'linked'
    | 'pending'
    | 'community_verified'
    | 'officially_verified'
    | 'rejected'
    | 'revoked'
  last_refreshed_at: string

  user_id: string
}

export type AllianceVerificationStatus =
  | 'unverified'
  | 'pending'
  | 'community_verified'
  | 'forge_verified'
  | 'rejected'
  | 'revoked'

export type AllianceRecruitmentStatus =
  | 'unknown'
  | 'closed'
  | 'limited'
  | 'recruiting'
  | 'transfer_only'

export type AllianceMemberRole =
  | 'member'
  | 'recruiter'
  | 'officer'
  | 'r4'
  | 'leader'

export type AllianceRecord = {
  id: string
  kingdom_id: string
  kingdom_number: number
  tag: string
  name: string | null
  description: string | null
  primary_language: string | null
  secondary_languages: string[]
  timezone: string | null
  bear_time_utc: string | null
  gift_level: number | null
  member_capacity: number | null
  estimated_power: number | null
  recruitment_status: AllianceRecruitmentStatus
  minimum_power: number | null
  discord_invite_url: string | null
  recruitment_channel_url: string | null
  verification_status: AllianceVerificationStatus
  is_public: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  registered_member_count: number
}

export type AllianceMember = {
  membership_id: string
  alliance_id: string
  kingdom_id: string
  kingdom_number: number
  member_role: AllianceMemberRole
  joined_at: string | null

  player_account_id: string
  user_id: string
  player_id: string
  player_name: string
  player_level: number | null
  level_rendered: string | null
  level_rendered_detailed: string | null
  level_image: string | null
  profile_photo: string | null
  verification_status:
    | 'linked'
    | 'pending'
    | 'community_verified'
    | 'officially_verified'
    | 'rejected'
    | 'revoked'
  last_refreshed_at: string

  forge_id: string
}