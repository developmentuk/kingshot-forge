function enabled(value: unknown): boolean {
  return value === "enabled"
}

export const playerIdentityBrowserFlags = Object.freeze({
  ui: enabled(import.meta.env.VITE_PLAYER_IDENTITY_UI),
  linkedCharacters: enabled(import.meta.env.VITE_PLAYER_IDENTITY_LINKED_CHARACTERS),
  primaryCharacter: enabled(import.meta.env.VITE_PLAYER_IDENTITY_PRIMARY_CHARACTER),
  activeCharacter: enabled(import.meta.env.VITE_PLAYER_IDENTITY_ACTIVE_CHARACTER),
  visibility: enabled(import.meta.env.VITE_PLAYER_IDENTITY_VISIBILITY),
  publicProfiles: enabled(import.meta.env.VITE_PLAYER_IDENTITY_PUBLIC_PROFILES),
  supportTools: enabled(import.meta.env.VITE_PLAYER_IDENTITY_SUPPORT_TOOLS),
  persistence: enabled(import.meta.env.VITE_PLAYER_IDENTITY_PERSISTENCE),
  verification: enabled(import.meta.env.VITE_PLAYER_IDENTITY_VERIFICATION),
  giftIntegration: enabled(import.meta.env.VITE_PLAYER_IDENTITY_GIFT_INTEGRATION),
  artIntegration: enabled(import.meta.env.VITE_PLAYER_IDENTITY_ART_INTEGRATION),
  heroIntegration: enabled(import.meta.env.VITE_PLAYER_IDENTITY_HERO_INTEGRATION),
})

export const syntheticPlayerIdentityPreview = import.meta.env.MODE === "test" &&
  import.meta.env.VITE_PLAYER_IDENTITY_SYNTHETIC_FIXTURES === "synthetic_unit_test"
