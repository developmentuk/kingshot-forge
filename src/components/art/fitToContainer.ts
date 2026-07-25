export function calculateResponsiveScale(availableWidth: number, renderedWidth: number) {
  if (availableWidth <= 0 || renderedWidth <= availableWidth) return 1
  return availableWidth / renderedWidth
}

export function calculateResponsiveLayout(availableWidth: number, naturalWidth: number, naturalHeight: number) {
  const scale = calculateResponsiveScale(availableWidth, naturalWidth)
  const scaledWidth = naturalWidth * scale
  const scaledHeight = naturalHeight * scale
  return {
    availableWidth,
    naturalWidth,
    naturalHeight,
    scale,
    scaledWidth,
    scaledHeight,
    offsetLeft: Math.max(0, (availableWidth - scaledWidth) / 2),
  }
}
