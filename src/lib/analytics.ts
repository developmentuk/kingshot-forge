export const FORGE_GA_MEASUREMENT_ID = 'G-8L3HYETN51' as const

export const HERO_SKILL_ANALYTICS_EVENTS = [
  'hero_skills_workspace_viewed',
  'hero_skills_source_proposal_started',
  'hero_skills_source_proposal_submitted',
  'hero_skills_staged_fact_reviewed',
  'hero_skills_evidence_requested',
  'hero_skills_canonical_candidate_edited',
  'hero_skills_progression_validated',
  'hero_skills_unlock_validation_completed',
  'hero_skills_verification_run',
  'hero_skills_publication_readiness_checked',
  'hero_skills_public_section_viewed',
] as const

export type HeroSkillAnalyticsEvent = (typeof HERO_SKILL_ANALYTICS_EVENTS)[number]

declare global {
  interface Window {
    gtag?: (command: 'js' | 'config' | 'event', eventName: string | Date, parameters?: Readonly<Record<string, string | number | boolean>>) => void
  }
}

/** Sends only allow-listed, aggregate UI metadata. Never pass record text or IDs. */
export function trackHeroSkillAnalytics(
  eventName: HeroSkillAnalyticsEvent,
  parameters: Readonly<Record<string, string | number | boolean>> = {},
): void {
  window.gtag?.('event', eventName, {
    measurement_id: FORGE_GA_MEASUREMENT_ID,
    ...parameters,
  })
}
