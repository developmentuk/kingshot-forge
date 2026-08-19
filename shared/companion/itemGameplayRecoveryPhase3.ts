import type {
  CompanionItemGameplayContent,
} from './itemGameplayContent.js'

const OWNER_VERIFICATION =
  'docs/companion/COMPANION_ITEM_GAMEPLAY_OWNER_VERIFICATION_2026-08-19.md'
const SWORDLAND_SOURCE = 'src/features/guides/articles/swordland.tsx'

const verified = (
  value: Omit<CompanionItemGameplayContent, 'trustState' | 'trustLabel' | 'confidenceLabel'>,
): CompanionItemGameplayContent => ({
  ...value,
  trustState: 'verified',
  trustLabel: 'Verified',
  confidenceLabel:
    'Verified in game and online by the project owner and approved for Forge publication on 19 August 2026',
})

export const COMPANION_ITEM_GAMEPLAY_RECOVERY_PHASE3:
Readonly<Record<string, CompanionItemGameplayContent>> = {
  'advanced-teleporter': verified({
    summary:
      'A city-mobility item that lets the player manually choose a destination on the kingdom map before relocating the city.',
    category: 'teleporter',
    categoryLabel: 'Teleporter',
    verificationNote:
      'Owner verification explicitly distinguishes Advanced Teleporter manual destination selection from Alliance Teleporter.',
    mechanics: [
      'Allows the player to manually choose a destination on the kingdom map for city relocation.',
      'This manual-location function belongs to Advanced Teleporter, not Alliance Teleporter.',
    ],
    usage: [
      'Use when precise city placement is required rather than relocation next to the Alliance Leader or to a random destination.',
    ],
    strategy: [
      'The governed Swordland preparation guide recommends keeping Advanced Teleports available for battlefield repositioning.',
    ],
    sources: [OWNER_VERIFICATION, SWORDLAND_SOURCE],
    tags: ['teleporter', 'manual-destination', 'swordland', 'mobility'],
  }),

  'alliance-teleporter': verified({
    summary:
      'Moves the player’s town directly close to the Alliance Leader (R5) on the kingdom map.',
    category: 'teleporter',
    categoryLabel: 'Teleporter',
    verificationNote:
      'Owner verification confirms Alliance Teleporter relocates close to the Alliance Leader and does not provide manual map-location selection.',
    mechanics: [
      'Moves the town/city directly close to the Alliance Leader (R5) on the kingdom map.',
      'It does not let the player manually choose any location on the map; that is the Advanced Teleporter function.',
    ],
    usage: [
      'Use when the goal is to relocate near the Alliance Leader rather than choose an exact map tile manually.',
    ],
    sources: [OWNER_VERIFICATION],
    tags: ['teleporter', 'alliance', 'r5', 'city-mobility'],
  }),

  'ceasers-aid-chest': verified({
    summary:
      'A Cesare’s Fury assistance chest earned for helping an ally defeat their Cesare Target.',
    category: 'event_reward_chest',
    categoryLabel: 'Event reward chest',
    verificationNote:
      'Owner verification confirms the assistance limits, contents and listed probabilities.',
    mechanics: [
      'Assisting an ally with their Cesare Target can award this chest up to 7 times per day and 21 chests across the event.',
      'Verified contents: 1 Mythic General Hero Shard (5%), 1 Epic General Hero Shard (20%), 100 Gems (25%), 1h General Speedup (20%), and 2 × 5m General Speedups (100%).',
    ],
    acquisition: [
      'Earned during Cesare’s Fury by assisting an ally in defeating their Cesare Target, subject to the verified daily and event limits.',
    ],
    usage: [
      'Open as a Cesare’s Fury reward chest for the listed shard, Gem and speedup rewards.',
    ],
    sources: [OWNER_VERIFICATION],
    tags: ['cesares-fury', 'reward-chest', 'hero-shards', 'speedups'],
  }),

  'champion-token': verified({
    summary:
      'A Swordland Summit prediction currency used to back a Match/Champion winner or exchange for rare items in the Prediction Shop.',
    category: 'event_currency',
    categoryLabel: 'Event currency',
    verificationNote:
      'Owner verification confirms the Swordland Summit prediction and Prediction Shop uses.',
    mechanics: [
      'Used during Swordland Summit to predict a Match/Champion winner.',
      'Can instead be exchanged for rare items in the event Prediction Shop.',
    ],
    usage: [
      'Choose between prediction use and shop redemption according to the current Swordland Summit options.',
    ],
    sources: [OWNER_VERIFICATION],
    tags: ['swordland-summit', 'prediction', 'event-currency'],
  }),

  compass: verified({
    summary:
      'A maritime/voyage event consumable that shortens voyage duration by 1 hour.',
    category: 'event_consumable',
    categoryLabel: 'Event consumable',
    verificationNote:
      'Owner verification confirms the one-hour voyage-duration reduction.',
    mechanics: [
      'Shortens the active voyage duration by 1 hour during supported maritime/voyage events.',
    ],
    usage: [
      'Use when reducing the remaining voyage timer by one hour advances the current event plan.',
    ],
    sources: [OWNER_VERIFICATION],
    tags: ['voyage', 'maritime', 'time-reduction', 'consumable'],
  }),

  'copper-horn': verified({
    summary: 'A resident Master gift that grants +10 Affinity.',
    category: 'master_gift',
    categoryLabel: 'Master gift',
    verificationNote: 'Owner verification confirms the +10 Affinity value.',
    mechanics: [
      'Gifting a Copper Horn to a resident Master grants +10 Affinity.',
    ],
    usage: [
      'Give to the resident Master whose Affinity progression you want to advance.',
    ],
    sources: [OWNER_VERIFICATION],
    tags: ['masters', 'affinity', 'gift'],
  }),

  'corsair-key': verified({
    summary:
      'A Buccaneer Bounty pirate key used to unlock event chests; unused keys carry over between event runs.',
    category: 'event_key',
    categoryLabel: 'Event key',
    verificationNote:
      'Owner verification confirms the Buccaneer Bounty chest-opening use and key carry-over behaviour.',
    mechanics: [
      'Unlocks event chests during Buccaneer Bounty.',
      'Unused Corsair Keys carry over to later Buccaneer Bounty event runs.',
    ],
    usage: [
      'Spend to open Buccaneer Bounty chests when the current run offers enough value for the account.',
    ],
    strategy: [
      'Because keys persist while Pearls of Enigma do not, keys can be saved until enough are available to complete desired event tiers.',
    ],
    sources: [OWNER_VERIFICATION],
    tags: ['buccaneer-bounty', 'event-key', 'persistent'],
  }),

  'custom-mythic-hero-gear-chest': verified({
    summary:
      'A selectable Hero Gear chest that lets the player choose an exact gold-tier Mythic gear piece instead of relying on a random drop.',
    category: 'hero_gear_chest',
    categoryLabel: 'Hero Gear chest',
    verificationNote:
      'Owner verification confirms the selection function and current Arena/event/pack acquisition routes.',
    mechanics: [
      'Allows selection of an exact Mythic (gold-tier) Hero Gear piece.',
      'Removes the random-drop uncertainty associated with non-selectable gear rewards.',
    ],
    acquisition: [
      'Arena Shop: currently available at 1 chest per week using Arena Tokens.',
      'Also appears as a top-tier reward in special events and in real-money store packs.',
    ],
    usage: [
      'Select the Mythic gear piece that directly fills the account’s planned Hero Gear gap.',
    ],
    sources: [OWNER_VERIFICATION],
    tags: ['hero-gear', 'mythic', 'selectable-chest', 'arena-shop'],
  }),

  'elite-spices': verified({
    summary: 'A high-value resident Master gift that grants +1,000 Affinity.',
    category: 'master_gift',
    categoryLabel: 'Master gift',
    verificationNote: 'Owner verification confirms the +1,000 Affinity value.',
    mechanics: [
      'Gifting Elite Spices to a resident Master grants +1,000 Affinity.',
    ],
    usage: [
      'Use on the resident Master whose Affinity progression gives the best current account value.',
    ],
    sources: [OWNER_VERIFICATION],
    tags: ['masters', 'affinity', 'gift'],
  }),

  'governor-gear-materials-chest': verified({
    summary:
      'A Governor Gear material chest containing 1 Artisan’s Vision, 4 Gilded Threads and 400 Satin.',
    category: 'governor_gear_chest',
    categoryLabel: 'Governor Gear material chest',
    verificationNote:
      'Owner verification confirms the chest contents and current acquisition examples.',
    mechanics: [
      'Contains Artisan’s Vision ×1, Gilded Threads ×4 and Satin ×400.',
    ],
    acquisition: [
      'Available from selected special in-game shop bundles.',
      'Can be earned from limited-time events, including Exquisite Tidal Treasures during voyage events.',
    ],
    usage: [
      'Open when the contained Governor Gear materials support a planned gear upgrade path.',
    ],
    sources: [OWNER_VERIFICATION],
    tags: ['governor-gear', 'artisans-vision', 'gilded-threads', 'satin', 'chest'],
  }),

  'governor-rename-card': verified({
    summary:
      'A Governor profile item that pays the rename cost, avoiding the normal 400-Gem charge.',
    category: 'account_item',
    categoryLabel: 'Account item',
    verificationNote:
      'Owner verification confirms the rename flow, 3–16 character rule, permitted standard characters and current Gem/Alliance Shop costs.',
    mechanics: [
      'Current rename flow: Profile (top-left avatar) → Pencil Edit Icon → Enter New Name → Confirm.',
      'Verified name length is 3 to 16 characters, with standard letters, numbers and spaces permitted.',
      'Using a Rename Card makes the rename free; without a card the current cost is 400 Gems.',
    ],
    acquisition: [
      'Can currently be purchased in the Alliance Shop for 4,000 Alliance Coins.',
    ],
    usage: [
      'Use from the Governor profile rename flow when changing the account name.',
    ],
    sources: [OWNER_VERIFICATION],
    tags: ['profile', 'rename', 'alliance-shop', 'account'],
  }),

  'growth-manual': verified({
    summary: 'A Pet progression resource used to level and advance Pets.',
    category: 'pet_material',
    categoryLabel: 'Pet material',
    verificationNote:
      'Owner verification confirms the Pet progression use and listed acquisition routes.',
    mechanics: [
      'Used to level up and advance Pets.',
    ],
    acquisition: [
      'Pet Adventure Treasure Spots and Ally Treasure.',
      'Beast Whisperer Event, Pet Shop and Side Missions.',
      'Pet Advancement Material Custom Chests and Store Packs.',
    ],
    usage: [
      'Spend according to the current Pet level/advancement requirement.',
    ],
    sources: [OWNER_VERIFICATION],
    tags: ['pets', 'growth', 'advancement', 'material'],
  }),

  'hunting-arrow': verified({
    summary:
      'An Alliance Bear Trap/Pitfall upgrade material earned from daily Intel Missions and donated to increase the alliance beast-damage buff.',
    category: 'alliance_material',
    categoryLabel: 'Alliance material',
    verificationNote:
      'Owner verification confirms the Intel Mission source, Bear Trap donation use and Level 5 +25% maximum attack-damage buff.',
    mechanics: [
      'Donated to upgrade the Alliance Bear Trap/Pitfall building.',
      'Bear Trap upgrades increase the overall attack-damage buff against the beast for alliance members, reaching +25% at Level 5.',
    ],
    acquisition: [
      'Earned through daily Intel Missions.',
    ],
    usage: [
      'Donate to the Alliance Bear Trap/Pitfall progression when alliance upgrades are available.',
    ],
    sources: [OWNER_VERIFICATION],
    tags: ['alliance', 'bear-trap', 'pitfall', 'intel-missions'],
  }),

  'league-token': verified({
    summary:
      'A Swordland Summit prediction currency used for match predictions or Prediction Shop rewards.',
    category: 'event_currency',
    categoryLabel: 'Event currency',
    verificationNote:
      'Owner verification confirms the Swordland Summit prediction and shop uses.',
    mechanics: [
      'Used to predict match outcomes during Swordland Summit.',
      'Can be spent in the Prediction Shop for rewards.',
    ],
    usage: [
      'Choose between prediction use and shop redemption according to the current Swordland Summit reward options.',
    ],
    sources: [OWNER_VERIFICATION],
    tags: ['swordland-summit', 'prediction', 'event-currency'],
  }),

  'lesser-truegold': verified({
    summary:
      'A persistent Truegold Refinement event currency exchanged for actual Truegold used in late-game building progression.',
    category: 'event_currency',
    categoryLabel: 'Event currency',
    verificationNote:
      'Owner verification confirms the Truegold Refinement sources, carry-over behaviour and exchange use.',
    mechanics: [
      'Obtained during Truegold Refinement and retained in inventory between refinement cycles if unused.',
      'Exchanged for actual Truegold used by high-level Town Center and late-game building upgrades.',
    ],
    acquisition: [
      'Gathering Quests, Stamina Spending Quests and Event Packs during Truegold Refinement.',
    ],
    usage: [
      'Exchange for Truegold when the resulting building progression fits the current account plan.',
    ],
    strategy: [
      'Because unused Lesser Truegold carries over, there is no need to force an inefficient exchange solely to empty the event balance.',
    ],
    sources: [OWNER_VERIFICATION],
    tags: ['truegold-refinement', 'truegold', 'event-currency', 'persistent'],
  }),

  'mark-of-valor-noble': verified({
    summary:
      'A generation-locked Hall of Heroes currency used to summon generation-exclusive Mythic Heroes or redeem eligible past-generation shards.',
    category: 'event_currency',
    categoryLabel: 'Event currency',
    verificationNote:
      'Owner verification confirms the Hall of Heroes use and generation-lock rules. The legacy identity key remains stable, while the player-facing name is corrected separately to Mark of Valor.',
    mechanics: [
      'Spent during Hall of Heroes to summon/unlock generation-exclusive Mythic Heroes or redeem eligible past-generation shards.',
      'Marks are generation-locked: for example, Gen 1 Marks cannot be used directly on Gen 2 or Gen 3 Hero Banners.',
      'Surplus older-generation Marks can be traded down according to the live Hall of Heroes exchange options.',
    ],
    usage: [
      'Spend only within the compatible generation’s Hall of Heroes options or the available older-mark exchange path.',
    ],
    strategy: [
      'Keep generation compatibility in mind before committing a stockpile; the item is not a universal cross-generation Hero currency.',
    ],
    sources: [OWNER_VERIFICATION],
    tags: ['hall-of-heroes', 'heroes', 'generation-locked', 'event-currency'],
  }),

  'mystery-badge': verified({
    summary:
      'The exclusive Mystery Shop currency, earned from high-tier Daily Mission activity and selected event/pack sources.',
    category: 'shop_currency',
    categoryLabel: 'Shop currency',
    verificationNote:
      'Owner verification confirms the acquisition routes and current discount-saving strategy.',
    mechanics: [
      'Used exclusively in the Mystery Shop.',
    ],
    acquisition: [
      'Highest-tier Daily Mission activity chest.',
      'Selected event milestones and Store Packs.',
    ],
    usage: [
      'Spend on worthwhile Mystery Shop offers rather than treating the badge balance as expiring currency.',
    ],
    strategy: [
      'Owner-verified strategy: save badges and refresh daily for 50%–70% discounted high-value offers such as Custom Hero Widget Chests, typically around 250 badges, or Forgehammers.',
    ],
    sources: [OWNER_VERIFICATION],
    tags: ['mystery-shop', 'currency', 'discounts', 'hero-widgets'],
  }),

  'mythic-general-decoration-component': verified({
    summary:
      'A universal Daybreak Island material used to claim or upgrade high-tier Mythic Decorations.',
    category: 'decoration_material',
    categoryLabel: 'Decoration material',
    verificationNote:
      'Owner verification confirms the 10:1 conversion and current source examples.',
    mechanics: [
      'Used for high-tier Mythic Decoration progression on Daybreak Island.',
      'Verified conversion rate: 10 components = 1 tier unit / upgrade piece.',
    ],
    acquisition: [
      'Daybreak Island Shop after Tree of Life Level 8, using Life Essence.',
      'Labyrinth Shop and major event rank rewards.',
    ],
    usage: [
      'Accumulate components until enough are available for the intended Mythic Decoration claim or upgrade.',
    ],
    sources: [OWNER_VERIFICATION],
    tags: ['daybreak-island', 'decoration', 'mythic', 'material'],
  }),

  'nutrient-potion': verified({
    summary:
      'A Pet advancement potion used to break through major Pet level caps, such as Level 10 to 11.',
    category: 'pet_material',
    categoryLabel: 'Pet material',
    verificationNote:
      'Owner verification confirms the cap-break use, acquisition routes and custom-chest quantity.',
    mechanics: [
      'Required to break through major Pet level caps, including the verified Level 10 → 11 example.',
    ],
    acquisition: [
      'Pet Adventure Treasure Spots and Ally Treasure.',
      'Pet Advancement Material Custom Chests; 1 chest can provide 2 Nutrient Potions.',
    ],
    usage: [
      'Spend at the relevant Pet cap-break requirement.',
    ],
    strategy: [
      'Save for KvK and Pet Advancement event windows when the same planned Pet progression can also earn event points.',
    ],
    sources: [OWNER_VERIFICATION],
    tags: ['pets', 'advancement', 'level-cap', 'kvk'],
  }),

  'pearl-of-enigma': verified({
    summary:
      'A temporary Buccaneer Bounty currency earned from Corsair-Key chests that expires when the event shop closes.',
    category: 'event_currency',
    categoryLabel: 'Event currency',
    verificationNote:
      'Owner verification confirms the earning method, non-persistence and automatic conversion behaviour.',
    mechanics: [
      'Earned by opening Buccaneer Bounty chests with Corsair Keys.',
      'Pearls do not carry over between event runs.',
      'Unused Pearls expire when the event shop closes and are automatically converted into basic speedups.',
    ],
    usage: [
      'Spend before the Buccaneer Bounty event shop closes if a current shop reward is preferable to the automatic expiry conversion.',
    ],
    strategy: [
      'Corsair Keys persist but Pearls do not, so hoarding keys until enough are available for desired event tiers can be more efficient than creating a small Pearl balance that will expire.',
    ],
    sources: [OWNER_VERIFICATION],
    tags: ['buccaneer-bounty', 'event-currency', 'expires', 'corsair-key'],
  }),

  'platinum-key': verified({
    summary:
      'A Recruit Hall key used for Advanced Recruitment, which can award hero shards, Hero XP, skill manuals and speedups.',
    category: 'recruitment_item',
    categoryLabel: 'Recruitment item',
    verificationNote:
      'Owner verification confirms the Advanced Recruitment function and listed acquisition routes.',
    mechanics: [
      'Consumes one Platinum Key to execute an Advanced Recruitment at the Recruit Hall.',
      'Advanced Recruitment can award hero shards, Hero XP, skill manuals and speedups.',
    ],
    acquisition: [
      'Conquest Battles, Daily Mission Chests, Call of the Sovereign and Store Packs.',
    ],
    usage: [
      'Use for Advanced Recruitment when the pull fits the account’s Hero progression or event plan.',
    ],
    sources: [OWNER_VERIFICATION],
    tags: ['recruit-hall', 'advanced-recruitment', 'heroes', 'key'],
  }),

  'promotion-medallion': verified({
    summary:
      'A rare Pet promotion material used at major progression thresholds every 10 levels and to unlock higher Pet skill tiers.',
    category: 'pet_material',
    categoryLabel: 'Pet material',
    verificationNote:
      'Owner verification confirms the milestone use, shop/event sources and custom-chest quantity.',
    mechanics: [
      'Required for Pet promotion at major thresholds every 10 levels.',
      'Supports progression into higher Pet skill tiers.',
    ],
    acquisition: [
      'Pet Adventures, Arena Shop, Tidal Shop, Alliance Shop and Alliance Championship Shop.',
      'Buccaneer Bounty, Champagne Fair and Pet Advancement Material Custom Chests.',
      'A Pet Advancement Material Custom Chest can provide 1 Promotion Medallion.',
    ],
    usage: [
      'Reserve for the next Pet promotion threshold rather than spending outside a planned advancement.',
    ],
    sources: [OWNER_VERIFICATION],
    tags: ['pets', 'promotion', 'skill-tier', 'material'],
  }),

  'silver-goblet': verified({
    summary: 'A luxury resident Master gift that grants +100 Affinity.',
    category: 'master_gift',
    categoryLabel: 'Master gift',
    verificationNote:
      'Owner verification confirms the +100 Affinity value and current source examples.',
    mechanics: [
      'Gifting a Silver Goblet to a resident Master grants +100 Affinity.',
    ],
    acquisition: [
      'Store Packs, Frontier Encounters, Realm Journeys and Achievement milestones.',
    ],
    usage: [
      'Give to the resident Master whose Affinity progression best fits the current account plan.',
    ],
    sources: [OWNER_VERIFICATION],
    tags: ['masters', 'affinity', 'gift'],
  }),

  'soldiers-medallion': verified({
    summary:
      'An Enlistment Office recovery item that immediately recovers eligible lost troops without waiting for natural Loyalty Point accumulation.',
    category: 'recovery_item',
    categoryLabel: 'Troop recovery item',
    verificationNote:
      'Owner verification confirms the Enlistment Office use, Infirmary-full activation context, up-to-70% recovery mechanic and wait bypass.',
    mechanics: [
      'Used at the Enlistment Office to recover eligible lost troops immediately instead of waiting for natural Loyalty Point accumulation.',
      'The Enlistment recovery mechanic activates when the Infirmary reaches maximum capacity during battle and can save up to 70% of lost troops.',
      'Spending Soldier’s Medallions bypasses the normal recovery wait timer.',
    ],
    usage: [
      'Spend when immediate recovery of eligible Enlistment Office troops is worth more than waiting for Loyalty Point recovery.',
    ],
    sources: [OWNER_VERIFICATION],
    tags: ['enlistment-office', 'troops', 'recovery', 'loyalty-points'],
  }),

  'transfer-pass': verified({
    summary:
      'A Kingdom Transfer migration item; the required number currently ranges from 1 to 50 according to account strength factors.',
    category: 'transfer_item',
    categoryLabel: 'Kingdom Transfer item',
    verificationNote:
      'Owner verification confirms the current 1–50 pass range, power/Governor Gear dependency and Alliance Shop/pack sources.',
    mechanics: [
      'Required to migrate the town to another kingdom during Kingdom Transfer.',
      'Current requirement ranges from 1 to 50 passes based on overall Account Power / Governor Gear statistics.',
    ],
    acquisition: [
      'Alliance Shop: currently 1 pass per week for 150,000 Alliance Coins.',
      'Also available from paid event packs.',
    ],
    usage: [
      'Accumulate the number shown by the live Kingdom Transfer requirement before attempting migration.',
    ],
    strategy: [
      'Because the shop purchase is weekly and transfer requirements can be high, build a pass reserve well before the intended transfer window.',
    ],
    sources: [OWNER_VERIFICATION],
    tags: ['kingdom-transfer', 'migration', 'alliance-shop'],
  }),

  'trial-crystal': verified({
    summary:
      'The Mystic Trial shop currency earned from clearing stages after the mode unlocks at Town Center Level 19.',
    category: 'event_currency',
    categoryLabel: 'Trial currency',
    verificationNote:
      'Owner verification confirms the Town Center unlock, stage-clear earning method and representative Trial Shop rewards.',
    mechanics: [
      'Earned from clearing Mystic Trial stages.',
      'Mystic Trial unlocks at Town Center Level 19.',
    ],
    usage: [
      'Spent in the Trial Shop for items including Truegold Dust, Mithril, Hero Gear XP and Charm Designs.',
    ],
    sources: [OWNER_VERIFICATION],
    tags: ['mystic-trial', 'trial-shop', 'currency', 'town-center-19'],
  }),

  'weapon-scraps': verified({
    summary:
      'A Champion’s Way event material dropped by standard world beasts and used to summon/rally Cesare’s Elite Rebels.',
    category: 'event_material',
    categoryLabel: 'Event material',
    verificationNote:
      'Owner verification confirms the Champion’s Way source, Cesare’s Elite Rebel use and carry-over behaviour.',
    mechanics: [
      'Dropped by defeating standard beasts on the world map during Champion’s Way.',
      'Used to summon and rally Cesare’s Elite Rebels.',
      'Surplus Weapon Scraps do not expire at the end of the event.',
    ],
    usage: [
      'Spend to summon/rally Cesare’s Elite Rebels when the current Champion’s Way plan calls for it.',
    ],
    strategy: [
      'Unused scraps can be hoarded for future Champion’s Way runs rather than spent simply to clear inventory.',
    ],
    sources: [OWNER_VERIFICATION],
    tags: ['champions-way', 'cesares-elite-rebels', 'beasts', 'persistent'],
  }),
}
