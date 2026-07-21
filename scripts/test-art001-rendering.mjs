import assert from 'node:assert/strict'
import { analyseText, hashText, repairText, reverseRepairs, RENDER_PROFILES } from '../shared/domains/art-studio/rendering.ts'

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
console.log('ART-001 rendering tests passed: preservation, Unicode diagnostics, width risks, deterministic repair and reversible operations.')
