import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { createServer } from 'vite'

const vite = await createServer({ appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } })

function jsonResponse(payload, init = {}) {
  const body = JSON.stringify(payload)
  const headers = new Headers(init.headers)
  headers.set('content-type', 'application/json; charset=utf-8')
  return new Response(body, { ...init, headers })
}

async function expectAdapterError(promise, code) {
  await assert.rejects(promise, (error) => {
    assert.equal(error?.name, 'BasicPlayerSourceAdapterError')
    assert.equal(error?.code, code)
    return true
  })
}

try {
  const adapterModule = await vite.ssrLoadModule('/server/player-intelligence/basicPlayerSourceAdapter.ts')
  const {
    BASIC_PLAYER_SOURCE_CONTRACT_VERSION,
    BASIC_PLAYER_SOURCE_ID,
    createBasicPlayerSourceAdapter,
    normaliseBasicPlayerPayload,
    sha256Payload,
    toBasicPlayerProjection,
  } = adapterModule

  const fixedTimes = [
    new Date('2026-07-29T16:30:00.000Z'),
    new Date('2026-07-29T16:30:01.000Z'),
  ]
  let clockIndex = 0
  let capturedUrl = null
  let capturedInit = null
  const successfulPayload = {
    status: 'success',
    data: {
      playerId: '140387849',
      name: 'Synthetic Governor',
      kingdom: 850,
      level: 30,
      levelRendered: '30',
      levelRenderedDetailed: 'Town Center 30',
      levelImage: 'https://assets.example.test/levels/30.png',
      profilePhoto: 'https://assets.example.test/avatars/player.png',
      internalUid: 'must-not-enter-projection',
    },
  }

  const adapter = createBasicPlayerSourceAdapter({
    baseUrl: 'https://forge-project.supabase.co',
    apiKey: 'synthetic-test-key',
    clock: () => fixedTimes[Math.min(clockIndex++, fixedTimes.length - 1)],
    fetchTransport: async (url, init) => {
      capturedUrl = new URL(url)
      capturedInit = init
      return jsonResponse(successfulPayload, { status: 200 })
    },
  })

  const result = await adapter.lookup({
    playerId: ' 140387849 ',
    purpose: 'private_profile_refresh',
    actorId: 'user-test-123',
  })

  assert.equal(adapter.sourceId, BASIC_PLAYER_SOURCE_ID)
  assert.equal(adapter.sourceContractVersion, BASIC_PLAYER_SOURCE_CONTRACT_VERSION)
  assert.equal(capturedUrl.pathname, '/functions/v1/kingshot-player')
  assert.equal(capturedUrl.searchParams.get('playerId'), '140387849')
  assert.equal(capturedInit.method, 'GET')
  assert.equal(capturedInit.redirect, 'error')
  assert.equal(new Headers(capturedInit.headers).get('accept'), 'application/json')
  assert.equal(new Headers(capturedInit.headers).get('apikey'), 'synthetic-test-key')
  assert.equal(new Headers(capturedInit.headers).get('authorization'), 'Bearer synthetic-test-key')

  const expectedBody = JSON.stringify(successfulPayload)
  const expectedHash = createHash('sha256').update(new TextEncoder().encode(expectedBody)).digest('hex')
  assert.equal(result.observation.payloadSha256, expectedHash)
  assert.equal(result.observation.payloadByteLength, new TextEncoder().encode(expectedBody).byteLength)
  assert.equal(result.observation.playerId, '140387849')
  assert.equal(result.observation.actorId, 'user-test-123')
  assert.equal(result.observation.purpose, 'private_profile_refresh')
  assert.equal(result.observation.requestedAt, '2026-07-29T16:30:00.000Z')
  assert.equal(result.observation.retrievedAt, '2026-07-29T16:30:01.000Z')
  assert.deepEqual(result.observation.rawPayload, successfulPayload)

  assert.deepEqual(result.snapshot, {
    playerId: '140387849',
    playerName: 'Synthetic Governor',
    kingdomId: 850,
    playerLevel: 30,
    levelRendered: '30',
    levelRenderedDetailed: 'Town Center 30',
    levelImageUrl: 'https://assets.example.test/levels/30.png',
    profileImageUrl: 'https://assets.example.test/avatars/player.png',
    observedAt: '2026-07-29T16:30:01.000Z',
    sourceId: BASIC_PLAYER_SOURCE_ID,
    sourceContractVersion: BASIC_PLAYER_SOURCE_CONTRACT_VERSION,
    payloadSha256: expectedHash,
    freshnessStatus: 'fresh',
    confidenceScore: 80,
    confidenceRationale: 'One approved server-side Kingshot lookup source returned a structurally valid record for the requested Player ID.',
  })

  assert.equal('rawPayload' in result.projection, false)
  assert.equal('payloadSha256' in result.projection, false)
  assert.equal('actorId' in result.projection, false)
  assert.equal('internalUid' in result.projection, false)
  assert.equal(JSON.stringify(result.projection).includes('must-not-enter-projection'), false)
  assert.equal(result.projection.source.id, BASIC_PLAYER_SOURCE_ID)
  assert.equal(result.projection.source.confidenceScore, 80)

  const deterministicBytes = new TextEncoder().encode('{"stable":true}')
  assert.equal(sha256Payload(deterministicBytes), sha256Payload(deterministicBytes))
  assert.equal(sha256Payload(deterministicBytes), createHash('sha256').update(deterministicBytes).digest('hex'))

  const directSnapshot = normaliseBasicPlayerPayload(
    { status: 'success', data: { playerId: 123456, name: 'Numeric ID', kingdom: '850', level: '40' } },
    '123456',
    '2026-07-29T16:31:00.000Z',
    'abc123',
  )
  assert.equal(directSnapshot.playerId, '123456')
  assert.equal(directSnapshot.kingdomId, 850)
  assert.equal(directSnapshot.playerLevel, 40)
  assert.equal(directSnapshot.levelImageUrl, null)
  assert.equal(directSnapshot.profileImageUrl, null)
  assert.deepEqual(toBasicPlayerProjection(directSnapshot).source, {
    id: BASIC_PLAYER_SOURCE_ID,
    contractVersion: BASIC_PLAYER_SOURCE_CONTRACT_VERSION,
    freshnessStatus: 'fresh',
    confidenceScore: 80,
    confidenceRationale: directSnapshot.confidenceRationale,
  })

  let invalidFetchCalled = false
  const invalidInputAdapter = createBasicPlayerSourceAdapter({
    baseUrl: 'https://forge-project.supabase.co',
    apiKey: 'synthetic-test-key',
    fetchTransport: async () => {
      invalidFetchCalled = true
      return jsonResponse(successfulPayload)
    },
  })
  await expectAdapterError(invalidInputAdapter.lookup({ playerId: 'not-a-player', purpose: 'private_profile_refresh', actorId: 'actor' }), 'invalid_player_id')
  assert.equal(invalidFetchCalled, false)

  const mismatchedAdapter = createBasicPlayerSourceAdapter({
    baseUrl: 'https://forge-project.supabase.co',
    apiKey: 'synthetic-test-key',
    fetchTransport: async () => jsonResponse({ status: 'success', data: { playerId: '999999', name: 'Wrong', kingdom: 850, level: 30 } }),
  })
  await expectAdapterError(mismatchedAdapter.lookup({ playerId: '123456', purpose: 'link_revalidation', actorId: 'actor' }), 'mismatched_player_id')

  const wrongContentAdapter = createBasicPlayerSourceAdapter({
    baseUrl: 'https://forge-project.supabase.co',
    apiKey: 'synthetic-test-key',
    fetchTransport: async () => new Response('<html>not json</html>', { status: 200, headers: { 'content-type': 'text/html' } }),
  })
  await expectAdapterError(wrongContentAdapter.lookup({ playerId: '123456', purpose: 'support_review', actorId: 'actor' }), 'invalid_content_type')

  const invalidJsonAdapter = createBasicPlayerSourceAdapter({
    baseUrl: 'https://forge-project.supabase.co',
    apiKey: 'synthetic-test-key',
    fetchTransport: async () => new Response('{not-json', { status: 200, headers: { 'content-type': 'application/json' } }),
  })
  await expectAdapterError(invalidJsonAdapter.lookup({ playerId: '123456', purpose: 'support_review', actorId: 'actor' }), 'invalid_source_payload')

  const oversizedDeclaredAdapter = createBasicPlayerSourceAdapter({
    baseUrl: 'https://forge-project.supabase.co',
    apiKey: 'synthetic-test-key',
    maxPayloadBytes: 10,
    fetchTransport: async () => new Response('{}', { status: 200, headers: { 'content-type': 'application/json', 'content-length': '11' } }),
  })
  await expectAdapterError(oversizedDeclaredAdapter.lookup({ playerId: '123456', purpose: 'support_review', actorId: 'actor' }), 'payload_too_large')

  const oversizedActualAdapter = createBasicPlayerSourceAdapter({
    baseUrl: 'https://forge-project.supabase.co',
    apiKey: 'synthetic-test-key',
    maxPayloadBytes: 5,
    fetchTransport: async () => new Response('{"x":1}', { status: 200, headers: { 'content-type': 'application/json' } }),
  })
  await expectAdapterError(oversizedActualAdapter.lookup({ playerId: '123456', purpose: 'support_review', actorId: 'actor' }), 'payload_too_large')

  const timeoutAdapter = createBasicPlayerSourceAdapter({
    baseUrl: 'https://forge-project.supabase.co',
    apiKey: 'synthetic-test-key',
    fetchTransport: async () => {
      const error = new Error('synthetic timeout')
      error.name = 'TimeoutError'
      throw error
    },
  })
  await expectAdapterError(timeoutAdapter.lookup({ playerId: '123456', purpose: 'support_review', actorId: 'actor' }), 'source_timeout')

  const unavailableAdapter = createBasicPlayerSourceAdapter({
    baseUrl: 'https://forge-project.supabase.co',
    apiKey: 'synthetic-test-key',
    fetchTransport: async () => { throw new Error('synthetic network failure') },
  })
  await expectAdapterError(unavailableAdapter.lookup({ playerId: '123456', purpose: 'support_review', actorId: 'actor' }), 'source_unavailable')

  const rateLimitedAdapter = createBasicPlayerSourceAdapter({
    baseUrl: 'https://forge-project.supabase.co',
    apiKey: 'synthetic-test-key',
    fetchTransport: async () => jsonResponse({ status: 'error' }, { status: 429 }),
  })
  await expectAdapterError(rateLimitedAdapter.lookup({ playerId: '123456', purpose: 'support_review', actorId: 'actor' }), 'source_rate_limited')

  const badImageAdapter = createBasicPlayerSourceAdapter({
    baseUrl: 'https://forge-project.supabase.co',
    apiKey: 'synthetic-test-key',
    fetchTransport: async () => jsonResponse({
      status: 'success',
      data: { playerId: '123456', name: 'Unsafe image', kingdom: 850, level: 30, profilePhoto: 'http://unsafe.example.test/avatar.png' },
    }),
  })
  await expectAdapterError(badImageAdapter.lookup({ playerId: '123456', purpose: 'support_review', actorId: 'actor' }), 'invalid_source_payload')

  assert.throws(() => createBasicPlayerSourceAdapter({ baseUrl: '', apiKey: '' }), (error) => error?.code === 'source_not_configured')
  assert.throws(() => createBasicPlayerSourceAdapter({ baseUrl: 'http://external.example.test', apiKey: 'key' }).lookup({
    playerId: '123456', purpose: 'support_review', actorId: 'actor',
  }), /configured safely/u)

  console.log('Player intelligence source adapter tests passed.')
} finally {
  await vite.close()
}
