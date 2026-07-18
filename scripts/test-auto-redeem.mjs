import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createServer } from 'vite'

const workflowSource = fs.readFileSync('server/giftcodes/autoRedeemService.ts', 'utf8')
assert.doesNotMatch(workflowSource, /AbortSignal\.timeout/)
assert.match(workflowSource, /new AbortController\(\)/)

const vite = await createServer({ appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } })
try {
  const provider = await vite.ssrLoadModule('/server/giftcodes/officialProvider.ts')
  const fixtureConfig = {
    playerUrl: 'https://provider.test/api/player',
    codeUrl: 'https://provider.test/api/gift_code',
    signingKey: 'fixture-signing-key',
    timeoutMs: 15000,
    enabled: true,
  }
  assert.equal(provider.createSignedFields({ cdk: 'CODE', fid: 'PLAYER', time: '123' }, fixtureConfig.signingKey).sign, '1622ae4ea35277aa89541e802fa7b03d')
  assert.equal(provider.normaliseOfficialResponse({ msg: 'SUCCESS' }).status, 'succeeded')
  assert.equal(provider.normaliseOfficialResponse({ msg: 'RECEIVED', err_code: 40008 }).status, 'already_claimed')
  assert.equal(provider.normaliseOfficialResponse({ msg: 'TIME ERROR', err_code: 40007 }).status, 'expired')
  assert.equal(provider.normaliseOfficialResponse({ msg: 'CDK NOT FOUND', err_code: 40014 }).safeDiagnosticCode, 'invalid_code')

  const calls = []
  const fakeFetch = async (url, init) => {
    calls.push({ url, init })
    if (calls.length === 1) return new Response(JSON.stringify({ msg: 'success' }), { status: 200, headers: { 'content-type': 'application/json', 'set-cookie': 'sid=fixture; Path=/' } })
    return new Response(JSON.stringify({ msg: 'SUCCESS' }), { status: 200, headers: { 'content-type': 'application/json' } })
  }
  const client = provider.createOfficialGiftCodeProvider(fixtureConfig, fakeFetch)
  const result = await client.redeem({ attemptId: 'attempt', playerAccountId: 'account', playerId: 'player', giftCodeId: 'code', giftCodeVersion: 'v1', code: 'CODE', idempotencyKey: 'hash', consentVersion: 'v1' })
  assert.equal(result.status, 'succeeded')
  assert.equal(calls.length, 2)
  assert.match(String(calls[1].init.headers.Cookie), /sid=fixture/)
  assert.equal(String(calls[1].init.body).includes('fixture-signing-key'), false)
  assert.equal(provider.createOfficialGiftCodeProvider(null).productionReady, false)
  console.log('Auto Redeem provider fixtures passed.')
} finally {
  await vite.close()
}
