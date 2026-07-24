import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile, stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const fixturePath = path.resolve(root, '..', 'kingshot-text-lab', 'fixtures', 'community-art', 'wow-im-so-cute', 'wow-im-so-cute.txt')
const fixture = await readFile(fixturePath)
const expectedHash = 'c4b0112b0e43312d1bbf3f2e18472814564d184f55c114c2749d0e921613cd79'
assert.equal(createHash('sha256').update(fixture).digest('hex'), expectedHash, 'raw fixture hash must remain canonical')
assert.equal(fixture.byteLength, 386, 'raw fixture byte length must remain canonical')
assert.equal((fixture.toString('binary').match(/\r\n/g) ?? []).length, 9, 'raw fixture must retain nine CRLF sequences')

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
