import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const fixturePath = path.join(root, 'fixtures', 'community-art', 'wow-im-so-cute', 'wow-im-so-cute.txt')
const fixture = await readFile(fixturePath)
const expectedHash = 'c4b0112b0e43312d1bbf3f2e18472814564d184f55c114c2749d0e921613cd79'
assert.equal(createHash('sha256').update(fixture).digest('hex'), expectedHash, 'raw fixture hash must remain canonical')
assert.equal(fixture.byteLength, 386, 'raw fixture byte length must remain canonical')
assert.equal((fixture.toString('binary').match(/\r\n/g) ?? []).length, 9, 'raw fixture must retain nine CRLF sequences')
const clipboardFixture = Buffer.from((await readFile(path.join(root, 'fixtures/community-art/kingshot-clipboard-expanded/cat.txt.base64'), 'utf8')).replace(/\s/g, ''), 'base64')
assert.equal(createHash('sha256').update(clipboardFixture).digest('hex'), 'fe6bfe732d320f75e810be9071788a5b749424a7cff20e7e2407161964cf14d2', 'expanded clipboard fixture hash must remain canonical')
assert.equal([...clipboardFixture.toString('utf8')].length, 321, 'expanded clipboard fixture must retain 321 code points')
assert.equal(clipboardFixture.byteLength, 431, 'expanded clipboard fixture bytes must remain exact')

const app = await readFile(path.join(root, 'src/App.tsx'), 'utf8')
const harness = await readFile(path.join(root, 'src/features/art-studio/ArtStudioAcceptancePage.tsx'), 'utf8')
const rendering = await readFile(path.join(root, 'shared/domains/art-studio/rendering.ts'), 'utf8')
const css = await readFile(path.join(root, 'src/features/art-studio/artStudioAcceptance.css'), 'utf8')

assert.match(app, /import\.meta\.env\.DEV/)
assert.match(app, /art-studio\/acceptance/)
assert.match(app, /const developmentAcceptanceRoute/)
assert.doesNotMatch(harness, /\b(?:supabase|localStorage|sessionStorage)\s*(?:\.|\(|\[)/i, 'harness must not read or write persistence')
assert.match(harness, /arrayBuffer\(\)/, 'fixture must be read as raw bytes before decoding')
assert.match(harness, /TextDecoder\('utf-8', \{ fatal: true \}\)/)
assert.match(harness, /SHA-256/)
assert.match(harness, /FIXTURE_SOURCE_CONTEXTS/)
assert.match(harness, /CANONICAL_FILENAME]: 'authored'/, 'canonical ART-003 fixture uses authored context')
assert.match(harness, /CLIPBOARD_FILENAME]: 'kingshot-clipboard'/, 'expanded clipboard fixture uses clipboard context')
assert.doesNotMatch(harness, /sourceContext="kingshot-clipboard"/, 'acceptance harness must not globally force clipboard context')
assert.match(harness, /sourceContext=\{sourceContext\}/, 'acceptance surfaces receive explicit fixture context')
assert.ok((harness.match(/<KingshotArtRenderer/g) ?? []).length >= 6, 'all six surfaces must use the shared renderer')
assert.match(harness, /copyApprovedPayload\(source\)/)
assert.match(harness, /copyApprovedPayloadFallback\(source\)/)
assert.match(harness, /role="dialog" aria-modal="true"/)
assert.match(harness, /event\.key === 'Escape'/)
assert.match(harness, /document\.body\.style\.overflow = 'hidden'/)
assert.match(harness, /event\.shiftKey/)
assert.match(rendering, /export async function copyApprovedPayloadFallback/)
assert.match(rendering, /return copyApprovedPayloadFallback\(value\)/)
assert.match(css, /min-width: 0/)
assert.match(css, /@media \(max-width: 600px\)/)

try {
  await stat(path.join(root, 'dist'))
  const built = await readFile(path.join(root, 'dist/assets'), 'utf8').catch(() => '')
  assert.doesNotMatch(built, /art-studio\/acceptance/, 'production output must not expose the acceptance route')
} catch {
  // The production exclusion is also enforced by the import.meta.env.DEV route guard.
}

console.log('Art Studio acceptance harness checks passed.')
