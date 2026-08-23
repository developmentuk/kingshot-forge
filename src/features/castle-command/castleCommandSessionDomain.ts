import {
  buildLaunchTiming,
  type CastleCommandTarget,
  type LaunchTiming,
  type RallyPreparationSeconds,
} from './castleCommandDomain'

export type CastleCommandSessionStatus = 'planning' | 'active' | 'closed'
export type CastleCommandTimingSource = 'normal' | 'howler-observed' | 'normal-fallback'

export type CastleCommandAssignmentSnapshot = {
  id: string
  playerAccountId: string
  playerId: string
  playerName: string
  target: CastleCommandTarget
  useHowler: boolean
  howlerSkillLevel: number
  marchSeconds: number
  timingSource: CastleCommandTimingSource
  needsHowlerCalibration: boolean
  profileUpdatedAt: string
}

export type CoordinatedLaunchRow = CastleCommandAssignmentSnapshot & {
  timing: LaunchTiming
}

export function buildCoordinatedLaunchOrder(input: {
  impactAt: Date
  rallyPreparationSeconds: RallyPreparationSeconds
  assignments: CastleCommandAssignmentSnapshot[]
}): CoordinatedLaunchRow[] {
  const rows = input.assignments.flatMap((assignment) => {
    const timing = buildLaunchTiming({
      impactAt: input.impactAt,
      marchSeconds: assignment.marchSeconds,
      rallyPreparationSeconds: input.rallyPreparationSeconds,
    })

    return timing ? [{ ...assignment, timing }] : []
  })

  return rows.sort((left, right) => {
    const timeDifference = left.timing.rallyStartAt.getTime() - right.timing.rallyStartAt.getTime()
    if (timeDifference !== 0) return timeDifference

    const nameDifference = left.playerName.localeCompare(right.playerName, 'en', {
      sensitivity: 'base',
    })
    if (nameDifference !== 0) return nameDifference

    return left.id.localeCompare(right.id)
  })
}

export function sessionStatusAllowsAssignment(status: CastleCommandSessionStatus): boolean {
  return status !== 'closed'
}
