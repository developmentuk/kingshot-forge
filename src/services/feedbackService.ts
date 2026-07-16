import { supabase } from '../lib/supabase'

export type FeedbackReportType =
  | 'data_issue'
  | 'update_request'
  | 'bug'
  | 'suggestion'
  | 'other'

export type FeedbackReportStatus =
  | 'new'
  | 'triaged'
  | 'in_progress'
  | 'resolved'
  | 'closed'

export type FeedbackPriority =
  | 'low'
  | 'normal'
  | 'high'
  | 'urgent'

export interface FeedbackReport {
  id: string
  reporter_id: string | null
  reporter_email: string | null
  report_type: FeedbackReportType
  title: string
  description: string
  page_url: string | null
  entity_type: string | null
  entity_id: string | null
  entity_name: string | null
  status: FeedbackReportStatus
  priority: FeedbackPriority
  assigned_to: string | null
  admin_notes: string | null
  resolution: string | null
  created_at: string
  updated_at: string
  resolved_at: string | null
}

export interface CreateFeedbackReportInput {
  reportType: FeedbackReportType
  title: string
  description: string
  pageUrl?: string
  entityType?: string
  entityId?: string
  entityName?: string
  reporterEmail?: string
}

export async function createFeedbackReport(
  input: CreateFeedbackReportInput,
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase.from('feedback_reports').insert({
    reporter_id: user?.id ?? null,
    reporter_email: input.reporterEmail?.trim() || user?.email || null,
    report_type: input.reportType,
    title: input.title.trim(),
    description: input.description.trim(),
    page_url: input.pageUrl || window.location.href,
    entity_type: input.entityType || null,
    entity_id: input.entityId || null,
    entity_name: input.entityName || null,
  })

  if (error) {
    throw new Error(`Unable to submit feedback: ${error.message}`)
  }
}

export async function getFeedbackReports(): Promise<FeedbackReport[]> {
  const { data, error } = await supabase
    .from('feedback_reports')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Unable to load feedback: ${error.message}`)
  }

  return (data ?? []) as FeedbackReport[]
}

export async function updateFeedbackReport(
  reportId: string,
  updates: Partial<
    Pick<
      FeedbackReport,
      'status' | 'priority' | 'assigned_to' | 'admin_notes' | 'resolution'
    >
  >,
): Promise<void> {
  const { error } = await supabase
    .from('feedback_reports')
    .update(updates)
    .eq('id', reportId)

  if (error) {
    throw new Error(`Unable to update feedback: ${error.message}`)
  }
}
