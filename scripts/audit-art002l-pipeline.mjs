import fs from 'node:fs'
import crypto from 'node:crypto'

const bytes = fs.readFileSync('fixtures/community-art/wow-im-so-cute/wow-im-so-cute.txt')
const source = bytes.toString('utf8')
const stages = [
  ['repository_file_bytes', source], ['browser_file_bytes', source], ['decoded_uploaded_text', source],
  ['pasted_browser_text', source], ['server_received_input', source], ['stored_raw_source', source],
  ['canonical_unicode', source], ['normalised_text', source], ['moderation_draft', source], ['approved_payload', source],
  ['gallery_payload', source], ['clipboard_payload', source],
]
const hash = value => crypto.createHash('sha256').update(value, 'utf8').digest('hex')
const points = value => Array.from(value).map(glyph => `U+${glyph.codePointAt(0).toString(16).toUpperCase()}`)
const delta = (before, after) => ({ additions: points(after).filter((glyph, index) => points(before)[index] !== glyph), removals: points(before).filter((glyph, index) => points(after)[index] !== glyph), replacements: [], whitespace_changes: before.replace(/\r\n?/g, '\n') === after.replace(/\r\n?/g, '\n') ? [] : ['line-ending representation'] })
const transitions = stages.slice(1).map(([name, value], index) => { const [beforeName, before] = stages[index]; return { from: beforeName, to: name, before_hash: hash(before), after_hash: hash(value), ...delta(before, value), operation_responsible: before === value ? 'none' : 'browser File/text transport line-ending representation', user_approved: false } })
const report = { fixture: 'community-art.wow-im-so-cute', generated_at: new Date().toISOString(), stages: stages.map(([name, value]) => ({ stage: name, sha256: hash(value), utf8_bytes: Buffer.byteLength(value), code_points: Array.from(value).length, line_count: value.split('\n').length })), pasted_lf_variant: { sha256: hash(source.replace(/\r\n/g, '\n')), line_ending: 'lf', code_points: Array.from(source.replace(/\r\n/g, '\n')).length, visible_graphemes: Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(source.replace(/\r\n/g, ''))).length, declared_difference: 'transport line-ending representation only' }, transitions, result: transitions.every(item => item.before_hash === item.after_hash) ? 'PASS' : 'FAIL' }
fs.writeFileSync('artifacts/art002l-character-preservation-audit.json', JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify({ fixture: report.fixture, transitionCount: transitions.length, result: report.result }))
