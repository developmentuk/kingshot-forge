import { segmentGraphemes } from '../parser/index.js'

export type RenderStageId = 'raw-bytes' | 'raw-unicode' | 'canonical-unicode' | 'normalised-unicode' | 'approved-payload' | 'clipboard-payload' | 'browser-preview' | 'kingshot-prediction'
export type TextStatistics = { byteLength: number; utf16Length: number; codePointCount: number; graphemeCount: number; lineCount: number; ordinarySpaces: number; nonBreakingSpaces: number; ideographicSpaces: number; tabs: number; carriageReturns: number; lineFeeds: number; whitespaceCount: number }
export type TextArtifact = { stage: RenderStageId; text: string; bytes: Uint8Array; sha256: string; statistics: TextStatistics }
export type TransformationAudit = { timestamp: string; actor: string; rule: string; beforeHash: string; afterHash: string; reason: string; mode: 'automatic' | 'manual' }
export type PipelineDifference = { index: number; before: string; after: string; beforeCodePoint: string | null; afterCodePoint: string | null }
export type PipelineStep = { stage: TextStage; before: TextArtifact; after: TextArtifact; operations: string[]; codePointDelta: number; graphemeDelta: number; utf16Delta: number; lineDelta: number; differences: PipelineDifference[]; audit: TransformationAudit }
export type TextStage = Exclude<RenderStageId, 'raw-bytes'>

const encoder = new TextEncoder()
const codePoint = (value: string | undefined) => value === undefined ? null : `U+${value.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')}`

export function measureText(text: string): TextStatistics {
  return { byteLength: encoder.encode(text).byteLength, utf16Length: text.length, codePointCount: Array.from(text).length, graphemeCount: segmentGraphemes(text).length, lineCount: text.split(/\r\n|\r|\n/).length, ordinarySpaces: (text.match(/ /g) ?? []).length, nonBreakingSpaces: (text.match(/\u00a0/g) ?? []).length, ideographicSpaces: (text.match(/\u3000/g) ?? []).length, tabs: (text.match(/\t/g) ?? []).length, carriageReturns: (text.match(/\r/g) ?? []).length, lineFeeds: (text.match(/\n/g) ?? []).length, whitespaceCount: (text.match(/\s/gu) ?? []).length }
}

export async function sha256Bytes(bytes: Uint8Array): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes as BufferSource)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function createArtifact(stage: RenderStageId, text: string): Promise<TextArtifact> {
  const bytes = encoder.encode(text)
  return { stage, text, bytes, sha256: await sha256Bytes(bytes), statistics: measureText(text) }
}

export function compareText(before: string, after: string): PipelineDifference[] {
  const left = Array.from(before); const right = Array.from(after); const differences: PipelineDifference[] = []
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) if (left[index] !== right[index]) differences.push({ index, before: left[index] ?? '', after: right[index] ?? '', beforeCodePoint: codePoint(left[index]), afterCodePoint: codePoint(right[index]) })
  return differences
}

export async function inspectTransition(before: TextArtifact, stage: TextStage, afterText: string, operations: string[], reason: string, actor = 'system', mode: TransformationAudit['mode'] = 'automatic'): Promise<PipelineStep> {
  const after = await createArtifact(stage, afterText)
  return { stage, before, after, operations, codePointDelta: after.statistics.codePointCount - before.statistics.codePointCount, graphemeDelta: after.statistics.graphemeCount - before.statistics.graphemeCount, utf16Delta: after.statistics.utf16Length - before.statistics.utf16Length, lineDelta: after.statistics.lineCount - before.statistics.lineCount, differences: compareText(before.text, after.text), audit: { timestamp: new Date().toISOString(), actor, rule: operations.join(', ') || 'identity', beforeHash: before.sha256, afterHash: after.sha256, reason, mode } }
}

export async function inspectPipeline(input: { raw: string; canonical?: string; normalised?: string; approved?: string; clipboard?: string; preview?: string; prediction?: string; actor?: string; reason?: string }): Promise<{ stages: TextArtifact[]; transitions: PipelineStep[] }> {
  const values: Array<[TextStage, string]> = [['raw-unicode', input.raw], ['canonical-unicode', input.canonical ?? input.raw], ['normalised-unicode', input.normalised ?? input.raw], ['approved-payload', input.approved ?? input.normalised ?? input.raw], ['clipboard-payload', input.clipboard ?? input.approved ?? input.normalised ?? input.raw], ['browser-preview', input.preview ?? input.approved ?? input.normalised ?? input.raw], ['kingshot-prediction', input.prediction ?? input.approved ?? input.normalised ?? input.raw]]
  const raw = await createArtifact('raw-bytes', input.raw); const stages: TextArtifact[] = [raw]; const transitions: PipelineStep[] = []; let before = raw
  for (const [stage, text] of values) { const step = await inspectTransition(before, stage, text, before.text === text ? [] : ['text transformation'], input.reason ?? 'Render pipeline transition', input.actor); transitions.push(step); stages.push(step.after); before = step.after }
  return { stages, transitions }
}

export async function copyApprovedPayloadExact(text: string): Promise<{ sha256: string; statistics: TextStatistics }> {
  if (typeof navigator === 'undefined' || !navigator.clipboard) throw new Error('Clipboard is unavailable.')
  const artifact = await createArtifact('approved-payload', text)
  await navigator.clipboard.writeText(text)
  return { sha256: artifact.sha256, statistics: artifact.statistics }
}
