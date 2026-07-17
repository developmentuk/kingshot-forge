import { useEffect, useRef } from "react"

export function ApprovalDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    previousFocusRef.current = document.activeElement as HTMLElement | null
    const dialog = dialogRef.current
    dialog?.querySelector<HTMLElement>("button, input, textarea")?.focus()
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") { event.preventDefault(); onClose(); return }
      if (event.key !== "Tab" || !dialog) return
      const focusable = [...dialog.querySelectorAll<HTMLElement>("button, input, textarea, [tabindex]:not([tabindex='-1'])")].filter((element) => !element.hasAttribute("disabled"))
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable.at(-1)!
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      previousFocusRef.current?.focus()
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="player-dialog-backdrop" role="presentation">
      <div ref={dialogRef} className="player-dialog" role="dialog" aria-modal="true" aria-labelledby="approval-title" aria-describedby="approval-description">
        <p className="player-identity__eyebrow">Contract-only action</p><h2 id="approval-title">Request four-eyes approval</h2>
        <p id="approval-description">A second, distinct authorised actor must approve this high-risk operation before execution.</p>
        <label className="player-identity__field">Reason<textarea rows={4} minLength={8} /></label>
        <label className="player-identity__field">Scope<input value="disputed-link restoration" readOnly /></label>
        <p className="player-identity__hint">No production action will run. Approval execution and persistence are disabled.</p>
        <div className="player-dialog__actions"><button type="button" className="player-identity__button player-identity__button--quiet" onClick={onClose}>Cancel</button><button type="button" className="player-identity__button" onClick={onClose}>Record request</button></div>
      </div>
    </div>
  )
}
