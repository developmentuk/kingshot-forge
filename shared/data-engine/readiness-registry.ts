import {
  DATASET_KEYS,
  IMPORTABLE_DATASET_KEYS,
  type DatasetKey,
} from './datasets.js'

import type {
  CapabilityReadiness,
  ReadinessCapability,
  ReadinessStatus,
} from '../platform/readiness.js'

import {
  DATASET_CAPABILITY_REGISTRY,
} from './dataset-capabilities.js'

import {
  getDatasetVerificationReadinessStatus,
} from './verification-registry.js'

export type DatasetDomain =
  | 'hero'
  | 'progression'
  | 'events'
  | 'editorial'
  | 'companion'

export type DatasetReadinessDefinition = {
  key: DatasetKey
  name: string
  domain: DatasetDomain
  description: string
  canonical: boolean
  importMode: 'data-engine' | 'source-staging' | 'published-projection'
  capabilities: readonly CapabilityReadiness[]
}

const CAPABILITIES: readonly ReadinessCapability[] = [
  'import',
  'adapter',
  'browser',
  'viewer',
  'editor',
  'validation',
  'publishing',
  'version-history',
  'search',
  'filters',
  'public-api',
  'public-pages',
  'mobile',
  'verification',
]

const DATASET_NAMES: Record<DatasetKey, string> = {
  heroes: 'Heroes',
  'hero-skills': 'Hero Skills',
  'hero-xp': 'Hero XP',
  shards: 'Hero Shards',
  gear: 'Hero Gear',
  charm: 'Chief Charms',
  troops: 'Troops',
  buildings: 'Buildings',
  items: 'Companion Items',
  truegold: 'Truegold',
  'war-academy': 'War Academy',
  vip: 'VIP',
  events: 'Events',
  masters: 'Mastery Forging',
  kvk: 'KvK Scoring',
}

const DATASET_DOMAINS: Record<DatasetKey, DatasetDomain> = {
  heroes: 'hero',
  'hero-skills': 'hero',
  'hero-xp': 'hero',
  shards: 'hero',
  gear: 'hero',
  charm: 'progression',
  troops: 'progression',
  buildings: 'progression',
  items: 'companion',
  truegold: 'progression',
  'war-academy': 'progression',
  vip: 'progression',
  events: 'events',
  masters: 'progression',
  kvk: 'events',
}

const ADMIN_CAPABILITY_EVIDENCE: Partial<
  Record<ReadinessCapability, string>
> = {
  browser: 'src/features/admin/datasetAdapterRegistry.ts',
  viewer: 'src/features/admin/DatasetRecordPanel.tsx',
  editor: 'src/features/admin/recordEditor/recordEditorSchemaRegistry.ts',
  validation: 'server/editorial/validation.ts',
  publishing: 'supabase/migrations/20260717170000_secure_atomic_editorial_publication.sql',
  'version-history': 'src/features/admin/editorial/ConnectedEditorialRecordEditor.tsx',
  search: 'src/features/admin/DatasetTable.tsx',
  filters: 'src/features/admin/DatasetTable.tsx',
  mobile: 'src/styles/legacy/08-admin.css',
  verification: 'shared/data-engine/verification-registry.ts',
}

function itemCapabilityStatus(
  capability: ReadinessCapability,
): ReadinessStatus | null {
  switch (capability) {
    case 'browser':
    case 'viewer':
    case 'search':
    case 'filters':
    case 'public-api':
    case 'public-pages':
    case 'mobile':
      return 'implemented'
    case 'editor':
    case 'validation':
    case 'publishing':
    case 'version-history':
      return 'missing'
    default:
      return null
  }
}

function adminCapabilityStatus(
  key: DatasetKey,
  capability: ReadinessCapability,
): ReadinessStatus | null {
  if (key === 'items') {
    const itemStatus = itemCapabilityStatus(capability)
    if (itemStatus) return itemStatus
  }

  switch (capability) {
    case 'browser':
    case 'viewer':
    case 'search':
    case 'mobile':
      return 'implemented'

    case 'editor':
      return DATASET_CAPABILITY_REGISTRY[key].editing
        ? 'implemented'
        : 'missing'

    case 'validation':
      return DATASET_CAPABILITY_REGISTRY[key].validation
        ? 'implemented'
        : 'missing'

    case 'version-history':
      return DATASET_CAPABILITY_REGISTRY[key].versionHistory
        ? 'implemented'
        : 'missing'

    case 'publishing':
      if (!DATASET_CAPABILITY_REGISTRY[key].publishing) {
        return 'missing'
      }

      return key === 'buildings'
        ? 'implemented'
        : 'partial'

    case 'filters':
      return 'missing'

    case 'verification':
      return getDatasetVerificationReadinessStatus(key)

    default:
      return null
  }
}

function itemEvidence(
  capability: ReadinessCapability,
): string | undefined {
  switch (capability) {
    case 'browser':
    case 'viewer':
      return 'src/features/admin/itemsDatasetAdapter.ts'
    case 'search':
      return 'server/search/runtime.ts'
    case 'filters':
    case 'public-pages':
    case 'mobile':
      return 'src/pages/CompanionIndexPage.tsx'
    case 'public-api':
      return 'api/data-engine/dataset.ts'
    default:
      return undefined
  }
}

function createCapabilities(key: DatasetKey): readonly CapabilityReadiness[] {
  const usesDataEngine = (IMPORTABLE_DATASET_KEYS as readonly DatasetKey[]).includes(key)

  return CAPABILITIES.map((capability) => {
    if (capability === 'import' || capability === 'adapter') {
      if (usesDataEngine) {
        return {
          capability,
          status: 'implemented',
          evidence: 'server/data-engine/registry.ts',
          note: 'Registered Data Engine importer.',
        }
      }

      if (key === 'items') {
        return {
          capability,
          status: 'implemented',
          evidence: 'server/data-engine/loadPublishedCompanionItemsDataset.ts',
          note:
            capability === 'import'
              ? 'The item catalogue is intentionally non-importable and is exposed through a governed published projection.'
              : 'The published Companion item projection is registered with the shared Data Engine and Admin browser.',
        }
      }

      return {
        capability,
        status: 'implemented',
        evidence: 'source_hero_skill_facts and source_scrape_runs',
        note: 'Hero Skills intentionally uses source staging rather than a standard Data Engine importer.',
      }
    }

    const adminStatus = adminCapabilityStatus(
      key,
      capability,
    )

    if (adminStatus) {
      const buildingsPublishingAccepted =
        key === 'buildings' && capability === 'publishing'
      const itemDataset = key === 'items'
      const evidence = itemDataset
        ? itemEvidence(capability)
        : buildingsPublishingAccepted
          ? 'docs/releases/COMPANION-BUILDINGS-001.md'
          : ADMIN_CAPABILITY_EVIDENCE[capability]

      return {
        capability,
        status: adminStatus,
        evidence,
        note:
          buildingsPublishingAccepted
            ? 'Live draft, review, approval, publication, rollback and restoration acceptance passed against the governed Buildings projection.'
            : itemDataset && adminStatus === 'implemented'
              ? 'Implemented by the text-only Companion Index foundation and protected by dedicated regression coverage.'
              : itemDataset && capability === 'publishing'
                ? 'Text records are projected from the governed intake, but the shared item editor, media publication and atomic rollback workflow are not implemented.'
                : itemDataset && adminStatus === 'missing'
                  ? `The ${capability} capability is deliberately unavailable until the governed item editorial workflow is built.`
                  : adminStatus === 'implemented'
                    ? 'Verified in the shared Admin dataset experience.'
                    : adminStatus === 'partial' && capability === 'publishing'
                      ? 'The atomic publication contract exists, but live publish, rollback and restoration acceptance remains incomplete for this dataset.'
                      : capability === 'verification'
                        ? 'Derived from current Verification Centre evidence. Live RLS, migration and publication checks remain blocked or not run.'
                        : capability === 'filters'
                          ? 'Search and sorting are available; dataset-specific filters are not implemented.'
                          : `The ${capability} capability is not implemented for this dataset.`,
      }
    }

    return {
      capability,
      status: 'not-audited',
      note: 'Requires implementation evidence before a readiness status is assigned.',
    }
  })
}

export const DATASET_READINESS_REGISTRY: readonly DatasetReadinessDefinition[] =
  DATASET_KEYS.map((key) => ({
    key,
    name: DATASET_NAMES[key],
    domain: DATASET_DOMAINS[key],
    description: `${DATASET_NAMES[key]} canonical dataset and editorial capabilities.`,
    canonical: true,
    importMode: key === 'hero-skills'
      ? 'source-staging'
      : key === 'items'
        ? 'published-projection'
        : 'data-engine',
    capabilities: createCapabilities(key),
  }))

export function getDatasetReadinessDefinition(
  key: DatasetKey,
): DatasetReadinessDefinition {
  const definition = DATASET_READINESS_REGISTRY.find(
    (candidate) => candidate.key === key,
  )

  if (!definition) {
    throw new Error(`Dataset readiness definition not found for "${key}".`)
  }

  return definition
}

export function getDatasetCapabilityReadiness(
  key: DatasetKey,
  capability: ReadinessCapability,
): CapabilityReadiness {
  const readiness = getDatasetReadinessDefinition(key)
    .capabilities.find(
      (candidate) => candidate.capability === capability,
    )

  if (!readiness) {
    throw new Error(
      `Dataset readiness capability "${capability}" not found for "${key}".`,
    )
  }

  return readiness
}
