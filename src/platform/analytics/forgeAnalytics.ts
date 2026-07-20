export const FORGE_ANALYTICS_MEASUREMENT_ID = "G-8L3HYETN51"

export type ForgePlayerAnalyticsEvent =
  | "player_identity_page_viewed"
  | "linked_character_flow_started"
  | "linked_character_proposal_submitted"
  | "primary_character_changed"
  | "active_character_selected"
  | "active_character_rejected"
  | "player_visibility_updated"
  | "public_alias_proposed"
  | "public_profile_viewed"
  | "hero_showcase_selection_updated"
  | "support_case_opened"

const FORBIDDEN_ANALYTICS_KEY = /(alias|audit|character|evidence|forge|identifier|note|player|proof|revision|support|visibility)/i

declare global {
  interface Window {
    gtag?: (command: 'js' | 'config' | 'event', name: string | Date, parameters?: Readonly<Record<string, string | number | boolean>>) => void
  }
}

export function trackForgePlayerEvent(
  event: ForgePlayerAnalyticsEvent,
  parameters: Readonly<Record<string, string | number | boolean>> = {},
): void {
  for (const key of Object.keys(parameters)) {
    if (FORBIDDEN_ANALYTICS_KEY.test(key)) {
      throw new Error(`Private Player analytics parameter rejected: ${key}`)
    }
  }
  window.gtag?.("event", event, parameters)
}
