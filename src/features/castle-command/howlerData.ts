import type { Pet, PetDataset } from '../companion/pets/petData'

export type HowlerLevel = {
  level: number
  marchSpeedPercent: number
  lethalityReductionPercent: number | null
}

export type HowlerDefinition = {
  petName: string
  skillName: string
  cooldown: string | null
  description: string
  levels: HowlerLevel[]
}

const HOWLER_PET_KEY = 'grizzly-bear'
const HOWLER_SKILL_NAME = 'The Howler'

function parsePercent(value: string): number | null {
  const match = value.match(/(\d+(?:\.\d+)?)%/)
  if (!match) return null
  const parsed = Number(match[1])
  return Number.isFinite(parsed) ? parsed : null
}

function parseHowlerLevel(effect: string, level: number): HowlerLevel | null {
  const [marchSpeedRaw, lethalityRaw] = effect.split('/').map((part) => part.trim())
  const marchSpeedPercent = parsePercent(marchSpeedRaw ?? '')
  if (marchSpeedPercent === null) return null

  return {
    level,
    marchSpeedPercent,
    lethalityReductionPercent: parsePercent(lethalityRaw ?? ''),
  }
}

export function getHowlerPet(dataset: PetDataset): Pet | null {
  const pet = dataset.pets.find((candidate) => candidate.key === HOWLER_PET_KEY)
  if (!pet || pet.skill.name !== HOWLER_SKILL_NAME) return null
  return pet
}

export function getHowlerDefinition(dataset: PetDataset): HowlerDefinition | null {
  const pet = getHowlerPet(dataset)
  if (!pet) return null

  const levels = pet.skill.progression
    .map((row) => parseHowlerLevel(row.effect, row.level))
    .filter((row): row is HowlerLevel => row !== null)

  if (levels.length !== pet.skill.progression.length) return null

  return {
    petName: pet.name,
    skillName: pet.skill.name,
    cooldown: pet.skill.cooldown,
    description: pet.skill.description,
    levels,
  }
}
