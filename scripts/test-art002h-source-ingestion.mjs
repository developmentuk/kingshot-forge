import assert from 'node:assert/strict'
import fs from 'node:fs'
import crypto from 'node:crypto'
import { bytesToBase64, inspectSourceText } from '../shared/domains/art-studio/sourceEvidence.ts'

const fixturePath = 'fixtures/community-art/wow-im-so-cute/wow-im-so-cute.txt'
const fixtureBytes = fs.readFileSync(fixturePath)
const fixtureText = fixtureBytes.toString('utf8')
const migration = fs.readFileSync('supabase/migrations/20260722100000_art002h_exact_source_ingestion.sql', 'utf8')
const api = fs.readFileSync('api/art-studio.ts', 'utf8')
const page = fs.readFileSync('src/pages/ArtStudioPage.tsx', 'utf8')

assert.equal(fixtureBytes.length, 386)
assert.equal(crypto.createHash('sha256').update(fixtureBytes).digest('hex'), 'c4b0112b0e43312d1bbf3f2e18472814564d184f55c114c2749d0e921613cd79')
assert.equal(inspectSourceText(fixtureText, fixtureBytes).crlfCount, 9)
assert.equal(inspectSourceText(fixtureText, fixtureBytes).lineEnding, 'crlf')
assert.equal(Buffer.from(bytesToBase64(fixtureBytes), 'base64').equals(fixtureBytes), true)

const pasted = fixtureText.replace(/\r\n/g, '\n')
const pastedEvidence = inspectSourceText(pasted, new TextEncoder().encode(pasted))
assert.equal(pastedEvidence.lineEnding, 'lf')
assert.notEqual(crypto.createHash('sha256').update(fixtureBytes).digest('hex'), crypto.createHash('sha256').update(pasted, 'utf8').digest('hex'))

const evidenceText = '\uFEFFa\t\u3000b\uFF01\r\n\r\n'
const evidenceBytes = new TextEncoder().encode(evidenceText)
const evidence = inspectSourceText(evidenceText, evidenceBytes)
assert.equal(evidence.bomPresent, true)
assert.equal(evidence.crlfCount, 2)
assert.equal(evidence.lfCount, 0)
assert.equal(evidence.trailingNewline, true)
assert.equal(evidenceBytes.includes(0x09), true)
assert.match(migration, /line_crlf := \(length\(decoded_text_value\).*\) \/ 2/)

for (const mode of ['file_upload', 'text_paste', 'manual_entry', 'legacy_import']) assert.match(migration, new RegExp(mode))
for (const field of ['raw_bytes', 'decoded_text_sha256', 'detected_line_ending', 'crlf_count', 'browser_received_text', 'normalisation_operations']) assert.match(migration, new RegExp(field))
assert.match(migration, /extensions\.digest\(source_bytes, 'sha256'\)/)
assert.match(api, /p_raw_bytes_base64/)
assert.match(api, /p_ingestion_mode/)
assert.match(page, /Upload text file \(exact bytes\)/)
assert.match(page, /Text entered in the browser/)
assert.match(page, /bytesToBase64/)
assert.match(page, /selectedFile/)
assert.match(page, /Choose and keep a valid \.txt file attached/)
assert.match(api, /Choose a supported source input mode/)
assert.match(api, /A file upload requires a \.txt filename and text\/plain MIME type/)

console.log('ART-002H source-ingestion tests passed: exact file bytes, honest paste evidence, hashes, line endings, modes and atomic contract.')
