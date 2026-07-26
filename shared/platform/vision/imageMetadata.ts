import { VISION_EVIDENCE_MAX_PIXELS, type VisionEvidenceMimeType } from './evidenceStorageContracts.js'

export interface VerifiedVisionImageMetadata {
  mimeType: VisionEvidenceMimeType
  widthPx: number
  heightPx: number
}

export class VisionImageMetadataError extends Error {
  readonly code: 'unsupported_signature' | 'truncated_image' | 'malformed_image' | 'pixel_limit_exceeded' | 'mime_signature_mismatch'
  constructor(code: VisionImageMetadataError['code'], message: string) { super(message); this.name = 'VisionImageMetadataError'; this.code = code }
}

const PNG_SIGNATURE = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

export function inspectVisionImage(bytes: Uint8Array, declaredMimeType?: VisionEvidenceMimeType): VerifiedVisionImageMetadata {
  if (bytes.byteLength < 12) throw new VisionImageMetadataError('truncated_image', 'Vision evidence image bytes are truncated.')
  const detected = detectImage(bytes)
  if (!detected) throw new VisionImageMetadataError('unsupported_signature', 'Vision evidence image signature is not allowlisted.')
  if (declaredMimeType && detected.mimeType !== declaredMimeType) throw new VisionImageMetadataError('mime_signature_mismatch', 'Vision evidence MIME type does not match its file signature.')
  if (detected.widthPx * detected.heightPx > VISION_EVIDENCE_MAX_PIXELS) throw new VisionImageMetadataError('pixel_limit_exceeded', 'Vision evidence image dimensions exceed the governed pixel limit.')
  return detected
}

function detectImage(bytes: Uint8Array): VerifiedVisionImageMetadata | null {
  if (startsWith(bytes, PNG_SIGNATURE)) return parsePng(bytes)
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return parseJpeg(bytes)
  if (ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 4) === 'WEBP') return parseWebp(bytes)
  if ((bytes[0] === 0x49 && bytes[1] === 0x49) || (bytes[0] === 0x4d && bytes[1] === 0x4d)) return parseTiff(bytes)
  return null
}

function parsePng(bytes: Uint8Array): VerifiedVisionImageMetadata {
  let offset = 8; let width = 0; let height = 0; let ended = false
  while (offset + 12 <= bytes.length) {
    const length = readU32BE(bytes, offset); const type = ascii(bytes, offset + 4, 4); const dataStart = offset + 8; const end = dataStart + length
    if (!Number.isSafeInteger(length) || end + 4 > bytes.length) throw new VisionImageMetadataError('truncated_image', 'PNG chunk exceeds the available bytes.')
    if (type === 'IHDR') {
      if (length !== 13 || width !== 0) throw new VisionImageMetadataError('malformed_image', 'PNG IHDR is malformed.')
      width = readU32BE(bytes, dataStart); height = readU32BE(bytes, dataStart + 4)
    }
    offset = end + 4
    if (type === 'IEND') { ended = true; break }
  }
  if (!ended || width <= 0 || height <= 0) throw new VisionImageMetadataError(ended ? 'malformed_image' : 'truncated_image', 'PNG is missing a complete IHDR/IEND structure.')
  return { mimeType: 'image/png', widthPx: width, heightPx: height }
}

function parseJpeg(bytes: Uint8Array): VerifiedVisionImageMetadata {
  let offset = 2
  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) throw new VisionImageMetadataError('malformed_image', 'JPEG marker is malformed.')
    while (offset < bytes.length && bytes[offset] === 0xff) offset++
    const marker = bytes[offset++]
    if (marker === 0xd9) throw new VisionImageMetadataError('malformed_image', 'JPEG has no image dimensions.')
    if (marker === 0xda) break
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue
    if (offset + 2 > bytes.length) throw new VisionImageMetadataError('truncated_image', 'JPEG segment length is truncated.')
    const segmentLength = readU16BE(bytes, offset)
    if (segmentLength < 2 || offset + segmentLength > bytes.length) throw new VisionImageMetadataError('truncated_image', 'JPEG segment exceeds the available bytes.')
    const isSof = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)
    if (isSof) {
      if (segmentLength < 7) throw new VisionImageMetadataError('malformed_image', 'JPEG frame header is malformed.')
      const height = readU16BE(bytes, offset + 3); const width = readU16BE(bytes, offset + 5)
      if (width <= 0 || height <= 0) throw new VisionImageMetadataError('malformed_image', 'JPEG dimensions are invalid.')
      if (!bytes.includes(0xd9, offset + segmentLength)) throw new VisionImageMetadataError('truncated_image', 'JPEG is missing its end marker.')
      return { mimeType: 'image/jpeg', widthPx: width, heightPx: height }
    }
    offset += segmentLength
  }
  throw new VisionImageMetadataError('truncated_image', 'JPEG is missing a complete frame header.')
}

function parseWebp(bytes: Uint8Array): VerifiedVisionImageMetadata {
  const declaredLength = readU32LE(bytes, 4) + 8
  if (declaredLength > bytes.length) throw new VisionImageMetadataError('truncated_image', 'WebP RIFF payload is truncated.')
  let offset = 12
  while (offset + 8 <= bytes.length) {
    const type = ascii(bytes, offset, 4); const length = readU32LE(bytes, offset + 4); const data = offset + 8
    if (data + length > bytes.length) throw new VisionImageMetadataError('truncated_image', 'WebP chunk exceeds the available bytes.')
    if (type === 'VP8X') {
      if (length < 10) throw new VisionImageMetadataError('malformed_image', 'WebP VP8X header is malformed.')
      return { mimeType: 'image/webp', widthPx: readU24LE(bytes, data + 4) + 1, heightPx: readU24LE(bytes, data + 7) + 1 }
    }
    if (type === 'VP8 ' && length >= 10 && bytes[data + 3] === 0x9d && bytes[data + 4] === 0x01 && bytes[data + 5] === 0x2a) return { mimeType: 'image/webp', widthPx: readU16LE(bytes, data + 6) & 0x3fff, heightPx: readU16LE(bytes, data + 8) & 0x3fff }
    if (type === 'VP8L' && length >= 5 && bytes[data] === 0x2f) return { mimeType: 'image/webp', widthPx: 1 + (((bytes[data + 1] | (bytes[data + 2] << 8)) & 0x3fff)), heightPx: 1 + (((bytes[data + 2] >> 6) | (bytes[data + 3] << 2) | ((bytes[data + 4] & 0x0f) << 10)) & 0x3fff) }
    offset = data + length + (length % 2)
  }
  throw new VisionImageMetadataError('malformed_image', 'WebP has no supported complete dimension header.')
}

function parseTiff(bytes: Uint8Array): VerifiedVisionImageMetadata {
  const little = bytes[0] === 0x49; const read16 = (offset: number) => readU16(bytes, offset, little); const read32 = (offset: number) => readU32(bytes, offset, little)
  if (read16(2) !== 42 || bytes.length < 8) throw new VisionImageMetadataError('malformed_image', 'TIFF header is malformed.')
  const ifd = read32(4); if (ifd < 8 || ifd + 2 > bytes.length) throw new VisionImageMetadataError('truncated_image', 'TIFF IFD is outside the file.')
  const count = read16(ifd); if (ifd + 2 + count * 12 > bytes.length) throw new VisionImageMetadataError('truncated_image', 'TIFF IFD is truncated.')
  let width: number | null = null; let height: number | null = null
  for (let index = 0; index < count; index++) {
    const entry = ifd + 2 + index * 12; const tag = read16(entry); const type = read16(entry + 2); const number = read32(entry + 4); const size = tiffTypeSize(type) * number
    if (!size) throw new VisionImageMetadataError('malformed_image', 'TIFF contains an unsupported field type.')
    const valueOffset = size <= 4 ? entry + 8 : read32(entry + 8)
    if (valueOffset + Math.min(size, 4) > bytes.length) throw new VisionImageMetadataError('truncated_image', 'TIFF field exceeds the available bytes.')
    if ((tag === 256 || tag === 257) && number >= 1) {
      const value = type === 3 ? read16(valueOffset) : type === 4 ? read32(valueOffset) : 0
      if (value > 0) { if (tag === 256) width = value; else height = value }
    }
  }
  if (!width || !height) throw new VisionImageMetadataError('malformed_image', 'TIFF is missing positive dimensions.')
  return { mimeType: 'image/tiff', widthPx: width, heightPx: height }
}

function tiffTypeSize(type: number): number { return ({ 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 6: 1, 7: 1, 8: 2, 9: 4, 10: 8, 11: 4, 12: 8 } as Record<number, number>)[type] ?? 0 }
function startsWith(bytes: Uint8Array, prefix: Uint8Array): boolean { return prefix.every((value, index) => bytes[index] === value) }
function ascii(bytes: Uint8Array, offset: number, length: number): string { return String.fromCharCode(...bytes.subarray(offset, offset + length)) }
function readU16BE(bytes: Uint8Array, offset: number): number { return (bytes[offset] << 8) | bytes[offset + 1] }
function readU32BE(bytes: Uint8Array, offset: number): number { return ((bytes[offset] * 0x1000000) + (bytes[offset + 1] << 16) + (bytes[offset + 2] << 8) + bytes[offset + 3]) >>> 0 }
function readU16LE(bytes: Uint8Array, offset: number): number { return bytes[offset] | (bytes[offset + 1] << 8) }
function readU24LE(bytes: Uint8Array, offset: number): number { return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) }
function readU32LE(bytes: Uint8Array, offset: number): number { return (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0 }
function readU16(bytes: Uint8Array, offset: number, little: boolean): number { return little ? readU16LE(bytes, offset) : readU16BE(bytes, offset) }
function readU32(bytes: Uint8Array, offset: number, little: boolean): number { return little ? readU32LE(bytes, offset) : readU32BE(bytes, offset) }
