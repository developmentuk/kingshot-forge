export function readSingleQueryParameter(
  requestUrl: string | undefined,
  name: string,
): string | null {
  if (!name) return null

  let parsedUrl: URL
  try {
    parsedUrl = new URL(requestUrl ?? '/', 'http://localhost')
  } catch {
    return null
  }

  const values = parsedUrl.searchParams.getAll(name)
  return values.length === 1 ? values[0] : null
}
