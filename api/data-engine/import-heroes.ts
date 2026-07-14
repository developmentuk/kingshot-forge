import type {
  VercelRequest,
  VercelResponse,
} from '@vercel/node'

import {
  importHeroesDataset,
} from '../../server/data-engine/importers/heroes/import.js'

function readImportSecret(): string {
  const secret =
    process.env.DATA_ENGINE_IMPORT_SECRET?.trim()

  if (!secret) {
    throw new Error(
      'Missing required server environment variable: DATA_ENGINE_IMPORT_SECRET',
    )
  }

  return secret
}

function readRequestSecret(
  request: VercelRequest,
): string | null {
  const header =
    request.headers['x-data-engine-secret']

  if (typeof header === 'string') {
    return header.trim()
  }

  if (Array.isArray(header)) {
    return header[0]?.trim() ?? null
  }

  return null
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
): Promise<void> {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')

    response.status(405).json({
      status: 'error',
      message: 'Method not allowed.',
    })

    return
  }

  try {
    const expectedSecret =
      readImportSecret()

    const providedSecret =
      readRequestSecret(request)

    if (
      !providedSecret ||
      providedSecret !== expectedSecret
    ) {
      response.status(401).json({
        status: 'error',
        message: 'Unauthorised.',
      })

      return
    }

    const result =
      await importHeroesDataset()

    response.status(200).json({
      status: 'success',
      data: result,
    })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unknown Heroes import error.'

    response.status(500).json({
      status: 'error',
      message,
    })
  }
}