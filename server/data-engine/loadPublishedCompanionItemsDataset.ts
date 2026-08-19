import { createHash } from 'node:crypto'

import {
  COMPANION_ITEM_PROJECTION,
} from '../../shared/companion/itemProjection.js'
import {
  COMPANION_ITEM_GAMEPLAY_CONTENT,
} from '../../shared/companion/itemGameplayContent.js'

import type {
  DatasetLoadResult,
} from './runner.js'

function unique(values: readonly string[]): string[] {
  return [...new Set(values)]
}

export async function loadPublishedCompanionItemsDataset():
Promise<DatasetLoadResult> {
  const records = COMPANION_ITEM_PROJECTION.map((record) => {
    const gameplay = COMPANION_ITEM_GAMEPLAY_CONTENT[record.key]

    return {
      ...record,
      ...(gameplay ? {
        summary: gameplay.summary,
        category: gameplay.category ?? record.category,
        category_label: gameplay.categoryLabel ?? record.category_label,
        trust_state: gameplay.trustState ?? record.trust_state,
        trust_label: gameplay.trustLabel ?? record.trust_label,
        verification_note:
          gameplay.verificationNote ?? record.verification_note,
        confidence_label:
          gameplay.confidenceLabel ?? record.confidence_label,
      } : {}),
      aliases: [...record.aliases],
      tags: unique([
        ...record.tags,
        ...(gameplay?.tags ?? []),
      ]),
      relationships: [],
      companion_relationships: record.companion_relationships.map(
        (relationship) => ({ ...relationship }),
      ),
      ...(gameplay ? {
        gameplay: {
          mechanics: [...(gameplay.mechanics ?? [])],
          acquisition: [...(gameplay.acquisition ?? [])],
          usage: [...(gameplay.usage ?? [])],
          strategy: [...(gameplay.strategy ?? [])],
          sources: [...gameplay.sources],
        },
      } : {}),
    }
  })
  const fetchedAt = new Date().toISOString()
  const payloadHash = createHash('sha256')
    .update(JSON.stringify(records))
    .digest('hex')

  return {
    dataset: 'items',
    sourceUrl:
      'forge://companion/item-intake/COMPANION-ITEM-ASSET-2026-08-03',
    fetchedAt,
    httpStatus: 200,
    payloadHash,
    metadata: {
      dataset: 'items',
      title: 'Published Companion Items',
      description:
        'Canonical Companion item projection with checksum-backed owner-approved media plus recovered gameplay content from governed Forge guides and datasets.',
      canonical:
        'docs/companion/assets/ITEM-ASSET-INTAKE-2026-08-03.json',
      updated: '2026-08-19',
      verified: 'partial',
      provenance: {
        intakeId: 'COMPANION-ITEM-ASSET-2026-08-03',
        sourceType: 'owner-supplied governed intake plus governed Forge gameplay sources',
        publicationState: 'published-preview-candidate',
        mediaState: 'role-specific-static-webp',
        rightsBasis: 'owner_declared_creative_commons',
        recordCount: records.length,
        gameplayEnrichmentCount: Object.keys(
          COMPANION_ITEM_GAMEPLAY_CONTENT,
        ).length,
      },
    },
    recordCount: records.length,
    records,
  }
}
