import type {
  VercelRequest,
  VercelResponse,
} from '@vercel/node'

import type {
  DatasetKey,
} from '../../shared/data-engine/types'

import {
  previewDataset,
} from '../../server/data-engine/runner.js'

const SUPPORTED_DATASETS =
  new Set<DatasetKey>([
    'heroes',
    'hero-xp',
    'shards',
    'gear',
    'charm',
    'troops',
    'buildings',
    'truegold',
    'war-academy',
    'vip',
    'events',
    'masters',
    'kvk',
  ])

function readDatasetKey(
  value: string | string[] | undefined,
): DatasetKey | null {
  if (typeof value !== 'string') {
    return null
  }

  if (!SUPPORTED_DATASETS.has(value as DatasetKey)) {
    return null
  }

  return value as DatasetKey
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
): Promise<void> {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')

    response.status(405).json({
      status: 'error',
      message: 'Method not allowed.',
    })

    return
  }

  const dataset =
    readDatasetKey(request.query.dataset)

  if (!dataset) {
    response.status(400).json({
      status: 'error',
      message:
        'A valid dataset query parameter is required.',
    })

    return
  }

  try {
    const result =
      await previewDataset(dataset)

    response.status(200).json({
      status: 'success',
      data: result,
    })
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unknown preview error.'

    response.status(500).json({
      status: 'error',
      message,
    })
  }
}