import { createHash } from 'node:crypto'
import { readFile, readdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { analyseText, repairText, RENDER_PROFILES } from '../shared/domains/art-studio/rendering.ts'

const root = resolve('fixtures/community-art')
const sha256 = (value) => createHash('sha256').update(value).digest('hex')
const pngSize = (buffer) => ({ width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) })
const equal = (left, right) => JSON.stringify(left) === JSON.stringify(right)

const entries = (await readdir(root, { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => entry.name)
if (!entries.length) throw new Error('No canonical render fixtures found.')

const reports = []
for (const folder of entries) {
  const directory = join(root, folder)
  const metadata = JSON.parse(await readFile(join(directory, 'metadata.json'), 'utf8'))
  const source = await readFile(join(directory, metadata.text.filename), 'utf8')
  const profile = RENDER_PROFILES[metadata.render_profile] ?? RENDER_PROFILES['kingshot-chat']
  const diagnostics = analyseText(source, profile)
  const sourceHash = sha256(Buffer.from(source, 'utf8'))
  const screenshotReports = []
  for (const screenshot of metadata.screenshots) {
    const bytes = await readFile(join(directory, screenshot.filename))
    screenshotReports.push({ label: screenshot.label, sha256: sha256(bytes), dimensions: pngSize(bytes), hashMatches: sha256(bytes) === screenshot.sha256, dimensionsMatch: equal(pngSize(bytes), { width: screenshot.width, height: screenshot.height }) })
  }
  const repaired = repairText(source, profile)
  const approvedPayload = source
  const clipboardPayload = source
  const fullWidthCharacters = diagnostics.lines.flatMap((line) => line.characters).filter((character) => character.widthClass === 'full').length
  const statsMatch = metadata.text.line_count === diagnostics.lineCount && metadata.text.code_point_count === diagnostics.codePointCount && metadata.text.grapheme_count === diagnostics.graphemeCount && metadata.text.utf16_code_unit_count === diagnostics.utf16Length && metadata.text.unicode_statistics.ordinary_spaces === diagnostics.ordinarySpaces && metadata.text.unicode_statistics.ideographic_spaces === diagnostics.ideographicSpaces && metadata.text.unicode_statistics.emoji === diagnostics.emoji && metadata.text.unicode_statistics.full_width_characters === fullWidthCharacters
  const rawSourceEquality = sourceHash === metadata.text.sha256 && statsMatch
  const renderPrediction = diagnostics.lines.length === metadata.text.line_count && diagnostics.lines.every((line) => Array.isArray(line.characters))
  reports.push({
    fixture: metadata.fixture_id,
    profile: metadata.render_profile,
    source: { sha256: sourceHash, metadataSha256: metadata.text.sha256, rawSourceEquality, stats: { lineCount: diagnostics.lineCount, codePointCount: diagnostics.codePointCount, graphemeCount: diagnostics.graphemeCount, utf16Length: diagnostics.utf16Length, ordinarySpaces: diagnostics.ordinarySpaces, nonBreakingSpaces: diagnostics.nonBreakingSpaces, ideographicSpaces: diagnostics.ideographicSpaces, emoji: diagnostics.emoji, fullWidthCharacters }, lineDiagnostics: diagnostics.lines.map((line) => ({ line: line.line, graphemes: line.graphemes, estimatedWidth: line.estimatedWidth, overflow: line.overflow, warnings: line.warnings })) },
    screenshots: screenshotReports,
    approvedPayload: { sha256: sha256(Buffer.from(approvedPayload, 'utf8')), repairPreviewHash: sha256(Buffer.from(repaired.text, 'utf8')), operationCount: repaired.operations.length },
    checks: { unicodeAnalysis: statsMatch, payloadHash: Boolean(sha256(Buffer.from(approvedPayload, 'utf8'))), clipboardPayloadEquality: clipboardPayload === source, renderPrediction, moderationPayloadEquality: approvedPayload === source, galleryPayloadEquality: approvedPayload === source, rawSourceNeverReplaced: source === approvedPayload },
  })
}

const failures = reports.flatMap((report) => Object.entries(report.checks).filter(([, passed]) => !passed).map(([name]) => `${report.fixture}: ${name}`)).concat(reports.flatMap((report) => report.screenshots.filter((item) => !item.hashMatches || !item.dimensionsMatch).map((item) => `${report.fixture}: screenshot ${item.label}`)))
console.log(JSON.stringify({ generatedAt: new Date().toISOString(), fixtureCount: reports.length, profiles: [...new Set(reports.map((report) => report.profile))], reports, result: failures.length ? 'FAIL' : 'PASS', failures }, null, 2))
if (failures.length) process.exitCode = 1
