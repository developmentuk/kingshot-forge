import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSupabaseAdmin } from '../server/database/supabaseAdmin.js'
import { requireForgeActor, type ForgeActor } from '../server/auth/requireForgeActor.js'

const BUCKET = 'community-art-submissions'
const MAX_BYTES = 5 * 1024 * 1024
const MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const CATEGORIES = new Set(['alliance_banner', 'profile_banner', 'player_name_design', 'chat_decoration', 'alliance_art', 'other'])
const ATTRIBUTIONS = new Set(['profile', 'custom', 'anonymous'])

function fail(response: VercelResponse, status: number, message: string) {
  response.status(status).json({ status: 'error', message })
}

function body(request: VercelRequest): Record<string, unknown> {
  return (request.body && typeof request.body === 'object' ? request.body : {}) as Record<string, unknown>
}

function toPublicRow(row: Record<string, unknown>, imageUrl: string | null) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    tags: row.tags ?? [],
    attribution: row.attribution_name ?? null,
    status: row.status,
    createdAt: row.created_at,
    moderatedAt: row.moderated_at ?? null,
    publishedAt: row.published_at ?? null,
    imageUrl,
    imageWidth: row.image_width,
    imageHeight: row.image_height,
    mimeType: row.mime_type,
  }
}

async function signedUrl(path: string | null) {
  if (!path) return null
  const { data, error } = await getSupabaseAdmin().storage.from(BUCKET).createSignedUrl(path, 3600)
  if (error) return null
  return data.signedUrl
}

async function rowsWithUrls(rows: Record<string, unknown>[]) {
  return Promise.all(rows.map(async (row) => toPublicRow(row, await signedUrl(typeof row.storage_path === 'string' ? row.storage_path : null))))
}

async function actor(request: VercelRequest): Promise<ForgeActor> {
  return requireForgeActor(request)
}

async function requireModerator(request: VercelRequest) {
  const currentActor = await actor(request)
  const admin = getSupabaseAdmin()
  const { data: roleData, error: roleError } = await admin.from('forge_user_roles').select('role').eq('user_id', currentActor.userId).maybeSingle()
  const { data: permission, error: permissionError } = roleData?.role
    ? await admin.from('forge_role_permissions').select('permission_key').eq('role', roleData.role).eq('permission_key', 'moderation.manage').maybeSingle()
    : { data: null, error: null }
  if (roleError || permissionError || !permission) throw Object.assign(new Error('Moderator access is required.'), { statusCode: 403 })
  return currentActor
}

async function listGallery(response: VercelResponse) {
  const { data, error } = await getSupabaseAdmin()
    .from('community_art_submissions')
    .select('id,title,description,category,tags,attribution_name,status,created_at,moderated_at,published_at,storage_path,image_width,image_height,mime_type')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
  if (error) throw error
  response.status(200).json({ status: 'success', data: await rowsWithUrls((data ?? []) as Record<string, unknown>[]) })
}

async function listMine(request: VercelRequest, response: VercelResponse) {
  const currentActor = await actor(request)
  const { data, error } = await getSupabaseAdmin()
    .from('community_art_submissions')
    .select('id,title,description,category,tags,attribution_name,status,created_at,moderated_at,published_at,storage_path,image_width,image_height,mime_type')
    .eq('user_id', currentActor.userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  response.status(200).json({ status: 'success', data: await rowsWithUrls((data ?? []) as Record<string, unknown>[]) })
}

async function listQueue(request: VercelRequest, response: VercelResponse) {
  await requireModerator(request)
  const { data, error } = await getSupabaseAdmin()
    .from('community_art_submissions')
    .select('id,user_id,title,description,category,tags,attribution_name,status,created_at,storage_path,image_width,image_height,mime_type')
    .in('status', ['pending', 'approved'])
    .order('created_at', { ascending: true })
  if (error) throw error
  response.status(200).json({ status: 'success', data: await rowsWithUrls((data ?? []) as Record<string, unknown>[]) })
}

async function submit(request: VercelRequest, response: VercelResponse) {
  const currentActor = await actor(request)
  const input = body(request)
  const title = typeof input.title === 'string' ? input.title.trim() : ''
  const description = typeof input.description === 'string' ? input.description.trim() : ''
  const category = typeof input.category === 'string' ? input.category : ''
  const tags = Array.isArray(input.tags) ? input.tags.filter((tag): tag is string => typeof tag === 'string').map((tag) => tag.trim()).filter(Boolean) : []
  const attributionType = typeof input.attributionType === 'string' ? input.attributionType : ''
  const attributionName = typeof input.attributionName === 'string' ? input.attributionName.trim() : null
  const storagePath = typeof input.storagePath === 'string' ? input.storagePath : ''
  const mimeType = typeof input.mimeType === 'string' ? input.mimeType : ''
  const fileSizeBytes = Number(input.fileSizeBytes)
  const imageWidth = Number(input.imageWidth)
  const imageHeight = Number(input.imageHeight)

  if (!title || title.length > 120 || description.length > 2000 || !CATEGORIES.has(category) || tags.length > 10 || tags.some((tag) => tag.length > 32) || !ATTRIBUTIONS.has(attributionType) || (attributionType !== 'anonymous' && (!attributionName || attributionName.length > 120)) || (attributionType === 'anonymous' && attributionName) || !MIME_TYPES.has(mimeType) || !Number.isInteger(fileSizeBytes) || fileSizeBytes < 1 || fileSizeBytes > MAX_BYTES || !Number.isInteger(imageWidth) || imageWidth < 128 || imageWidth > 4096 || !Number.isInteger(imageHeight) || imageHeight < 128 || imageHeight > 4096 || !input.ownershipConfirmed || !input.guidelinesConfirmed) {
    fail(response, 400, 'Check the required fields and image constraints, then try again.')
    return
  }

  const pathPattern = new RegExp(`^${currentActor.userId}/[0-9a-f-]{36}\\.(jpg|jpeg|png|webp)$`)
  if (!pathPattern.test(storagePath)) {
    fail(response, 400, 'The uploaded artwork path is invalid.')
    return
  }

  const admin = getSupabaseAdmin()
  const { data: storedObject, error: objectError } = await admin.schema('storage').from('objects').select('name,metadata').eq('bucket_id', BUCKET).eq('name', storagePath).maybeSingle()
  if (objectError || !storedObject) {
    fail(response, 400, 'The artwork upload could not be verified.')
    return
  }
  const metadata = (storedObject.metadata ?? {}) as Record<string, unknown>
  if (metadata.mimetype !== mimeType || Number(metadata.size) !== fileSizeBytes) {
    fail(response, 400, 'The artwork upload metadata does not match the selected file.')
    return
  }

  let safeAttributionName = attributionName
  if (attributionType === 'profile') {
    const { data: profile } = await admin.from('profiles').select('display_name').eq('id', currentActor.userId).maybeSingle()
    safeAttributionName = typeof profile?.display_name === 'string' && profile.display_name.trim() ? profile.display_name.trim() : null
    if (!safeAttributionName) {
      fail(response, 400, 'Complete a Forge display name before using profile attribution.')
      return
    }
  }

  const { data: recent } = await admin.from('community_art_submissions').select('id').eq('user_id', currentActor.userId).gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
  if ((recent?.length ?? 0) >= 5) {
    fail(response, 429, 'You have reached the submission limit for this hour.')
    return
  }

  const { data, error } = await admin.from('community_art_submissions').insert({
    user_id: currentActor.userId, title, description, category, tags, storage_path: storagePath,
    mime_type: mimeType, file_size_bytes: fileSizeBytes, image_width: imageWidth, image_height: imageHeight,
    attribution_type: attributionType, attribution_name: safeAttributionName,
    ownership_confirmed: true, guidelines_confirmed: true, status: 'pending',
  }).select('id,title,description,category,tags,attribution_name,status,created_at,storage_path,image_width,image_height,mime_type').single()
  if (error || !data) throw error ?? new Error('Unable to save submission.')
  response.status(201).json({ status: 'success', data: toPublicRow(data as Record<string, unknown>, await signedUrl(storagePath)) })
}

async function moderate(request: VercelRequest, response: VercelResponse) {
  const moderator = await requireModerator(request)
  const input = body(request)
  const id = typeof input.id === 'string' ? input.id : ''
  const action = input.action === 'approve' || input.action === 'reject' || input.action === 'publish' ? input.action : ''
  const note = typeof input.note === 'string' ? input.note.trim() : ''
  if (!id || !action || (action === 'reject' && !note) || note.length > 4000) {
    fail(response, 400, 'A valid moderation action and note are required.')
    return
  }
  const admin = getSupabaseAdmin()
  const { data: current, error: readError } = await admin.from('community_art_submissions').select('status').eq('id', id).maybeSingle()
  if (readError || !current) { fail(response, 404, 'Submission not found.'); return }
  const nextStatus = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'published'
  if ((action === 'approve' || action === 'reject') && current.status !== 'pending') { fail(response, 409, 'Only pending submissions can be reviewed.'); return }
  if (action === 'publish' && current.status !== 'approved') { fail(response, 409, 'Only approved submissions can be published.'); return }
  const update = { status: nextStatus, moderation_note: note || null, moderated_by: moderator.userId, moderated_at: new Date().toISOString(), published_at: action === 'publish' ? new Date().toISOString() : null }
  const { data, error } = await admin.from('community_art_submissions').update(update).eq('id', id).eq('status', current.status).select('id,title,description,category,tags,attribution_name,status,created_at,moderated_at,published_at,storage_path,image_width,image_height,mime_type').maybeSingle()
  if (error || !data) { fail(response, 409, 'The submission changed before this action completed.'); return }
  response.status(200).json({ status: 'success', data: toPublicRow(data as Record<string, unknown>, await signedUrl((data as Record<string, unknown>).storage_path as string)) })
}

export default async function handler(request: VercelRequest, response: VercelResponse): Promise<void> {
  try {
    const action = typeof request.query.action === 'string' ? request.query.action : 'gallery'
    if (request.method === 'GET' && action === 'gallery') return await listGallery(response)
    if (request.method === 'GET' && action === 'mine') return await listMine(request, response)
    if (request.method === 'GET' && action === 'queue') return await listQueue(request, response)
    if (request.method === 'POST' && action === 'submit') return await submit(request, response)
    if (request.method === 'POST' && action === 'moderate') return await moderate(request, response)
    response.setHeader('Allow', 'GET, POST')
    fail(response, 405, 'Method not allowed.')
  } catch (error) {
    const statusCode = typeof error === 'object' && error && 'statusCode' in error && typeof error.statusCode === 'number' ? error.statusCode : 500
    fail(response, statusCode, statusCode === 500 ? 'The Art Studio service is temporarily unavailable.' : 'You do not have permission for this action.')
  }
}
