import type {
  DatasetRecordValues,
  DatasetValue,
} from '../../datasets'
import type {
  EditorialRecordVersion,
} from '../contracts'
import type {
  EditorialFieldDiff,
  EditorialVersionComparison,
} from './contracts'

function isRecord(
  value: DatasetValue | undefined,
): value is Record<string, DatasetValue> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

function valuesEqual(
  before: DatasetValue | undefined,
  after: DatasetValue | undefined,
): boolean {
  if (before === after) {
    return true
  }

  if (Array.isArray(before) && Array.isArray(after)) {
    return (
      before.length === after.length &&
      before.every((value, index) =>
        valuesEqual(value, after[index]),
      )
    )
  }

  if (isRecord(before) && isRecord(after)) {
    const beforeKeys = Object.keys(before).sort()
    const afterKeys = Object.keys(after).sort()

    return (
      beforeKeys.length === afterKeys.length &&
      beforeKeys.every(
        (key, index) =>
          key === afterKeys[index] &&
          valuesEqual(before[key], after[key]),
      )
    )
  }

  return false
}

function joinPath(
  parentPath: string,
  segment: string,
): string {
  return parentPath.length > 0
    ? `${parentPath}.${segment}`
    : segment
}

function diffValues(
  before: DatasetValue | undefined,
  after: DatasetValue | undefined,
  path: string,
): EditorialFieldDiff[] {
  if (valuesEqual(before, after)) {
    return []
  }

  if (before === undefined) {
    return [{
      path,
      kind: 'added',
      after: structuredClone(after),
    }]
  }

  if (after === undefined) {
    return [{
      path,
      kind: 'removed',
      before: structuredClone(before),
    }]
  }

  if (Array.isArray(before) && Array.isArray(after)) {
    const changes: EditorialFieldDiff[] = []
    const maximumLength = Math.max(
      before.length,
      after.length,
    )

    for (let index = 0; index < maximumLength; index += 1) {
      changes.push(
        ...diffValues(
          before[index],
          after[index],
          `${path}[${index}]`,
        ),
      )
    }

    return changes
  }

  if (isRecord(before) && isRecord(after)) {
    const keys = new Set([
      ...Object.keys(before),
      ...Object.keys(after),
    ])

    return [...keys]
      .sort()
      .flatMap((key) =>
        diffValues(
          before[key],
          after[key],
          joinPath(path, key),
        ),
      )
  }

  return [{
    path,
    kind: 'changed',
    before: structuredClone(before),
    after: structuredClone(after),
  }]
}

export class EditorialDiffService {
  compareValues(
    before: DatasetRecordValues,
    after: DatasetRecordValues,
  ): EditorialFieldDiff[] {
    return diffValues(before, after, '')
      .map((change) => ({
        ...change,
        path: change.path || '$',
      }))
  }

  compareVersions(
    fromVersion: EditorialRecordVersion,
    toVersion: EditorialRecordVersion,
  ): EditorialVersionComparison {
    if (
      fromVersion.datasetId !== toVersion.datasetId ||
      fromVersion.recordId !== toVersion.recordId
    ) {
      throw new Error(
        'Editorial versions must belong to the same record.',
      )
    }

    const changes = this.compareValues(
      fromVersion.values,
      toVersion.values,
    )

    return {
      datasetId: fromVersion.datasetId,
      recordId: fromVersion.recordId,
      fromVersion: structuredClone(fromVersion),
      toVersion: structuredClone(toVersion),
      changes,
      changedFieldCount: changes.length,
      hasChanges: changes.length > 0,
    }
  }
}
