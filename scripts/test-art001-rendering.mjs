import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import { spawnSync } from 'node:child_process'

if (!process.execArgv.includes('tsx')) {
  const result = spawnSync(process.execPath, ['--import', 'tsx', ...process.argv.slice(1)], { stdio: 'inherit' })
  process.exit(result.status ?? 1)
}

const { analyseText, hashText, repairText, reverseRepairs, RENDER_PROFILES } = await import('../shared/domains/art-studio/rendering.ts')

const source = '💭  💭　Wow！ I’m so cute....\r\n\t╭──╮'
const profile = RENDER_PROFILES['kingshot-chat-bubble']
const diagnostics = analyseText(source, profile)
assert.equal(diagnostics.lineCount, 2)
assert.equal(diagnostics.ordinarySpaces, 5)
assert.equal(diagnostics.ideographicSpaces, 1)
assert.equal(diagnostics.tabs, 1)
assert.ok(diagnostics.emoji >= 1)
assert.ok(diagnostics.utf16Length > diagnostics.codePointCount)
assert.ok(diagnostics.lines.some((line) => line.warnings.length > 0))
const repaired = repairText(source, profile)
assert.ok(repaired.operations.length >= 2)
assert.ok(!repaired.text.includes('\r'))
assert.ok(!repaired.text.includes('\t'))
assert.equal(reverseRepairs(repaired.text, repaired.operations), source.replace(/\r\n?/g, '\n'))
assert.notEqual(hashText(source), hashText(repaired.text))

const fixturePath = 'fixtures/community-art/wow-im-so-cute/wow-im-so-cute.txt'
const metadata = JSON.parse(fs.readFileSync('fixtures/community-art/wow-im-so-cute/metadata.json', 'utf8'))
const fixtureBytes = fs.readFileSync(fixturePath)
const fixture = fixtureBytes.toString('utf8')
const fixtureDiagnostics = analyseText(fixture, RENDER_PROFILES[metadata.render_profile])
assert.equal(createHash('sha256').update(fixtureBytes).digest('hex'), metadata.text.sha256, 'fixture bytes match the canonical source hash')
assert.equal(fixtureBytes.length, 386, 'fixture retains canonical CRLF byte length')
assert.equal((fixture.match(/\r\n/g) ?? []).length, 9, 'fixture retains nine CRLF line endings')
assert.equal(fixtureDiagnostics.lineCount, metadata.text.line_count)
assert.equal(fixtureDiagnostics.codePointCount, metadata.text.code_point_count)
assert.equal(fixtureDiagnostics.graphemeCount, metadata.text.grapheme_count)
assert.equal(fixtureDiagnostics.utf16Length, metadata.text.utf16_code_unit_count)
assert.equal(fixtureDiagnostics.ordinarySpaces, metadata.text.unicode_statistics.ordinary_spaces)
assert.equal(fixtureDiagnostics.ideographicSpaces, metadata.text.unicode_statistics.ideographic_spaces)
assert.equal(fixtureDiagnostics.emoji, metadata.text.unicode_statistics.emoji)
assert.equal(fixtureDiagnostics.lines.flatMap((line) => line.characters).filter((character) => character.widthClass === 'full').length, metadata.text.unicode_statistics.full_width_characters)
assert.equal(metadata.expected_status, 'calibration_required', 'fixture remains honestly uncalibrated pending visual acceptance')

const renderer = fs.readFileSync('src/components/art/KingshotArtRenderer.tsx', 'utf8')
const clipboard = fs.readFileSync('shared/domains/art-studio/rendering.ts', 'utf8')
assert.match(renderer, /data-source-text=\{artwork\}/)
assert.match(renderer, /<pre[^>]+>\{artwork\}<\/pre>/)
assert.match(clipboard, /textarea\.value = value/)
assert.doesNotMatch(renderer, /wow-im-so-cute|c4b0112b0e43312d/i)
console.log('ART-001 rendering tests passed: canonical hash, CRLF source, Unicode counts, exact renderer source and deterministic repair.')
