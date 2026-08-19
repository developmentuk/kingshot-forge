import type {
  CompanionItemGameplayContent,
} from './itemGameplayContent.js'

const RECOVERY_NOTE =
  'docs/companion/COMPANION_ITEM_GAMEPLAY_RECOVERY_2026-08-19.md'
const MYSTIC_SOURCE = 'src/features/guides/articles/mysticDivination.tsx'
const SWORDLAND_SOURCE = 'src/features/guides/articles/swordland.tsx'
const KVK_SOURCE = 'src/features/guides/articles/kingdomOfPower.tsx'
const FAIR_SOURCE = 'src/features/guides/articles/champagneFair.tsx'
const TWIN_STAR_SOURCE = 'src/features/guides/articles/twinStarAdventure.tsx'
const OASIS_SOURCE = 'src/features/guides/articles/oasisIsland.tsx'
const MASTERS_SOURCE = 'src/features/guides/articles/masters.tsx'

const confirmed = (
  value: Omit<CompanionItemGameplayContent, 'trustState' | 'trustLabel' | 'confidenceLabel'>,
): CompanionItemGameplayContent => ({
  ...value,
  trustState: 'confirmed',
  trustLabel: 'Confirmed',
  confidenceLabel:
    'Owner-supplied verified material or governed Forge data supports these gameplay facts',
})

const provisional = (
  value: Omit<CompanionItemGameplayContent, 'trustState' | 'trustLabel' | 'confidenceLabel'>,
): CompanionItemGameplayContent => ({
  ...value,
  trustState: 'provisional',
  trustLabel: 'Provisional',
  confidenceLabel:
    'Supplied gameplay evidence supports the shown facts, while complete item rules remain intentionally unpublished',
})

export const COMPANION_ITEM_GAMEPLAY_RECOVERY_PHASE2:
Readonly<Record<string, CompanionItemGameplayContent>> = {
  'fortune-token': provisional({
    summary:
      'The persistent spend currency used for Mystic Divination card flips and board progression.',
    category: 'event_currency',
    categoryLabel: 'Event currency',
    verificationNote:
      'The supplied Mystic Divination guide defines Fortune Tokens as the event spend currency and states that unused tokens persist between event runs.',
    mechanics: [
      'Fortune Tokens are spent to flip cards in Mystic Divination, with the supplied event guide describing escalating token costs as more cards are revealed.',
      'The supplied guide states that unused Fortune Tokens carry over between Mystic Divination event runs.',
    ],
    acquisition: [
      'The supplied guide describes free daily and Daily Mission acquisition, with paid packs as an additional source. Exact quantities remain source-version details rather than permanent constants.',
    ],
    usage: [
      'Spend on Mystic Divination flips and resets according to the current board and reward target.',
    ],
    strategy: [
      'Because the supplied guide describes Fortune Tokens as persistent, saving them for a later event can be better than forcing an inefficient board cycle.',
    ],
    sources: [MYSTIC_SOURCE, RECOVERY_NOTE],
    tags: ['mystic-divination', 'event-currency', 'persistent'],
  }),

  'truegold-dust': confirmed({
    summary:
      'A War Academy research material recorded as a per-level cost across the supplied research dataset.',
    category: 'research_material',
    categoryLabel: 'Research material',
    verificationNote:
      'The owner-supplied War Academy dataset explicitly records `truegoldDust` costs across its technology progression. Costs vary by technology and level.',
    mechanics: [
      'Consumed by War Academy technology research alongside ordinary settlement resources and Gold in the supplied dataset.',
      'The supplied dataset records different Truegold Dust requirements by technology and level, so there is no single flat research cost.',
    ],
    usage: [
      'Reserve the amount required by the exact War Academy technology and target level being researched.',
    ],
    strategy: [
      'Where practical, coordinate planned research spending with event windows that reward progression rather than consuming the stockpile automatically on receipt.',
    ],
    sources: [RECOVERY_NOTE, KVK_SOURCE],
    tags: ['war-academy', 'research', 'truegold-dust', 'material'],
  }),

  'advanced-teleporter': provisional({
    summary:
      'A city-mobility item the supplied Swordland preparation guidance specifically recommends saving for battlefield repositioning.',
    category: 'teleporter',
    categoryLabel: 'Teleporter',
    verificationNote:
      'The supplied Swordland material explicitly includes Advanced Teleports in the recommended consumable stockpile. Complete destination-selection and acquisition rules are not reconstructed here.',
    mechanics: [
      'Used as part of Swordland city mobility and battlefield repositioning in the supplied strategy.',
    ],
    usage: [
      'Keep available when Swordland positioning changes require a city move rather than spending the item casually outside the event plan.',
    ],
    strategy: [
      'The supplied Swordland checklist recommends saving Advanced Teleports specifically for the event alongside Counter Recon and March Speedups.',
    ],
    sources: [SWORDLAND_SOURCE, RECOVERY_NOTE],
    tags: ['teleporter', 'swordland', 'mobility'],
  }),

  'random-teleporter': provisional({
    summary:
      'An emergency city-repositioning item used in the supplied Kingdom of Power strategy as a safeguard when a city cannot be saved from being zeroed.',
    category: 'teleporter',
    categoryLabel: 'Teleporter',
    verificationNote:
      'The supplied KvK guidance supports the emergency defensive use. It does not provide a complete random-location algorithm or full acquisition rules.',
    mechanics: [
      'Repositions the city and is used in the supplied KvK strategy as an emergency escape option.',
    ],
    usage: [
      'Use when the city cannot be defended or saved and immediate repositioning is preferable to remaining exposed.',
    ],
    strategy: [
      'The supplied Kingdom of Power zeroing-safeguard guidance recommends burning a Random Teleport immediately when the city cannot be saved.',
    ],
    sources: [KVK_SOURCE, RECOVERY_NOTE],
    tags: ['teleporter', 'kvk', 'city-defense'],
  }),

  'gold-key': provisional({
    summary:
      'A hero recruitment key that can generate hero pulls and duplicate shards, with specific Champagne Fair planning value in the supplied guide.',
    category: 'recruitment_item',
    categoryLabel: 'Recruitment item',
    verificationNote:
      'The supplied Champagne Fair material explicitly treats Gold Key pulls as a source of hero duplicates/shards and recommends considering stored keys before the final Fair exchange calculation.',
    mechanics: [
      'Used in the hero recruitment/pull loop described by the supplied Champagne Fair guide.',
      'Recruitment pulls can create additional duplicate hero shards, including surplus shards from already-maxed heroes.',
    ],
    usage: [
      'Use for hero recruitment when the resulting pulls fit the account progression or event plan.',
    ],
    strategy: [
      'The supplied Champagne Fair strategy recommends considering stored Gold Keys before final shard exchange because recruitment can create additional eligible duplicates.',
    ],
    sources: [FAIR_SOURCE, RECOVERY_NOTE],
    tags: ['recruitment', 'heroes', 'champagne-fair', 'key'],
  }),

  'lucky-hero-gear-chest': provisional({
    summary:
      'A Hero Gear reward chest recorded among Twin Star Adventure Ice Megalodon damage milestones.',
    category: 'hero_gear_reward',
    categoryLabel: 'Hero Gear reward',
    verificationNote:
      'The supplied Twin Star Adventure guide supports the chest as an Ice Megalodon milestone reward. No item-content odds are published because the recoverable source does not provide them.',
    acquisition: [
      'Recorded as a reward at Ice Megalodon damage milestones in the supplied Twin Star Adventure guide.',
    ],
    usage: [
      'Treat it as a Hero Gear progression reward chest; exact contents and probabilities remain unpublished until a governed source provides them.',
    ],
    sources: [TWIN_STAR_SOURCE, RECOVERY_NOTE],
    tags: ['hero-gear', 'reward-chest', 'twin-star-adventure'],
  }),

  bread: confirmed({
    summary:
      'A core settlement resource consumed by building progression and supported by dedicated Bread gathering effects in Oasis Island.',
    category: 'settlement_resource',
    categoryLabel: 'Settlement resource',
    verificationNote:
      'The owner-supplied Buildings dataset records Bread as an upgrade cost across building progression, while the supplied Oasis material independently records a Bread Gathering Speed effect.',
    mechanics: [
      'Consumed as a building upgrade resource in the supplied Buildings progression dataset; required amounts depend on the building and level.',
      'The supplied Oasis Island data connects the Deluxe Restaurant to Bread Gathering Speed.',
    ],
    usage: [
      'Reserve against the exact building and level cost rather than assuming a flat requirement.',
    ],
    strategy: [
      'Opened city resources are subject to Storehouse protection rules; plan large building spends with protected and exposed stock in mind.',
    ],
    sources: [OASIS_SOURCE, RECOVERY_NOTE],
    tags: ['resource', 'buildings', 'oasis-island', 'bread'],
  }),

  wood: confirmed({
    summary:
      'A core settlement resource consumed by building progression and supported by dedicated Wood gathering effects in Oasis Island.',
    category: 'settlement_resource',
    categoryLabel: 'Settlement resource',
    verificationNote:
      'The owner-supplied Buildings dataset records Wood as an upgrade cost across building progression, while the supplied Oasis material independently records a Wood Gathering Speed effect.',
    mechanics: [
      'Consumed as a building upgrade resource in the supplied Buildings progression dataset; required amounts depend on the building and level.',
      'The supplied Oasis Island data connects the Conservatory to Wood Gathering Speed.',
    ],
    usage: [
      'Reserve against the exact building and level cost rather than assuming a flat requirement.',
    ],
    strategy: [
      'Opened city resources are subject to Storehouse protection rules; plan large building spends with protected and exposed stock in mind.',
    ],
    sources: [OASIS_SOURCE, RECOVERY_NOTE],
    tags: ['resource', 'buildings', 'oasis-island', 'wood'],
  }),

  stone: confirmed({
    summary:
      'A core settlement resource consumed by building progression and supported by dedicated Stone gathering effects in Oasis Island.',
    category: 'settlement_resource',
    categoryLabel: 'Settlement resource',
    verificationNote:
      'The owner-supplied Buildings dataset records Stone as an upgrade cost across building progression, while the supplied Oasis material independently records a Stone Gathering Speed effect.',
    mechanics: [
      'Consumed as a building upgrade resource in the supplied Buildings progression dataset; required amounts depend on the building and level.',
      'The supplied Oasis Island data connects the Ore Stow to Stone Gathering Speed.',
    ],
    usage: [
      'Reserve against the exact building and level cost rather than assuming a flat requirement.',
    ],
    strategy: [
      'Opened city resources are subject to Storehouse protection rules; plan large building spends with protected and exposed stock in mind.',
    ],
    sources: [OASIS_SOURCE, RECOVERY_NOTE],
    tags: ['resource', 'buildings', 'oasis-island', 'stone'],
  }),

  iron: confirmed({
    summary:
      'A core settlement resource consumed by building progression and supported by dedicated Iron mining effects in Oasis Island.',
    category: 'settlement_resource',
    categoryLabel: 'Settlement resource',
    verificationNote:
      'The owner-supplied Buildings dataset records Iron as an upgrade cost across building progression, while the supplied Oasis material independently records an Iron Mining Speed effect.',
    mechanics: [
      'Consumed as a building upgrade resource in the supplied Buildings progression dataset; required amounts depend on the building and level.',
      'The supplied Oasis Island data connects the Blacksmith to Iron Mining Speed.',
    ],
    usage: [
      'Reserve against the exact building and level cost rather than assuming a flat requirement.',
    ],
    strategy: [
      'Opened city resources are subject to Storehouse protection rules; plan large building spends with protected and exposed stock in mind.',
    ],
    sources: [OASIS_SOURCE, RECOVERY_NOTE],
    tags: ['resource', 'buildings', 'oasis-island', 'iron'],
  }),

  'arena-token': provisional({
    summary:
      'An Arena progression currency connected to Arena token income and shop efficiency in the verified Masters material.',
    category: 'arena_currency',
    categoryLabel: 'Arena currency',
    verificationNote:
      'The verified Masters material records Roman skills that affect Arena token income and Arena shop efficiency. Universal earning amounts and the complete shop catalogue are not reconstructed here.',
    mechanics: [
      'Part of the Arena progression/reward economy described by the verified Masters material.',
      'Roman skills can affect Arena token income and Arena shop efficiency in the current Masters workbook/guide.',
    ],
    usage: [
      'Use within the Arena reward/shop economy according to the live Arena options available to the account.',
    ],
    sources: [MASTERS_SOURCE, RECOVERY_NOTE],
    tags: ['arena', 'currency', 'masters', 'roman'],
  }),
}
