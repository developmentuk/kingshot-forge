import { sha256Text } from './rendering'

export type TextPasteProvenance = {
  sha256: string
  byteLength: number
  detectedLineEnding: 'crlf' | 'lf' | 'mixed' | 'none'
  crlfCount: number
  lfCount: number
  trailingNewline: boolean
  bomPresent: boolean
}

export function inspectTextProvenance(value: string): Omit<TextPasteProvenance, 'sha256'> {
  const crlfCount = (value.match(/\r\n/g) ?? []).length
  const lfCount = (value.match(/(?<!\r)\n/g) ?? []).length
  const detectedLineEnding = crlfCount && lfCount ? 'mixed' : crlfCount ? 'crlf' : lfCount ? 'lf' : 'none'
  return {
    byteLength: new TextEncoder().encode(value).byteLength,
    detectedLineEnding,
    crlfCount,
    lfCount,
    trailingNewline: /(?:\r\n|\n)$/.test(value),
    bomPresent: value.charCodeAt(0) === 0xfeff,
  }
}

export async function createTextPasteProvenance(value: string): Promise<TextPasteProvenance> {
  return { sha256: await sha256Text(value), ...inspectTextProvenance(value) }
}
