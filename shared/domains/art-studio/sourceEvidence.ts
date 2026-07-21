export type IngestionMode = 'file_upload' | 'text_paste' | 'manual_entry' | 'legacy_import'
export type DetectedLineEnding = 'crlf' | 'lf' | 'mixed' | 'none'

export type SourceEvidenceSummary = {
  byteLength: number
  lineEnding: DetectedLineEnding
  crlfCount: number
  lfCount: number
  trailingNewline: boolean
  bomPresent: boolean
}

export function inspectSourceText(value: string, bytes?: Uint8Array): SourceEvidenceSummary {
  const crlfCount = (value.match(/\r\n/g) ?? []).length
  const lfCount = (value.replace(/\r\n/g, '').match(/\n/g) ?? []).length
  return { byteLength: bytes?.byteLength ?? new TextEncoder().encode(value).byteLength, lineEnding: crlfCount && lfCount ? 'mixed' : crlfCount ? 'crlf' : lfCount ? 'lf' : 'none', crlfCount, lfCount, trailingNewline: /(?:\r\n|\r|\n)$/.test(value), bomPresent: bytes ? bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf : value.startsWith('\uFEFF') }
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let index = 0; index < bytes.length; index += 0x8000) binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000))
  return btoa(binary)
}

export async function sha256Bytes(bytes: Uint8Array): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes as BufferSource)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}
