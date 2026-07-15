import type {
  DatasetImporter,
  DatasetSourceMetadata,
  NormalisedDataset,
} from '../../../../shared/data-engine/types.js'

import type {
  NormalisedWarAcademyRecord,
  WarAcademyLevelSourceRecord,
  WarAcademySourcePayload,
  WarAcademyTechnologySourceRecord,
} from './types.js'

const WAR_ACADEMY_SOURCE_URL =
  'https://kingshotpro.com/data/war-academy.json'

function isObject(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

function readString(
  ...values: unknown[]
): string | null {
  for (const value of values) {
    if (
      typeof value === 'string' &&
      value.trim().length > 0
    ) {
      return value.trim()
    }
  }

  return null
}

function readNumber(
  ...values: unknown[]
): number | null {
  for (const value of values) {
    if (
      typeof value === 'number' &&
      Number.isFinite(value)
    ) {
      return value
    }

    if (
      typeof value === 'string' &&
      value.trim() !== ''
    ) {
      const parsed = Number(value)

      if (Number.isFinite(parsed)) {
        return parsed
      }
    }
  }

  return null
}

function createKey(
  technologyId: string,
  level: number,
): string {
  return `${technologyId}-level-${level}`
}

function createSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function parseMetadata(
  value: unknown,
): DatasetSourceMetadata | null {
  if (!isObject(value)) {
    return null
  }

  const provenance = isObject(value.provenance)
    ? value.provenance
    : null

  return {
    dataset:
      readString(value.dataset) ?? undefined,

    title:
      readString(value.title) ?? undefined,

    description:
      readString(value.description) ??
      undefined,

    canonical:
      readString(value.canonical) ??
      undefined,

    updated:
      readString(value.updated) ?? undefined,

    verified:
      readString(
        value.verified,
        provenance?.verified,
      ) ?? undefined,

    accuracyScore:
      readNumber(
        value.accuracyScore,
        provenance?.accuracyScore,
      ) ?? undefined,

    license:
      readString(value.license) ?? undefined,

    provenance: value.provenance,
  }
}

function parsePayload(
  payload: unknown,
): WarAcademySourcePayload {
  if (!isObject(payload)) {
    throw new Error(
      'War Academy source payload must be a JSON object.',
    )
  }

  if (!Array.isArray(payload.technologies)) {
    throw new Error(
      'War Academy source payload must contain a technologies array.',
    )
  }

  return {
    _meta: payload._meta,
    technologies: payload.technologies,
  }
}

function normaliseTechnologyLevel(
  technologyValue: unknown,
  levelValue: unknown,
  metadata: DatasetSourceMetadata | null,
): NormalisedWarAcademyRecord {
  if (!isObject(technologyValue)) {
    throw new Error(
      'War Academy technology must be a JSON object.',
    )
  }

  if (!isObject(levelValue)) {
    throw new Error(
      'War Academy level must be a JSON object.',
    )
  }

  const technology =
    technologyValue as WarAcademyTechnologySourceRecord

  const levelRecord =
    levelValue as WarAcademyLevelSourceRecord

  const technologyName =
    readString(technology.name)

  if (!technologyName) {
    throw new Error(
      'War Academy technology is missing a valid name.',
    )
  }

  const technologyId =
    readString(technology.id) ??
    createSlug(technologyName)

  if (!technologyId) {
    throw new Error(
      `Unable to create an ID for "${technologyName}".`,
    )
  }

  const category =
    readString(technology.category)

  if (!category) {
    throw new Error(
      `War Academy technology "${technologyName}" is missing a category.`,
    )
  }

  const level =
    readNumber(levelRecord.level)

  if (
    level === null ||
    !Number.isInteger(level) ||
    level < 1
  ) {
    throw new Error(
      `War Academy technology "${technologyName}" has an invalid level.`,
    )
  }

  return {
    key: createKey(
      technologyId,
      level,
    ),

    technology_id: technologyId,
    technology_name: technologyName,
    category,
    benefit:
      readString(technology.benefit),

    level,

    food:
      readNumber(levelRecord.food),

    wood:
      readNumber(levelRecord.wood),

    stone:
      readNumber(levelRecord.stone),

    iron:
      readNumber(levelRecord.iron),

    gold:
      readNumber(levelRecord.gold),

    truegold_dust:
      readNumber(
        levelRecord.truegoldDust,
        levelRecord.truegold_dust,
      ),

    time_seconds:
      readNumber(
        levelRecord.timeSec,
        levelRecord.time_sec,
      ),

    is_active: true,

    source_updated_at:
      metadata?.updated ?? null,

    source_verified:
      metadata?.verified ?? null,

    source_accuracy_score:
      metadata?.accuracyScore ?? null,

    source_name: 'KingshotPro',

    source_url:
      metadata?.canonical ??
      WAR_ACADEMY_SOURCE_URL,
  }
}

function normalisePayload(
  payload: WarAcademySourcePayload,
): NormalisedDataset<NormalisedWarAcademyRecord> {
  const metadata =
    parseMetadata(payload._meta)

  const records: NormalisedWarAcademyRecord[] = []

  for (const technology of payload.technologies) {
    if (!isObject(technology)) {
      throw new Error(
        'War Academy technology must be a JSON object.',
      )
    }

    if (!Array.isArray(technology.levels)) {
      throw new Error(
        'War Academy technology must contain a levels array.',
      )
    }

    for (const level of technology.levels) {
      records.push(
        normaliseTechnologyLevel(
          technology,
          level,
          metadata,
        ),
      )
    }
  }

  return {
    metadata,
    records,
  }
}

export const warAcademyImporter:
  DatasetImporter<
    WarAcademySourcePayload,
    NormalisedWarAcademyRecord
  > = {
    key: 'war-academy',

    sourceUrl: WAR_ACADEMY_SOURCE_URL,

    parsePayload,

    normalisePayload,

    getRecordKey(record) {
      return record.key
    },
  }