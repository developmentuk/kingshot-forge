export type CompatibilityClassification = 'verified_in_kingshot' | 'verified_in_specific_context' | 'likely_compatible' | 'unverified' | 'width_uncertain' | 'unsupported_confirmed' | 'unsafe_control'
export type PipelineStage = 'repository_file_bytes' | 'browser_file_bytes' | 'decoded_uploaded_text' | 'pasted_browser_text' | 'server_received_input' | 'stored_raw_source' | 'canonical_unicode' | 'normalised_text' | 'moderation_draft' | 'approved_payload' | 'gallery_payload' | 'clipboard_payload'
export type PreservationOperation = { id: string; kind: string; beforeHash: string; afterHash: string; additions: string[]; removals: string[]; replacements: Array<{ before: string; after: string }>; whitespaceChanges: string[]; lineEndingChanges: string[]; responsible: string; userApproved: boolean }

export function fingerprint(value: string | Uint8Array): string { const text = typeof value === 'string' ? value : new TextDecoder().decode(value); let hash = 2166136261; for (const glyph of text) { hash ^= glyph.codePointAt(0)!; hash = Math.imul(hash, 16777619) } return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}` }
export function codePoints(value: string): string[] { return Array.from(value) }
export function graphemes(value: string): string[] {
  const Segmenter = (Intl as typeof Intl & { Segmenter?: new (locale?: string | string[], options?: { granularity: 'grapheme' }) => { segment(input: string): Iterable<{ segment: string }> } }).Segmenter
  const visible = value.replace(/\r\n?/g, '')
  return typeof Segmenter === 'function' ? Array.from(new Segmenter(undefined, { granularity: 'grapheme' }).segment(visible), item => item.segment) : Array.from(visible)
}
export function lineEnding(value: string): 'crlf' | 'lf' | 'mixed' | 'none' { const crlf = (value.match(/\r\n/g) ?? []).length; const lf = (value.replace(/\r\n/g, '').match(/\n/g) ?? []).length; return crlf && lf ? 'mixed' : crlf ? 'crlf' : lf ? 'lf' : 'none' }
export function canonicalUnicode(value: string): string { return value }
export function restoreOriginal(rawSource: string): { text: string; hash: string; equal: boolean } { return { text: rawSource, hash: fingerprint(rawSource), equal: true } }

function isUnsafeControl(glyph: string): boolean { const point = glyph.codePointAt(0) ?? -1; return (point >= 0 && point <= 8) || point === 11 || point === 12 || (point >= 14 && point <= 31) || point === 127 }
export function classifyCharacter(glyph: string, fixtureEvidence = false): CompatibilityClassification {
  if (isUnsafeControl(glyph)) return 'unsafe_control'
  if (fixtureEvidence) return 'verified_in_specific_context'
  if (glyph === '\u3000' || /[\uFF00-\uFFEF]/u.test(glyph) || /\p{Extended_Pictographic}/u.test(glyph)) return 'width_uncertain'
  if (glyph.codePointAt(0)! > 0x7f) return 'unverified'
  return 'likely_compatible'
}
export function preservationDiff(before: string, after: string): Pick<PreservationOperation, 'additions' | 'removals' | 'replacements' | 'whitespaceChanges' | 'lineEndingChanges'> {
  const left = codePoints(before), right = codePoints(after), max = Math.max(left.length, right.length)
  const additions: string[] = [], removals: string[] = [], replacements: Array<{ before: string; after: string }> = []
  for (let i = 0; i < max; i++) { const a = left[i], b = right[i]; if (a === b) continue; if (a === undefined) additions.push(b); else if (b === undefined) removals.push(a); else replacements.push({ before: a, after: b }) }
  const whitespace = (value: string) => /\s|\u3000/u.test(value)
  return { additions, removals, replacements, whitespaceChanges: [...removals.filter(whitespace).map(v => `removed ${JSON.stringify(v)}`), ...additions.filter(whitespace).map(v => `added ${JSON.stringify(v)}`), ...replacements.filter(v => whitespace(v.before) || whitespace(v.after)).map(v => `replaced ${JSON.stringify(v.before)} with ${JSON.stringify(v.after)}`)], lineEndingChanges: lineEnding(before) === lineEnding(after) ? [] : [`${lineEnding(before)} -> ${lineEnding(after)}`] }
}
export function auditTransition(id: string, from: string, to: string, responsible: string, userApproved = false): PreservationOperation {
  const delta = preservationDiff(from, to)
  return { id, kind: 'text-transition', beforeHash: fingerprint(from), afterHash: fingerprint(to), ...delta, responsible, userApproved }
}
export function suggestedRepair(value: string): { text: string; changed: boolean; reason: string } { return { text: value, changed: false, reason: 'Preservation-first default: warnings are non-mutating suggestions.' } }
