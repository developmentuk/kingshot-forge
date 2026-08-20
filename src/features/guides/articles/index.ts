import type { GuideArticleDefinition } from '../guideTypes'
import { allianceBrawlGuide } from './allianceBrawl'
import { buildingProgressionGuide } from './buildingProgression'
import { champagneFairGuide } from './champagneFair'
import { fishingTournamentGuide } from './fishingTournament'
import { generation7HeroesGuide } from './generation7Heroes'
import { governorCharmsGuide } from './governorCharms'
import { governorGearGuide } from './governorGear'
import { heroProgressionGuide } from './heroProgression'
import { heroRoleTierGuide } from './heroRoleTier'
import { kingdomOfPowerGuide } from './kingdomOfPower'
import { kvkScoringGuide } from './kvkScoring'
import { mastersGuide } from './masters'
import { mysticDivinationGuide } from './mysticDivination'
import { oasisIslandGuide } from './oasisIsland'
import { swordlandGuide } from './swordland'
import { troopTrainingGuide } from './troopTraining'
import { truegoldProgressionGuide } from './truegoldProgression'
import { twinStarAdventureGuide } from './twinStarAdventure'
import { vipProgressionGuide } from './vipProgression'
import { warAcademyGuide } from './warAcademy'

const guideArticles: GuideArticleDefinition[] = [
  champagneFairGuide,
  swordlandGuide,
  fishingTournamentGuide,
  mysticDivinationGuide,
  kingdomOfPowerGuide,
  kvkScoringGuide,
  allianceBrawlGuide,
  twinStarAdventureGuide,
  oasisIslandGuide,
  mastersGuide,
  generation7HeroesGuide,
  truegoldProgressionGuide,
  governorGearGuide,
  governorCharmsGuide,
  vipProgressionGuide,
  warAcademyGuide,
  heroProgressionGuide,
  heroRoleTierGuide,
  troopTrainingGuide,
  buildingProgressionGuide,
]

export const guideArticlesBySlug: Record<string, GuideArticleDefinition> = Object.fromEntries(
  guideArticles.map((guide) => [guide.slug, guide]),
)
