import { createForgeId } from '../entity-identity/forgeId.js'
import { COMPANION_MEDIA_MANIFEST } from './generatedMediaManifest.js'

export type CompanionItemTrustState =
  | 'verified'
  | 'confirmed'
  | 'provisional'
  | 'research_needed'

export type CompanionItemRelationshipType =
  | 'used_by'
  | 'used_for'
  | 'required_by_calculator'
  | 'awarded_by'
  | 'scores_in'
  | 'unlocks_at'
  | 'upgrades_to'
  | 'related_to'

export type CompanionItemRelationship = {
  type: CompanionItemRelationshipType
  targetForgeId: string
  label: string
  route: string | null
  availability: 'available' | 'planned'
}

export type CompanionItemRecord = {
  id: string
  key: string
  forge_id: string
  name: string
  aliases: readonly string[]
  category: string
  category_label: string
  summary: string
  trust_state: CompanionItemTrustState
  trust_label: string
  verification_note: string
  source_name: string
  source_reference: string
  source_updated_at: string
  rights_status: 'owner_supplied_unverified_rights' | 'owner_declared_creative_commons'
  rights_note: string
  media_state: 'withheld_pending_rights' | 'published_preview_candidate'
  image_url: string | null
  image_alt_text: string
  planned_media_path: string
  media_role: 'full_artwork' | 'compact_icon' | null
  media_sha256: string | null
  media_width: number | null
  media_height: number | null
  media_byte_length: number | null
  relationships: readonly []
  companion_relationships: readonly CompanionItemRelationship[]
  status: 'published'
  canonical_url: string
  tags: readonly string[]
  search_weight: number
  confidence: 'dataset_verified' | 'relationship_derived' | 'experimental'
  confidence_label: string
}

const SOURCE_REFERENCE =
  'docs/companion/assets/ITEM-ASSET-INTAKE-2026-08-03.json'
const SOURCE_UPDATED_AT = '2026-08-03T00:00:00.000Z'
const RIGHTS_NOTE =
  'Owner-supplied artwork is withheld until its original extraction source and reuse basis are documented.'
const PUBLISHED_RIGHTS_NOTE =
  'The project owner declared the supplied artwork Creative Commons and approved publication. Forge has not independently verified the exact licence variant, original artist, original website, source URL, official ownership or endorsement.'

function trust(
  state: CompanionItemTrustState,
): Pick<
  CompanionItemRecord,
  'trust_state' | 'trust_label' | 'confidence' | 'confidence_label'
> {
  switch (state) {
    case 'verified':
      return {
        trust_state: state,
        trust_label: 'Verified',
        confidence: 'dataset_verified',
        confidence_label: 'Verified',
      }
    case 'confirmed':
      return {
        trust_state: state,
        trust_label: 'Confirmed',
        confidence: 'dataset_verified',
        confidence_label: 'Confirmed from a published Forge dataset',
      }
    case 'provisional':
      return {
        trust_state: state,
        trust_label: 'Provisional',
        confidence: 'relationship_derived',
        confidence_label: 'Confirmed relationships; description incomplete',
      }
    case 'research_needed':
      return {
        trust_state: state,
        trust_label: 'Research needed',
        confidence: 'experimental',
        confidence_label: 'Further source verification required',
      }
  }
}

function item(input: {
  key: string
  name: string
  aliases?: readonly string[]
  category: string
  categoryLabel: string
  summary: string
  trustState: CompanionItemTrustState
  verificationNote: string
  imageAltText: string
  plannedMediaPath: string
  relationships: readonly CompanionItemRelationship[]
  tags: readonly string[]
}): CompanionItemRecord {
  const forgeId = createForgeId('item', input.key)
  if (!forgeId) {
    throw new Error(`Invalid Companion item key: ${input.key}`)
  }

  return {
    id: input.key,
    key: input.key,
    forge_id: forgeId,
    name: input.name,
    aliases: input.aliases ?? [],
    category: input.category,
    category_label: input.categoryLabel,
    summary: input.summary,
    ...trust(input.trustState),
    verification_note: input.verificationNote,
    source_name: 'Forge Companion item intake',
    source_reference: SOURCE_REFERENCE,
    source_updated_at: SOURCE_UPDATED_AT,
    rights_status: 'owner_supplied_unverified_rights',
    rights_note: RIGHTS_NOTE,
    media_state: 'withheld_pending_rights',
    image_url: null,
    image_alt_text: input.imageAltText,
    planned_media_path: input.plannedMediaPath,
    media_role: null,
    media_sha256: null,
    media_width: null,
    media_height: null,
    media_byte_length: null,
    relationships: [],
    companion_relationships: input.relationships,
    status: 'published',
    canonical_url: `/companion/items/${encodeURIComponent(input.key)}`,
    tags: input.tags,
    search_weight: 20,
  }
}

const CORE_COMPANION_ITEM_PROJECTION: readonly CompanionItemRecord[] = [
  item({
    key: 'mithril',
    name: 'Mithril',
    category: 'hero_gear_material',
    categoryLabel: 'Hero Gear material',
    summary:
      'Used in high-level Hero Gear progression and recorded in Kingdom of Power preparation scoring.',
    trustState: 'provisional',
    verificationNote:
      'Relationships are confirmed by the governed intake; a complete item description still requires further editorial research.',
    imageAltText: 'Mithril crystal item icon',
    plannedMediaPath: '/media/companion/items/mithril.webp',
    relationships: [
      {
        type: 'used_for',
        targetForgeId: 'tool.hero-gear',
        label: 'Hero Gear progression',
        route: null,
        availability: 'planned',
      },
      {
        type: 'required_by_calculator',
        targetForgeId: 'calculator.hero-gear',
        label: 'Hero Gear calculator',
        route: null,
        availability: 'planned',
      },
      {
        type: 'scores_in',
        targetForgeId: 'event.kingdom-of-power-preparation',
        label: 'Kingdom of Power preparation',
        route: null,
        availability: 'planned',
      },
    ],
    tags: ['hero-gear', 'material', 'event-scoring'],
  }),
  item({
    key: 'governor-stamina',
    name: 'Governor Stamina',
    category: 'consumable',
    categoryLabel: 'Consumable',
    summary:
      'Represents stamina used for marches, rallies and other stamina-consuming activities.',
    trustState: 'research_needed',
    verificationNote:
      'The Storehouse, Cesare’s Fury and world-activity relationships are recorded, but complete sourcing and usage guidance remain under research.',
    imageAltText: 'Governor Stamina meat item icon',
    plannedMediaPath: '/media/companion/items/governor-stamina.webp',
    relationships: [
      {
        type: 'related_to',
        targetForgeId: 'building.storehouse',
        label: 'Storehouse',
        route: '/buildings/storehouse',
        availability: 'available',
      },
      {
        type: 'related_to',
        targetForgeId: 'event.cesares-fury',
        label: 'Cesare’s Fury',
        route: null,
        availability: 'planned',
      },
      {
        type: 'used_for',
        targetForgeId: 'tool.world-activities',
        label: 'World activities',
        route: null,
        availability: 'planned',
      },
    ],
    tags: ['stamina', 'consumable', 'world-activities'],
  }),
  item({
    key: 'forgehammer',
    name: 'Forgehammer',
    aliases: ['Forge Hammer', 'Hero Gear Forgehammer'],
    category: 'hero_gear_material',
    categoryLabel: 'Hero Gear material',
    summary:
      'Used by Hero Gear progression and recorded as a scored material in Kingdom of Power preparation.',
    trustState: 'provisional',
    verificationNote:
      'Relationships are confirmed by the governed intake; a complete item description still requires further editorial research.',
    imageAltText: 'Forgehammer item icon',
    plannedMediaPath: '/media/companion/items/forgehammer.webp',
    relationships: [
      {
        type: 'used_for',
        targetForgeId: 'tool.hero-gear',
        label: 'Hero Gear progression',
        route: null,
        availability: 'planned',
      },
      {
        type: 'required_by_calculator',
        targetForgeId: 'calculator.hero-gear',
        label: 'Hero Gear calculator',
        route: null,
        availability: 'planned',
      },
      {
        type: 'scores_in',
        targetForgeId: 'event.kingdom-of-power-preparation',
        label: 'Kingdom of Power preparation',
        route: null,
        availability: 'planned',
      },
    ],
    tags: ['hero-gear', 'material', 'event-scoring'],
  }),
  item({
    key: 'gilded-threads',
    name: 'Gilded Threads',
    category: 'governor_gear_material',
    categoryLabel: 'Governor Gear material',
    summary: 'One of the published Governor Gear upgrade materials.',
    trustState: 'confirmed',
    verificationNote:
      'The material relationship is confirmed by the published Governor Gear dataset.',
    imageAltText: 'Gilded Threads spool item icon',
    plannedMediaPath: '/media/companion/items/gilded-threads.webp',
    relationships: [
      {
        type: 'used_for',
        targetForgeId: 'tool.governor-gear',
        label: 'Governor Gear progression',
        route: null,
        availability: 'planned',
      },
      {
        type: 'required_by_calculator',
        targetForgeId: 'calculator.governor-gear',
        label: 'Governor Gear calculator',
        route: null,
        availability: 'planned',
      },
    ],
    tags: ['governor-gear', 'material'],
  }),
  item({
    key: 'satin',
    name: 'Satin',
    category: 'governor_gear_material',
    categoryLabel: 'Governor Gear material',
    summary: 'One of the published Governor Gear upgrade materials.',
    trustState: 'confirmed',
    verificationNote:
      'The material relationship is confirmed by the published Governor Gear dataset.',
    imageAltText: 'Satin fabric roll item icon',
    plannedMediaPath: '/media/companion/items/satin.webp',
    relationships: [
      {
        type: 'used_for',
        targetForgeId: 'tool.governor-gear',
        label: 'Governor Gear progression',
        route: null,
        availability: 'planned',
      },
      {
        type: 'required_by_calculator',
        targetForgeId: 'calculator.governor-gear',
        label: 'Governor Gear calculator',
        route: null,
        availability: 'planned',
      },
    ],
    tags: ['governor-gear', 'material'],
  }),
  item({
    key: 'charm-guide',
    name: 'Charm Guide',
    category: 'governor_charm_material',
    categoryLabel: 'Governor Charm material',
    summary:
      'A published Governor Charm upgrade material with per-level requirements in the Charm dataset.',
    trustState: 'confirmed',
    verificationNote:
      'The material relationship is confirmed by the published Governor Charm dataset.',
    imageAltText: 'Charm Guide book item icon',
    plannedMediaPath: '/media/companion/items/charm-guide.webp',
    relationships: [
      {
        type: 'used_for',
        targetForgeId: 'tool.governor-charms',
        label: 'Governor Charm progression',
        route: null,
        availability: 'planned',
      },
      {
        type: 'required_by_calculator',
        targetForgeId: 'calculator.governor-charms',
        label: 'Governor Charm calculator',
        route: null,
        availability: 'planned',
      },
    ],
    tags: ['governor-charms', 'material'],
  }),
  item({
    key: 'charm-design',
    name: 'Charm Design',
    category: 'governor_charm_material',
    categoryLabel: 'Governor Charm material',
    summary:
      'A published Governor Charm upgrade material with per-level requirements in the Charm dataset.',
    trustState: 'confirmed',
    verificationNote:
      'The material relationship is confirmed by the published Governor Charm dataset.',
    imageAltText: 'Charm Design document item icon',
    plannedMediaPath: '/media/companion/items/charm-design.webp',
    relationships: [
      {
        type: 'used_for',
        targetForgeId: 'tool.governor-charms',
        label: 'Governor Charm progression',
        route: null,
        availability: 'planned',
      },
      {
        type: 'required_by_calculator',
        targetForgeId: 'calculator.governor-charms',
        label: 'Governor Charm calculator',
        route: null,
        availability: 'planned',
      },
    ],
    tags: ['governor-charms', 'material'],
  }),
  item({
    key: 'artisans-vision',
    name: "Artisan's Vision",
    category: 'governor_gear_material',
    categoryLabel: 'Governor Gear material',
    summary:
      'A Governor Gear material introduced in the published progression from Blue two-star upgrades onward.',
    trustState: 'confirmed',
    verificationNote:
      'The material relationship and introduction point are confirmed by the published Governor Gear dataset.',
    imageAltText: "Artisan's Vision scroll item icon",
    plannedMediaPath: '/media/companion/items/artisans-vision.webp',
    relationships: [
      {
        type: 'used_for',
        targetForgeId: 'tool.governor-gear',
        label: 'Governor Gear progression',
        route: null,
        availability: 'planned',
      },
      {
        type: 'required_by_calculator',
        targetForgeId: 'calculator.governor-gear',
        label: 'Governor Gear calculator',
        route: null,
        availability: 'planned',
      },
    ],
    tags: ['governor-gear', 'material'],
  }),
  item({
    key: 'truegold',
    name: 'Truegold',
    aliases: ['True Gold'],
    category: 'building_upgrade_material',
    categoryLabel: 'Building upgrade material',
    summary:
      'Used for post-Level-30 Truegold building stages and kept separate from Tempered Truegold.',
    trustState: 'confirmed',
    verificationNote:
      'The material and Building Planner relationships are confirmed by the published Buildings and Truegold datasets.',
    imageAltText: 'Truegold block item icon',
    plannedMediaPath: '/media/companion/items/truegold.webp',
    relationships: [
      {
        type: 'used_for',
        targetForgeId: 'tool.building-progression',
        label: 'Building progression',
        route: '/buildings',
        availability: 'available',
      },
      {
        type: 'required_by_calculator',
        targetForgeId: 'calculator.building-planner',
        label: 'Building Planner',
        route: '/calculators/buildings',
        availability: 'available',
      },
    ],
    tags: ['buildings', 'truegold', 'material'],
  }),
  item({
    key: 'tempered-truegold',
    name: 'Tempered Truegold',
    category: 'building_upgrade_material',
    categoryLabel: 'Building upgrade material',
    summary:
      'An additional premium building material required in later Truegold progression and counted separately from ordinary Truegold.',
    trustState: 'confirmed',
    verificationNote:
      'The material and Building Planner relationships are confirmed by the published Buildings and Truegold datasets.',
    imageAltText: 'Tempered Truegold crystal item icon',
    plannedMediaPath: '/media/companion/items/tempered-truegold.webp',
    relationships: [
      {
        type: 'used_for',
        targetForgeId: 'tool.building-progression',
        label: 'Building progression',
        route: '/buildings',
        availability: 'available',
      },
      {
        type: 'required_by_calculator',
        targetForgeId: 'calculator.building-planner',
        label: 'Building Planner',
        route: '/calculators/buildings',
        availability: 'available',
      },
    ],
    tags: ['buildings', 'tempered-truegold', 'material'],
  }),
]

function applyMedia(
  record: CompanionItemRecord,
  media: (typeof COMPANION_MEDIA_MANIFEST)[number] | undefined,
): CompanionItemRecord {
  if (!media) return record

  return {
    ...record,
    rights_status: 'owner_declared_creative_commons',
    rights_note: PUBLISHED_RIGHTS_NOTE,
    media_state: 'published_preview_candidate',
    image_url: media.immutable_media_path,
    image_alt_text: record.image_alt_text || media.alt_text,
    planned_media_path: media.immutable_media_path,
    media_role: media.media_role,
    media_sha256: media.source_sha256,
    media_width: media.width,
    media_height: media.height,
    media_byte_length: media.byte_length,
  }
}

function generatedMediaItem(
  media: (typeof COMPANION_MEDIA_MANIFEST)[number],
): CompanionItemRecord {
  const forgeId = createForgeId('item', media.canonical_item_key)
  if (!forgeId) throw new Error(`Invalid media item key: ${media.canonical_item_key}`)

  return {
    id: media.canonical_item_key,
    key: media.canonical_item_key,
    forge_id: forgeId,
    name: media.canonical_name,
    aliases: [],
    category: media.media_role === 'compact_icon' ? 'resource_icon' : 'unclassified_item',
    category_label: media.media_role === 'compact_icon' ? 'Compact resource icon' : 'Item artwork',
    summary: `Approved ${media.media_role === 'compact_icon' ? 'compact icon' : 'full artwork'} is available. Gameplay meaning, acquisition and strategic guidance require editorial research.`,
    trust_state: 'research_needed',
    trust_label: 'Research needed',
    verification_note: 'The asset identity is mapped from the supplied archive entry. Gameplay facts are not inferred from the artwork.',
    source_name: 'Owner-supplied Companion media intake',
    source_reference: 'docs/companion/assets/ITEM-MEDIA-MANIFEST-2026-08-03.json',
    source_updated_at: SOURCE_UPDATED_AT,
    rights_status: 'owner_declared_creative_commons',
    rights_note: PUBLISHED_RIGHTS_NOTE,
    media_state: 'published_preview_candidate',
    image_url: media.immutable_media_path,
    image_alt_text: media.alt_text,
    planned_media_path: media.immutable_media_path,
    media_role: media.media_role,
    media_sha256: media.source_sha256,
    media_width: media.width,
    media_height: media.height,
    media_byte_length: media.byte_length,
    relationships: [],
    companion_relationships: [],
    status: 'published',
    canonical_url: `/companion/items/${encodeURIComponent(media.canonical_item_key)}`,
    tags: [media.media_role],
    search_weight: 10,
    confidence: 'experimental',
    confidence_label: 'Media identity mapped; gameplay research needed',
  }
}

const coreKeys = new Set(CORE_COMPANION_ITEM_PROJECTION.map((record) => record.key))
const generatedItems = COMPANION_MEDIA_MANIFEST
  .filter((media) => !coreKeys.has(media.canonical_item_key))
  .map(generatedMediaItem)

export const COMPANION_ITEM_PROJECTION: readonly CompanionItemRecord[] = [
  ...CORE_COMPANION_ITEM_PROJECTION.map((record) => applyMedia(
    record,
    COMPANION_MEDIA_MANIFEST.find((media) => media.canonical_item_key === record.key),
  )),
  ...generatedItems,
]

export function getCompanionItem(
  key: string,
): CompanionItemRecord | undefined {
  return COMPANION_ITEM_PROJECTION.find((record) => record.key === key)
}
