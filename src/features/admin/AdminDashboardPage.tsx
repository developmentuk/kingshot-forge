import { Link } from 'react-router-dom'
import { adminDatasets } from './adminDatasets'
import { getDatasetStats } from './adminDatasetStats'
import { useRole } from '../../context/RoleContext'

export function AdminDashboardPage() {
  const { role, canEditRecords, canPublish, hasPermission } = useRole()

  const readyDatasets = adminDatasets.filter(
    (dataset) => dataset.status === 'ready',
  ).length

  const pendingDatasets = adminDatasets.filter(
    (dataset) => dataset.status === 'not-imported',
  ).length

  const totalRecords = adminDatasets.reduce((total, dataset) => {
    const records = getDatasetStats(dataset.id).records
    return total + (typeof records === 'number' ? records : 0)
  }, 0)

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
        <article><span>Ready</span><strong>{readyDatasets}</strong></article>
        <article><span>Awaiting import</span><strong>{pendingDatasets}</strong></article>
        <article><span>Known records</span><strong>{totalRecords}</strong></article>
      </section>

      <section className="admin-dashboard-grid">
        <article className="admin-dashboard-card">
          <span className="admin-dashboard-card__icon">🗄️</span>
          <div>
            <h2>Datasets</h2>
            <p>Browse every registered dataset and inspect its records and import status.</p>
          </div>
          <Link to="/admin/datasets" className="button button--primary">Open datasets</Link>
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
          {hasPermission('cms.import.run') ? (
            <Link to="/admin/imports" className="button button--secondary">Open imports</Link>
          ) : (
            <span className="admin-dashboard-card__restricted">Permission required</span>
          )}
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
          {canPublish ? (
            <Link to="/admin/publish" className="button button--secondary">Open publishing</Link>
          ) : (
            <span className="admin-dashboard-card__restricted">Permission required</span>
          )}
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
