export const PLAYER_IDENTITY_FEATURE_FLAG_ENV = {
  ui: "PLAYER_IDENTITY_UI",
  linkedCharacters: "PLAYER_IDENTITY_LINKED_CHARACTERS",
  primaryCharacter: "PLAYER_IDENTITY_PRIMARY_CHARACTER",
  activeCharacter: "PLAYER_IDENTITY_ACTIVE_CHARACTER",
  visibility: "PLAYER_IDENTITY_VISIBILITY",
  publicProfiles: "PLAYER_IDENTITY_PUBLIC_PROFILES",
  supportTools: "PLAYER_IDENTITY_SUPPORT_TOOLS",
  persistence: "PLAYER_IDENTITY_PERSISTENCE",
  verification: "PLAYER_IDENTITY_VERIFICATION",
  giftIntegration: "PLAYER_IDENTITY_GIFT_INTEGRATION",
  artIntegration: "PLAYER_IDENTITY_ART_INTEGRATION",
  heroIntegration: "PLAYER_IDENTITY_HERO_INTEGRATION",
} as const

export type PlayerIdentityFeature = keyof typeof PLAYER_IDENTITY_FEATURE_FLAG_ENV

export type PlayerIdentityFeatureFlags = Readonly<
  Record<PlayerIdentityFeature, boolean>
>

export function isExactFeatureFlagEnabled(value: unknown): boolean {
  return value === "enabled"
}

export function resolvePlayerIdentityFeatureFlags(
  environment: Readonly<Record<string, string | undefined>>,
): PlayerIdentityFeatureFlags {
  return Object.freeze(Object.fromEntries(
    Object.entries(PLAYER_IDENTITY_FEATURE_FLAG_ENV).map(([feature, key]) => [
      feature,
      isExactFeatureFlagEnabled(environment[key]),
    ]),
  ) as Record<PlayerIdentityFeature, boolean>)
}

export const PLAYER_IDENTITY_FEATURE_FLAGS_OFF = resolvePlayerIdentityFeatureFlags({})
