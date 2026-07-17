export function StatusBadge({ status }: { status: string }) {
  const label = status.replaceAll("_", " ")
  return <span className={`player-status player-status--${status}`}><span aria-hidden="true">●</span> {label}</span>
}
