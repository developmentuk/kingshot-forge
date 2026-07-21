import type { CharacterDiagnostic, TextDiagnostics } from '../art-studio/rendering'

export type RepairEdit = {
  kind: 'replace' | 'replace-all' | 'line-shift' | 'space' | 'trim' | 'reset-line' | 'restore'
  line: number | null
  before: string
  after: string
  reason: string
}

export type RepairOccurrence = CharacterDiagnostic & { line: number; column: number }

export function findRepairOccurrences(diagnostics: TextDiagnostics, codePoint: string): RepairOccurrence[] {
  return diagnostics.lines.flatMap((line) => line.characters.flatMap((character, index) => character.codePoint === codePoint ? [{ ...character, line: line.line, column: index + 1 }] : []))
}

export function replaceOccurrence(value: string, lineNumber: number, column: number, replacement: string): { text: string; edit: RepairEdit } {
  const lines = value.replace(/\r\n?/g, '\n').split('\n')
  const line = lines[lineNumber - 1] ?? ''
  const glyphs = Array.from(line)
  const before = glyphs[column - 1] ?? ''
  glyphs.splice(Math.max(0, column - 1), 1, replacement)
  lines[lineNumber - 1] = glyphs.join('')
  return { text: lines.join('\n'), edit: { kind: 'replace', line: lineNumber, before, after: replacement, reason: `Replace ${before || 'selected glyph'} at line ${lineNumber}, column ${column}` } }
}

export function replaceAllOccurrences(value: string, target: string, replacement: string): { text: string; edit: RepairEdit } {
  return { text: value.split(target).join(replacement), edit: { kind: 'replace-all', line: null, before: target, after: replacement, reason: `Replace every ${target} occurrence` } }
}

export function shiftLine(value: string, lineNumber: number, direction: 'left' | 'right', space = ' '): { text: string; edit: RepairEdit } {
  const lines = value.replace(/\r\n?/g, '\n').split('\n')
  const before = lines[lineNumber - 1] ?? ''
  const after = direction === 'left' ? before.replace(/^( |\u3000)/, '') : `${space}${before}`
  lines[lineNumber - 1] = after
  return { text: lines.join('\n'), edit: { kind: 'line-shift', line: lineNumber, before, after, reason: `Shift line ${direction}` } }
}

export function trimLine(value: string, lineNumber: number): { text: string; edit: RepairEdit } {
  const lines = value.replace(/\r\n?/g, '\n').split('\n')
  const before = lines[lineNumber - 1] ?? ''
  const after = before.trimEnd()
  lines[lineNumber - 1] = after
  return { text: lines.join('\n'), edit: { kind: 'trim', line: lineNumber, before, after, reason: `Trim trailing spaces on line ${lineNumber}` } }
}

export function resetLine(value: string, original: string, lineNumber: number): { text: string; edit: RepairEdit } {
  const lines = value.replace(/\r\n?/g, '\n').split('\n')
  const originalLines = original.replace(/\r\n?/g, '\n').split('\n')
  const before = lines[lineNumber - 1] ?? ''
  const after = originalLines[lineNumber - 1] ?? ''
  lines[lineNumber - 1] = after
  return { text: lines.join('\n'), edit: { kind: 'reset-line', line: lineNumber, before, after, reason: `Restore original line ${lineNumber}` } }
}
