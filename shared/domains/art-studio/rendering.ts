export type CompatibilityStatus = 'verified_safe' | 'likely_safe' | 'width_unstable' | 'unsupported' | 'invisible_control' | 'emoji_supported' | 'emoji_risk' | 'unknown'
export type RepairKind = 'line-endings' | 'tabs' | 'duplicate-invisible' | 'known-punctuation' | 'manual-edit'
export type RepairOperation = { kind: RepairKind; line: number | null; before: string; after: string; reason: string }
export type RenderProfile = {
  id: string
  version: number
  label: string
  fontFamily: string
  widthMultipliers: { half: number; full: number; ambiguous: number; emoji: number; combining: number; tab: number }
  maximumSafeLineWidth: number
  emojiBehaviour: 'single-cell' | 'double-cell' | 'risk'
  unsupportedCharacterHandling: 'flag' | 'replace'
  trimBehaviour: 'preserve' | 'trim-trailing'
  preserveLeadingSpaces: boolean
  preserveTrailingSpaces: boolean
  lineBreakBehaviour: 'lf'
  /** ART-003: context-specific measurements stay in the prediction profile. */
  perCharacterWidthOverrides: Record<string, number>
  characterWidthOverrides?: Record<string, number>
  emojiWidthOverrides: Record<string, number>
  ideographicSpaceWidth: number
  fullWidthPunctuationWidth: number
  lineHeight: number
  baseline: number
  leadingSpaceBehaviour: 'preserve' | 'trim'
  trailingSpaceBehaviour: 'preserve' | 'trim'
}

export type RenderContext = 'kingshot-chat' | 'kingshot-alliance-chat' | 'kingshot-mail'
export type LineAnchor = { line: number; left: number; right: number; top?: number; bottom?: number; baseline?: number }
export type LineDrift = LineAnchor & { predictedLeft: number; predictedRight: number; predictedWidth: number; actualWidth: number; leftDrift: number; rightDrift: number; widthDrift: number; baselineDrift: number | null; lineHeightDrift: number | null }

const profileOptions = (input: Partial<RenderProfile> = {}): Omit<RenderProfile, 'id' | 'version' | 'label' | 'fontFamily' | 'widthMultipliers' | 'maximumSafeLineWidth' | 'emojiBehaviour' | 'unsupportedCharacterHandling' | 'trimBehaviour' | 'preserveLeadingSpaces' | 'preserveTrailingSpaces' | 'lineBreakBehaviour'> => ({
  perCharacterWidthOverrides: {}, characterWidthOverrides: {}, emojiWidthOverrides: {}, ideographicSpaceWidth: 2, fullWidthPunctuationWidth: 2,
  lineHeight: 1.08, baseline: 0, leadingSpaceBehaviour: 'preserve', trailingSpaceBehaviour: 'preserve',
  ...input,
})

export const RENDER_PROFILES: Record<string, RenderProfile> = {
  desktop: { id: 'desktop', version: 1, label: 'Desktop', fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace', widthMultipliers: { half: 1, full: 2, ambiguous: 1, emoji: 2, combining: 0, tab: 4 }, maximumSafeLineWidth: 80, emojiBehaviour: 'double-cell', unsupportedCharacterHandling: 'flag', trimBehaviour: 'preserve', preserveLeadingSpaces: true, preserveTrailingSpaces: true, lineBreakBehaviour: 'lf', ...profileOptions() },
  'forge-browser': { id: 'forge-browser', version: 1, label: 'Forge Browser', fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace', widthMultipliers: { half: 1, full: 2, ambiguous: 1, emoji: 2, combining: 0, tab: 4 }, maximumSafeLineWidth: 52, emojiBehaviour: 'double-cell', unsupportedCharacterHandling: 'flag', trimBehaviour: 'preserve', preserveLeadingSpaces: true, preserveTrailingSpaces: true, lineBreakBehaviour: 'lf', ...profileOptions() },
  'kingshot-chat': { id: 'kingshot-chat', version: 2, label: 'Kingshot Chat', fontFamily: 'Kingshot chat approximation', widthMultipliers: { half: 1, full: 2, ambiguous: 2, emoji: 2, combining: 0, tab: 4 }, maximumSafeLineWidth: 42, emojiBehaviour: 'risk', unsupportedCharacterHandling: 'flag', trimBehaviour: 'preserve', preserveLeadingSpaces: true, preserveTrailingSpaces: true, lineBreakBehaviour: 'lf', ...profileOptions({ ideographicSpaceWidth: 2.02, fullWidthPunctuationWidth: 1.94, lineHeight: 1.12, baseline: 1 }) },
  'kingshot-mail': { id: 'kingshot-mail', version: 2, label: 'Kingshot Mail', fontFamily: 'Kingshot mail approximation', widthMultipliers: { half: 1, full: 2, ambiguous: 2, emoji: 2, combining: 0, tab: 4 }, maximumSafeLineWidth: 50, emojiBehaviour: 'risk', unsupportedCharacterHandling: 'flag', trimBehaviour: 'preserve', preserveLeadingSpaces: true, preserveTrailingSpaces: true, lineBreakBehaviour: 'lf', ...profileOptions({ ideographicSpaceWidth: 2, fullWidthPunctuationWidth: 1.98, lineHeight: 1.1, baseline: 1 }) },
  'kingshot-alliance-chat': { id: 'kingshot-alliance-chat', version: 2, label: 'Kingshot Alliance Chat', fontFamily: 'Kingshot alliance approximation', widthMultipliers: { half: 1, full: 2, ambiguous: 2, emoji: 2, combining: 0, tab: 4 }, maximumSafeLineWidth: 46, emojiBehaviour: 'risk', unsupportedCharacterHandling: 'flag', trimBehaviour: 'preserve', preserveLeadingSpaces: true, preserveTrailingSpaces: true, lineBreakBehaviour: 'lf', ...profileOptions({ ideographicSpaceWidth: 2.01, fullWidthPunctuationWidth: 1.96, lineHeight: 1.11, baseline: 1 }) },
  'browser-forge-preview': { id: 'browser-forge-preview', version: 1, label: 'Browser Forge preview', fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace', widthMultipliers: { half: 1, full: 2, ambiguous: 1, emoji: 2, combining: 0, tab: 4 }, maximumSafeLineWidth: 52, emojiBehaviour: 'double-cell', unsupportedCharacterHandling: 'flag', trimBehaviour: 'preserve', preserveLeadingSpaces: true, preserveTrailingSpaces: true, lineBreakBehaviour: 'lf', ...profileOptions() },
  'kingshot-chat-bubble': { id: 'kingshot-chat-bubble', version: 2, label: 'Kingshot chat bubble', fontFamily: 'Kingshot chat approximation', widthMultipliers: { half: 1, full: 2, ambiguous: 2, emoji: 2, combining: 0, tab: 4 }, maximumSafeLineWidth: 42, emojiBehaviour: 'risk', unsupportedCharacterHandling: 'flag', trimBehaviour: 'preserve', preserveLeadingSpaces: true, preserveTrailingSpaces: true, lineBreakBehaviour: 'lf', ...profileOptions({ ideographicSpaceWidth: 2.02, fullWidthPunctuationWidth: 1.94, lineHeight: 1.12, baseline: 1 }) },
  'kingshot-alliance-message': { id: 'kingshot-alliance-message', version: 2, label: 'Kingshot alliance message', fontFamily: 'Kingshot alliance approximation', widthMultipliers: { half: 1, full: 2, ambiguous: 2, emoji: 2, combining: 0, tab: 4 }, maximumSafeLineWidth: 46, emojiBehaviour: 'risk', unsupportedCharacterHandling: 'flag', trimBehaviour: 'preserve', preserveLeadingSpaces: true, preserveTrailingSpaces: true, lineBreakBehaviour: 'lf', ...profileOptions({ ideographicSpaceWidth: 2.01, fullWidthPunctuationWidth: 1.96, lineHeight: 1.11, baseline: 1 }) },
  'kingshot-name-banner': { id: 'kingshot-name-banner', version: 1, label: 'Kingshot name/banner', fontFamily: 'Kingshot banner approximation', widthMultipliers: { half: 1, full: 2, ambiguous: 2, emoji: 2, combining: 0, tab: 4 }, maximumSafeLineWidth: 24, emojiBehaviour: 'risk', unsupportedCharacterHandling: 'flag', trimBehaviour: 'trim-trailing', preserveLeadingSpaces: true, preserveTrailingSpaces: false, lineBreakBehaviour: 'lf', ...profileOptions({ trailingSpaceBehaviour: 'trim' }) },
}

export type CharacterDiagnostic = { character: string; codePoint: string; name: string; block: string; grapheme: string; widthClass: 'half' | 'full' | 'ambiguous' | 'combining' | 'zero' | 'control'; browserWidth: number; kingshotWidth: number; status: CompatibilityStatus; risk: 'none' | 'low' | 'medium' | 'high'; replacementCandidates: string[] }
export type LineDiagnostic = { line: number; source: string; graphemes: number; estimatedWidth: number; overflow: number; characters: CharacterDiagnostic[]; warnings: string[] }
export type TextDiagnostics = { source: string; lineCount: number; codePointCount: number; graphemeCount: number; utf16Length: number; ordinarySpaces: number; nonBreakingSpaces: number; ideographicSpaces: number; tabs: number; combiningMarks: number; emoji: number; unsupportedCharacters: number; invisibleCharacters: number; longestLine: number; maximumOverflow: number; score: number; lines: LineDiagnostic[]; warnings: string[] }

const EMOJI = /\p{Extended_Pictographic}/u
const INVISIBLE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u00AD\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF]/u
const FULL = /[\u1100-\u115F\u2329\u232A\u2E80-\u303E\u3040-\uA4CF\uAC00-\uD7A3\uF900-\uFAFF\uFE10-\uFE19\uFE30-\uFE6F\uFF00-\uFF60\uFFE0-\uFFE6]/u
const AMBIGUOUS = /[\u00A1\u00A4\u00A7\u00A8\u00AA\u00AD\u00AE\u00B0\u00B1\u00B2\u00B3\u00B4\u00B6\u00B7\u00B8\u00B9\u00BA\u00BC-\u00BE\u00C6\u00D0\u00D7\u00D8\u00DE\u00DF\u00E0\u00E6\u00E8\u00F0\u00F7\u00F8\u00FE]/u
const PUNCTUATION_REPLACEMENTS: Record<string, string> = { '，': ',', '！': '!', '？': '?', '：': ':', '；': ';', '（': '(', '）': ')', '【': '[', '】': ']', '“': '"', '”': '"', '‘': "'", '’': "'" }

function codePoint(value: string) { return `U+${value.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')}` }
function unicodeName(value: string) { return value === ' ' ? 'SPACE' : value === '\u3000' ? 'IDEOGRAPHIC SPACE' : value === '\n' ? 'LINE FEED' : value === '\t' ? 'CHARACTER TABULATION' : EMOJI.test(value) ? 'EMOJI / EXTENDED PICTOGRAPHIC' : `UNICODE CHARACTER ${codePoint(value)}` }
function block(value: string) { const point = value.codePointAt(0)!; if (point <= 0x7f) return 'Basic Latin'; if (point >= 0xff00) return 'Halfwidth and Fullwidth Forms'; if (point >= 0x4e00 && point <= 0x9fff) return 'CJK Unified Ideographs'; if (point >= 0x300 && point <= 0x36f) return 'Combining Diacritical Marks'; return 'Other Unicode' }
function widthForGlyph(glyph: string, profile: RenderProfile): number {
  if (profile.perCharacterWidthOverrides[glyph] !== undefined) return profile.perCharacterWidthOverrides[glyph]
  if (profile.characterWidthOverrides?.[glyph] !== undefined) return profile.characterWidthOverrides[glyph]
  if (profile.emojiWidthOverrides[glyph] !== undefined) return profile.emojiWidthOverrides[glyph]
  if (glyph === '\u3000') return profile.ideographicSpaceWidth
  if (/^[，！？？：；（）【】“”‘’]$/u.test(glyph)) return profile.fullWidthPunctuationWidth
  const widthClass = FULL.test(glyph) ? 'full' : AMBIGUOUS.test(glyph) ? 'ambiguous' : 'half'
  return profile.widthMultipliers[widthClass]
}
export function getRenderGlyphWidth(glyph: string, profile: RenderProfile): number { return widthForGlyph(glyph, profile) }
function diagnosticsFor(glyph: string, profile: RenderProfile): CharacterDiagnostic {
  const point = glyph.codePointAt(0)!
  const combining = /\p{Mark}/u.test(glyph)
  const control = INVISIBLE.test(glyph)
  const emoji = EMOJI.test(glyph)
  const widthClass = control ? 'control' : combining ? 'combining' : glyph === '\u200B' ? 'zero' : FULL.test(glyph) || glyph === '\u3000' ? 'full' : AMBIGUOUS.test(glyph) ? 'ambiguous' : 'half'
  const browserWidth = widthClass === 'full' ? 2 : widthClass === 'combining' || widthClass === 'zero' ? 0 : emoji ? 2 : 1
  const kingshotWidth = widthClass === 'combining' || widthClass === 'zero' ? 0 : widthForGlyph(glyph, profile)
  const status: CompatibilityStatus = control ? 'invisible_control' : emoji ? profile.emojiBehaviour === 'risk' ? 'emoji_risk' : 'emoji_supported' : PUNCTUATION_REPLACEMENTS[glyph] ? 'width_unstable' : widthClass === 'ambiguous' ? 'width_unstable' : point > 0x7f && widthClass === 'half' ? 'unknown' : 'verified_safe'
  return { character: glyph, codePoint: codePoint(glyph), name: unicodeName(glyph), block: block(glyph), grapheme: glyph, widthClass, browserWidth, kingshotWidth, status, risk: control ? 'high' : status === 'width_unstable' || status === 'emoji_risk' ? 'medium' : status === 'unknown' ? 'low' : 'none', replacementCandidates: PUNCTUATION_REPLACEMENTS[glyph] ? [PUNCTUATION_REPLACEMENTS[glyph]] : [] }
}

function graphemes(value: string): string[] {
  const IntlWithSegmenter = Intl as typeof Intl & { Segmenter?: new (locale?: string | string[], options?: { granularity: 'grapheme' }) => { segment(input: string): Iterable<{ segment: string }> } }
  return typeof IntlWithSegmenter.Segmenter === 'function' ? Array.from(new IntlWithSegmenter.Segmenter(undefined, { granularity: 'grapheme' }).segment(value), (item) => item.segment) : Array.from(value)
}
export function analyseText(value: string, profile: RenderProfile = RENDER_PROFILES['kingshot-chat-bubble']): TextDiagnostics {
  const lines = value.replace(/\r\n?/g, '\n').split('\n')
  const lineDiagnostics = lines.map((source, index) => { const chars = graphemes(source).map((glyph) => diagnosticsFor(glyph, profile)); const estimatedWidth = chars.reduce((sum, item) => sum + item.kingshotWidth, 0); const overflow = Math.max(0, estimatedWidth - profile.maximumSafeLineWidth); const warnings = [...new Set(chars.filter((item) => item.status !== 'verified_safe').map((item) => `${item.codePoint} ${item.status.replaceAll('_', ' ')}`))]; if (overflow) warnings.push(`predicted overflow: ${overflow} cells`); return { line: index + 1, source, graphemes: chars.length, estimatedWidth, overflow, characters: chars, warnings } })
  const all = lineDiagnostics.flatMap((line) => line.characters)
  const risky = all.filter((item) => item.status !== 'verified_safe' && item.status !== 'likely_safe')
  return { source: value, lineCount: lines.length, codePointCount: Array.from(value).length, graphemeCount: all.length, utf16Length: value.length, ordinarySpaces: (value.match(/ /g) ?? []).length, nonBreakingSpaces: (value.match(/\u00A0/g) ?? []).length, ideographicSpaces: (value.match(/\u3000/g) ?? []).length, tabs: (value.match(/\t/g) ?? []).length, combiningMarks: all.filter((item) => item.widthClass === 'combining').length, emoji: all.filter((item) => item.status === 'emoji_supported' || item.status === 'emoji_risk').length, unsupportedCharacters: all.filter((item) => item.status === 'unsupported').length, invisibleCharacters: all.filter((item) => item.status === 'invisible_control').length, longestLine: Math.max(...lineDiagnostics.map((line) => line.estimatedWidth), 0), maximumOverflow: Math.max(...lineDiagnostics.map((line) => line.overflow), 0), score: Math.max(0, Math.min(100, 100 - risky.length * 4 - Math.max(...lineDiagnostics.map((line) => line.overflow), 0))), lines: lineDiagnostics, warnings: [...new Set(lineDiagnostics.flatMap((line) => line.warnings))] }
}

/** Compare manually marked screenshot anchors with the current prediction. Pixel scale is explicit so screenshot/browser scaling is not hidden. */
export function measureRenderDrift(value: string, profile: RenderProfile, anchors: LineAnchor[], options: { cellWidth?: number; predictedLeft?: number; predictedTop?: number; screenshotScale?: number } = {}): LineDrift[] {
  const cellWidth = options.cellWidth ?? 10
  const scale = options.screenshotScale ?? 1
  const predictedLeft = options.predictedLeft ?? 0
  const diagnostics = analyseText(value, profile)
  return anchors.map((anchor) => {
    const line = diagnostics.lines[anchor.line - 1]
    const leading = line?.characters.slice(0, line.characters.findIndex((item) => item.character.trim() !== '') < 0 ? line.characters.length : line.characters.findIndex((item) => item.character.trim() !== '')).reduce((sum, item) => sum + item.kingshotWidth, 0) ?? 0
    const lineLeft = predictedLeft + leading * cellWidth * scale
    const predictedWidth = Math.max(0, (line?.estimatedWidth ?? 0) - leading) * cellWidth * scale
    const predictedRight = lineLeft + predictedWidth
    const actualWidth = anchor.right - anchor.left
    const predictedTop = options.predictedTop ?? ((anchors[0]?.baseline ?? 0) - profile.baseline)
    const predictedBaseline = predictedTop + (line?.line ? (line.line - 1) * profile.lineHeight * cellWidth : 0) + profile.baseline
    const previousBaseline = anchors[anchor.line - 2]?.baseline
    return { ...anchor, predictedLeft: lineLeft, predictedRight, predictedWidth, actualWidth, leftDrift: lineLeft - anchor.left, rightDrift: predictedRight - anchor.right, widthDrift: predictedWidth - actualWidth, baselineDrift: anchor.baseline === undefined ? null : predictedBaseline - anchor.baseline, lineHeightDrift: anchor.line > 1 && previousBaseline !== undefined && anchor.baseline !== undefined ? (anchor.baseline - previousBaseline) - profile.lineHeight * cellWidth : null }
  })
}

export function summariseRenderDrift(drifts: LineDrift[]) {
  const average = (field: keyof LineDrift) => { const values = drifts.map((item) => item[field]).filter((value): value is number => typeof value === 'number'); return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null }
  return { lineCount: drifts.length, maxAbsLeftDrift: Math.max(0, ...drifts.map((item) => Math.abs(item.leftDrift))), maxAbsWidthDrift: Math.max(0, ...drifts.map((item) => Math.abs(item.widthDrift))), meanLeftDrift: average('leftDrift'), meanWidthDrift: average('widthDrift'), meanBaselineDrift: average('baselineDrift') }
}

export function repairText(value: string, profile: RenderProfile = RENDER_PROFILES['kingshot-chat-bubble']): { text: string; operations: RepairOperation[] } {
  const operations: RepairOperation[] = []; let text = value
  if (/\r\n?|\r/.test(text)) { const after = text.replace(/\r\n?/g, '\n'); operations.push({ kind: 'line-endings', line: null, before: 'CRLF/CR', after: 'LF', reason: 'Deterministic clipboard line endings' }); text = after }
  const lines = text.split('\n').map((line, index) => { if (!line.includes('\t')) return line; const after = line.replace(/\t/g, ' '.repeat(profile.widthMultipliers.tab)); operations.push({ kind: 'tabs', line: index + 1, before: line, after, reason: `Tabs use ${profile.widthMultipliers.tab} configured cells` }); return after })
  text = lines.join('\n')
  for (const [before, after] of Object.entries(PUNCTUATION_REPLACEMENTS)) if (text.includes(before)) { text = text.split(before).join(after); operations.push({ kind: 'known-punctuation', line: null, before, after, reason: 'Known width-unstable punctuation replacement; review before approval' }) }
  return { text, operations }
}

export function reverseRepairs(value: string, operations: RepairOperation[]): string {
  return [...operations].reverse().reduce((current, operation) => {
    if (operation.line === null) return current.split(operation.after).join(operation.before)
    const lines = current.split('\n'); const index = operation.line - 1
    if (lines[index] === operation.after) lines[index] = operation.before
    return lines.join('\n')
  }, value)
}

export function hashText(value: string): string {
  // Stable, dependency-free fingerprint for UI/API comparison. Server persistence
  // may additionally store a cryptographic digest when it owns the write.
  let hash = 2166136261
  for (const character of value) { hash ^= character.codePointAt(0)!; hash = Math.imul(hash, 16777619) }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}`
}
export async function sha256Text(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value)
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}
export function copyApprovedPayload(value: string): Promise<void> { if (typeof navigator === 'undefined' || !navigator.clipboard) return Promise.reject(new Error('Clipboard is unavailable.')); return navigator.clipboard.writeText(value) }
