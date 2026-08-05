import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const [
  packageJson,
  viteConfig,
  browserSentry,
  serverSentry,
  sharedRedaction,
  mainEntry,
  userRuntime,
  playerAccountApi,
] = await Promise.all([
  readFile('package.json', 'utf8').then(JSON.parse),
  readFile('vite.config.ts', 'utf8'),
  readFile('src/observability/sentry.ts', 'utf8'),
  readFile('server/observability/sentry.ts', 'utf8'),
  readFile('shared/observability/redaction.ts', 'utf8'),
  readFile('src/main.tsx', 'utf8'),
  readFile('src/components/SentryUserRuntime.tsx', 'utf8'),
  readFile('api/player/account.ts', 'utf8'),
])

assert.equal(packageJson.dependencies['@sentry/react'], '10.68.0')
assert.equal(packageJson.dependencies['@sentry/node'], '10.68.0')
assert.equal(packageJson.devDependencies['@sentry/vite-plugin'], '5.4.0')

assert.match(viteConfig, /__SENTRY_DSN__:\s*JSON\.stringify\(process\.env\.SENTRY_DSN \?\? ''\)/)
assert.match(viteConfig, /filesToDeleteAfterUpload:\s*'\.\/dist\/\*\*\/\*\.map'/)
assert.match(viteConfig, /sourcemap:\s*sentryConfigured \? 'hidden' : false/)
assert.equal(viteConfig.includes('envPrefix'), false)

const defineBlock = viteConfig.slice(
  viteConfig.indexOf('define: {'),
  viteConfig.indexOf('build: {'),
)
assert.equal(defineBlock.includes('SENTRY_AUTH_TOKEN'), false)

for (const source of [browserSentry, serverSentry]) {
  assert.match(source, /sendDefaultPii:\s*false/)
  assert.match(source, /tracesSampleRate:\s*0\.05/)
  assert.match(source, /sanitizeSentryEvent/)
}
assert.equal(browserSentry.includes('replayIntegration'), false)
assert.equal(browserSentry.includes('browserSessionIntegration'), false)

assert.ok(mainEntry.indexOf('initSentry()') < mainEntry.indexOf('createRoot('))
assert.match(mainEntry, /<ForgeErrorBoundary>/)
assert.match(mainEntry, /<SentryUserRuntime \/>/)

assert.match(userRuntime, /user\?\.id \?\? null/)
for (const forbidden of ['user.email', 'user_metadata', 'app_metadata', 'playerId']) {
  assert.equal(userRuntime.includes(forbidden), false)
}

for (const sensitiveField of ['authorization', 'cookie', 'password', 'service[-_]?role', 'access_token', 'refresh_token']) {
  assert.ok(sharedRedaction.toLowerCase().includes(sensitiveField.toLowerCase()))
}

assert.match(playerAccountApi, /captureServerException\(error/)
assert.ok(
  playerAccountApi.indexOf('error instanceof ForgeAuthenticationError')
    < playerAccountApi.indexOf('captureServerException(error'),
)
assert.equal(serverSentry.includes('request.body'), false)

console.log('Sentry observability safety contracts passed.')
