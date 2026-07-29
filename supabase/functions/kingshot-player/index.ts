const KINGSHOT_API_URL = 'https://kingshot.net/api/player-info'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

type JsonRecord = Record<string, unknown>

function json(body: unknown, status = 200, cacheControl = 'no-store') {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': cacheControl,
    },
  })
}

function record(value: unknown): JsonRecord | null {
  return value && typeof value === 'object' ? value as JsonRecord : null
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function validPlayerId(value: string | null) {
  return value !== null && /^\d{1,20}$/u.test(value.trim())
}

function validKingdomId(value: string | null) {
  if (value === null || value.trim() === '') return true
  const parsed = Number(value)
  return /^\d{1,4}$/u.test(value.trim()) && Number.isInteger(parsed) && parsed >= 1 && parsed <= 9999
}

function classifyUpstreamFailure(status: number, responseData: unknown) {
  const root = record(responseData)
  const meta = record(root?.meta)
  const upstreamMessage = text(root?.message)
  const upstreamErrorKey = text(meta?.errorKey) || text(meta?.code)

  if (
    status === 400 &&
    (upstreamErrorKey === 'PLAYER_NOT_FOUND' || /^player not found\.?$/iu.test(upstreamMessage))
  ) {
    return json({
      status: 'fail',
      message: 'Player not found.',
      meta: { code: 'PLAYER_NOT_FOUND' },
    }, 404)
  }

  const code = status === 429
    ? 'PLAYER_LOOKUP_RATE_LIMITED'
    : 'PLAYER_LOOKUP_UPSTREAM_UNAVAILABLE'
  const message = status === 429
    ? 'The external Kingshot player lookup is temporarily busy. No player details have been changed.'
    : 'The external Kingshot player lookup is currently unavailable. No player details have been changed.'

  console.error('[kingshot-player] upstream failure', {
    status,
    errorKey: upstreamErrorKey || null,
    message: upstreamMessage.slice(0, 100) || null,
  })

  return json({
    status: 'error',
    message,
    meta: { code },
    upstreamStatus: status,
  }, 503)
}

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'GET') return json({ status: 'error', message: 'Method not allowed.' }, 405)

  try {
    const requestUrl = new URL(request.url)
    const playerId = requestUrl.searchParams.get('playerId') ?? requestUrl.searchParams.get('id')
    const kingdomId = requestUrl.searchParams.get('kingdomId') ?? requestUrl.searchParams.get('state')

    if (!validPlayerId(playerId)) return json({ status: 'fail', message: 'A valid Player ID is required.' }, 400)
    if (!validKingdomId(kingdomId)) return json({ status: 'fail', message: 'A valid State between 1 and 9999 is required.' }, 400)

    const upstreamUrl = new URL(KINGSHOT_API_URL)
    upstreamUrl.searchParams.set('playerId', playerId!.trim())

    const upstreamResponse = await fetch(upstreamUrl.toString(), {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(12_000),
    })
    const contentType = upstreamResponse.headers.get('content-type') ?? ''
    const responseText = await upstreamResponse.text()

    if (!contentType.toLowerCase().includes('application/json')) {
      console.error('[kingshot-player] non-json upstream', { status: upstreamResponse.status, sample: responseText.slice(0, 120) })
      return json({
        status: 'error',
        message: 'The external Kingshot player lookup returned an invalid response. No player details have been changed.',
        meta: { code: 'PLAYER_LOOKUP_INVALID_RESPONSE' },
        upstreamStatus: upstreamResponse.status,
      }, 503)
    }

    let responseData: unknown
    try {
      responseData = JSON.parse(responseText)
    } catch {
      return json({
        status: 'error',
        message: 'The external Kingshot player response could not be read. No player details have been changed.',
        meta: { code: 'PLAYER_LOOKUP_INVALID_RESPONSE' },
      }, 503)
    }

    if (!upstreamResponse.ok) return classifyUpstreamFailure(upstreamResponse.status, responseData)

    if (kingdomId) {
      const root = record(responseData)
      const data = record(root?.data)
      const returnedKingdom = Number(data?.kingdom)
      const requestedKingdom = Number(kingdomId)
      if (!Number.isInteger(returnedKingdom)) return json({ status: 'error', message: 'The Kingshot player service did not return a valid State.' }, 502)
      if (returnedKingdom !== requestedKingdom) {
        return json({ status: 'fail', message: `This Player ID belongs to State ${returnedKingdom}, not State ${requestedKingdom}.`, meta: { code: 'STATE_MISMATCH' } }, 409)
      }
    }

    return json(responseData, 200, 'private, max-age=60')
  } catch (error) {
    console.error('[kingshot-player] lookup failed', error instanceof Error ? error.name : 'UnknownError')
    return json({
      status: 'error',
      message: 'The external Kingshot player lookup could not be reached. No player details have been changed.',
      meta: { code: 'PLAYER_LOOKUP_UNREACHABLE' },
    }, 503)
  }
})
