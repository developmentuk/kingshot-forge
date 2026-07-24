import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'

if (!process.execArgv.includes('tsx')) {
  const result = spawnSync(process.execPath, ['--import', 'tsx', ...process.argv.slice(1)], { stdio: 'inherit' })
  process.exit(result.status ?? 1)
}

const { analyseText } = await import('../shared/domains/art-studio/rendering.ts')
const { findRepairOccurrences, replaceAllOccurrences, replaceOccurrence, resetLine, shiftLine, trimLine } = await import('../shared/domains/render-engine/repair.ts')

const source = ' A’B\nＣ  '
const diagnostics = analyseText(source)
const apostrophe = diagnostics.lines[0].characters[2]
assert.equal(apostrophe.character, '’')
assert.deepEqual(findRepairOccurrences(diagnostics, apostrophe.codePoint).map(({ line, column }) => [line, column]), [[1, 3]])
assert.equal(replaceOccurrence(source, 1, 3, "'").text, " A'B\nＣ  ")
assert.equal(replaceAllOccurrences('A’B\n’', '’', "'").text, "A'B\n'")
assert.equal(shiftLine(source, 1, 'left').text, 'A’B\nＣ  ')
assert.equal(shiftLine(source, 1, 'right', '　').text, '　 A’B\nＣ  ')
assert.equal(trimLine(source, 2).text, ' A’B\nＣ')
assert.equal(resetLine('changed\nＣ  ', source, 1).text, source)
console.log('Render repair tests passed: warning locations, replacements, line shifts, spaces, trim and restore.')
