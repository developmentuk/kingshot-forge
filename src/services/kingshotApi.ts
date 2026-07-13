import { supabase } from '../lib/supabase'
import type { GiftCodesResponse } from '../types/giftCodes'
import type {
  PlayerInfoErrorResponse,
  PlayerInfoResponse,
} from '../types/player'
import type {
  KingdomTrackerErrorResponse,
  KingdomTrackerResponse,
} from '../types/kingdom'
import type {
  KvkErrorResponse,
  KvkMatchesResponse,
  KvkSeasonsResponse,
} from '../types/kvk'

export async function getGiftCodes(): Promise<GiftCodesResponse> {
  const { data, error } =
    await supabase.functions.invoke<GiftCodesResponse>(
      'kingshot-gift-codes',
      {
        method: 'GET',
      },
    )

  if (error) {
    throw new Error(error.message)
  }

  if (!data || data.status !== 'success') {
    throw new Error('The gift-code service returned no data.')
  }

  return data
}

export async function getPlayer(
  playerId: string,
): Promise<PlayerInfoResponse> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseKey =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration is missing.')
  }

  const functionUrl = new URL(
    `${supabaseUrl}/functions/v1/kingshot-player`,
  )

  functionUrl.searchParams.set('playerId', playerId)

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const response = await fetch(functionUrl.toString(), {
    method: 'GET',
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${
        session?.access_token ?? supabaseKey
      }`,
      Accept: 'application/json',
    },
  })

  const responseData: unknown = await response.json()

  if (!response.ok) {
    const errorResponse =
      responseData as PlayerInfoErrorResponse

    throw new Error(
      errorResponse.message ||
        'Player information could not be loaded.',
    )
  }

  const playerResponse = responseData as PlayerInfoResponse

  if (
    playerResponse.status !== 'success' ||
    !playerResponse.data
  ) {
    throw new Error(
      'The player service returned an unexpected response.',
    )
  }

  return playerResponse
}

export async function getKingdom(
  kingdomId: string,
): Promise<KingdomTrackerResponse> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseKey =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration is missing.')
  }

  const functionUrl = new URL(
    `${supabaseUrl}/functions/v1/kingshot-kingdom`,
  )

  functionUrl.searchParams.set('kingdomId', kingdomId)

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const response = await fetch(functionUrl.toString(), {
    method: 'GET',
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${
        session?.access_token ?? supabaseKey
      }`,
      Accept: 'application/json',
    },
  })

  const responseData: unknown = await response.json()

  if (!response.ok) {
    const errorResponse =
      responseData as KingdomTrackerErrorResponse

    throw new Error(
      errorResponse.message ||
        'Kingdom information could not be loaded.',
    )
  }

  const kingdomResponse =
    responseData as KingdomTrackerResponse

  if (
    kingdomResponse.status !== 'success' ||
    !kingdomResponse.data
  ) {
    throw new Error(
      'The kingdom service returned an unexpected response.',
    )
  }

  return kingdomResponse
}

type KvkMatchSearchOptions = {
  season?: string
  kingdomA?: string
  kingdomB?: string
  status?: 'all' | 'captured' | 'defended'
  page?: number
  limit?: number
}

async function callKvkFunction<T>(
  parameters: Record<string, string>,
): Promise<T> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseKey =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration is missing.')
  }

  const functionUrl = new URL(
    `${supabaseUrl}/functions/v1/kingshot-kvk`,
  )

  Object.entries(parameters).forEach(([key, value]) => {
    if (value) {
      functionUrl.searchParams.set(key, value)
    }
  })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const response = await fetch(functionUrl.toString(), {
    method: 'GET',
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${
        session?.access_token ?? supabaseKey
      }`,
      Accept: 'application/json',
    },
  })

  const responseData: unknown = await response.json()

  if (!response.ok) {
    const errorResponse = responseData as KvkErrorResponse

    throw new Error(
      errorResponse.message ||
        'KvK information could not be loaded.',
    )
  }

  return responseData as T
}

export async function getKvkSeasons() {
  const response =
    await callKvkFunction<KvkSeasonsResponse>({
      resource: 'seasons',
    })

  if (response.status !== 'success') {
    throw new Error(
      'The KvK season service returned an unexpected response.',
    )
  }

  return response
}

export async function getKvkMatches(
  options: KvkMatchSearchOptions,
) {
  const parameters: Record<string, string> = {
    resource: 'matches',
    page: String(options.page ?? 1),
    limit: String(options.limit ?? 100),
  }

  if (options.season) {
    parameters.season = options.season
  }

  if (options.kingdomA) {
    parameters.kingdom_a = options.kingdomA
  }

  if (options.kingdomB) {
    parameters.kingdom_b = options.kingdomB
  }

  if (options.status && options.status !== 'all') {
    parameters.status = options.status
  }

  const response =
    await callKvkFunction<KvkMatchesResponse>(parameters)

  if (response.status !== 'success') {
    throw new Error(
      'The KvK match service returned an unexpected response.',
    )
  }

  return response
}