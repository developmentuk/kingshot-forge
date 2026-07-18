export type PlayerVerificationStatus =
  | 'linked'
  | 'verified'
  | 'pending'
  | 'community_verified'
  | 'officially_verified'
  | 'rejected'
  | 'revoked'

export type PlayerVerificationMethod =
  | 'none'
  | 'kingshot_player_lookup'
  | 'alliance_officer'
  | 'kingdom_moderator'
  | 'forge_admin'
  | 'century_games_code'

export type PlayerAccount = {
  id: string
  user_id: string
  player_id: string
  player_name: string
  kingdom_id: number
  player_level: number | null
  level_rendered: string | null
  level_rendered_detailed: string | null
  level_image: string | null
  profile_photo: string | null
  verification_status: PlayerVerificationStatus
  verification_method: PlayerVerificationMethod
  verified_by: string | null
  verified_at: string | null
  last_refreshed_at: string
  is_primary: boolean
  is_public: boolean
  created_at: string
  updated_at: string
}
