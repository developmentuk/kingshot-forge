import { useCallback, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { trackForgePlayerEvent } from "../../platform/analytics/forgeAnalytics"
import { ApprovalDialog } from "./ApprovalDialog"
import { FeatureDisabledNotice } from "./FeatureDisabledNotice"
import { playerIdentityBrowserFlags, syntheticPlayerIdentityPreview } from "./featureFlags"
import { StatusBadge } from "./StatusBadge"

const SYNTHETIC_CASES = [
  { id: "case-link-dispute", title: "Disputed character link", kind: "link dispute", status: "approval_required", age: "18 min" },
  { id: "case-alias-conflict", title: "Public alias collision", kind: "alias conflict", status: "open", age: "42 min" },
  { id: "case-migration", title: "Legacy compatibility issue", kind: "migration compatibility", status: "awaiting_information", age: "1 h" },
] as const

export function PlayerSupportWorkspacePage() {
  const { caseId } = useParams()
  if (!playerIdentityBrowserFlags.ui || !playerIdentityBrowserFlags.supportTools) return <main className="player-identity"><FeatureDisabledNotice area="Player Identity support tools" /></main>
  if (!syntheticPlayerIdentityPreview) return <main className="player-identity"><section className="player-identity__notice" role="alert"><div><p className="player-identity__eyebrow">Capability denied</p><h1>Support workspace unavailable</h1><p>No Player Identity capabilities are granted in this milestone.</p></div></section></main>
  return caseId ? <SupportCaseDetail caseId={caseId} /> : <SupportQueue />
}

function SupportQueue() {
  return (
    <main className="player-identity player-identity--support">
      <header className="player-identity__hero"><p className="player-identity__eyebrow">Forge Admin · synthetic test preview</p><h1>Player Identity support</h1><p>Inspect disputes and compatibility issues without exposing private notes to Player or public projections.</p></header>
      <section className="player-identity__panel"><div className="player-identity__section-heading"><div><p className="player-identity__eyebrow">3 open items</p><h2>Support queue</h2></div><label className="player-identity__field player-identity__field--inline">Filter<select><option>All case types</option><option>Disputes</option><option>Migration issues</option></select></label></div>
        <div className="player-identity__scroll"><table><thead><tr><th>Case</th><th>Type</th><th>Status</th><th>Age</th><th><span className="sr-only">Open</span></th></tr></thead><tbody>{SYNTHETIC_CASES.map((item) => <tr key={item.id}><td><strong>{item.title}</strong></td><td>{item.kind}</td><td><StatusBadge status={item.status} /></td><td>{item.age}</td><td><Link className="player-identity__table-link" to={`/admin/player-identity/${item.id}`} onClick={() => trackForgePlayerEvent("support_case_opened", { case_type: item.kind })}>Inspect<span className="sr-only"> {item.title}</span></Link></td></tr>)}</tbody></table></div>
      </section>
    </main>
  )
}

function SupportCaseDetail({ caseId }: { caseId: string }) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const closeDialog = useCallback(() => setDialogOpen(false), [])
  const supportCase = SYNTHETIC_CASES.find((item) => item.id === caseId)
  if (!supportCase) return <main className="player-identity"><section className="player-identity__notice"><div><h1>Case not found</h1><Link to="/admin/player-identity">Return to support queue</Link></div></section></main>
  return (
    <main className="player-identity player-identity--support">
      <header className="player-identity__hero"><Link className="player-identity__back" to="/admin/player-identity">← Support queue</Link><p className="player-identity__eyebrow">Private support case · synthetic test preview</p><h1>{supportCase.title}</h1><StatusBadge status={supportCase.status} /></header>
      <div className="player-identity__two-column">
        <section className="player-identity__panel"><h2>Safe identity comparison</h2><dl className="player-character-card__facts"><div><dt>Link state</dt><dd>Disputed</dd></div><div><dt>Primary state</dt><dd>Stale</dd></div><div><dt>Verification</dt><dd>Unverified</dd></div><div><dt>Revision</dt><dd>12</dd></div></dl><p className="player-identity__hint">Provider evidence and private reviewer identity are not loaded into this view.</p></section>
        <section className="player-identity__panel"><h2>Contract-only actions</h2><div className="player-support-actions"><button type="button" className="player-identity__button player-identity__button--quiet">Request evidence</button><button type="button" className="player-identity__button player-identity__button--quiet">Annotate privately</button><button type="button" className="player-identity__button" onClick={() => setDialogOpen(true)}>Request restoration approval</button></div><p className="player-identity__hint">Suspend, revoke, restore, limit override, and Primary restoration cannot execute against production persistence.</p></section>
      </div>
      <section className="player-identity__panel"><h2>Immutable decision history</h2><div className="player-identity__scroll"><table><thead><tr><th>Decision</th><th>Actor separation</th><th>Result</th><th>Revision</th></tr></thead><tbody><tr><td>Restoration requested</td><td>Approver required</td><td>Pending</td><td>12</td></tr></tbody></table></div></section>
      <ApprovalDialog open={dialogOpen} onClose={closeDialog} />
    </main>
  )
}
