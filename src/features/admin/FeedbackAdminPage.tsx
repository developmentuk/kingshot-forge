import { useEffect, useMemo, useState } from 'react'
import {
  getFeedbackReports,
  updateFeedbackReport,
  type FeedbackPriority,
  type FeedbackReport,
  type FeedbackReportStatus,
} from '../../services/feedbackService'
import './FeedbackAdminPage.css'

const statusOptions: FeedbackReportStatus[] = [
  'new',
  'triaged',
  'in_progress',
  'resolved',
  'closed',
]

const priorityOptions: FeedbackPriority[] = [
  'low',
  'normal',
  'high',
  'urgent',
]

function label(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase())
}

export function FeedbackAdminPage() {
  const [reports, setReports] = useState<FeedbackReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | FeedbackReportStatus>('all')
  const [savingId, setSavingId] = useState<string | null>(null)

  async function loadReports() {
    setLoading(true)
    setError('')

    try {
      setReports(await getFeedbackReports())
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load feedback.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadReports()
  }, [])

  const visibleReports = useMemo(
    () => (filter === 'all' ? reports : reports.filter((report) => report.status === filter)),
    [filter, reports],
  )

  const newCount = reports.filter((report) => report.status === 'new').length
  const activeCount = reports.filter((report) =>
    ['triaged', 'in_progress'].includes(report.status),
  ).length
  const resolvedCount = reports.filter((report) => report.status === 'resolved').length

  async function saveReport(
    report: FeedbackReport,
    updates: Partial<Pick<FeedbackReport, 'status' | 'priority' | 'admin_notes' | 'resolution'>>,
  ) {
    setSavingId(report.id)
    setError('')

    try {
      await updateFeedbackReport(report.id, updates)
      setReports((current) =>
        current.map((item) => (item.id === report.id ? { ...item, ...updates } : item)),
      )
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to update feedback.')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <main className="admin-page feedback-admin-page">
      <section className="admin-dashboard-hero">
        <div>
          <p className="admin-page__eyebrow">Forge feedback</p>
          <h1>Feedback queue</h1>
          <p className="admin-page__intro">
            Review player reports, prioritise updates and record how each issue was resolved.
          </p>
        </div>
        <button type="button" className="button button--secondary" onClick={() => void loadReports()}>
          Refresh
        </button>
      </section>

      <section className="admin-dashboard-stats">
        <article><span>All reports</span><strong>{reports.length}</strong></article>
        <article><span>New</span><strong>{newCount}</strong></article>
        <article><span>Active</span><strong>{activeCount}</strong></article>
        <article><span>Resolved</span><strong>{resolvedCount}</strong></article>
      </section>

      <section className="feedback-admin-toolbar">
        <label htmlFor="feedback-status-filter">Status</label>
        <select
          id="feedback-status-filter"
          value={filter}
          onChange={(event) => setFilter(event.target.value as 'all' | FeedbackReportStatus)}
        >
          <option value="all">All statuses</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>{label(status)}</option>
          ))}
        </select>
        <span>{visibleReports.length} reports</span>
      </section>

      {error && <p className="feedback-admin-error" role="alert">{error}</p>}
      {loading && <p>Loading feedback…</p>}

      {!loading && (
        <section className="feedback-admin-list">
          {visibleReports.map((report) => (
            <article className="feedback-admin-card" key={report.id}>
              <header>
                <div>
                  <div className="feedback-admin-card__meta">
                    <span>{label(report.report_type)}</span>
                    <span>{new Date(report.created_at).toLocaleString('en-GB')}</span>
                  </div>
                  <h2>{report.title}</h2>
                  {report.entity_name && <p>About: <strong>{report.entity_name}</strong></p>}
                </div>
                <span className={`feedback-admin-status feedback-admin-status--${report.status}`}>
                  {label(report.status)}
                </span>
              </header>

              <p className="feedback-admin-card__description">{report.description}</p>

              {report.page_url && (
                <a href={report.page_url} target="_blank" rel="noreferrer">
                  Open reported page
                </a>
              )}

              <div className="feedback-admin-card__controls">
                <label>
                  Status
                  <select
                    value={report.status}
                    disabled={savingId === report.id}
                    onChange={(event) =>
                      void saveReport(report, { status: event.target.value as FeedbackReportStatus })
                    }
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>{label(status)}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Priority
                  <select
                    value={report.priority}
                    disabled={savingId === report.id}
                    onChange={(event) =>
                      void saveReport(report, { priority: event.target.value as FeedbackPriority })
                    }
                  >
                    {priorityOptions.map((priority) => (
                      <option key={priority} value={priority}>{label(priority)}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label>
                Internal notes
                <textarea
                  rows={3}
                  defaultValue={report.admin_notes ?? ''}
                  onBlur={(event) =>
                    void saveReport(report, { admin_notes: event.target.value.trim() || null })
                  }
                />
              </label>

              <label>
                Resolution
                <textarea
                  rows={3}
                  defaultValue={report.resolution ?? ''}
                  onBlur={(event) =>
                    void saveReport(report, { resolution: event.target.value.trim() || null })
                  }
                />
              </label>
            </article>
          ))}

          {visibleReports.length === 0 && (
            <section className="admin-placeholder-panel">
              <div className="admin-placeholder-panel__body">
                <h2>No feedback in this view</h2>
                <p>New player reports will appear here automatically.</p>
              </div>
            </section>
          )}
        </section>
      )}
    </main>
  )
}
