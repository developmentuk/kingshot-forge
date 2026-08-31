export const MIGHTPULSE_API_BASE_URL = 'https://api.mightpulse.com/v1'
export const DEFAULT_MIGHTPULSE_TIMEOUT_MS = 45_000

const MAX_CONFIGURED_TIMEOUT_MS = 55_000

export type MightPulseTransportFailureKind =
  | 'unconfigured'
  | 'invalid-request'
  | 'timeout'
  | 'unreachable'
  | 'http'
  | 'invalid-response'

export class MightPulseTransportError extends Error {
  constructor(
    readonly kind: MightPulseTransportFailureKind,
    readonly httpStatus: number | null,
    message: string,
  ) {
    super(message)
    this.name = 'MightPulseTransportError'
  }
}

export type MightPulseTransportOptions = Readonly<{
  apiKey?: string
  timeoutMs?: number
  fetchImplementation?: typeof fetch
}>

export type MightPulseTestTransportOptions =
  MightPulseTransportOptions
  & Readonly<{ baseUrl?: string }>

export type MightPulseJsonRequest = Readonly<{
  pathSegments: readonly string[]
  query?: Readonly<Record<string, string>>
}>

export interface MightPulseTransport {
  getJson(request: MightPulseJsonRequest): Promise<unknown>
}

function configuredTimeout(value: string | undefined): number {
  if (value === undefined || value.trim() === '') {
    return DEFAULT_MIGHTPULSE_TIMEOUT_MS
  }

  const parsed = Number(value)
  if (
    !Number.isInteger(parsed)
    || parsed < 1_000
    || parsed > MAX_CONFIGURED_TIMEOUT_MS
  ) {
    throw new MightPulseTransportError(
      'unconfigured',
      null,
      'The MightPulse provider is not configured.',
    )
  }

  return parsed
}

function directTimeout(value: number | undefined): number | null {
  if (value === undefined) return null

  if (
    !Number.isInteger(value)
    || value < 1
    || value > MAX_CONFIGURED_TIMEOUT_MS
  ) {
    throw new MightPulseTransportError(
      'unconfigured',
      null,
      'The MightPulse provider is not configured.',
    )
  }

  return value
}

function configuredTestBaseUrl(value: string | undefined): string {
  const candidate = value?.trim() || MIGHTPULSE_API_BASE_URL

  try {
    const url = new URL(candidate)
    if (
      url.protocol !== 'https:'
      || url.username
      || url.password
      || !url.hostname
    ) {
      throw new Error('invalid')
    }

    return url.toString().replace(/\/$/u, '')
  } catch {
    throw new MightPulseTransportError(
      'unconfigured',
      null,
      'The MightPulse provider is not configured.',
    )
  }
}

function encodedPathSegment(value: string): string {
  if (
    typeof value !== 'string'
    || value.length === 0
    || value.length > 512
    || /[\u0000-\u001f\u007f]/u.test(value)
  ) {
    throw new MightPulseTransportError(
      'invalid-request',
      null,
      'The MightPulse request path is invalid.',
    )
  }

  return encodeURIComponent(value)
}

function createConfiguredMightPulseTransport(
  options: MightPulseTransportOptions,
  baseUrl: string,
): MightPulseTransport {
  const apiKey =
    options.apiKey
    ?? process.env.MIGHTPULSE_API_KEY?.trim()

  const timeoutMs =
    directTimeout(options.timeoutMs)
    ?? configuredTimeout(process.env.MIGHTPULSE_TIMEOUT_MS)

  const fetchImplementation =
    options.fetchImplementation
    ?? fetch

  return {
    async getJson(request): Promise<unknown> {
      if (!apiKey) {
        throw new MightPulseTransportError(
          'unconfigured',
          null,
          'The MightPulse provider is not configured.',
        )
      }

      if (
        !Array.isArray(request.pathSegments)
        || request.pathSegments.length === 0
      ) {
        throw new MightPulseTransportError(
          'invalid-request',
          null,
          'The MightPulse request path is invalid.',
        )
      }

      const url = new URL(
        baseUrl
        + '/'
        + request.pathSegments
          .map(encodedPathSegment)
          .join('/'),
      )

      for (
        const [key, value]
        of Object.entries(request.query ?? {})
      ) {
        if (
          !key
          || key.length > 120
          || /[\u0000-\u001f\u007f]/u.test(key)
          || typeof value !== 'string'
          || value.length > 2_000
          || /[\u0000-\u001f\u007f]/u.test(value)
        ) {
          throw new MightPulseTransportError(
            'invalid-request',
            null,
            'The MightPulse request query is invalid.',
          )
        }

        url.searchParams.set(key, value)
      }

      let response: Response
      try {
        response = await fetchImplementation(url, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: 'Bearer ' + apiKey,
          },
          signal: AbortSignal.timeout(timeoutMs),
        })
      } catch (error) {
        if (
          (
            error instanceof DOMException
            && error.name === 'TimeoutError'
          )
          || (
            error instanceof Error
            && (
              error.name === 'TimeoutError'
              || error.name === 'AbortError'
            )
          )
        ) {
          throw new MightPulseTransportError(
            'timeout',
            null,
            'The MightPulse request timed out.',
          )
        }

        throw new MightPulseTransportError(
          'unreachable',
          null,
          'The MightPulse service could not be reached.',
        )
      }

      if (!response.ok) {
        throw new MightPulseTransportError(
          'http',
          response.status,
          'The MightPulse service returned an HTTP error.',
        )
      }

      if (
        !(response.headers.get('content-type') ?? '')
          .toLowerCase()
          .includes('application/json')
      ) {
        throw new MightPulseTransportError(
          'invalid-response',
          null,
          'The MightPulse service returned an invalid response.',
        )
      }

      try {
        return await response.json()
      } catch {
        throw new MightPulseTransportError(
          'invalid-response',
          null,
          'The MightPulse service returned invalid JSON.',
        )
      }
    },
  }
}

export function createMightPulseTransport(
  options: MightPulseTransportOptions = {},
): MightPulseTransport {
  return createConfiguredMightPulseTransport(
    options,
    MIGHTPULSE_API_BASE_URL,
  )
}

export function createMightPulseTransportForTest(
  options: MightPulseTestTransportOptions,
): MightPulseTransport {
  return createConfiguredMightPulseTransport(
    options,
    configuredTestBaseUrl(options.baseUrl),
  )
}
