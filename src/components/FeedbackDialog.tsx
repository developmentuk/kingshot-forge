import { useEffect, useState } from 'react'
import {
  createFeedbackReport,
  type FeedbackReportType,
} from '../services/feedbackService'
import './FeedbackDialog.css'

interface FeedbackDialogProps {
  open: boolean
  onClose: () => void
  entityType?: string
  entityId?: string
  entityName?: string
  defaultType?: FeedbackReportType
}

export default function FeedbackDialog({
  open,
  onClose,
  entityType,
  entityId,
  entityName,
  defaultType = 'data_issue',
}: FeedbackDialogProps) {
  const [reportType, setReportType] = useState<FeedbackReportType>(defaultType)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!open) return
    setReportType(defaultType)
    setTitle(entityName ? `Update requested for ${entityName}` : '')
    setDescription('')
    setEmail('')
    setError('')
    setSuccess(false)
  }, [defaultType, entityName, open])

  useEffect(() => {
    if (!open) return

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose, open])

  if (!open) return null

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (title.trim().length < 5 || description.trim().length < 10) {
      setError('Please add a clear title and at least 10 characters of detail.')
      return
    }

    setSubmitting(true)

    try {
      await createFeedbackReport({
        reportType,
        title,
        description,
        reporterEmail: email,
        pageUrl: window.location.href,
        entityType,
        entityId,
        entityName,
      })
      setSuccess(true)
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to submit feedback.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="feedback-dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="feedback-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-dialog-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="feedback-dialog__close"
          aria-label="Close feedback form"
          onClick={onClose}
        >
          ×
        </button>

        {success ? (
          <div className="feedback-dialog__success">
            <span aria-hidden="true">✅</span>
            <p className="eyebrow">Feedback received</p>
            <h2 id="feedback-dialog-title">Thank you</h2>
            <p>
              Your report is now in the Forge feedback queue for an editor or
              contributor to review.
            </p>
            <button type="button" className="button button--primary" onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p className="eyebrow">Help improve Forge</p>
            <h2 id="feedback-dialog-title">Report an issue or request an update</h2>
            {entityName && <p className="feedback-dialog__context">About: {entityName}</p>}

            <label>
              Feedback type
              <select
                value={reportType}
                onChange={(event) =>
                  setReportType(event.target.value as FeedbackReportType)
                }
              >
                <option value="data_issue">Incorrect data</option>
                <option value="update_request">Request an update</option>
                <option value="bug">Page or feature problem</option>
                <option value="suggestion">Suggestion</option>
                <option value="other">Other</option>
              </select>
            </label>

            <label>
              Title
              <input
                type="text"
                value={title}
                maxLength={140}
                onChange={(event) => setTitle(event.target.value)}
                required
              />
            </label>

            <label>
              What needs checking?
              <textarea
                value={description}
                rows={7}
                maxLength={3000}
                placeholder="Tell us what looks wrong, what you expected, and any source or evidence that may help."
                onChange={(event) => setDescription(event.target.value)}
                required
              />
            </label>

            <label>
              Email <span>(optional)</span>
              <input
                type="email"
                value={email}
                placeholder="Used only if we need more detail"
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>

            {error && (
              <p className="feedback-dialog__error" role="alert">
                {error}
              </p>
            )}

            <div className="feedback-dialog__actions">
              <button type="button" className="button button--secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="button button--primary" disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit feedback'}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}
