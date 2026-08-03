import type {
  CompanionItemRelationship,
  CompanionItemRelationshipType,
  CompanionItemTrustState,
} from '../../../shared/companion/itemProjection'

export type CompanionItemViewRecord = {
  id: string
  key: string
  forgeId: string
  name: string
  aliases: string[]
  category: string
  categoryLabel: string
  summary: string
  trustState: CompanionItemTrustState
  trustLabel: string
  verificationNote: string
  sourceName: string
  sourceReference: string
  sourceUpdatedAt: string
  rightsStatus: string
  rightsNote: string
  mediaState: string
  imageUrl: string | null
  imageAltText: string
  plannedMediaPath: string
  relationships: CompanionItemRelationship[]
  canonicalUrl: string
  tags: string[]
  confidenceLabel: string
}

const TRUST_STATES = new Set<CompanionItemTrustState>([
  'verified',
  'confirmed',
  'provisional',
  'research_needed',
])

const RELATIONSHIP_TYPES = new Set<CompanionItemRelationshipType>([
  'used_by',
  'used_for',
  'required_by_calculator',
  'awarded_by',
  'scores_in',
  'unlocks_at',
  'upgrades_to',
  'related_to',
])

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function list(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean)
    : []
}

function trustState(value: unknown): CompanionItemTrustState {
  return typeof value === 'string'
    && TRUST_STATES.has(value as CompanionItemTrustState)
    ? value as CompanionItemTrustState
    : 'research_needed'
}

function relationships(value: unknown): CompanionItemRelationship[] {
  if (!Array.isArray(value)) return []

  return value.flatMap((candidate) => {
    if (!isObject(candidate)) return []

    const type = text(candidate.type)
    const targetForgeId = text(candidate.targetForgeId)
    const label = text(candidate.label)
    const availability = candidate.availability === 'available'
      ? 'available'
      : 'planned'
    const route = text(candidate.route) || null

    if (
      !RELATIONSHIP_TYPES.has(type as CompanionItemRelationshipType)
      || !targetForgeId
      || !label
    ) {
      return []
    }

    return [{
      type: type as CompanionItemRelationshipType,
      targetForgeId,
      label,
      route,
      availability,
    }]
  })
}

export function normaliseCompanionItems(
  records: unknown[],
): CompanionItemViewRecord[] {
  return records.flatMap((candidate) => {
    if (!isObject(candidate)) return []

    const key = text(candidate.key) || text(candidate.id)
    const name = text(candidate.name)
    const forgeId = text(candidate.forge_id)

    if (!key || !name || !forgeId) return []

    return [{
      id: text(candidate.id) || key,
      key,
      forgeId,
      name,
      aliases: list(candidate.aliases),
      category: text(candidate.category),
      categoryLabel: text(candidate.category_label) || 'Item',
      summary: text(candidate.summary),
      trustState: trustState(candidate.trust_state),
      trustLabel: text(candidate.trust_label) || 'Research needed',
      verificationNote: text(candidate.verification_note),
      sourceName: text(candidate.source_name),
      sourceReference: text(candidate.source_reference),
      sourceUpdatedAt: text(candidate.source_updated_at),
      rightsStatus: text(candidate.rights_status),
      rightsNote: text(candidate.rights_note),
      mediaState: text(candidate.media_state),
      imageUrl: text(candidate.image_url) || null,
      imageAltText: text(candidate.image_alt_text),
      plannedMediaPath: text(candidate.planned_media_path),
      relationships: relationships(candidate.companion_relationships),
      canonicalUrl: text(candidate.canonical_url)
        || `/companion/items/${encodeURIComponent(key)}`,
      tags: list(candidate.tags),
      confidenceLabel: text(candidate.confidence_label),
    }]
  }).sort((left, right) => left.name.localeCompare(right.name))
}

export function companionCategoryLabel(value: string): string {
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

export function relationshipTypeLabel(
  value: CompanionItemRelationshipType,
): string {
  const labels: Record<CompanionItemRelationshipType, string> = {
    used_by: 'Used by',
    used_for: 'Used for',
    required_by_calculator: 'Required by calculator',
    awarded_by: 'Awarded by',
    scores_in: 'Scores in',
    unlocks_at: 'Unlocks at',
    upgrades_to: 'Upgrades to',
    related_to: 'Related to',
  }

  return labels[value]
}
