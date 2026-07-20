import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireForgeActor } from '../server/auth/requireForgeActor.js'
import { getSupabaseAdmin } from '../server/database/supabaseAdmin.js'

export default async function handler(request: VercelRequest, response: VercelResponse) {
  try {
    const actor = await requireForgeActor(request)
    const admin = getSupabaseAdmin()
    if (request.method === 'GET') { const { data, error } = await admin.from('forge_notifications').select('id,kind,title,body,href,read_at,created_at').eq('user_id', actor.userId).order('created_at', { ascending: false }).limit(20); if (error) throw error; response.status(200).json({ status: 'success', data: data ?? [] }); return }
    if (request.method === 'POST') { const id = typeof request.body?.id === 'string' ? request.body.id : ''; if (!id) { response.status(400).json({ status: 'error', message: 'Notification id is required.' }); return } await admin.from('forge_notifications').update({ read_at: new Date().toISOString() }).eq('id', id).eq('user_id', actor.userId); response.status(200).json({ status: 'success' }); return }
    response.status(405).json({ status: 'error', message: 'Method not allowed.' })
  } catch { response.status(500).json({ status: 'error', message: 'Notifications are temporarily unavailable.' }) }
}
