export function calculateResponsiveScale(availableWidth: number, renderedWidth: number) {
  if (availableWidth <= 0 || renderedWidth <= availableWidth) return 1
  return availableWidth / renderedWidth
}
