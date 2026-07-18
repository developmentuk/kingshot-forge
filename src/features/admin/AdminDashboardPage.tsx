import { Link } from 'react-router-dom'
import { adminDatasets } from './adminDatasets'
import { useRole } from '../../context/RoleContext'

export function AdminDashboardPage() {
  const { role, canEditRecords, canPublish, hasPermission } = useRole()

  const browserReadyDatasets = adminDatasets.filter(
    (dataset) => dataset.capabilities.browsing,
  ).length

  const editorReadyDatasets = adminDatasets.filter(
    (dataset) => dataset.capabilities.editing,
  ).length

  const notAuditedCapabilities = adminDatasets.reduce(
    (total, dataset) =>
      total + dataset.readinessScore.notAudited,
    0,
  )

  return (
    <main className="admin-page">
      <section className="admin-dashboard-hero">
        <div>
          <p className="admin-page__eyebrow">Forge Admin CMS</p>
          <h1>Dashboard</h1>
          <p className="admin-page__intro">
            Monitor Kingshot datasets, feedback, imports, publishing and platform
            health from one place.
          </p>
        </div>
        <div className="admin-dashboard-role">
          <span>Signed-in role</span>
          <strong>{role.replaceAll('_', ' ')}</strong>
        </div>
      </section>

      <section className="admin-dashboard-stats">
        <article><span>Total datasets</span><strong>{adminDatasets.length}</strong></article>
        <article><span>Browser ready</span><strong>{browserReadyDatasets}</strong></article>
        <article><span>Editor ready</span><strong>{editorReadyDatasets}</strong></article>
        <article><span>Not audited</span><strong>{notAuditedCapabilities}</strong></article>
      </section>

      <section className="admin-dashboard-grid">
        <article className="admin-dashboard-card">
          <span className="admin-dashboard-card__icon">🗄️</span>
          <div>
            <h2>Datasets</h2>
            <p>Browse every registered dataset and inspect its evidence-backed readiness.</p>
          </div>
          <Link to="/admin/datasets" className="button button--primary">Open datasets</Link>
        </article>

        {hasPermission('moderation.manage') && <article className="admin-dashboard-card">
          <span className="admin-dashboard-card__icon">🎨</span>
          <div><h2>Community Art</h2><p>Review attribution, test text artwork and manage the approved public gallery.</p></div>
          <Link to="/admin/community-art" className="button button--primary">Open art queue</Link>
        </article>}

        <article className="admin-dashboard-card">
          <span className="admin-dashboard-card__icon">🧭</span>
          <div>
            <h2>Verification Centre</h2>
            <p>Review dataset evidence, blockers, environment safety and readiness without hiding untested states.</p>
          </div>
          <Link to="/admin/verification" className="button button--primary">Open verification</Link>
        </article>

        <article className="admin-dashboard-card">
          <span className="admin-dashboard-card__icon">💬</span>
          <div>
            <h2>Feedback Queue</h2>
            <p>Review player reports, prioritise content updates and record resolutions.</p>
          </div>
          <Link to="/admin/feedback" className="button button--primary">Open feedback</Link>
        </article>

        <article className="admin-dashboard-card">
          <span className="admin-dashboard-card__icon">📥</span>
          <div>
            <h2>Import Manager</h2>
            <p>Refresh remote sources and review import results.</p>
          </div>
          <span className="admin-dashboard-card__restricted">Not yet implemented</span>
        </article>

        <article className="admin-dashboard-card">
          <span className="admin-dashboard-card__icon">⚙️</span>
          <div>
            <h2>Data Engine</h2>
            <p>Check dataset availability, update times and loading errors.</p>
          </div>
          <Link to="/admin/data-engine" className="button button--secondary">View diagnostics</Link>
        </article>

        <article className="admin-dashboard-card">
          <span className="admin-dashboard-card__icon">🚀</span>
          <div>
            <h2>Publish Centre</h2>
            <p>Validate and publish approved dataset changes.</p>
          </div>
          <span className="admin-dashboard-card__restricted">Available per supported dataset</span>
        </article>
      </section>

      <section className="admin-dashboard-access">
        <div><span>Record editing</span><strong>{canEditRecords ? 'Available' : 'Read only'}</strong></div>
        <div><span>Publishing</span><strong>{canPublish ? 'Available' : 'Restricted'}</strong></div>
        <div>
          <span>Import tools</span>
          <strong>{hasPermission('cms.import.run') ? 'Available' : 'Restricted'}</strong>
        </div>
      </section>
    </main>
  )
}
