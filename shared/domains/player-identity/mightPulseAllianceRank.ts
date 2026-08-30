export type ForgeAllianceMemberRole =
  | 'member'
  | 'recruiter'
  | 'officer'
  | 'r4'
  | 'leader'

export function mapMightPulseAllianceRank(
  rank: number | null | undefined,
): ForgeAllianceMemberRole | null {
  switch (rank) {
    case 1:
      return 'member'
    case 2:
      return 'recruiter'
    case 3:
      return 'officer'
    case 4:
      return 'r4'
    case 5:
      return 'leader'
    default:
      return null
  }
}

export function isAllianceManagementRank(
  role: ForgeAllianceMemberRole | null,
): role is 'r4' | 'leader' {
  return role === 'r4' || role === 'leader'
}
