export type DatasetScalarValue =
  | string
  | number
  | boolean
  | null

export type DatasetValue =
  | DatasetScalarValue
  | DatasetValue[]
  | {
      [key: string]: DatasetValue
    }

export type DatasetRecordValues = Record<string, DatasetValue>

export function isDatasetScalarValue(
  value: unknown,
): value is DatasetScalarValue {
  return (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  )
}

export function isDatasetValue(
  value: unknown,
): value is DatasetValue {
  if (isDatasetScalarValue(value)) {
    return true
  }

  if (Array.isArray(value)) {
    return value.every(isDatasetValue)
  }

  if (typeof value !== 'object' || value === null) {
    return false
  }

  return Object.values(value).every(isDatasetValue)
}
