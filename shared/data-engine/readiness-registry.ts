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

export type DatasetDomain =
  | 'hero'
  | 'progression'
  | 'events'
  | 'editorial'

export type DatasetReadinessDefinition = {
  key: DatasetKey
  name: string
  domain: DatasetDomain
  description: string
  canonical: boolean
  importMode: 'data-engine' | 'source-staging'
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
}

function adminCapabilityStatus(
  key: DatasetKey,
  capability: ReadinessCapability,
): ReadinessStatus | null {
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
      return DATASET_CAPABILITY_REGISTRY[key].publishing
        ? 'partial'
        : 'missing'

    case 'filters':
      return 'missing'

    default:
      return null
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
      return {
        capability,
        status: adminStatus,
        evidence: ADMIN_CAPABILITY_EVIDENCE[capability],
        note:
          adminStatus === 'implemented'
            ? 'Verified in the shared Admin dataset experience.'
            : adminStatus === 'partial' && capability === 'publishing'
              ? 'The atomic publication contract is implemented locally but its unapplied migration and live transaction remain unverified.'
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
    importMode: key === 'hero-skills' ? 'source-staging' : 'data-engine',
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
