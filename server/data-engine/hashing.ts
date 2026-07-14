import { createHash } from 'node:crypto'

function sortJsonValue(
  value: unknown,
): unknown {
  if (Array.isArray(value)) {
    return value.map(sortJsonValue)
  }

  if (
    value !== null &&
    typeof value === 'object'
  ) {
    const source =
      value as Record<string, unknown>

    return Object.keys(source)
      .sort((first, second) =>
        first.localeCompare(second),
      )
      .reduce<Record<string, unknown>>(
        (sorted, key) => {
          sorted[key] = sortJsonValue(
            source[key],
          )

          return sorted
        },
        {},
      )
  }

  return value
}

export function createPayloadHash(
  payload: unknown,
): string {
  const stablePayload =
    JSON.stringify(sortJsonValue(payload))

  return createHash('sha256')
    .update(stablePayload)
    .digest('hex')
}