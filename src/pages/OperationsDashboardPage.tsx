import { Link } from 'react-router-dom'

const cards = [
  ['Platform status', 'Release 0.8.0', 'This branch is in development; deployment status is not inferred locally.'],
  ['Content operations', 'Available', 'Dataset catalogue and Verification Centre are implemented; import, publish and history remain partial/planned.'],
  ['Player operations', 'Partial', 'Gift Redemption and Player Identity support exist; safe User Management is planned.'],
  ['Community operations', 'Available', 'Community Art moderation exists behind moderation permission.'],
  ['Security and governance', 'Partial', 'Role-to-capability reads exist; audited role mutation and unified Audit Log are planned.'],
  ['Responsive validation', 'Pending', 'Authenticated desktop, tablet and mobile validation is still required for this release.'],
]

export default function OperationsDashboardPage() {
  return <main className="workspace-home"><header className="workspace-home__header"><p className="eyebrow">Forge Operations Centre</p><h1>Operate the Forge with confidence.</h1><p>Actionable status from implemented platform surfaces, with unknowns called out instead of invented metrics.</p></header><section className="workspace-home__section" aria-labelledby="operations-status"><div className="workspace-home__section-heading"><div><p className="eyebrow">Operational overview</p><h2 id="operations-status">Current release signals</h2></div><span className="status-badge">In development</span></div><div className="workspace-home__grid">{cards.map(([label, value, detail]) => <article className="workspace-home__card" key={label}><span aria-hidden="true">{value === 'Available' ? '●' : value === 'Partial' ? '◐' : '○'}</span><div><h3>{label}</h3><p><strong>{value}</strong> — {detail}</p></div></article>)}</div></section><section className="workspace-home__note"><strong>Next operational priorities</strong><span><Link to="/operations/users">User Management</Link>, role and permission management, unified audit history and authenticated responsive validation.</span></section></main>
}
