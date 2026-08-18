import type { GuideArticleDefinition } from '../guideTypes'
import { allianceBrawlGuide } from './allianceBrawl'
import { champagneFairGuide } from './champagneFair'
import { fishingTournamentGuide } from './fishingTournament'
import { kingdomOfPowerGuide } from './kingdomOfPower'
import { mysticDivinationGuide } from './mysticDivination'
import { swordlandGuide } from './swordland'
import { twinStarAdventureGuide } from './twinStarAdventure'

const guideArticles: GuideArticleDefinition[] = [
  champagneFairGuide,
  swordlandGuide,
  fishingTournamentGuide,
  mysticDivinationGuide,
  kingdomOfPowerGuide,
  allianceBrawlGuide,
  twinStarAdventureGuide,
]

export const guideArticlesBySlug: Record<string, GuideArticleDefinition> = Object.fromEntries(
  guideArticles.map((guide) => [guide.slug, guide]),
)
