import assert from 'node:assert/strict'
import fs from 'node:fs'

const { createTextPasteProvenance } = await import('../shared/domains/art-studio/textProvenance.ts')

const cases = [
  ['ASCII', 'hello\nworld', 11, 'lf', 0, 1],
  ['emoji', '💭', 4, 'none', 0, 0],
  ['full-width', 'Ｗｏｗ！', 12, 'none', 0, 0],
  ['ideographic-space', 'a　b', 5, 'none', 0, 0],
  ['CRLF', 'one\r\ntwo\r\n', 10, 'crlf', 2, 0],
  ['LF', 'one\ntwo\n', 8, 'lf', 0, 2],
]

for (const [label, value, byteLength, lineEnding, crlfCount, lfCount] of cases) {
  const provenance = await createTextPasteProvenance(value)
  assert.equal(provenance.byteLength, byteLength, `${label}: UTF-8 byte length`)
  assert.equal(provenance.detectedLineEnding, lineEnding, `${label}: line ending`)
  assert.equal(provenance.crlfCount, crlfCount, `${label}: CRLF count`)
  assert.equal(provenance.lfCount, lfCount, `${label}: LF count`)
}

const fixture = fs.readFileSync('fixtures/community-art/wow-im-so-cute/wow-im-so-cute.txt').toString('utf8')
const fixtureProvenance = await createTextPasteProvenance(fixture)
assert.equal(fixtureProvenance.byteLength, 386)
assert.equal(fixtureProvenance.crlfCount, 9)
assert.equal(fixtureProvenance.lfCount, 0)
assert.equal(fixtureProvenance.trailingNewline, false)

const api = fs.readFileSync('api/art-studio.ts', 'utf8')
const page = fs.readFileSync('src/pages/ArtStudioPage.tsx', 'utf8')
const service = fs.readFileSync('src/services/communityArtService.ts', 'utf8')
assert.match(api, /raw_source_sha256: sourceSha256/)
assert.match(api, /raw_source_byte_length: textProvenance\.byteLength/)
assert.match(api, /source_hash: sourceSha256/)
assert.match(api, /browser_received_text: artworkText/)
assert.match(api, /browser_text_sha256: sourceSha256/)
assert.match(api, /normalisation_operations: \[\]/)
assert.match(api, /ingestion_mode: 'text_paste'/)
assert.match(api, /raw_source_text: artworkText/)
assert.match(api, /artwork_text: artworkText/)
assert.match(page, /errorElement\.focus\(\{ preventScroll: true \}\)/)
assert.match(page, /className="error-state" role="alert"/)
assert.match(service, /Your draft is still here — please try again\./)
assert.match(api, /The Art Studio service is temporarily unavailable\./)
console.log('Art Studio submission provenance regression tests passed.')