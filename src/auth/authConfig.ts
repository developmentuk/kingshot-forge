export type ForgeAuthProvider = 'google' | 'email' | 'discord' | 'facebook' | 'apple'

export const FORGE_AUTH_PROVIDER_AVAILABILITY: Readonly<Record<ForgeAuthProvider, boolean>> = {
  google: true,
  email: false,
  discord: false,
  facebook: false,
  apple: false,
}

export const CONNECTED_ACCOUNT_LINKING_AVAILABLE = false

export function isForgeAuthProviderAvailable(provider: ForgeAuthProvider): boolean {
  return FORGE_AUTH_PROVIDER_AVAILABILITY[provider]
}
