import assert from 'node:assert/strict'
import { resolveInternalDestination } from '../src/auth/returnDestination.ts'
import { completeAuthCallback } from '../src/auth/callbackFlow.ts'
import { isForgeAuthProviderAvailable } from '../src/auth/authConfig.ts'
import { resolveAuthError } from '../src/auth/authErrors.ts'

const accepted = [
  ['/my-forge', '/my-forge'],
  ['/settings?tab=security', '/settings?tab=security'],
  ['/companion/items/example#details', '/companion/items/example#details'],
  ['/my-forge?tab=security#sessions', '/my-forge?tab=security#sessions'],
  ['/search?q=hero%20skills', '/search?q=hero%20skills'],
  ['/name-studio?value=%E2%9C%A8', '/name-studio?value=%E2%9C%A8'],
  ['/my-forge#https://attacker.example', '/my-forge#https://attacker.example'],
]
for (const [input, expected] of accepted) assert.equal(resolveInternalDestination(input).destination, expected)

const rejected = [
  '//attacker.example', '///attacker.example', 'https://attacker.example', 'http://attacker.example',
  'javascript:alert(1)', 'data:text/html,test', '\\attacker.example', '/\\attacker.example',
  '/%2F%2Fattacker.example', '/%252F%252Fattacker.example', '/%2f%5cattacker.example',
  '/bad%2', '/foo\u0000bar', '/foo\rbar', '/foo\nbar', '/foo\tbar', '/foo\u0085bar',
  `/foo?next=${encodeURIComponent('https://attacker.example')}`,
  `/foo?redirect=${encodeURIComponent('//attacker.example')}`,
  `/foo?returnTo=${encodeURIComponent('/%2F%2Fattacker.example')}`,
  `/foo?continue=${encodeURIComponent('javascript:alert(1)')}`,
  'x'.repeat(2049),
]
for (const input of rejected) assert.equal(resolveInternalDestination(input).destination, '/my-forge', `expected rejection: ${input}`)

assert.equal(isForgeAuthProviderAvailable('google'), true)
assert.equal(isForgeAuthProviderAvailable('email'), false)
assert.equal(isForgeAuthProviderAvailable('discord'), false)
assert.equal(resolveAuthError({ code: 'expired_code' }).code, 'expired_code')
assert.equal(resolveAuthError({ code: 'missing_verifier' }).retryable, true)

const session = { user: { id: 'fixture-user' } }
let exchangeCount = 0
const success = await completeAuthCallback({
  search: '?code=fixture-code&returnTo=%2Fmy-forge%3Ftab%3Dsecurity',
  existingSession: null,
  exchangeCode: async (code) => { exchangeCount += 1; assert.equal(code, 'fixture-code'); return session },
})
assert.equal(success.destination, '/my-forge?tab=security')
assert.equal(success.session, session)
assert.equal(exchangeCount, 1)

const existing = await completeAuthCallback({ search: '?code=unused&returnTo=%2Fsettings', existingSession: session, exchangeCode: async () => { throw new Error('must not exchange') } })
assert.equal(existing.destination, '/settings')
assert.equal(existing.session, session)

await assert.rejects(() => completeAuthCallback({ search: '?error=access_denied', existingSession: null, exchangeCode: async () => null }), (error) => error.code === 'access_denied')
await assert.rejects(() => completeAuthCallback({ search: '', existingSession: null, exchangeCode: async () => null }), (error) => error.code === 'missing_code')
await assert.rejects(() => completeAuthCallback({ search: '?code=expired', existingSession: null, exchangeCode: async () => { throw { code: 'expired_code' } } }), (error) => error.code === 'expired_code')
await assert.rejects(() => completeAuthCallback({ search: '?code=reused', existingSession: null, exchangeCode: async () => { throw { code: 'invalid_grant' } } }), (error) => error.code === 'invalid_grant')
await assert.rejects(() => completeAuthCallback({ search: '?code=missing-verifier', existingSession: null, exchangeCode: async () => { throw { code: 'missing_verifier' } } }), (error) => error.code === 'missing_verifier')

console.log('AUTH-EXP-001 focused tests passed')
