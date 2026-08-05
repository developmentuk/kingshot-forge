const MAX_DESTINATION_LENGTH = 2048
const REDIRECT_PARAMETER = /(redirect|return|next|destination|callback)/i

export const DEFAULT_AUTH_DESTINATION = '/my-forge'

export type DestinationResult = {
  destination: string
  accepted: boolean
}

function hasMalformedEncoding(value: string): boolean {
  try {
    decodeURIComponent(value)
    return false
  } catch {
    return true
  }
}

function hasExternalShape(value: string): boolean {
  const decoded = value.toLowerCase()
  return decoded.startsWith('//')
    || /^[a-z][a-z\d+.-]*:/i.test(decoded)
    || decoded.startsWith('\\')
    || decoded.includes('\\')
}

function decodeLayers(value: string): string[] {
  const layers = [value]
  let current = value
  for (let index = 0; index < 3; index += 1) {
    let decoded: string
    try {
      decoded = decodeURIComponent(current)
    } catch {
      return layers
    }
    if (decoded === current) break
    layers.push(decoded)
    current = decoded
  }
  return layers
}

function nestedDestinationIsUnsafe(value: string): boolean {
  if (!value) return false
  if (hasMalformedEncoding(value)) return true
  const layers = decodeLayers(value)
  return layers.some((layer) => hasExternalShape(layer))
}

export function resolveInternalDestination(input: string | null | undefined): DestinationResult {
  if (!input || input.length > MAX_DESTINATION_LENGTH) {
    return { destination: DEFAULT_AUTH_DESTINATION, accepted: false }
  }

  if (/\p{Cc}/u.test(input) || hasMalformedEncoding(input) || hasExternalShape(input)) {
    return { destination: DEFAULT_AUTH_DESTINATION, accepted: false }
  }

  const layers = decodeLayers(input)
  if (layers.some((layer) => !layer.startsWith('/') || hasExternalShape(layer))) {
    return { destination: DEFAULT_AUTH_DESTINATION, accepted: false }
  }

  let parsed: URL
  try {
    parsed = new URL(input, 'https://ksforge.app')
  } catch {
    return { destination: DEFAULT_AUTH_DESTINATION, accepted: false }
  }

  if (parsed.origin !== 'https://ksforge.app' || !parsed.pathname.startsWith('/') || parsed.pathname.startsWith('//')) {
    return { destination: DEFAULT_AUTH_DESTINATION, accepted: false }
  }

  for (const [key, value] of parsed.searchParams.entries()) {
    if (REDIRECT_PARAMETER.test(key) && nestedDestinationIsUnsafe(value)) {
      return { destination: DEFAULT_AUTH_DESTINATION, accepted: false }
    }
  }

  return { destination: `${parsed.pathname}${parsed.search}${parsed.hash}`, accepted: true }
}
