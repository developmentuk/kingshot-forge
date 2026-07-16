import {
  DATASET_KEYS,
  IMPORTABLE_DATASET_KEYS,
  type DatasetKey,
} from './datasets.js'

import type {
  CapabilityReadiness,
  ReadinessCapability,
} from '../platform/readiness.js'

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

function createInitialCapabilities(key: DatasetKey): readonly CapabilityReadiness[] {
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
    capabilities: createInitialCapabilities(key),
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
