import { getSupabaseAdmin } from '../database/supabaseAdmin.js'

type RoleNotice = { userId: string; action: string; roleOrStatus: string; auditEventId?: string }

export async function notifyIdentityMutation(input: RoleNotice) {
  const admin = getSupabaseAdmin()
  const title = input.action === 'account_status_changed' ? 'Account status updated' : 'Forge role updated'
  const body = input.action === 'account_status_changed' ? `Your Forge account status is now ${input.roleOrStatus}.` : `Your Forge access changed: ${input.roleOrStatus}.`
  const { data, error } = await admin.from('forge_notifications').insert({ user_id: input.userId, kind: input.action, title, body, href: '/settings' }).select('id').single()
  if (error || !data) throw error ?? new Error('Notification could not be created.')
  await admin.from('forge_notification_deliveries').insert({ notification_id: data.id, audit_event_id: input.auditEventId ?? null, channel: 'in_app', status: 'delivered' })
  let emailStatus = 'skipped_no_provider'
  const { data: target } = await admin.auth.admin.getUserById(input.userId)
  if (target.user?.email && process.env.RESEND_API_KEY && process.env.EMAIL_FROM) {
    try {
      const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [target.user.email], subject: title, text: body }) })
      emailStatus = response.ok ? 'delivered' : 'failed'
    } catch { emailStatus = 'failed' }
  }
  await admin.from('forge_notification_deliveries').insert({ notification_id: data.id, audit_event_id: input.auditEventId ?? null, channel: 'email', status: emailStatus })
  return { notificationId: data.id, emailStatus }
}
