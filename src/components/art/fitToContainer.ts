export type ArtworkFitMode = 'width' | 'contain'

export function calculateResponsiveScale(availableWidth: number, renderedWidth: number) {
  if (availableWidth <= 0 || renderedWidth <= 0 || renderedWidth <= availableWidth) return 1
  return availableWidth / renderedWidth
}

export function calculateResponsiveLayout(availableWidth: number, naturalWidth: number, naturalHeight: number, options: { mode?: ArtworkFitMode; availableHeight?: number } = {}) {
  const mode = options.mode ?? 'width'
  const availableHeight = options.availableHeight ?? 0
  const widthScale = calculateResponsiveScale(availableWidth, naturalWidth)
  const heightScale = availableWidth > 0 && availableHeight > 0 && naturalHeight > availableHeight ? availableHeight / naturalHeight : 1
  const scale = mode === 'contain' ? Math.min(1, widthScale, heightScale) : widthScale
  const scaledWidth = naturalWidth * scale
  const scaledHeight = naturalHeight * scale
  return {
    availableWidth,
    availableHeight,
    naturalWidth,
    naturalHeight,
    scale,
    scaledWidth,
    scaledHeight,
    offsetLeft: Math.max(0, (availableWidth - scaledWidth) / 2),
    offsetTop: Math.max(0, (availableHeight - scaledHeight) / 2),
  }
}
