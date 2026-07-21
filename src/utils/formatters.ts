const numberFormatter = new Intl.NumberFormat('en-GB')

export function formatNumber(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  const numeric = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numeric) ? numberFormatter.format(numeric) : String(value)
}

export function formatDuration(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  const seconds = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(seconds) || seconds < 0) return '—'
  if (seconds === 0) return '0s'
  const units: Array<[string, number]> = [['d', 86400], ['h', 3600], ['m', 60], ['s', 1]]
  let remaining = Math.floor(seconds)
  const parts: string[] = []
  for (const [label, size] of units) {
    const amount = Math.floor(remaining / size)
    if (amount > 0 || (label === 's' && parts.length === 0)) parts.push(`${amount}${label}`)
    remaining %= size
  }
  return parts.join(' ')
}

export function formatPercent(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  const numeric = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numeric) ? `${numeric}%` : '—'
}
