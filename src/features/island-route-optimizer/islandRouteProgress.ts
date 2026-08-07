export type IslandRouteMode = 'single' | 'double'

export type IslandRouteProgressState = Readonly<{
  completedChestIds: ReadonlyArray<string>
  currentRound: number
  mode: IslandRouteMode
  updatedAt: string
  reset?: boolean
}>

export type IslandRouteProgressByKey = Readonly<Record<string, IslandRouteProgressState | undefined>>

export type IslandRouteProgressSaveOutcome = 'saved' | 'fallback'

export function islandRouteProgressKey(mode: IslandRouteMode): string {
  return `oasis-island:${mode}:v1`
}

export function islandRouteProgressStorageKey(mode: IslandRouteMode): string {
  return `forge:island-route-optimizer:collected:v1:${islandRouteProgressKey(mode)}`
}

export function createEmptyIslandRouteProgress(mode: IslandRouteMode): IslandRouteProgressState {
  return createIslandRouteProgressState({
    completedChestIds: [],
    currentRound: 1,
    mode,
    updatedAt: '',
  })
}

export function getActiveIslandRouteProgress(
  progressByKey: IslandRouteProgressByKey,
  mode: IslandRouteMode,
): IslandRouteProgressState {
  const progress = progressByKey[islandRouteProgressKey(mode)]
  return progress?.mode === mode ? progress : createEmptyIslandRouteProgress(mode)
}

export function updateIslandRouteProgress(
  progressByKey: IslandRouteProgressByKey,
  mode: IslandRouteMode,
  updater: (current: IslandRouteProgressState) => IslandRouteProgressState,
): IslandRouteProgressByKey {
  const progressKey = islandRouteProgressKey(mode)
  const next = updater(getActiveIslandRouteProgress(progressByKey, mode))
  return { ...progressByKey, [progressKey]: next.mode === mode ? next : createEmptyIslandRouteProgress(mode) }
}

export function isCurrentIslandRouteProgressRevision(input: {
  activeProgressKey: string
  progressKey: string
  currentRevision: number
  expectedRevision: number
}): boolean {
  return input.activeProgressKey === input.progressKey && input.currentRevision === input.expectedRevision
}

export function islandRouteProgressSaveStatus(outcome: IslandRouteProgressSaveOutcome): 'synced' | 'error' {
  return outcome === 'saved' ? 'synced' : 'error'
}

export function createIslandRouteProgressState(input: {
  completedChestIds: Iterable<string>
  currentRound: number
  mode: IslandRouteMode
  updatedAt?: string
  reset?: boolean
}): IslandRouteProgressState {
  return {
    completedChestIds: [...new Set([...input.completedChestIds].filter((id) => typeof id === 'string' && id.length > 0))].sort(),
    currentRound: Number.isInteger(input.currentRound) && input.currentRound > 0 ? input.currentRound : 1,
    mode: input.mode,
    updatedAt: input.updatedAt ?? new Date().toISOString(),
    reset: input.reset ?? false,
  }
}

export function parseIslandRouteProgressState(value: unknown, fallbackMode: IslandRouteMode): IslandRouteProgressState | null {
  if (!value || typeof value !== 'object') return null

  const candidate = value as Partial<IslandRouteProgressState>
  if (candidate.mode !== fallbackMode) return null
  if (!Array.isArray(candidate.completedChestIds) || typeof candidate.updatedAt !== 'string') return null

  return createIslandRouteProgressState({
    completedChestIds: candidate.completedChestIds.filter((id): id is string => typeof id === 'string'),
    currentRound: candidate.currentRound ?? 1,
    mode: candidate.mode ?? fallbackMode,
    updatedAt: candidate.updatedAt,
    reset: candidate.reset === true,
  })
}

export function mergeIslandRouteProgress(
  local: IslandRouteProgressState | null,
  remote: IslandRouteProgressState | null,
  updatedAt = new Date().toISOString(),
): IslandRouteProgressState {
  const mode = local?.mode ?? remote?.mode ?? 'single'
  const modeLocal = local?.mode === mode ? local : null
  const modeRemote = remote?.mode === mode ? remote : null
  if (modeLocal?.reset && modeRemote?.reset) {
    return new Date(modeLocal.updatedAt).getTime() >= new Date(modeRemote.updatedAt).getTime() ? modeLocal : modeRemote
  }
  if (modeLocal?.reset && (!modeRemote || new Date(modeLocal.updatedAt).getTime() >= new Date(modeRemote.updatedAt).getTime())) return modeLocal
  if (modeRemote?.reset && (!modeLocal || new Date(modeRemote.updatedAt).getTime() >= new Date(modeLocal.updatedAt).getTime())) return modeRemote
  const localCount = modeLocal?.completedChestIds.length ?? 0
  const remoteCount = modeRemote?.completedChestIds.length ?? 0
  const localHasMoreCompleted = localCount > remoteCount

  return createIslandRouteProgressState({
    completedChestIds: new Set([
      ...(modeLocal?.completedChestIds ?? []),
      ...(modeRemote?.completedChestIds ?? []),
    ]),
    currentRound: localHasMoreCompleted
      ? (modeLocal?.currentRound ?? 1)
      : (modeRemote?.currentRound ?? modeLocal?.currentRound ?? 1),
    mode,
    updatedAt,
    reset: false,
  })
}
