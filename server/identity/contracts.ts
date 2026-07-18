import type { ForgeRole, ForgeCapability } from './roleCapabilities.js'

export type AccountStatus = 'active' | 'restricted' | 'suspended' | 'deactivated'

export type LinkedPlayerSummary = {
  playerAccountId: string
  maskedPlayerId: string
  playerName: string
  kingdom: number
  verificationStatus: string
  verificationDate: string | null
  isPrimary: boolean
}

export type UserListItem = {
  userId: string
  displayName: string
  safeEmail: string | null
  avatarUrl: string | null
  createdAt: string
  lastSignInAt: string | null
  accountStatus: AccountStatus
  roles: ForgeRole[]
  capabilities: ForgeCapability[]
  workspaces: string[]
  linkedPlayerCount: number
  verifiedPlayer: boolean
  kingdom: number | null
  alliance: string | null
  contributor: boolean
  creator: boolean
  moderator: boolean
  autoRedeemConsent: 'active' | 'inactive' | 'unavailable'
}

export type UserRoleAssignment = {
  id: string
  role: ForgeRole
  active: boolean
  grantedAt: string
  grantReason: string
  revokedAt: string | null
  revokeReason: string | null
}

export type UserAuditEntry = {
  id: string
  actorUserId: string
  targetUserId: string
  action: string
  domain: string
  reason: string
  beforeState: Record<string, unknown>
  afterState: Record<string, unknown>
  createdAt: string
}

export type UserDetail = UserListItem & {
  providerNames: string[]
  emailConfirmed: boolean
  linkedPlayers: LinkedPlayerSummary[]
  assignments: UserRoleAssignment[]
  audit: UserAuditEntry[]
  safeRecentActivity: { source: string; occurredAt: string; summary: string }[]
}
