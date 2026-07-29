const KINGSHOT_API_URL = 'https://kingshot.net/api/player-info'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

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

function validPlayerId(value: string | null) {
  return value !== null && /^\d{1,20}$/u.test(value.trim())
}

function validKingdomId(value: string | null) {
  if (value === null || value.trim() === '') return true
  const parsed = Number(value)
  return /^\d{1,4}$/u.test(value.trim()) && Number.isInteger(parsed) && parsed >= 1 && parsed <= 9999
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
      return json({ status: 'error', message: 'The Kingshot player service returned an invalid response.', upstreamStatus: upstreamResponse.status }, 502)
    }

    let responseData: unknown
    try {
      responseData = JSON.parse(responseText)
    } catch {
      return json({ status: 'error', message: 'The Kingshot player response could not be read.' }, 502)
    }

    if (upstreamResponse.ok && kingdomId) {
      const root = responseData && typeof responseData === 'object' ? responseData as Record<string, unknown> : null
      const data = root?.data && typeof root.data === 'object' ? root.data as Record<string, unknown> : null
      const returnedKingdom = Number(data?.kingdom)
      const requestedKingdom = Number(kingdomId)
      if (!Number.isInteger(returnedKingdom)) return json({ status: 'error', message: 'The Kingshot player service did not return a valid State.' }, 502)
      if (returnedKingdom !== requestedKingdom) {
        return json({ status: 'fail', message: `This Player ID belongs to State ${returnedKingdom}, not State ${requestedKingdom}.`, meta: { code: 'STATE_MISMATCH' } }, 409)
      }
    }

    return json(responseData, upstreamResponse.status, upstreamResponse.ok ? 'private, max-age=60' : 'no-store')
  } catch (error) {
    console.error('[kingshot-player] lookup failed', error instanceof Error ? error.name : 'UnknownError')
    return json({ status: 'error', message: 'Player information could not be loaded.' }, 502)
  }
})
