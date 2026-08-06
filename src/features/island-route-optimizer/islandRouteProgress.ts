export type IslandRouteMode = 'single' | 'double'

export type IslandRouteProgressState = Readonly<{
  completedChestIds: ReadonlyArray<string>
  currentRound: number
  mode: IslandRouteMode
  updatedAt: string
}>

export function islandRouteProgressKey(mode: IslandRouteMode): string {
  return `oasis-island:${mode}:v1`
}

export function createIslandRouteProgressState(input: {
  completedChestIds: Iterable<string>
  currentRound: number
  mode: IslandRouteMode
  updatedAt?: string
}): IslandRouteProgressState {
  return {
    completedChestIds: [...new Set([...input.completedChestIds].filter((id) => typeof id === 'string' && id.length > 0))].sort(),
    currentRound: Number.isInteger(input.currentRound) && input.currentRound > 0 ? input.currentRound : 1,
    mode: input.mode,
    updatedAt: input.updatedAt ?? new Date().toISOString(),
  }
}

export function parseIslandRouteProgressState(value: unknown, fallbackMode: IslandRouteMode): IslandRouteProgressState | null {
  if (!value || typeof value !== 'object') return null

  const candidate = value as Partial<IslandRouteProgressState>
  if (candidate.mode !== 'single' && candidate.mode !== 'double') return null
  if (!Array.isArray(candidate.completedChestIds) || typeof candidate.updatedAt !== 'string') return null

  return createIslandRouteProgressState({
    completedChestIds: candidate.completedChestIds.filter((id): id is string => typeof id === 'string'),
    currentRound: candidate.currentRound ?? 1,
    mode: candidate.mode ?? fallbackMode,
    updatedAt: candidate.updatedAt,
  })
}

export function mergeIslandRouteProgress(
  local: IslandRouteProgressState | null,
  remote: IslandRouteProgressState | null,
  updatedAt = new Date().toISOString(),
): IslandRouteProgressState {
  const localCount = local?.completedChestIds.length ?? 0
  const remoteCount = remote?.completedChestIds.length ?? 0
  const localHasMoreCompleted = localCount > remoteCount

  return createIslandRouteProgressState({
    completedChestIds: new Set([
      ...(local?.completedChestIds ?? []),
      ...(remote?.completedChestIds ?? []),
    ]),
    currentRound: localHasMoreCompleted
      ? (local?.currentRound ?? 1)
      : (remote?.currentRound ?? local?.currentRound ?? 1),
    mode: local?.mode ?? remote?.mode ?? 'single',
    updatedAt,
  })
}
