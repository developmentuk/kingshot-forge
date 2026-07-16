import type {
  SourceFetchResult,
} from '../../shared/data-engine/types.js'

import {
  createPayloadHash,
} from './hashing.js'

export interface FetchJsonSourceOptions {
  timeoutMs?: number
  userAgent?: string
}

const DEFAULT_TIMEOUT_MS = 15_000

export async function fetchJsonSource<TPayload = unknown>(
  sourceUrl: string,
  options: FetchJsonSourceOptions = {},
): Promise<SourceFetchResult<TPayload>> {
  const timeoutMs =
    options.timeoutMs ?? DEFAULT_TIMEOUT_MS

  const controller = new AbortController()

  const timeout = setTimeout(
    () => controller.abort(),
    timeoutMs,
  )

  try {
    const response = await fetch(sourceUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'User-Agent':
          options.userAgent ??
          'Kingshot-Forge-Data-Engine/1.0',
      },
      redirect: 'follow',
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(
        `Source request failed with HTTP ${response.status}.`,
      )
    }

    const contentType =
      response.headers.get('content-type')

    if (
      contentType &&
      !contentType
        .toLowerCase()
        .includes('application/json')
    ) {
      throw new Error(
        `Source returned unsupported content type: ${contentType}.`,
      )
    }

    const payload = await response.json() as TPayload

    return {
      sourceUrl: response.url || sourceUrl,
      fetchedAt: new Date().toISOString(),
      httpStatus: response.status,
      payload,
      payloadHash: createPayloadHash(payload),
    }
  } catch (error) {
    if (
      error instanceof Error &&
      error.name === 'AbortError'
    ) {
      throw new Error(
        `Source request timed out after ${timeoutMs}ms.`,
      )
    }

    throw error
  } finally {
    clearTimeout(timeout)
  }
}
