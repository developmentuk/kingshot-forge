import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import fs from 'node:fs'

import { evaluateVisionConfidence } from '../server/vision/confidenceEngine.ts'
import { VisionExtractorRegistry } from '../server/vision/extractors/registry.ts'
import {
  TesseractCliExtractor,
  buildTesseractArguments,
  parseTesseractLanguages,
  parseTesseractTsv,
} from '../server/vision/extractors/tesseractCliExtractor.ts'
import { validateVisionValue } from '../server/vision/validationEngine.ts'
import {
  assertExtractorManifest,
  assertRegistryTarget,
  isNormalisedGeometry,
} from '../shared/platform/vision/contracts.ts'

const migration = fs.readFileSync('supabase/migrations/20260722193000_vision_001a_contracts_and_persistence.sql', 'utf8')
const architecture = fs.readFileSync('docs/architecture/FORGE-VISION-PLATFORM.md', 'utf8')
const adr = fs.readFileSync('docs/ADR/ADR-2026-07-23-FORGE-VISION-PLATFORM-SERVICE.md', 'utf8')
const tesseractSource = fs.readFileSync('server/vision/extractors/tesseractCliExtractor.ts', 'utf8')
const studioSource = fs.readFileSync('src/features/admin/VisionStudioPage.tsx', 'utf8')

const visionTables = [
  'vision_field_registry',
  'vision_extractor_plugins',
  'vision_screen_types',
  'vision_mapping_versions',
  'vision_evidence_images',
  'vision_mapping_reference_images',
  'vision_regions',
  'vision_field_mappings',
  'vision_mapping_extractors',
  'vision_mapping_regions',
  'vision_test_cases',
  'vision_test_results',
  'vision_scan_runs',
  'vision_scan_values',
  'vision_extraction_evidence',
  'vision_user_corrections',
  'vision_audit_events',
]
const rlsBlock = migration.match(/foreach table_name in array array\[.*?end loop;/s)?.[0]
assert.ok(rlsBlock, 'migration must contain the governed Vision RLS loop')
assert.match(rlsBlock, /force row level security/, 'all Vision tables must FORCE RLS')
for (const table of visionTables) {
  assert.match(migration, new RegExp(`create table public\\.${table}`), `${table} must exist`)
  assert.match(rlsBlock, new RegExp(`'${table}'`), `${table} must be included in the FORCE RLS set`)
}

for (const evidenceColumn of [
  'field_key',
  'mapping_version_id',
  'source_image_id',
  'extractor_plugin_key',
  'extractor_plugin_version',
  'engine_name',
  'engine_version',
  'bounding_boxes',
  'raw_text',
  'extracted_value',
  'confidence_detail',
  'validation_detail',
  'conflict_detail',
  'extracted_at',
]) assert.match(migration, new RegExp(evidenceColumn), `evidence must preserve ${evidenceColumn}`)

for (const permission of [
  'vision.admin.read',
  'vision.admin.edit',
  'vision.admin.test',
  'vision.admin.publish',
  'vision.scan.create',
  'vision.scan.review-own',
  'vision.evidence.review',
]) assert.match(migration, new RegExp(permission.replaceAll('.', '\\.')), `${permission} must be registered`)

assert.match(migration, /publish_vision_mapping_version/, 'publication must be a named server operation')
assert.match(migration, /guard_published_vision_version_mutation/, 'published mapping versions need an immutable guard')
assert.match(migration, /guard_published_vision_mapping_child_mutation/, 'published extractor and region bindings need immutable guards')
assert.match(migration, /guard_append_only_vision_evidence/, 'evidence and correction history must be append-only')
assert.match(migration, /field_key text not null references public\.vision_field_registry/, 'mappings must target the governed Field Registry')
assert.doesNotMatch(migration, /target_table|target_column|arbitrary_sql|custom_code/, 'mapping persistence must not expose arbitrary write targets')
assert.doesNotMatch(migration, /player\.game_name|governor-profile|hero\./, 'platform foundation must seed no screen-specific fields or mappings')
assert.match(migration, /ocr\.tesseract\.cli/, 'Tesseract must be represented as a plugin')
assert.match(migration, /local_worker/, 'Tesseract must remain an isolated worker integration')
assert.match(migration, /revoke all .* from anon, authenticated/s, 'browser mutation grants must default closed')
assert.doesNotMatch(migration, /grant (insert|update|delete).* to authenticated/i, 'authenticated clients must not receive direct Vision mutation grants')

assert.match(architecture, /not an OCR feature/i, 'architecture must define Forge Vision beyond OCR')
assert.match(architecture, /no screen-specific mapping/i, 'architecture must preserve the platform-only foundation boundary')
assert.match(architecture, /Why do we believe this value is correct/i, 'architecture must make evidence explainable')
assert.match(adr, /permanent platform service/i, 'ADR must record the permanent service decision')
assert.match(studioSource, /No Kingshot screen mapping is configured/, 'Vision Studio must present the current state honestly')

assert.match(tesseractSource, /execFileAsync/, 'Tesseract must be invoked without a shell')
assert.doesNotMatch(tesseractSource, /\bexec\(/, 'Tesseract adapter must not use shell execution')
assert.match(tesseractSource, /MAX_TIMEOUT_MS/, 'Tesseract work must have a bounded timeout')
assert.match(tesseractSource, /tessedit_char_whitelist/, 'allowlisted OCR configuration should support bounded character sets')
assert.match(tesseractSource, /--list-langs/, 'Tesseract health must verify trained language data')

assert.equal(isNormalisedGeometry({ x: 0.1, y: 0.2, width: 0.3, height: 0.4 }), true)
assert.equal(isNormalisedGeometry({ x: 0.8, y: 0.2, width: 0.3, height: 0.4 }), false)

const field = {
  fieldKey: 'example.field',
  label: 'Example field',
  description: '',
  domainKey: 'example',
  owningService: 'example-service',
  valueType: 'integer',
  validationSchema: { minimum: 1, maximum: 100 },
  screenshotImportAllowed: true,
  userConfirmationRequired: true,
  conflictPolicy: 'review',
  freshnessSeconds: null,
  visibility: 'private',
  sensitivity: 'standard',
  proposalOperation: 'example.propose',
  isEnabled: true,
}
assert.doesNotThrow(() => assertRegistryTarget(field))

const validResult = validateVisionValue(field, 42, {}, () => new Date('2026-07-23T12:00:00.000Z'))
assert.equal(validResult.status, 'valid')
const invalidResult = validateVisionValue(field, 101, {}, () => new Date('2026-07-23T12:00:00.000Z'))
assert.equal(invalidResult.status, 'invalid')

const acceptedConfidence = evaluateVisionConfidence({
  threshold: 0.8,
  extractorConfidence: 0.94,
  screenDetectionConfidence: 0.9,
  regionDetectionConfidence: 0.91,
  formatConfidence: 1,
  validation: validResult,
})
assert.equal(acceptedConfidence.status, 'accepted')
assert.ok(acceptedConfidence.score >= 0.8)

const blockedConfidence = evaluateVisionConfidence({
  threshold: 0.8,
  extractorConfidence: 0.99,
  validation: invalidResult,
})
assert.equal(blockedConfidence.status, 'blocked', 'validation must block even high-confidence extraction')

const tsv = [
  'level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\tleft\ttop\twidth\theight\tconf\ttext',
  '5\t1\t1\t1\t1\t1\t10\t5\t30\t10\t96.0\tForge',
  '5\t1\t1\t1\t1\t2\t45\t5\t30\t10\t88.0\tVision',
].join('\n')
const parsedTokens = parseTesseractTsv(tsv, 100, 50)
assert.equal(parsedTokens.length, 2)
assert.deepEqual(parsedTokens[0].normalisedBox, { x: 0.1, y: 0.1, width: 0.3, height: 0.2 })
assert.deepEqual(
  parseTesseractLanguages('List of available languages in /safe/tessdata (2):\neng\nosd\n'),
  ['eng', 'osd'],
)

const args = buildTesseractArguments('/tmp/input.png', {
  language: 'eng',
  pageSegmentationMode: 6,
  ocrEngineMode: 1,
  preserveInterwordSpaces: true,
  characterWhitelist: 'ABC123',
  timeoutMs: 5_000,
}, '/opt/tessdata')
assert.deepEqual(args.slice(0, 2), ['/tmp/input.png', 'stdout'])
assert.ok(args.includes('tsv'))
assert.ok(args.includes('--tessdata-dir'))

const calls = []
const fakeRunner = {
  async run(executable, commandArgs, timeoutMs) {
    calls.push({ executable, commandArgs: [...commandArgs], timeoutMs })
    if (commandArgs[0] === '--version') return { stdout: 'tesseract 5.5.2\n', stderr: '' }
    if (commandArgs.includes('--list-langs')) {
      return { stdout: 'List of available languages in /safe/tessdata (1):\neng\n', stderr: '' }
    }
    return { stdout: tsv, stderr: '' }
  },
}
const extractor = new TesseractCliExtractor({
  executablePath: '/safe/tesseract',
  expectedEngineVersion: '5.5.2',
  commandRunner: fakeRunner,
  now: () => new Date('2026-07-23T12:00:00.000Z'),
})
assert.doesNotThrow(() => assertExtractorManifest(extractor.manifest))

const registry = new VisionExtractorRegistry()
registry.register(extractor)
assert.equal(registry.get('ocr.tesseract.cli'), extractor)
assert.throws(() => registry.register(extractor), /already registered/)

const extractionBytes = new Uint8Array([137, 80, 78, 71])
const extraction = await extractor.extract({
  runId: 'run-1',
  mappingVersionId: 'version-1',
  mappingId: 'mapping-1',
  fieldKey: 'example.field',
  image: {
    evidenceId: 'evidence-1',
    sha256: createHash('sha256').update(extractionBytes).digest('hex'),
    mimeType: 'image/png',
    widthPx: 100,
    heightPx: 50,
    bytes: extractionBytes,
  },
  region: null,
  configuration: { language: 'eng', pageSegmentationMode: 6 },
})
assert.equal(extraction.candidateValue, 'Forge Vision')
assert.equal(extraction.provenance.engineVersion, '5.5.2')
assert.equal(extraction.tokens.length, 2)
assert.ok(calls.every((call) => call.executable === '/safe/tesseract'))
assert.ok(calls.every((call) => call.timeoutMs <= 60_000))

const unsafeBytes = new Uint8Array([1])
const unsafeExtractor = new TesseractCliExtractor({ commandRunner: fakeRunner })
await assert.rejects(() => unsafeExtractor.extract({
  runId: 'run-2',
  mappingVersionId: 'version-1',
  mappingId: 'mapping-1',
  fieldKey: 'example.field',
  image: {
    evidenceId: 'evidence-2',
    sha256: createHash('sha256').update(unsafeBytes).digest('hex'),
    mimeType: 'image/png',
    widthPx: 10,
    heightPx: 10,
    bytes: unsafeBytes,
  },
  region: null,
  configuration: { language: 'eng;rm' },
}), /Invalid Tesseract language/)

console.log('Forge Vision platform tests passed: provider-neutral contracts, immutable mappings, evidence, confidence, validation, secure Tesseract adapter and honest Vision Studio foundation.')
