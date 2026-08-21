export type PetMedia = {
  status: 'available' | 'pending'
  path: string | null
  filename: string | null
  originalFilename: string | null
  rights: string | null
  sprite: readonly [number, number] | null
}

export type PetSkillProgressionRow = {
  level: number
  effect: string
  description?: string
}

export type PetLevelRow = {
  level: number
  petFood: number
  growthManual: number | null
  nutrientPotion: number | null
  promotionMedallion: number | null
}

export type Pet = {
  key: string
  name: string
  generation: number
  maxLevel: number
  unlock: {
    label: string
    approxDays: number | null
    confidence: string
  }
  summary: string | null
  skill: {
    name: string
    description: string
    cooldown: string | null
    effect: string | null
    progression: PetSkillProgressionRow[]
  }
  progressionCurve: string
  notes: string[]
  media: PetMedia
}

export type ProgressionCurve = {
  key: string
  maxLevel: number
  levelProgression: PetLevelRow[]
  advancementMilestones: PetLevelRow[]
  sourceRepresentative: string
}

export type RefinementThreshold = {
  pets: string[]
  gray: string
  green: string
  blue: string
  purple: string
  gold: string
  confidence: string
}

export type PetDataset = {
  _meta: {
    schemaVersion: string
    datasetId: string
    title: string
    description: string
    source: {
      filename: string
      basis: string
      received: string
      terminology: string
    }
    media: {
      archive: string
      received: string
      available: number
      pending: string[]
      rightsStatement: string
    }
    coverage: {
      petCount: number
      generations: number[]
      minMaxLevel: number
      maxMaxLevel: number
    }
  }
  progressionCurves: Record<string, ProgressionCurve>
  pets: Pet[]
  refinement: {
    stats: string[]
    rarityOrder: string[]
    thresholds: RefinementThreshold[]
    guidance: string[]
    confidence: string
  }
  strategy: {
    f2pPriority: string[]
    spenderPriority: string[]
    sourceNotes: string[]
    confidence: string
  }
}

type JsonRecord = Record<string, unknown>

type ParsedMeta = PetDataset['_meta'] & {
  curveFiles: Record<string, string>
  refinement: PetDataset['refinement']
  strategy: PetDataset['strategy']
}

const EXPECTED_DATASET_ID = 'kingshot-pets'
const EXPECTED_SCHEMA_VERSION = '1.0.0'
const EXPECTED_PET_COUNT = 14
const CURVE_KEYS = ['max-50', 'max-60', 'max-70', 'max-80', 'max-100'] as const
const CURVE_MAX_LEVELS = new Map<string, number>([
  ['max-50', 50],
  ['max-60', 60],
  ['max-70', 70],
  ['max-80', 80],
  ['max-100', 100],
])
const PET_SPRITE_PATH = '/media/pets/pets-sprite.webp'

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function fail(path: string, message: string): never {
  throw new Error(`Pet dataset validation failed at ${path}: ${message}`)
}

function expectRecord(value: unknown, path: string): JsonRecord {
  if (!isRecord(value)) fail(path, 'expected an object')
  return value
}

function expectArray(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) fail(path, 'expected an array')
  return value
}

function expectString(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) fail(path, 'expected a non-empty string')
  return value
}

function expectNullableString(value: unknown, path: string): string | null {
  if (value === null) return null
  return expectString(value, path)
}

function expectInteger(value: unknown, path: string, minimum = 0): number {
  if (!Number.isInteger(value) || (value as number) < minimum) fail(path, `expected an integer >= ${minimum}`)
  return value as number
}

function expectNullableInteger(value: unknown, path: string, minimum = 0): number | null {
  if (value === null) return null
  return expectInteger(value, path, minimum)
}

function expectStringArray(value: unknown, path: string): string[] {
  return expectArray(value, path).map((entry, index) => expectString(entry, `${path}[${index}]`))
}

function parseThreshold(value: unknown, path: string): RefinementThreshold {
  const record = expectRecord(value, path)
  return {
    pets: expectStringArray(record.pets, `${path}.pets`),
    gray: expectString(record.gray, `${path}.gray`),
    green: expectString(record.green, `${path}.green`),
    blue: expectString(record.blue, `${path}.blue`),
    purple: expectString(record.purple, `${path}.purple`),
    gold: expectString(record.gold, `${path}.gold`),
    confidence: expectString(record.confidence, `${path}.confidence`),
  }
}

function parseMeta(value: unknown): ParsedMeta {
  const root = expectRecord(value, 'meta')
  const meta = expectRecord(root._meta, 'meta._meta')
  if (meta.datasetId !== EXPECTED_DATASET_ID) fail('meta._meta.datasetId', `expected ${EXPECTED_DATASET_ID}`)
  if (meta.schemaVersion !== EXPECTED_SCHEMA_VERSION) fail('meta._meta.schemaVersion', `expected ${EXPECTED_SCHEMA_VERSION}`)

  const source = expectRecord(meta.source, 'meta._meta.source')
  const media = expectRecord(meta.media, 'meta._meta.media')
  const coverage = expectRecord(meta.coverage, 'meta._meta.coverage')
  const generations = expectArray(coverage.generations, 'meta._meta.coverage.generations').map((entry, index) => expectInteger(entry, `meta._meta.coverage.generations[${index}]`, 1))
  if (coverage.petCount !== EXPECTED_PET_COUNT) fail('meta._meta.coverage.petCount', `expected ${EXPECTED_PET_COUNT}`)
  if (generations.join(',') !== '1,2,3,4,5,6,7') fail('meta._meta.coverage.generations', 'expected generations 1 through 7 exactly once and in order')
  if (coverage.minMaxLevel !== 50 || coverage.maxMaxLevel !== 100) fail('meta._meta.coverage', 'expected max-level coverage 50 through 100')

  const curveFilesRaw = expectRecord(root.curveFiles, 'meta.curveFiles')
  const curveFiles: Record<string, string> = {}
  for (const key of CURVE_KEYS) {
    const path = expectString(curveFilesRaw[key], `meta.curveFiles.${key}`)
    if (path !== `/data/pets/${key}.json`) fail(`meta.curveFiles.${key}`, `unexpected path ${path}`)
    curveFiles[key] = path
  }
  if (Object.keys(curveFilesRaw).length !== CURVE_KEYS.length) fail('meta.curveFiles', 'unexpected curve file entry')

  const refinementRaw = expectRecord(root.refinement, 'meta.refinement')
  const strategyRaw = expectRecord(root.strategy, 'meta.strategy')

  return {
    schemaVersion: EXPECTED_SCHEMA_VERSION,
    datasetId: EXPECTED_DATASET_ID,
    title: expectString(meta.title, 'meta._meta.title'),
    description: expectString(meta.description, 'meta._meta.description'),
    source: {
      filename: expectString(source.filename, 'meta._meta.source.filename'),
      basis: expectString(source.basis, 'meta._meta.source.basis'),
      received: expectString(source.received, 'meta._meta.source.received'),
      terminology: expectString(source.terminology, 'meta._meta.source.terminology'),
    },
    media: {
      archive: expectString(media.archive, 'meta._meta.media.archive'),
      received: expectString(media.received, 'meta._meta.media.received'),
      available: expectInteger(media.available, 'meta._meta.media.available'),
      pending: expectStringArray(media.pending, 'meta._meta.media.pending'),
      rightsStatement: expectString(media.rightsStatement, 'meta._meta.media.rightsStatement'),
    },
    coverage: {
      petCount: EXPECTED_PET_COUNT,
      generations,
      minMaxLevel: 50,
      maxMaxLevel: 100,
    },
    curveFiles,
    refinement: {
      stats: expectStringArray(refinementRaw.stats, 'meta.refinement.stats'),
      rarityOrder: expectStringArray(refinementRaw.rarityOrder, 'meta.refinement.rarityOrder'),
      thresholds: expectArray(refinementRaw.thresholds, 'meta.refinement.thresholds').map((entry, index) => parseThreshold(entry, `meta.refinement.thresholds[${index}]`)),
      guidance: expectStringArray(refinementRaw.guidance, 'meta.refinement.guidance'),
      confidence: expectString(refinementRaw.confidence, 'meta.refinement.confidence'),
    },
    strategy: {
      f2pPriority: expectStringArray(strategyRaw.f2pPriority, 'meta.strategy.f2pPriority'),
      spenderPriority: expectStringArray(strategyRaw.spenderPriority, 'meta.strategy.spenderPriority'),
      sourceNotes: expectStringArray(strategyRaw.sourceNotes, 'meta.strategy.sourceNotes'),
      confidence: expectString(strategyRaw.confidence, 'meta.strategy.confidence'),
    },
  }
}

function parseMedia(value: unknown, path: string): PetMedia {
  const media = expectRecord(value, path)
  const status = media.status
  if (status !== 'available' && status !== 'pending') fail(`${path}.status`, 'expected available or pending')

  const parsed: PetMedia = {
    status,
    path: media.path === null ? null : expectString(media.path, `${path}.path`),
    filename: media.filename === null ? null : expectString(media.filename, `${path}.filename`),
    originalFilename: media.originalFilename === null ? null : expectString(media.originalFilename, `${path}.originalFilename`),
    rights: media.rights === null ? null : expectString(media.rights, `${path}.rights`),
    sprite: null,
  }

  if (media.sprite !== null) {
    const sprite = expectArray(media.sprite, `${path}.sprite`)
    if (sprite.length !== 2) fail(`${path}.sprite`, 'expected exactly two coordinates')
    const column = expectInteger(sprite[0], `${path}.sprite[0]`)
    const row = expectInteger(sprite[1], `${path}.sprite[1]`)
    if (column > 3 || row > 3) fail(`${path}.sprite`, 'coordinates must be within the 4x4 sprite')
    parsed.sprite = [column, row]
  }

  if (status === 'available') {
    if (parsed.path !== PET_SPRITE_PATH || parsed.filename !== 'pets-sprite.webp') fail(path, 'available media must resolve to the governed pet sprite')
    if (!parsed.originalFilename || !parsed.rights || !parsed.sprite) fail(path, 'available media requires original filename, rights and sprite coordinates')
  } else if (parsed.path !== null || parsed.filename !== null || parsed.originalFilename !== null || parsed.rights !== null || parsed.sprite !== null) {
    fail(path, 'pending media must remain explicitly null')
  }

  return parsed
}

function parsePet(value: unknown, index: number): Pet {
  const path = `pets[${index}]`
  const record = expectRecord(value, path)
  const generation = expectInteger(record.gen, `${path}.gen`, 1)
  if (generation > 7) fail(`${path}.gen`, 'expected generation 1 through 7')
  const maxLevel = expectInteger(record.max, `${path}.max`, 1)
  const expectedCurve = `max-${maxLevel}`
  if (!CURVE_MAX_LEVELS.has(expectedCurve)) fail(`${path}.max`, `unsupported max level ${maxLevel}`)
  if (record.curve !== expectedCurve) fail(`${path}.curve`, `expected ${expectedCurve}`)

  const unlock = expectArray(record.unlock, `${path}.unlock`)
  if (unlock.length !== 3 || unlock[2] !== 'community_observation') fail(`${path}.unlock`, 'expected [label, approxDays, community_observation]')

  const skill = expectRecord(record.skill, `${path}.skill`)
  const progression = expectArray(skill.progression, `${path}.skill.progression`).map((entry, rowIndex): PetSkillProgressionRow => {
    const row = expectArray(entry, `${path}.skill.progression[${rowIndex}]`)
    if (row.length !== 3) fail(`${path}.skill.progression[${rowIndex}]`, 'expected exactly three fields')
    return {
      level: expectInteger(row[0], `${path}.skill.progression[${rowIndex}][0]`, 1),
      effect: expectString(row[1], `${path}.skill.progression[${rowIndex}][1]`),
      ...(row[2] === null ? {} : { description: expectString(row[2], `${path}.skill.progression[${rowIndex}][2]`) }),
    }
  })
  const expectedSkillLevels = maxLevel / 10
  if (progression.length !== expectedSkillLevels || progression.some((row, rowIndex) => row.level !== rowIndex + 1)) {
    fail(`${path}.skill.progression`, `expected sequential levels 1-${expectedSkillLevels}`)
  }

  return {
    key: expectString(record.key, `${path}.key`),
    name: expectString(record.name, `${path}.name`),
    generation,
    maxLevel,
    unlock: {
      label: expectString(unlock[0], `${path}.unlock[0]`),
      approxDays: expectNullableInteger(unlock[1], `${path}.unlock[1]`),
      confidence: 'community_observation',
    },
    summary: expectNullableString(record.summary, `${path}.summary`),
    skill: {
      name: expectString(skill.name, `${path}.skill.name`),
      description: expectString(skill.description, `${path}.skill.description`),
      cooldown: expectNullableString(skill.cooldown, `${path}.skill.cooldown`),
      effect: expectNullableString(skill.effect, `${path}.skill.effect`),
      progression,
    },
    progressionCurve: expectedCurve,
    notes: expectStringArray(record.notes, `${path}.notes`),
    media: parseMedia(record.media, `${path}.media`),
  }
}

function parsePets(value: unknown): Pet[] {
  const rawPets = expectArray(value, 'pets')
  if (rawPets.length !== EXPECTED_PET_COUNT) fail('pets', `expected ${EXPECTED_PET_COUNT} records`)
  const pets = rawPets.map(parsePet)
  const keys = new Set<string>()
  const names = new Set<string>()
  const spriteCoordinates = new Set<string>()
  let availableMedia = 0
  const pendingNames: string[] = []

  for (const pet of pets) {
    if (!/^[a-z0-9-]+$/.test(pet.key)) fail(`pets.${pet.key}.key`, 'expected a lowercase kebab-case key')
    if (keys.has(pet.key)) fail(`pets.${pet.key}.key`, 'duplicate pet key')
    if (names.has(pet.name)) fail(`pets.${pet.key}.name`, 'duplicate pet name')
    keys.add(pet.key)
    names.add(pet.name)

    if (pet.media.status === 'available') {
      availableMedia += 1
      const coordinate = pet.media.sprite?.join(',')
      if (!coordinate) fail(`pets.${pet.key}.media.sprite`, 'available media has no coordinate')
      if (spriteCoordinates.has(coordinate)) fail(`pets.${pet.key}.media.sprite`, 'duplicate sprite coordinate')
      spriteCoordinates.add(coordinate)
    } else {
      pendingNames.push(pet.name)
    }
  }

  if (availableMedia !== 13 || pendingNames.join(',') !== 'Ironclad War Bear') fail('pets.media', 'expected 13 available artworks and Ironclad War Bear as the only pending artwork')
  return pets
}

function parseCurve(value: unknown, key: string): ProgressionCurve {
  const record = expectRecord(value, `curves.${key}`)
  const expectedMax = CURVE_MAX_LEVELS.get(key)
  if (!expectedMax) fail(`curves.${key}`, 'unknown curve key')
  if (record.max !== expectedMax) fail(`curves.${key}.max`, `expected ${expectedMax}`)

  const rows = expectArray(record.rows, `curves.${key}.rows`).map((entry, index): PetLevelRow => {
    const row = expectArray(entry, `curves.${key}.rows[${index}]`)
    if (row.length !== 5) fail(`curves.${key}.rows[${index}]`, 'expected exactly five fields')
    const level = expectInteger(row[0], `curves.${key}.rows[${index}][0]`, 2)
    if (level !== index + 2) fail(`curves.${key}.rows[${index}][0]`, `expected level ${index + 2}`)
    return {
      level,
      petFood: expectInteger(row[1], `curves.${key}.rows[${index}][1]`),
      growthManual: expectNullableInteger(row[2], `curves.${key}.rows[${index}][2]`),
      nutrientPotion: expectNullableInteger(row[3], `curves.${key}.rows[${index}][3]`),
      promotionMedallion: expectNullableInteger(row[4], `curves.${key}.rows[${index}][4]`),
    }
  })
  if (rows.length !== expectedMax - 1) fail(`curves.${key}.rows`, `expected ${expectedMax - 1} level rows`)

  return {
    key,
    maxLevel: expectedMax,
    levelProgression: rows,
    advancementMilestones: rows.filter((row) => row.level % 10 === 0),
    sourceRepresentative: expectString(record.rep, `curves.${key}.rep`),
  }
}

async function fetchJson(fetcher: typeof fetch, path: string): Promise<unknown> {
  const response = await fetcher(path)
  if (!response.ok) throw new Error(`Pet dataset request failed for ${path} (${response.status})`)
  return response.json() as Promise<unknown>
}

export async function loadPetDataset(fetcher: typeof fetch = fetch): Promise<PetDataset> {
  const [metaPayload, petsPayload] = await Promise.all([
    fetchJson(fetcher, '/data/pets/meta.json'),
    fetchJson(fetcher, '/data/pets/pets.json'),
  ])
  const meta = parseMeta(metaPayload)
  const pets = parsePets(petsPayload)
  const curveEntries = await Promise.all(CURVE_KEYS.map(async (key) => {
    const payload = await fetchJson(fetcher, meta.curveFiles[key])
    return [key, parseCurve(payload, key)] as const
  }))
  const progressionCurves = Object.fromEntries(curveEntries) as Record<string, ProgressionCurve>

  for (const pet of pets) {
    const curve = progressionCurves[pet.progressionCurve]
    if (!curve || curve.maxLevel !== pet.maxLevel) fail(`pets.${pet.key}.progressionCurve`, 'curve is missing or does not match max level')
  }
  if (meta.media.available !== 13 || meta.media.pending.join(',') !== 'Ironclad War Bear') fail('meta._meta.media', 'metadata media coverage does not match governed pet records')

  return {
    _meta: {
      schemaVersion: meta.schemaVersion,
      datasetId: meta.datasetId,
      title: meta.title,
      description: meta.description,
      source: meta.source,
      media: meta.media,
      coverage: meta.coverage,
    },
    progressionCurves,
    pets,
    refinement: meta.refinement,
    strategy: meta.strategy,
  }
}
