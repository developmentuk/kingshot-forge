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
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function formatDate(value: string | null) {
  if (!value) return 'Not recorded'

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function TicketTimeline({ report }: { report: FeedbackReport }) {
  const events = [
    {
      title: 'Report submitted',
      detail: report.reporter_email
        ? `Submitted by ${report.reporter_email}`
        : 'Submitted by a Forge player',
      date: report.created_at,
    },
    report.updated_at !== report.created_at
      ? {
          title: 'Ticket updated',
          detail: `Current status: ${label(report.status)}`,
          date: report.updated_at,
        }
      : null,
    report.resolved_at
      ? {
          title: 'Resolution recorded',
          detail: report.resolution || 'Marked as resolved.',
          date: report.resolved_at,
        }
      : null,
  ].filter(Boolean) as Array<{
    title: string
    detail: string
    date: string
  }>

  return (
    <ol className="feedback-admin-timeline">
      {events.map((event, index) => (
        <li key={`${event.title}-${event.date}-${index}`}>
          <span className="feedback-admin-timeline__marker" aria-hidden="true" />
          <div>
            <strong>{event.title}</strong>
            <p>{event.detail}</p>
            <time dateTime={event.date}>{formatDate(event.date)}</time>
          </div>
        </li>
      ))}
    </ol>
  )
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
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load feedback.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadReports()
  }, [])

  const visibleReports = useMemo(
    () =>
      filter === 'all'
        ? reports
        : reports.filter((report) => report.status === filter),
    [filter, reports],
  )

  const newCount = reports.filter(
    (report) => report.status === 'new',
  ).length
  const activeCount = reports.filter((report) =>
    ['triaged', 'in_progress'].includes(report.status),
  ).length
  const resolvedCount = reports.filter(
    (report) => report.status === 'resolved',
  ).length

  async function saveReport(
    report: FeedbackReport,
    updates: Partial<
      Pick<
        FeedbackReport,
        'status' | 'priority' | 'admin_notes' | 'resolution'
      >
    >,
  ) {
    setSavingId(report.id)
    setError('')

    try {
      await updateFeedbackReport(report.id, updates)
      setReports((current) =>
        current.map((item) =>
          item.id === report.id
            ? {
                ...item,
                ...updates,
                updated_at: new Date().toISOString(),
                resolved_at:
                  updates.status === 'resolved'
                    ? new Date().toISOString()
                    : item.resolved_at,
              }
            : item,
        ),
      )
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Unable to update feedback.',
      )
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
            Review player reports, prioritise updates and record how each issue
            was resolved.
          </p>
        </div>
        <button
          type="button"
          className="button button--secondary"
          onClick={() => void loadReports()}
        >
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
          onChange={(event) =>
            setFilter(event.target.value as 'all' | FeedbackReportStatus)
          }
        >
          <option value="all">All statuses</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>{label(status)}</option>
          ))}
        </select>
        <span>{visibleReports.length} reports</span>
      </section>

      {error && (
        <p className="feedback-admin-error" role="alert">{error}</p>
      )}
      {loading && <p>Loading feedback…</p>}

      {!loading && (
        <section className="feedback-admin-list">
          {visibleReports.map((report) => (
            <article className="feedback-admin-card" key={report.id}>
              <header className="feedback-admin-card__header">
                <div>
                  <div className="feedback-admin-card__meta">
                    <span className="feedback-admin-type-badge">
                      {label(report.report_type)}
                    </span>
                    <time dateTime={report.created_at}>
                      Reported {formatDate(report.created_at)}
                    </time>
                  </div>
                  <h2>{report.title}</h2>
                </div>
                <span
                  className={`feedback-admin-status feedback-admin-status--${report.status}`}
                >
                  {label(report.status)}
                </span>
              </header>

              <section className="feedback-admin-report-copy">
                <p className="feedback-admin-section-label">Player report</p>
                <blockquote>{report.description}</blockquote>
              </section>

              <section className="feedback-admin-context">
                <div>
                  <span>Affected record</span>
                  <strong>{report.entity_name || 'General Forge feedback'}</strong>
                </div>
                <div>
                  <span>Domain</span>
                  <strong>{report.entity_type ? label(report.entity_type) : 'Platform'}</strong>
                </div>
                <div>
                  <span>Reporter</span>
                  <strong>{report.reporter_email || 'Anonymous player'}</strong>
                </div>
                <div>
                  <span>Priority</span>
                  <strong>{label(report.priority)}</strong>
                </div>
              </section>

              {report.page_url && (
                <a
                  className="feedback-admin-page-link"
                  href={report.page_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open reported page ↗
                </a>
              )}

              <section className="feedback-admin-workflow">
                <div className="feedback-admin-workflow__heading">
                  <div>
                    <p className="feedback-admin-section-label">Editorial workflow</p>
                    <h3>Manage this report</h3>
                  </div>
                  {savingId === report.id && <span>Saving…</span>}
                </div>

                <div className="feedback-admin-card__controls">
                  <label>
                    Status
                    <select
                      value={report.status}
                      disabled={savingId === report.id}
                      onChange={(event) =>
                        void saveReport(report, {
                          status: event.target.value as FeedbackReportStatus,
                        })
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
                        void saveReport(report, {
                          priority: event.target.value as FeedbackPriority,
                        })
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
                    placeholder="Add investigation notes visible only to the Forge team."
                    onBlur={(event) =>
                      void saveReport(report, {
                        admin_notes: event.target.value.trim() || null,
                      })
                    }
                  />
                </label>

                <label>
                  Resolution
                  <textarea
                    rows={3}
                    defaultValue={report.resolution ?? ''}
                    placeholder="Record what changed or why the report was closed."
                    onBlur={(event) =>
                      void saveReport(report, {
                        resolution: event.target.value.trim() || null,
                      })
                    }
                  />
                </label>
              </section>

              <section className="feedback-admin-activity">
                <p className="feedback-admin-section-label">Activity</p>
                <h3>Ticket timeline</h3>
                <TicketTimeline report={report} />
              </section>
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
