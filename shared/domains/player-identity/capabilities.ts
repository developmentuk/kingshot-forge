export const PLAYER_IDENTITY_CAPABILITIES = [
  "player_identity.read_own",
  "player_identity.manage_links",
  "player_identity.manage_primary",
  "player_identity.manage_visibility",
  "player_identity.manage_alias",
  "player_identity.support.read",
  "player_identity.support.manage",
  "player_identity.verify",
  "player_identity.approve_high_risk",
  "player_identity.audit.read",
] as const

export type PlayerIdentityCapability =
  (typeof PLAYER_IDENTITY_CAPABILITIES)[number]

export interface PlayerIdentityCapabilityResolver {
  hasCapability(input: {
    readonly forgeUserId: string
    readonly capability: PlayerIdentityCapability
  }): Promise<boolean>
}

export const denyAllPlayerIdentityCapabilities: PlayerIdentityCapabilityResolver = {
  async hasCapability(): Promise<boolean> {
    return false
  },
}
