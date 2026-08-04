import {
  IMPORTABLE_DATASET_KEYS,
  PUBLISHED_DATASET_KEYS,
  type DatasetKey,
  type PublishedDatasetKey,
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

export type DatasetReadinessDefinition = {
  key: PublishedDatasetKey
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

const DATASET_NAMES: Record<PublishedDatasetKey, string> = {
  heroes: 'Heroes',
  'hero-skills': 'Hero Skills',
  'hero-xp': 'Hero XP',
  shards: 'Hero Shards',
  gear: 'Hero Gear',
  charm: 'Chief Charms',
  troops: 'Troops',
  buildings: 'Buildings',
  truegold: 'Truegold',
  'war-academy': 'War Academy',
  vip: 'VIP',
  events: 'Events',
  masters: 'Mastery Forging',
  kvk: 'KvK Scoring',
  items: 'Companion Items',
}

const DATASET_DOMAINS: Record<PublishedDatasetKey, DatasetDomain> = {
  heroes: 'hero',
  'hero-skills': 'hero',
  'hero-xp': 'hero',
  shards: 'hero',
  gear: 'hero',
  charm: 'progression',
  troops: 'progression',
  buildings: 'progression',
  truegold: 'progression',
  'war-academy': 'progression',
  vip: 'progression',
  events: 'events',
  masters: 'progression',
  kvk: 'events',
  items: 'editorial',
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

const ITEM_ADMIN_CAPABILITY_EVIDENCE: Partial<
  Record<ReadinessCapability, string>
> = {
  adapter: 'src/features/admin/itemsDatasetAdapter.ts',
  browser: 'scripts/test-companion-admin-stage-1a.mjs',
  viewer: 'src/features/admin/DatasetRecordPanel.tsx',
  filters: 'src/features/admin/itemsDatasetAdapter.ts',
  'public-api': 'api/data-engine/dataset.ts',
  'public-pages': 'docs/releases/COMPANION-INDEX-001.md',
  mobile: 'scripts/test-companion-admin-stage-1a.mjs',
}

function itemAdminCapabilityStatus(
  capability: ReadinessCapability,
): ReadinessStatus | null {
  switch (capability) {
    case 'adapter':
    case 'browser':
    case 'filters':
    case 'public-api':
    case 'public-pages':
      return 'implemented'
    case 'viewer':
    case 'mobile':
      return 'partial'
    case 'import':
    case 'editor':
    case 'validation':
    case 'publishing':
    case 'version-history':
    case 'search':
    case 'verification':
      return 'missing'
    default:
      return null
  }
}

function adminCapabilityStatus(
  key: PublishedDatasetKey,
  capability: ReadinessCapability,
): ReadinessStatus | null {
  if (key === 'items') {
    return itemAdminCapabilityStatus(capability)
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

function createCapabilities(key: PublishedDatasetKey): readonly CapabilityReadiness[] {
  const usesDataEngine = (IMPORTABLE_DATASET_KEYS as readonly DatasetKey[]).includes(key as DatasetKey)

  return CAPABILITIES.map((capability) => {
    if (capability === 'import' || capability === 'adapter') {
      if (key === 'items') {
        return {
          capability,
          status: capability === 'adapter' ? 'implemented' : 'missing',
          evidence: capability === 'adapter'
            ? ITEM_ADMIN_CAPABILITY_EVIDENCE.adapter
            : undefined,
          note: capability === 'adapter'
            ? 'Read-only adapter over the published Item Data Engine contract.'
            : 'Items is published-only in Stage 1A and is not importable through Admin.',
        }
      }

      if (usesDataEngine) {
        return {
          capability,
          status: 'implemented',
          evidence: 'server/data-engine/registry.ts',
          note: 'Registered Data Engine importer.',
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

      return {
        capability,
        status: adminStatus,
        evidence: key === 'items'
          ? ITEM_ADMIN_CAPABILITY_EVIDENCE[capability]
          : buildingsPublishingAccepted
          ? 'docs/releases/COMPANION-BUILDINGS-001.md'
          : ADMIN_CAPABILITY_EVIDENCE[capability],
        note:
          buildingsPublishingAccepted
            ? 'Live draft, review, approval, publication, rollback and restoration acceptance passed against the governed Buildings projection.'
            : adminStatus === 'implemented'
              ? 'Verified in the shared Admin dataset experience.'
              : key === 'items' && capability === 'viewer'
                ? 'A generic record panel is available, but a complete Item viewer is outside Stage 1A.'
                : key === 'items' && capability === 'mobile'
                  ? 'Responsive contracts are covered by Stage 1A tests; live mobile acceptance remains a later gate.'
                  : key === 'items' && capability === 'filters'
                    ? 'Item-specific category, trust-state, media-state and media-role filters are implemented and tested.'
                    : key === 'items'
                      ? `The Item ${capability} capability remains unavailable in Stage 1A.`
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
  PUBLISHED_DATASET_KEYS.map((key) => ({
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
  key: PublishedDatasetKey,
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
  key: PublishedDatasetKey,
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
