import { parseForgeId } from '../../shared/entity-identity/forgeId.js'
import type { ForgeId, LegacyIdentityMapping, LegacyIdentifier } from '../../shared/entity-identity/contracts.js'

export interface LegacyIdentityIndex {
  readonly mappings: readonly LegacyIdentityMapping[]
}

export function translateLegacyIdentifier(identifier: LegacyIdentifier, index: LegacyIdentityIndex): { forgeId: ForgeId } | { code: 'invalid' | 'not_found' | 'ambiguous'; message: string } {
  if (!identifier.value.trim() || parseForgeId(identifier.value)) return { code: 'invalid', message: 'A legacy identifier is required.' }
  const matches = index.mappings.filter((mapping) => mapping.identifier.kind === identifier.kind && mapping.identifier.value === identifier.value)
  if (matches.length === 0) return { code: 'not_found', message: 'No approved Forge ID mapping exists.' }
  if (new Set(matches.map((match) => match.forgeId)).size !== 1) return { code: 'ambiguous', message: 'The legacy identifier maps to more than one Forge ID.' }
  return { forgeId: matches[0].forgeId }
}

export function createLegacyIndex(mappings: readonly LegacyIdentityMapping[]): LegacyIdentityIndex {
  return { mappings: [...mappings] }
}
