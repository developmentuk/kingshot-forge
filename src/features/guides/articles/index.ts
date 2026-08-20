import type { GuideArticleDefinition } from '../guideTypes'
import { allianceBrawlGuide } from './allianceBrawl'
import { bearHuntGuide } from './bearHunt'
import { buildingProgressionGuide } from './buildingProgression'
import { champagneFairGuide } from './champagneFair'
import { fishingTournamentGuide } from './fishingTournament'
import { generation7HeroesGuide } from './generation7Heroes'
import { governorCharmsGuide } from './governorCharms'
import { governorGearGuide } from './governorGear'
import { hallOfGovernorsGuide } from './hallOfGovernors'
import { heroProgressionGuide } from './heroProgression'
import { heroRoleTierGuide } from './heroRoleTier'
import { kingdomOfPowerGuide } from './kingdomOfPower'
import { kingdomTransferGuide } from './kingdomTransfer'
import { kvkScoringGuide } from './kvkScoring'
import { mastersGuide } from './masters'
import { mysticDivinationGuide } from './mysticDivination'
import { mysticTrialGuide } from './mysticTrial'
import { oasisIslandGuide } from './oasisIsland'
import { swordlandGuide } from './swordland'
import { triAllianceClashGuide } from './triAllianceClash'
import { troopTrainingGuide } from './troopTraining'
import { truegoldProgressionGuide } from './truegoldProgression'
import { twinStarAdventureGuide } from './twinStarAdventure'
import { vipProgressionGuide } from './vipProgression'
import { warAcademyGuide } from './warAcademy'

const guideArticles: GuideArticleDefinition[] = [
  mysticTrialGuide,
  kingdomTransferGuide,
  triAllianceClashGuide,
  hallOfGovernorsGuide,
  bearHuntGuide,
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
