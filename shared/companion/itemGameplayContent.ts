export type CompanionItemGameplayTrustState =
  | 'verified'
  | 'confirmed'
  | 'provisional'
  | 'research_needed'

export type CompanionItemGameplayContent = {
  summary: string
  category?: string
  categoryLabel?: string
  trustState?: CompanionItemGameplayTrustState
  trustLabel?: string
  verificationNote?: string
  confidenceLabel?: string
  mechanics?: readonly string[]
  acquisition?: readonly string[]
  usage?: readonly string[]
  strategy?: readonly string[]
  sources: readonly string[]
  tags?: readonly string[]
}

const GEAR_SOURCE = 'src/features/guides/articles/governorGear.tsx'
const CHARM_SOURCE = 'src/features/guides/articles/governorCharms.tsx'
const TRUEGOLD_SOURCE = 'src/features/guides/articles/truegoldProgression.tsx'
const KVK_SOURCE = 'src/features/guides/articles/kingdomOfPower.tsx'
const FAIR_SOURCE = 'src/features/guides/articles/champagneFair.tsx'
const FISHING_SOURCE = 'src/features/guides/articles/fishingTournament.tsx'
const MASTERS_SOURCE = 'src/features/guides/articles/masters.tsx'

const confirmed = (
  value: Omit<CompanionItemGameplayContent, 'trustState' | 'trustLabel' | 'confidenceLabel'>,
): CompanionItemGameplayContent => ({
  ...value,
  trustState: 'confirmed',
  trustLabel: 'Confirmed',
  confidenceLabel: 'Published Forge data or governed guide supports these gameplay facts',
})

const provisional = (
  value: Omit<CompanionItemGameplayContent, 'trustState' | 'trustLabel' | 'confidenceLabel'>,
): CompanionItemGameplayContent => ({
  ...value,
  trustState: 'provisional',
  trustLabel: 'Provisional',
  confidenceLabel: 'Published Forge guidance supports the shown facts; complete item coverage is still being recovered',
})

export const COMPANION_ITEM_GAMEPLAY_CONTENT: Readonly<Record<string, CompanionItemGameplayContent>> = {
  mithril: provisional({
    summary: 'A high-level Hero Gear progression material and recurring late-game bottleneck that also appears in Kingdom of Power preparation planning.',
    category: 'hero_gear_material',
    categoryLabel: 'Hero Gear material',
    verificationNote: 'Hero Gear usage is retained from the governed Companion intake; current Forge event guides independently connect Mithril to late-game progression and KvK resource planning.',
    mechanics: [
      'Used in high-level Hero Gear progression.',
      'Treated by Forge event guidance as a scarce late-game progression material rather than a routine farmable resource.',
    ],
    acquisition: [
      'The Champagne Fair guide lists Mithril as a Redemption Shop target and its highest-priority purchase in the supplied strategy.',
    ],
    usage: [
      'Spend on Hero Gear progression when the upgrade is part of your account plan.',
      'Kingdom of Power guidance recommends preserving major progression materials between KvK cycles and spending them in useful scoring windows where possible.',
    ],
    strategy: [
      'Do not convert persistent Fair Vouchers into lower-value filler if saving for Mithril creates more account value.',
    ],
    sources: [FAIR_SOURCE, KVK_SOURCE, 'docs/companion/assets/ITEM-ASSET-INTAKE-2026-08-03.json'],
    tags: ['hero-gear', 'kvk', 'champagne-fair', 'bottleneck'],
  }),

  forgehammer: provisional({
    summary: 'A Hero Gear progression material with recurring event reward and scoring connections across Forge guides.',
    category: 'hero_gear_material',
    categoryLabel: 'Hero Gear material',
    verificationNote: 'The governed Companion intake confirms Hero Gear and Kingdom of Power relationships; current Masters and Champagne Fair guides add acquisition context.',
    mechanics: [
      'Used by Hero Gear progression.',
      'Appears as a strategic progression material in Kingdom of Power preparation planning.',
    ],
    acquisition: [
      'The Masters guide records Forgehammer rewards through Valora and Arena Star Chest context through Roman.',
      'The Champagne Fair guide lists Forgehammers among useful secondary Redemption Shop choices.',
    ],
    usage: [
      'Use for Hero Gear progression and time major spending around overlapping progression/event goals where practical.',
    ],
    strategy: [
      'Kingdom of Power guidance recommends saving major gear materials between KvK cycles instead of spending automatically on receipt.',
    ],
    sources: [MASTERS_SOURCE, FAIR_SOURCE, KVK_SOURCE, 'docs/companion/assets/ITEM-ASSET-INTAKE-2026-08-03.json'],
    tags: ['hero-gear', 'masters', 'kvk', 'champagne-fair'],
  }),

  'gilded-threads': confirmed({
    summary: 'A Governor Gear upgrade material used throughout the 58-step Green to Red T6 progression.',
    category: 'governor_gear_material',
    categoryLabel: 'Governor Gear material',
    verificationNote: 'The published Governor Gear guide is backed by Forge’s governed 58-step progression dataset.',
    mechanics: ['Consumed alongside Satin and, from later steps, Artisan’s Vision when upgrading Governor Gear.'],
    usage: ['Use the current Governor Gear tier/star requirement rather than treating the material as a flat per-upgrade cost.'],
    strategy: ['Plan all six gear pieces before committing a scarce stockpile to one upgrade path.'],
    sources: [GEAR_SOURCE],
    tags: ['governor-gear', 'material'],
  }),

  satin: confirmed({
    summary: 'A core Governor Gear upgrade material used throughout the 58-step Green to Red T6 progression.',
    category: 'governor_gear_material',
    categoryLabel: 'Governor Gear material',
    verificationNote: 'The published Governor Gear guide is backed by Forge’s governed 58-step progression dataset.',
    mechanics: ['Consumed alongside Gilded Threads and, from later steps, Artisan’s Vision when upgrading Governor Gear.'],
    usage: ['Use the exact tier/star requirement from the Governor Gear progression rather than assuming a constant cost.'],
    strategy: ['Treat large late-game Satin requirements as part of full-set planning, not just the next individual piece.'],
    sources: [GEAR_SOURCE],
    tags: ['governor-gear', 'material'],
  }),

  'artisans-vision': confirmed({
    summary: 'A Governor Gear upgrade material introduced at Blue 2★ and used through later progression tiers.',
    category: 'governor_gear_material',
    categoryLabel: 'Governor Gear material',
    verificationNote: 'Forge’s governed Governor Gear progression records Artisan’s Vision from Blue 2★ onward.',
    mechanics: ['Begins appearing in Governor Gear upgrade requirements at Blue 2★ and remains part of later upgrade steps.'],
    acquisition: ['The Champagne Fair guide lists Artisan’s Vision among strong secondary Redemption Shop choices when it unlocks meaningful progression.'],
    usage: ['Spend according to the exact Governor Gear tier/star requirement.'],
    strategy: ['Avoid buying or spending it simply because it is available; prioritise upgrades that advance the gear set you actually use.'],
    sources: [GEAR_SOURCE, FAIR_SOURCE],
    tags: ['governor-gear', 'material', 'champagne-fair'],
  }),

  'charm-guide': confirmed({
    summary: 'A Governor Charm upgrade material with governed requirements across Charm Levels 1–22.',
    category: 'governor_charm_material',
    categoryLabel: 'Governor Charm material',
    verificationNote: 'Forge’s published Governor Charms guide is backed by the governed Level 1–22 Charm dataset.',
    mechanics: ['Consumed together with Charm Designs to upgrade Governor Charms; the amount changes by Charm level.'],
    acquisition: ['The Champagne Fair guide lists Charm Guides among useful secondary Redemption Shop choices.'],
    usage: ['Use the Level 1–22 requirement table to plan the number needed for a target Charm level.'],
    strategy: ['Plan cumulative material requirements before committing to multiple Charm upgrades.'],
    sources: [CHARM_SOURCE, FAIR_SOURCE],
    tags: ['governor-charms', 'material', 'champagne-fair'],
  }),

  'charm-design': confirmed({
    summary: 'A Governor Charm upgrade material with governed requirements across Charm Levels 1–22.',
    category: 'governor_charm_material',
    categoryLabel: 'Governor Charm material',
    verificationNote: 'Forge’s published Governor Charms guide is backed by the governed Level 1–22 Charm dataset.',
    mechanics: ['Consumed together with Charm Guides to upgrade Governor Charms; the amount changes by Charm level.'],
    acquisition: ['The Champagne Fair guide lists Charm Designs among useful secondary Redemption Shop choices.'],
    usage: ['Use the Level 1–22 requirement table to plan the number needed for a target Charm level.'],
    strategy: ['Plan cumulative material requirements before committing to multiple Charm upgrades.'],
    sources: [CHARM_SOURCE, FAIR_SOURCE],
    tags: ['governor-charms', 'material', 'champagne-fair'],
  }),

  truegold: confirmed({
    summary: 'The main building progression material used across the governed TG1–TG8 cost table for eight key buildings.',
    category: 'building_upgrade_material',
    categoryLabel: 'Building upgrade material',
    verificationNote: 'The current Truegold guide is backed by Forge’s governed TG1–TG8 dataset and preserves its per-building confidence scores and corrections.',
    mechanics: [
      'Ordinary Truegold is recorded for TG1–TG8 across Town Center, Embassy, Command Center, Infirmary, Barracks, Stable, Range and War Academy.',
      'From TG6 onward the source adds Tempered Truegold as a separate second material.',
    ],
    acquisition: [
      'The Masters guide records Pan Reserve Chest context that can include Truegold.',
    ],
    usage: [
      'Track the exact building and target TG tier before spending.',
      'Use the Building Planner for the rest of the resource and time requirement rather than treating Truegold as the only upgrade constraint.',
    ],
    strategy: [
      'Keep ordinary and Tempered Truegold totals separate.',
      'Kingdom of Power guidance recommends timing major planned construction with useful scoring windows where possible.',
    ],
    sources: [TRUEGOLD_SOURCE, MASTERS_SOURCE, KVK_SOURCE],
    tags: ['buildings', 'truegold', 'kvk', 'material'],
  }),

  'tempered-truegold': confirmed({
    summary: 'A separate late-game building material added alongside ordinary Truegold from TG6 in the governed TG1–TG8 progression dataset.',
    category: 'building_upgrade_material',
    categoryLabel: 'Building upgrade material',
    verificationNote: 'Forge’s current Truegold guide states that Tempered Truegold applies from TG6 upward and keeps it separate from ordinary Truegold totals.',
    mechanics: ['Required in addition to ordinary Truegold for TG6, TG7 and TG8 in the governed eight-building table.'],
    usage: ['Track the Tempered requirement separately for the exact building and tier being upgraded.'],
    strategy: ['Do not compare TG5 and TG6 using ordinary Truegold alone; TG6+ is a two-material requirement.'],
    sources: [TRUEGOLD_SOURCE],
    tags: ['buildings', 'truegold', 'tempered-truegold', 'material'],
  }),

  'governor-stamina': provisional({
    summary: 'Stamina used by marches, rallies and other stamina-consuming world activities; Forge event planning treats it as a resource to manage rather than spend automatically.',
    category: 'consumable',
    categoryLabel: 'Consumable',
    verificationNote: 'The governed Companion intake records the stamina/world-activity relationship. Complete live recovery and acquisition rules remain intentionally outside this recovered content.',
    mechanics: ['Represents stamina consumed by supported world activities such as marches and rallies.'],
    usage: ['Spend when the activity itself is worthwhile; do not burn stamina simply to empty the bar or inventory.'],
    strategy: ['Coordinate stamina use with relevant event and activity goals where practical.'],
    sources: ['docs/companion/assets/ITEM-ASSET-INTAKE-2026-08-03.json', FAIR_SOURCE],
    tags: ['stamina', 'world-activities', 'consumable'],
  }),

  'advanced-taming-mark': confirmed({
    summary: 'A Pet progression material explicitly included in Forge’s Kingdom of Power preparation guidance.',
    category: 'pet_material',
    categoryLabel: 'Pet material',
    verificationNote: 'The published Kingdom of Power guide explicitly lists Common/Advanced Taming Marks among resources to save between KvK cycles.',
    mechanics: ['Used within Pet progression and treated as a scored/savable progression resource in Kingdom of Power preparation.'],
    usage: ['Use during planned Pet advancement and, where useful, align spending with the relevant event window.'],
    strategy: ['Kingdom of Power guidance recommends saving Taming Marks between KvK cycles instead of spending automatically.'],
    sources: [KVK_SOURCE],
    tags: ['pets', 'kvk', 'material'],
  }),

  'common-taming-mark': confirmed({
    summary: 'A Pet progression material explicitly included in Forge’s Kingdom of Power preparation guidance.',
    category: 'pet_material',
    categoryLabel: 'Pet material',
    verificationNote: 'The published Kingdom of Power guide explicitly lists Common/Advanced Taming Marks among resources to save between KvK cycles.',
    mechanics: ['Used within Pet progression and treated as a scored/savable progression resource in Kingdom of Power preparation.'],
    usage: ['Use during planned Pet advancement and, where useful, align spending with the relevant event window.'],
    strategy: ['Kingdom of Power guidance recommends saving Taming Marks between KvK cycles instead of spending automatically.'],
    sources: [KVK_SOURCE],
    tags: ['pets', 'kvk', 'material'],
  }),

  'pet-advancement-materials-custom-chest': provisional({
    summary: 'A selectable Pet progression reward chest; Forge event guidance treats Pet advancement materials as progression bottlenecks worth preserving for planned upgrades.',
    category: 'pet_material',
    categoryLabel: 'Pet material chest',
    verificationNote: 'Champagne Fair and Kingdom of Power guides support the Pet advancement-material relationship; the exact selectable chest contents are not reconstructed here.',
    mechanics: ['Provides Pet advancement material selection rather than a general-purpose resource payout.'],
    acquisition: ['The Champagne Fair guide lists Pet Advancement materials among useful secondary Redemption Shop choices.'],
    usage: ['Open/select only when you know which Pet progression material is needed for the next planned upgrade.'],
    strategy: ['Keep strategic Pet materials for a progression or event window that advances the account rather than opening stock blindly.'],
    sources: [FAIR_SOURCE, KVK_SOURCE],
    tags: ['pets', 'chest', 'champagne-fair', 'kvk'],
  }),

  'adventure-supply': confirmed({
    summary: 'A Master Academy progression item used to target discovered Masters in Lostlands and build Affinity toward settlement.',
    category: 'master_material',
    categoryLabel: 'Master material',
    verificationNote: 'The published Masters guide is based on the verified six-Master workbook and explicitly describes Adventure Supplies as the Lostlands targeting resource.',
    mechanics: [
      'Used to target a discovered Master in Lostlands and increase progress toward the required Affinity settlement threshold.',
      'The Masters guide records a special Valora rule: do not spend Adventure Supplies targeting her because the workbook describes her automatic unlock after the first 1,000-Affinity settlement.',
    ],
    usage: ['Use on the Master whose Affinity progression matches your current account priority.'],
    strategy: ['Do not treat unlock order as investment priority; the Masters guide separates those decisions.'],
    sources: [MASTERS_SOURCE],
    tags: ['masters', 'master-academy', 'affinity'],
  }),

  'reserve-chest': confirmed({
    summary: 'A Master-related reward chest connected to Pan’s economy kit and gathering activity.',
    category: 'master_reward',
    categoryLabel: 'Master reward',
    verificationNote: 'The published Masters guide is based on the verified workbook and records Pan’s Reserve Chest economy loop.',
    mechanics: ['Pan’s economy kit turns qualifying gathering activity into Reserve Chest opportunities.'],
    acquisition: ['Earned through Pan’s Master economy mechanics described in the verified Masters guide.'],
    usage: ['Open as a reward chest; the guide notes that its reward pool can include Truegold.'],
    strategy: ['Pan is prioritised highly in the verified workbook because this economy value compounds through everyday play.'],
    sources: [MASTERS_SOURCE],
    tags: ['masters', 'pan', 'economy', 'reward-chest'],
  }),

  'masters-manuscript': confirmed({
    summary: 'The core Master skill-upgrade material tracked separately from skill XP in the verified Master Academy progression workbook.',
    category: 'master_material',
    categoryLabel: 'Master material',
    verificationNote: 'The published Masters guide explicitly distinguishes incremental Manuscript cost from cumulative Manuscripts when planning skill upgrades.',
    mechanics: ['Consumed by Master skill progression; per-level cost and cumulative investment are separate planning values.'],
    usage: ['Use on the Master skill that affects the event or system you actually play rather than spreading Manuscripts evenly.'],
    strategy: ['Plan to a target skill level using cumulative Manuscripts, while using the incremental value for the immediate next upgrade.'],
    sources: [MASTERS_SOURCE],
    tags: ['masters', 'master-academy', 'skills', 'material'],
  }),

  'general-master-emblem': confirmed({
    summary: 'A Master Affinity progression material used at milestone steps in the Master Academy system.',
    category: 'master_material',
    categoryLabel: 'Master Affinity material',
    verificationNote: 'The published Masters guide states that the verified workbook tracks Affinity growth together with milestone Emblem costs.',
    mechanics: ['Used for Master Affinity milestone progression.'],
    usage: ['Reserve for the Master Affinity path that matches your investment priority.'],
    strategy: ['Affinity investment should follow account/event value rather than unlock order alone.'],
    sources: [MASTERS_SOURCE],
    tags: ['masters', 'affinity', 'emblem'],
  }),

  'valoras-emblem': confirmed({
    summary: 'Valora-specific Emblem used in her Master Affinity progression.',
    category: 'master_material',
    categoryLabel: 'Master Affinity material',
    verificationNote: 'Valora is part of the verified six-Master workbook; the guide records Master-specific Affinity bonuses and milestone Emblem costs.',
    mechanics: ['Supports Valora’s Affinity milestone progression; her Affinity bonus family is Squad Attack in the current workbook.'],
    usage: ['Use on Valora Affinity when Bear Hunt-focused Master progression matches your account plan.'],
    sources: [MASTERS_SOURCE],
    tags: ['masters', 'valora', 'affinity', 'emblem'],
  }),

  'pans-emblem': confirmed({
    summary: 'Pan-specific Emblem used in his Master Affinity progression.',
    category: 'master_material',
    categoryLabel: 'Master Affinity material',
    verificationNote: 'Pan is part of the verified six-Master workbook; the guide records Master-specific Affinity bonuses and milestone Emblem costs.',
    mechanics: ['Supports Pan’s Affinity milestone progression; his Affinity bonus family is Squad Defense in the current workbook.'],
    usage: ['Use on Pan Affinity when his economy-focused Master progression matches your account plan.'],
    sources: [MASTERS_SOURCE],
    tags: ['masters', 'pan', 'affinity', 'emblem'],
  }),

  'romans-emblem': confirmed({
    summary: 'Roman-specific Emblem used in his Master Affinity progression.',
    category: 'master_material',
    categoryLabel: 'Master Affinity material',
    verificationNote: 'Roman is part of the verified six-Master workbook; the guide records Master-specific Affinity bonuses and milestone Emblem costs.',
    mechanics: ['Supports Roman’s Affinity milestone progression; his Affinity bonus family is Squad Attack & Defense in the current workbook.'],
    usage: ['Use on Roman Affinity when Arena-focused Master progression matches your account plan.'],
    sources: [MASTERS_SOURCE],
    tags: ['masters', 'roman', 'affinity', 'emblem'],
  }),

  'cassia-emblem': confirmed({
    summary: 'Cassia-specific Emblem used in her Master Affinity progression.',
    category: 'master_material',
    categoryLabel: 'Master Affinity material',
    verificationNote: 'Cassia is part of the verified six-Master workbook; the guide records Master-specific Affinity bonuses and milestone Emblem costs.',
    mechanics: ['Supports Cassia’s Affinity milestone progression; her Affinity bonus family is Squad Lethality & Health in the current workbook.'],
    usage: ['Use on Cassia Affinity when broad combat and rally-capacity progression matches your account plan.'],
    sources: [MASTERS_SOURCE],
    tags: ['masters', 'cassia', 'affinity', 'emblem'],
  }),

  'wilsons-emblem': provisional({
    summary: 'Wilson-specific Emblem used in his Master Affinity progression.',
    category: 'master_material',
    categoryLabel: 'Master Affinity material',
    verificationNote: 'Wilson is verified as part of the current six-Master roster, while his detailed Affinity rows deliberately carry lower confidence than the older four Masters.',
    mechanics: ['Supports Wilson’s Affinity milestone progression; his current workbook bonus family is Squad Attack & Defense with lower detail confidence.'],
    usage: ['Use on Wilson Affinity when alliance-event reward progression is a major account priority.'],
    sources: [MASTERS_SOURCE],
    tags: ['masters', 'wilson', 'affinity', 'emblem'],
  }),

  'enhancement-xp-part': confirmed({
    summary: 'A Hero Gear enhancement resource that also appears in the verified Masters reward loop through Valora.',
    category: 'hero_gear_material',
    categoryLabel: 'Hero Gear material',
    verificationNote: 'The published Masters guide explicitly records Enhancement XP Parts as a Valora Bear Hunt reward path.',
    mechanics: ['Provides enhancement XP for Hero Gear progression.'],
    acquisition: ['The Masters guide records Valora’s Leader by Example skill as a repeatable source of Enhancement XP Parts through Bear Hunt rewards.'],
    usage: ['Use to advance Hero Gear enhancement rather than treating it as a generic account XP item.'],
    sources: [MASTERS_SOURCE],
    tags: ['hero-gear', 'masters', 'valora', 'bear-hunt'],
  }),

  'championship-badge': provisional({
    summary: 'An Alliance Championship progression/reward item connected to Wilson’s alliance-event Master skills.',
    category: 'event_currency',
    categoryLabel: 'Event currency',
    verificationNote: 'The Masters guide states that Wilson can multiply Championship Badges; complete Championship shop and earning rules are not reconstructed in this record.',
    mechanics: ['Used within Alliance Championship progression/rewards; Wilson’s kit can increase Championship Badge output according to the verified Masters workbook.'],
    usage: ['Use within the Alliance Championship system according to the live event/shop options.'],
    sources: [MASTERS_SOURCE],
    tags: ['alliance-championship', 'masters', 'wilson'],
  }),

  'ocean-scanner': provisional({
    summary: 'A Fishing Tournament special item that shows direction and distance guidance for rare targets during a cast.',
    category: 'fishing_item',
    categoryLabel: 'Fishing Tournament item',
    verificationNote: 'The published Fishing Tournament guide preserves this mechanic from the supplied player guide and does not extend it into unsupported spawn formulas.',
    mechanics: ['Shows direction and distance guidance for rare targets during the cast.'],
    usage: ['Use when targeting a rare fish, including targets summoned by a Horn of the Tide in the supplied Fishing guide.'],
    strategy: ['The supplied long-term strategy treats Scanners as persistent special items worth saving for high-value leaderboard attempts.'],
    sources: [FISHING_SOURCE],
    tags: ['fishing', 'fishing-tournament', 'special-item'],
  }),

  lantern: provisional({
    summary: 'A Fishing Tournament special item used for visibility in deep water where the supplied guide describes darkness below roughly 300m.',
    category: 'fishing_item',
    categoryLabel: 'Fishing Tournament item',
    verificationNote: 'Forge presents the depth/visibility behaviour as supplied-guide guidance rather than a permanent live-client constant.',
    mechanics: ['Provides visibility in deep water; the supplied guide treats it as essential below roughly 300m.'],
    usage: ['Equip before committing a high-value cast aimed at deep-water species.'],
    strategy: ['Save Lanterns for casts where deep visibility materially improves the chance of reaching the intended target.'],
    sources: [FISHING_SOURCE],
    tags: ['fishing', 'fishing-tournament', 'special-item'],
  }),

  reel: provisional({
    summary: 'A Fishing Tournament stabilising item that absorbs pullbacks or bumps and protects the descent during valuable casts.',
    category: 'fishing_item',
    categoryLabel: 'Fishing Tournament item',
    verificationNote: 'The published Fishing Tournament guide describes this as Reel / Stabilizer and preserves it as source-described gameplay guidance.',
    mechanics: ['Absorbs pullbacks or bumps and protects the fishing descent.'],
    usage: ['Use on high-value casts where a poor descent would waste a scarce attempt or premium fishing item.'],
    strategy: ['The supplied leaderboard strategy recommends hoarding stabilisers across cycles rather than spending them on routine low-value casts.'],
    sources: [FISHING_SOURCE],
    tags: ['fishing', 'fishing-tournament', 'stabilizer', 'special-item'],
  }),

  'epic-general-hero-shard': provisional({
    summary: 'A universal Epic hero shard used for hero progression, with surplus maxed-hero shard value also recognised by Champagne Fair planning.',
    category: 'hero_shard',
    categoryLabel: 'Hero shard',
    verificationNote: 'Champagne Fair guidance explicitly distinguishes useful progression shards from genuinely surplus shards; exchange values can change and are not hard-coded here.',
    mechanics: ['Used for Epic hero progression; universal shards should be protected for heroes you actually use.'],
    acquisition: ['Available through normal hero/event reward paths documented elsewhere in Forge; Champagne Fair is primarily an exchange context, not presented as the source of the shard.'],
    usage: ['Use for a planned Epic hero upgrade before treating the shard as surplus event currency.'],
    strategy: ['Do not spend Universal Epic shards merely to force a hero to max for voucher farming.'],
    sources: [FAIR_SOURCE],
    tags: ['heroes', 'hero-shard', 'champagne-fair'],
  }),

  'rare-general-hero-shard': provisional({
    summary: 'A universal Rare hero shard used for hero progression, with surplus shard value also recognised by Champagne Fair planning.',
    category: 'hero_shard',
    categoryLabel: 'Hero shard',
    verificationNote: 'Champagne Fair guidance explicitly distinguishes useful progression shards from genuinely surplus shards; exchange values can change and are not hard-coded here.',
    mechanics: ['Used for Rare hero progression; universal shards should be protected until they are genuinely surplus to the account plan.'],
    usage: ['Use for a planned Rare hero upgrade before treating the shard as surplus event currency.'],
    strategy: ['Do not sacrifice future progression or overlapping event scoring simply to create Fair Vouchers.'],
    sources: [FAIR_SOURCE],
    tags: ['heroes', 'hero-shard', 'champagne-fair'],
  }),

  'mythic-general-hero-shard': provisional({
    summary: 'A universal Mythic hero progression shard and one of Forge’s high-value long-term progression resources.',
    category: 'hero_shard',
    categoryLabel: 'Hero shard',
    verificationNote: 'Forge’s current event guides repeatedly treat Mythic shards as high-value progression stock; exact event exchange bands are intentionally omitted where the supplied Champagne Fair source conflicts.',
    mechanics: ['Used for Mythic hero progression and should be treated as strategic progression stock.'],
    usage: ['Use on heroes that remain part of the account’s planned rally, garrison or core formation.'],
    strategy: ['Check overlapping hero-growth, Alliance Brawl or KvK value before consuming a major shard stockpile.'],
    sources: [FAIR_SOURCE, KVK_SOURCE, MASTERS_SOURCE],
    tags: ['heroes', 'hero-shard', 'mythic', 'champagne-fair', 'kvk'],
  }),

  'rare-conquest-skill-book': provisional({
    summary: 'A Rare Conquest skill-upgrade book that can also become Champagne Fair exchange stock when genuinely surplus.',
    category: 'hero_skill_material',
    categoryLabel: 'Hero skill material',
    verificationNote: 'The Champagne Fair guide explicitly identifies Conquest/Expedition Skill Books as exchangeable; live exchange values should be checked in-game.',
    mechanics: ['Used for Conquest-side hero skill progression.'],
    usage: ['Prioritise useful skill progression before treating books as Champagne Fair surplus.'],
    sources: [FAIR_SOURCE],
    tags: ['heroes', 'skills', 'conquest', 'champagne-fair'],
  }),

  'epic-conquest-skill-book': provisional({
    summary: 'An Epic Conquest skill-upgrade book that can also become Champagne Fair exchange stock when genuinely surplus.',
    category: 'hero_skill_material',
    categoryLabel: 'Hero skill material',
    verificationNote: 'The Champagne Fair source conflicts on the Epic Skill Book voucher rate, so Forge deliberately does not publish a single exchange value here.',
    mechanics: ['Used for Conquest-side hero skill progression.'],
    usage: ['Prioritise useful skill progression before treating books as Champagne Fair surplus.'],
    strategy: ['Check the live Champagne Fair rate before exchanging because the supplied source gives inconsistent Epic book values.'],
    sources: [FAIR_SOURCE],
    tags: ['heroes', 'skills', 'conquest', 'champagne-fair'],
  }),

  'mythic-conquest-skill-book': provisional({
    summary: 'A Mythic Conquest skill-upgrade book for high-rarity hero skill progression.',
    category: 'hero_skill_material',
    categoryLabel: 'Hero skill material',
    verificationNote: 'The item role is preserved as a Hero skill material; complete acquisition and exchange rules are not invented where the supplied event source is incomplete.',
    mechanics: ['Used for Conquest-side Mythic hero skill progression.'],
    usage: ['Use on planned high-rarity hero skill upgrades rather than treating it as generic event currency.'],
    sources: [FAIR_SOURCE],
    tags: ['heroes', 'skills', 'conquest', 'mythic'],
  }),

  'rare-expedition-skill-manual': provisional({
    summary: 'A Rare Expedition skill-upgrade manual that can also become Champagne Fair exchange stock when genuinely surplus.',
    category: 'hero_skill_material',
    categoryLabel: 'Hero skill material',
    verificationNote: 'The Champagne Fair guide explicitly identifies Conquest/Expedition Skill Books as exchangeable; live exchange values should be checked in-game.',
    mechanics: ['Used for Expedition-side hero skill progression.'],
    usage: ['Prioritise useful skill progression before treating manuals as Champagne Fair surplus.'],
    sources: [FAIR_SOURCE],
    tags: ['heroes', 'skills', 'expedition', 'champagne-fair'],
  }),

  'epic-expedition-skill-manual': provisional({
    summary: 'An Epic Expedition skill-upgrade manual that can also become Champagne Fair exchange stock when genuinely surplus.',
    category: 'hero_skill_material',
    categoryLabel: 'Hero skill material',
    verificationNote: 'The Champagne Fair source conflicts on the Epic Skill Book voucher rate, so Forge deliberately does not publish a single exchange value here.',
    mechanics: ['Used for Expedition-side hero skill progression.'],
    usage: ['Prioritise useful skill progression before treating manuals as Champagne Fair surplus.'],
    strategy: ['Check the live Champagne Fair rate before exchanging because the supplied source gives inconsistent Epic book values.'],
    sources: [FAIR_SOURCE],
    tags: ['heroes', 'skills', 'expedition', 'champagne-fair'],
  }),

  'mythic-expedition-skill-manual': provisional({
    summary: 'A Mythic Expedition skill-upgrade manual for high-rarity hero skill progression.',
    category: 'hero_skill_material',
    categoryLabel: 'Hero skill material',
    verificationNote: 'The item role is preserved as a Hero skill material; complete acquisition and exchange rules are not invented where the supplied event source is incomplete.',
    mechanics: ['Used for Expedition-side Mythic hero skill progression.'],
    usage: ['Use on planned high-rarity hero skill upgrades rather than treating it as generic event currency.'],
    sources: [FAIR_SOURCE],
    tags: ['heroes', 'skills', 'expedition', 'mythic'],
  }),

  'gen-4-custom-hero-widget-chest': provisional({
    summary: 'A Generation 4 Hero Widget selection chest tied to Exclusive Hero Gear progression and Champagne Fair planning.',
    category: 'hero_widget',
    categoryLabel: 'Hero Widget chest',
    verificationNote: 'Champagne Fair guidance explicitly covers Hero Widgets and warns that unopened Widget crates must be opened before eligible Widget exchange.',
    mechanics: ['Provides generation-scoped Hero Widgets used in Exclusive Hero Gear progression.'],
    usage: ['Select Widgets for a hero you actually intend to keep in a core formation rather than spreading investment across every available hero.'],
    strategy: ['Champagne Fair guidance recommends generation skipping when necessary so vouchers fund meaningful Widget progression instead of small purchases every cycle.'],
    sources: [FAIR_SOURCE],
    tags: ['heroes', 'hero-widget', 'generation-4', 'champagne-fair'],
  }),

  'gen-5-custom-hero-widget-chest': provisional({
    summary: 'A Generation 5 Hero Widget selection chest tied to Exclusive Hero Gear progression and Champagne Fair planning.',
    category: 'hero_widget',
    categoryLabel: 'Hero Widget chest',
    verificationNote: 'Champagne Fair guidance explicitly covers Hero Widgets and warns that unopened Widget crates must be opened before eligible Widget exchange.',
    mechanics: ['Provides generation-scoped Hero Widgets used in Exclusive Hero Gear progression.'],
    usage: ['Select Widgets for a hero you actually intend to keep in a core formation rather than spreading investment across every available hero.'],
    strategy: ['Champagne Fair guidance recommends generation skipping when necessary so vouchers fund meaningful Widget progression instead of small purchases every cycle.'],
    sources: [FAIR_SOURCE],
    tags: ['heroes', 'hero-widget', 'generation-5', 'champagne-fair'],
  }),
}
