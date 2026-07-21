import type { ForgeId, ParsedForgeId } from './contracts.js'

const COMPONENT = '[a-z0-9]+(?:-[a-z0-9]+)*'
const ID_PATTERN = new RegExp(`^${COMPONENT}(?:\\.${COMPONENT})+$`)
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function normaliseForgeId(value: string): string {
  return value.trim().toLowerCase()
}

export function parseForgeId(value: unknown): ParsedForgeId | null {
  if (typeof value !== 'string') return null
  const normalised = normaliseForgeId(value)
  if (!isValidForgeId(normalised)) return null
  const separator = normalised.indexOf('.')
  return {
    forgeId: normalised as ForgeId,
    namespace: normalised.slice(0, separator),
    localKey: normalised.slice(separator + 1),
  }
}

export function isValidForgeId(value: unknown): value is ForgeId {
  if (typeof value !== 'string' || value !== normaliseForgeId(value) || UUID_PATTERN.test(value)) return false
  return ID_PATTERN.test(value)
}

export function createForgeId(namespace: string, localKey: string): ForgeId | null {
  const candidate = `${namespace}.${localKey}`
  return isValidForgeId(candidate) ? candidate as ForgeId : null
}

export function namespaceOf(value: ForgeId | string): string | null {
  return parseForgeId(value)?.namespace ?? null
}

export function localKeyOf(value: ForgeId | string): string | null {
  return parseForgeId(value)?.localKey ?? null
}

export function forgeIdsEqual(left: unknown, right: unknown): boolean {
  const a = parseForgeId(left)
  const b = parseForgeId(right)
  return Boolean(a && b && a.forgeId === b.forgeId)
}

export function serialiseForgeId(value: ForgeId): string {
  if (!isValidForgeId(value)) throw new Error('Cannot serialise an invalid Forge ID.')
  return JSON.stringify(value)
}

export function assertForgeId(value: unknown): ForgeId {
  const parsed = parseForgeId(value)
  if (!parsed) throw new Error('Invalid Forge ID.')
  return parsed.forgeId
}
