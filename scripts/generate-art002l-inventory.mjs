import fs from 'node:fs'
import crypto from 'node:crypto'

const sourcePath = 'fixtures/community-art/wow-im-so-cute/wow-im-so-cute.txt'
const bytes = fs.readFileSync(sourcePath)
const text = bytes.toString('utf8')
const names = new Map([[' ', 'SPACE'], ['\n', 'LINE FEED'], ['\r', 'CARRIAGE RETURN'], ['\t', 'CHARACTER TABULATION'], ['　', 'IDEOGRAPHIC SPACE'], ['🐱', 'CAT FACE'], ['💭', 'THOUGHT BALLOON']])
const codePoint = glyph => `U+${glyph.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`
const whitespaceType = glyph => glyph === ' ' ? 'space' : glyph === '　' ? 'ideographic_space' : glyph === '\n' ? 'line_feed' : glyph === '\r' ? 'carriage_return' : glyph === '\t' ? 'tab' : /^\s$/u.test(glyph) ? 'other_whitespace' : 'none'
const compatibility = glyph => glyph === '　' ? 'verified_in_specific_context' : /\p{Extended_Pictographic}/u.test(glyph) ? 'verified_in_specific_context' : /[\u1100-\u115F\u2329\u232A\u2E80-\u303E\u3040-\uA4CF\uAC00-\uD7A3\uF900-\uFAFF\uFE10-\uFE19\uFE30-\uFE6F\uFF00-\uFF60\uFFE0-\uFFE6]/u.test(glyph) ? 'verified_in_specific_context' : 'unverified'
const entries = []
let line = 1, column = 1
for (const glyph of Array.from(text)) {
  const utf8 = [...Buffer.from(glyph)].map(byte => byte.toString(16).padStart(2, '0'))
  const entry = { line, column, glyph, code_point: codePoint(glyph), unicode_name: names.get(glyph) ?? `UNICODE CHARACTER ${codePoint(glyph)}`, utf8_bytes: utf8, utf16_units: [...glyph].map(char => char.charCodeAt(0)), whitespace_type: whitespaceType(glyph), compatibility_classification: compatibility(glyph), source_origin: 'fixtures/community-art/wow-im-so-cute/{wow-im-so-cute.txt,kingshot-reference-chat.png,kingshot-reference-game.png}', occurrence_count: 0 }
  entries.push(entry)
  if (glyph === '\n') { line++; column = 1 } else column++
}
for (const entry of entries) entry.occurrence_count = entries.filter(other => other.code_point === entry.code_point).length
const output = { fixture_id: 'community-art.wow-im-so-cute', source_sha256: crypto.createHash('sha256').update(bytes).digest('hex'), source_byte_length: bytes.length, decoded_text_sha256: crypto.createHash('sha256').update(text, 'utf8').digest('hex'), code_point_count: entries.length, grapheme_count: Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text.replace(/\r\n?/g, ''))).length, entries }
fs.writeFileSync('fixtures/community-art/wow-im-so-cute/expected-inventory.json', JSON.stringify(output, null, 2) + '\n')
console.log(JSON.stringify({ fixture: output.fixture_id, codePoints: output.code_point_count, graphemes: output.grapheme_count, bytes: output.source_byte_length, sha256: output.source_sha256 }))
