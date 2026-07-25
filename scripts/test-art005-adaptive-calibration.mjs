import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { buildFixedCellGrid } from '../src/render-engine/grid/index.ts'
import { classifyClipboardLineContext } from '../src/render-engine/adaptiveCalibration.ts'
import { DEFAULT_CALIBRATION } from '../src/render-engine/configuration/index.ts'
import { segmentGraphemes } from '../src/render-engine/parser/index.ts'
import { ARTWORK_SPACE_ADVANCE, PROSE_SPACE_ADVANCE } from '../src/render-engine/analyser/index.ts'
import { calculateSubmissionRetryAfterSeconds, COMMUNITY_ART_SUBMISSION_LIMIT, COMMUNITY_ART_SUBMISSION_WINDOW_SECONDS } from '../shared/domains/art-studio/submissionRateLimit.ts'

const root = path.resolve('fixtures/community-art/adaptive-clipboard')
const expected = new Map([
  ['ah-ah-oops', ['5e496c7d-294d-4a2e-b20a-6ae780b1fef4', '3eb998a5526650229360f453bab2506f7ee3a54f1f28b4645431451c7bc923c6', 'kingshot-clipboard']],
  ['free-hard-spanking', ['7d4dd5d5-af9a-4975-894a-af683ec5662d', 'ceb4e2b817146c1714b02edcfba0bb6dcbc9b93fc72fd3b88c08522d63315ae4', 'kingshot-clipboard']],
  ['where-is-all-the-good-text-art', ['3a57a724-afdd-4193-9eef-f7dd9d9cf381', 'cfacdd29930f5a94438291406e56360c7139253c74aadb294f27bb77c042bff6', 'kingshot-clipboard']],
  ['dont-ask-me', ['3dbd4af9-61f3-4b6f-8456-a6d04e180504', '7cfbe9fcb122a6412a25b6d665f5924c242b03a2dac898149c87ef7c569a5fa7', 'kingshot-clipboard']],
  ['i-have-come-to', ['3c490bb3-31d1-481a-a4c8-a45ad6bd7562', '3bea8beb8d0a1345306552abe1f3e395ff0aeb84595d1c8a0897c66f159d8985', 'kingshot-clipboard']],
  ['alliance-coffee-time', ['8ad59659-531a-412c-86e1-5006de55c864', 'c4b0c423a3501da0e77b26b08a40b4af41937dd433cc3e0f6efd6d98bbf6a6d5', 'kingshot-clipboard']],
  ['wow-im-so-cute-expanded', ['70e96272-7f37-4021-89f6-d34610c27969', 'fe6bfe732d320f75e810be9071788a5b749424a7cff20e7e2407161964cf14d2', 'kingshot-clipboard']],
])

for (const [slug, [recordId, hash, sourceContext]] of expected) {
  const metadata = JSON.parse(await readFile(path.join(root, slug, 'metadata.json'), 'utf8'))
  const bytes = Buffer.from((await readFile(path.join(root, slug, metadata.source.filename), 'utf8')).replace(/\s/g, ''), 'base64')
  const source = bytes.toString('utf8')
  assert.equal(metadata.database.recordId, recordId, `${slug}: record ID`)
  assert.equal(metadata.database.status, 'pending', `${slug}: pending status`)
  assert.equal(metadata.sourceContext, sourceContext, `${slug}: source context`)
  assert.equal(createHash('sha256').update(bytes).digest('hex'), hash, `${slug}: source hash`)
  assert.equal(bytes.byteLength, metadata.source.utf8ByteLength, `${slug}: byte length`)
  assert.equal([...source].length, metadata.source.codePointCount, `${slug}: code points`)
  assert.equal([...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(source)].length, metadata.source.graphemeCount, `${slug}: graphemes`)
  assert.equal(source.length, metadata.source.utf16CodeUnitCount, `${slug}: UTF-16 units`)
  assert.equal(source.split(/\r\n|\r|\n/).length, metadata.source.lineCount, `${slug}: line count`)
  assert.equal(metadata.source.sourceEqualsArtworkText, true, `${slug}: source equality evidence`)
  assert.ok(source.split(/\r\n|\r|\n/).map(classifyClipboardLineContext).every(Boolean), `${slug}: deterministic line contexts`)
}

const authored = buildFixedCellGrid(['word gap'], DEFAULT_CALIBRATION, 'authored')[0].cells.find((cell) => cell.glyph === ' ')
assert.equal(authored?.span, PROSE_SPACE_ADVANCE, 'authored spacing remains unchanged')
const clipboard = buildFixedCellGrid(['/       |'], DEFAULT_CALIBRATION, 'kingshot-clipboard')[0].cells.find((cell) => cell.glyph === ' ')
assert.equal(clipboard?.sourceGlyphs.length, 7, 'clipboard source run remains grouped without mutation')
assert.equal(clipboard?.span, 1.29, 'ART-004 clipboard run calibration remains unchanged')
assert.equal(segmentGraphemes('  / | _').length, 7, 'grapheme parser remains source-preserving')
assert.equal(ARTWORK_SPACE_ADVANCE, .55, 'authored artwork spacing constant remains unchanged')

const now = Date.parse('2026-07-25T12:00:00.000Z')
assert.equal(COMMUNITY_ART_SUBMISSION_LIMIT, 5)
assert.equal(COMMUNITY_ART_SUBMISSION_WINDOW_SECONDS, 3600)
assert.equal(calculateSubmissionRetryAfterSeconds('2026-07-25T11:30:00.000Z', now), 1800, 'rate-limit wait is based on oldest submission')
assert.equal(calculateSubmissionRetryAfterSeconds('invalid', now), 3600, 'invalid timestamp fails closed to the full window')

const api = await readFile('api/art-studio.ts', 'utf8')
const service = await readFile('src/services/communityArtService.ts', 'utf8')
const page = await readFile('src/pages/ArtStudioPage.tsx', 'utf8')
assert.match(api, /code: 'submission_rate_limit'/)
assert.match(api, /Retry-After/)
assert.match(service, /error\.code = payload\.code/)
assert.match(page, /Your draft has been preserved/)
assert.match(page, /errorElement\.focus\(\{ preventScroll: true \}\)/)
console.log(`ART-005 adaptive fixture, context, fidelity and rate-limit checks passed (${expected.size} fixtures).`)
