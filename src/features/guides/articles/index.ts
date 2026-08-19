import type { GuideArticleDefinition } from '../guideTypes'
import { allianceBrawlGuide } from './allianceBrawl'
import { champagneFairGuide } from './champagneFair'
import { fishingTournamentGuide } from './fishingTournament'
import { generation7HeroesGuide } from './generation7Heroes'
import { kingdomOfPowerGuide } from './kingdomOfPower'
import { mastersGuide } from './masters'
import { mysticDivinationGuide } from './mysticDivination'
import { oasisIslandGuide } from './oasisIsland'
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
  oasisIslandGuide,
  mastersGuide,
  generation7HeroesGuide,
]

export const guideArticlesBySlug: Record<string, GuideArticleDefinition> = Object.fromEntries(
  guideArticles.map((guide) => [guide.slug, guide]),
)
