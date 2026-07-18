export function normaliseArtwork(value: string): string {
  return value.replace(/\r\n?/g, '\n').replace(/\t/g, '    ')
}

export function segmentGraphemes(value: string): string[] {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
    return Array.from(segmenter.segment(value), (item) => item.segment)
  }
  return Array.from(value)
}

export function parseArtwork(value: string, maxLines?: number): string[] {
  const lines = normaliseArtwork(value).split('\n')
  if (!maxLines || lines.length <= maxLines) return lines
  return [...lines.slice(0, maxLines), '…']
}

