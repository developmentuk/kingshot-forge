export type UserRole =
  | 'member'
  | 'contributor'
  | 'moderator'
  | 'admin'
  | 'owner'

export type Profile = {
  id: string
  display_name: string | null
  avatar_url: string | null
  alliance: string | null
  role: UserRole
  created_at: string
  updated_at: string
}