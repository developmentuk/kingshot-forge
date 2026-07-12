export type RecentName = {
  id: string
  result: string
  label: string
  group: string
  copiedAt: number
}

export const RECENT_NAMES_STORAGE_KEY =
  'kingshot-forge-recent-names'

export const RECENT_NAMES_UPDATED_EVENT =
  'kingshot-forge-recent-names-updated'

const MAX_RECENT_NAMES = 12

function isRecentName(value: unknown): value is RecentName {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const item = value as Record<string, unknown>

  return (
    typeof item.id === 'string' &&
    typeof item.result === 'string' &&
    typeof item.label === 'string' &&
    typeof item.group === 'string' &&
    typeof item.copiedAt === 'number'
  )
}

export function loadRecentNames(): RecentName[] {
  try {
    const storedValue = window.localStorage.getItem(
      RECENT_NAMES_STORAGE_KEY,
    )

    if (!storedValue) {
      return []
    }

    const parsedValue: unknown = JSON.parse(storedValue)

    if (!Array.isArray(parsedValue)) {
      return []
    }

    return parsedValue
      .filter(isRecentName)
      .sort((first, second) => second.copiedAt - first.copiedAt)
      .slice(0, MAX_RECENT_NAMES)
  } catch {
    return []
  }
}

export function saveRecentName(
  currentNames: RecentName[],
  newName: RecentName,
): RecentName[] {
  const updatedNames = [
    newName,
    ...currentNames.filter(
      (item) => item.result !== newName.result,
    ),
  ]
    .sort((first, second) => second.copiedAt - first.copiedAt)
    .slice(0, MAX_RECENT_NAMES)

  window.localStorage.setItem(
    RECENT_NAMES_STORAGE_KEY,
    JSON.stringify(updatedNames),
  )

  window.dispatchEvent(
    new CustomEvent(RECENT_NAMES_UPDATED_EVENT),
  )

  return updatedNames
}

export function clearRecentNames() {
  window.localStorage.removeItem(RECENT_NAMES_STORAGE_KEY)

  window.dispatchEvent(
    new CustomEvent(RECENT_NAMES_UPDATED_EVENT),
  )
}