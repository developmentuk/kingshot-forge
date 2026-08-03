import { createHash } from 'node:crypto'

import {
  COMPANION_ITEM_PROJECTION,
} from '../../shared/companion/itemProjection.js'

import type {
  DatasetLoadResult,
} from './runner.js'

export async function loadPublishedCompanionItemsDataset():
Promise<DatasetLoadResult> {
  const records = COMPANION_ITEM_PROJECTION.map((record) => ({
    ...record,
    aliases: [...record.aliases],
    tags: [...record.tags],
    relationships: [],
    companion_relationships: record.companion_relationships.map(
      (relationship) => ({ ...relationship }),
    ),
  }))
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
        'Text-only canonical item projection derived from the governed Companion intake. Artwork remains withheld pending source and reuse verification.',
      canonical:
        'docs/companion/assets/ITEM-ASSET-INTAKE-2026-08-03.json',
      updated: '2026-08-03',
      verified: 'partial',
      provenance: {
        intakeId: 'COMPANION-ITEM-ASSET-2026-08-03',
        sourceType: 'owner-supplied governed intake',
        publicationState: 'published-text-only',
        mediaState: 'withheld-pending-rights',
        rightsStatus: 'owner_supplied_unverified_rights',
        recordCount: records.length,
      },
    },
    recordCount: records.length,
    records,
  }
}
