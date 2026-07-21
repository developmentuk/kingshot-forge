import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireForgeActor, type ForgeActor } from '../server/auth/requireForgeActor.js'
import { getSupabaseAdmin } from '../server/database/supabaseAdmin.js'
import { validateTextArtwork, type TextArtworkValidationIssue } from '../shared/domains/art-studio/textValidation.js'
import { analyseText, hashText, repairText, RENDER_PROFILES, sha256Text, type RepairOperation } from '../shared/domains/art-studio/rendering.js'
import { randomUUID } from 'node:crypto'

const CATEGORIES = new Set(['Cats', 'Animals', 'Characters', 'Announcements', 'Battle', 'KvK', 'Alliance', 'Flags', 'Pixel Art', 'Nature', 'Funny', 'Gaming', 'Seasonal', 'Other'])
const COMPATIBILITY = new Set(['untested', 'needs_testing', 'verified', 'known_issues'])
const REACTION_TYPES = new Set(['like', 'heart', 'smile', 'wow'])

function fail(response: VercelResponse, status: number, message: string, referenceId?: string) { response.status(status).json({ status: 'error', message, ...(referenceId ? { referenceId } : {}) }) }
function correlationId(request: VercelRequest): string { const value = request.headers['x-correlation-id']; return typeof value === 'string' && /^[a-zA-Z0-9._:-]{8,120}$/.test(value) ? value : randomUUID() }
function requestId(value: unknown): string { return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ? value : randomUUID() }
function body(request: VercelRequest): Record<string, unknown> { return (request.body && typeof request.body === 'object' ? request.body : {}) as Record<string, unknown> }
function sizeClass(lines: number): 'compact' | 'standard' | 'large' { return lines <= 3 ? 'compact' : lines <= 8 ? 'standard' : 'large' }
function emptyReactionCounts() { return { like: 0, heart: 0, smile: 0, wow: 0 } }
async function reactionCounts(artworkIds: string[]) {
  const counts = new Map<string, ReturnType<typeof emptyReactionCounts>>()
  if (!artworkIds.length) return counts
  const { data, error } = await getSupabaseAdmin().from('community_art_reaction_counts').select('artwork_id,reaction_type,reaction_count').in('artwork_id', artworkIds)
  if (error) throw error
  for (const row of data ?? []) {
    const current = counts.get(row.artwork_id) ?? emptyReactionCounts()
    if (row.reaction_type in current) current[row.reaction_type as keyof typeof current] = Number(row.reaction_count ?? 0)
    counts.set(row.artwork_id, current)
  }
  return counts
}
function record(row: Record<string, unknown>, counts = emptyReactionCounts(), myReaction: string | null = null, includeRaw = false): Record<string, unknown> {
  const lines = Number(row.line_count ?? 0)
  const approvedPayload = typeof row.approved_copy_payload === 'string' ? row.approved_copy_payload : null
  return { id: row.id, title: row.title, description: row.description, category: row.category, tags: row.tags ?? [], artworkText: row.artwork_text, ...(includeRaw ? { rawSourceText: row.raw_source_text ?? row.artwork_text, rawSourceSha256: row.raw_source_sha256 ?? row.source_hash ?? null, rawSourceByteLength: row.raw_source_byte_length ?? null, decodedTextSha256: row.decoded_text_sha256 ?? null, browserReceivedText: row.browser_received_text ?? null } : {}), ingestionMode: row.ingestion_mode ?? 'legacy_import', originalFilename: row.original_filename ?? null, originalMimeType: row.original_mime_type ?? null, exactBytePreserved: row.ingestion_mode === 'file_upload' && row.raw_bytes !== null, detectedLineEnding: row.detected_line_ending ?? null, crlfCount: row.crlf_count ?? null, lfCount: row.lf_count ?? null, normalisationOperations: row.normalisation_operations ?? [], normalisedText: row.normalised_text ?? row.artwork_text, approvedCopyPayload: approvedPayload, renderedPreviewPayload: row.rendered_preview_payload ?? row.normalised_text ?? row.artwork_text, compatibilityProfile: row.compatibility_profile ?? 'kingshot-chat-bubble', repairOperations: row.repair_operations ?? [], sourceHash: row.source_hash ?? null, approvedPayloadHash: row.approved_payload_hash ?? (approvedPayload ? hashText(approvedPayload) : null), attribution: row.attribution_name ?? null, status: row.status, compatibilityStatus: row.compatibility_status ?? 'untested', characterCount: row.character_count, lineCount: lines, sizeClass: sizeClass(lines), createdAt: row.created_at, moderatedAt: row.moderated_at ?? null, publishedAt: row.published_at ?? null, submitterFeedback: row.submitter_feedback ?? null, reactionCounts: counts, myReaction }
}
function moderatorRecord(row: Record<string, unknown>): Record<string, unknown> {
  return { ...record(row, emptyReactionCounts(), null, true), submitterContext: { userId: row.user_id, attributionType: row.attribution_type, attributionName: row.attribution_name ?? null } }
}
function publicRecord(row: Record<string, unknown>, counts = emptyReactionCounts(), myReaction: string | null = null): Record<string, unknown> {
  const payload = typeof row.approved_copy_payload === 'string' ? row.approved_copy_payload : null
  const lines = Number(row.line_count ?? 0)
  return { id: row.id, title: row.title, description: row.description, category: row.category, tags: row.tags ?? [], artworkText: payload, approvedCopyPayload: payload, renderedPreviewPayload: payload, compatibilityProfile: row.compatibility_profile ?? 'kingshot-chat-bubble', approvedPayloadHash: row.approved_payload_hash ?? null, attribution: row.attribution_name ?? null, status: 'published', compatibilityStatus: row.compatibility_status ?? 'untested', characterCount: payload?.length ?? 0, lineCount: lines, sizeClass: sizeClass(lines), publishedAt: row.published_at ?? null, reactionCounts: counts, myReaction }
}
async function actor(request: VercelRequest): Promise<ForgeActor> { return requireForgeActor(request) }
async function moderator(request: VercelRequest) {
  const currentActor = await actor(request)
  if (!currentActor.capabilities.includes('community_art.moderate')) throw Object.assign(new Error('Community Art moderation capability is required.'), { statusCode: 403 })
  return currentActor
}
const columns = 'id,title,description,category,tags,artwork_text,raw_source_text,raw_source_sha256,raw_source_byte_length,normalised_text,approved_copy_payload,rendered_preview_payload,compatibility_profile,repair_operations,source_hash,approved_payload_hash,attribution_name,status,compatibility_status,character_count,line_count,created_at,moderated_at,published_at,submitter_feedback,ingestion_mode,original_filename,original_mime_type,raw_bytes,decoded_text,decoded_text_sha256,detected_line_ending,crlf_count,lf_count,trailing_newline,bom_present,browser_received_text,browser_text_sha256,normalisation_operations'

async function gallery(response: VercelResponse) {
  const { data, error } = await getSupabaseAdmin().from('community_art_submissions').select(columns).eq('status', 'published').order('published_at', { ascending: false })
  if (error) throw error
  const counts = await reactionCounts((data ?? []).map((row) => row.id))
  response.status(200).json({ status: 'success', data: (data ?? []).map((row) => publicRecord(row as Record<string, unknown>, counts.get(row.id) ?? emptyReactionCounts())) })
}
async function mine(request: VercelRequest, response: VercelResponse) {
  const currentActor = await actor(request)
  const { data, error } = await getSupabaseAdmin().from('community_art_submissions').select(`${columns},submitter_feedback`).eq('user_id', currentActor.userId).order('created_at', { ascending: false })
  if (error) throw error
  response.status(200).json({ status: 'success', data: (data ?? []).map((row) => record(row as Record<string, unknown>)) })
}
async function queue(request: VercelRequest, response: VercelResponse) {
  await moderator(request)
  const { data, error } = await getSupabaseAdmin().from('community_art_submissions').select(`${columns},user_id`).in('status', ['pending', 'approved']).order('created_at', { ascending: true })
  if (error) throw error
  response.status(200).json({ status: 'success', data: (data ?? []).map((row) => moderatorRecord(row as Record<string, unknown>)) })
}

async function myReactions(request: VercelRequest, response: VercelResponse) {
  const currentActor = await actor(request)
  const admin = getSupabaseAdmin()
  const { data: published, error: publishedError } = await admin.from('community_art_submissions').select('id').eq('status', 'published')
  if (publishedError) throw publishedError
  const ids = (published ?? []).map((row) => row.id)
  if (!ids.length) { response.status(200).json({ status: 'success', data: [] }); return }
  const { data, error } = await admin.from('community_art_reactions').select('artwork_id,reaction_type').eq('user_id', currentActor.userId).in('artwork_id', ids)
  if (error) throw error
  response.status(200).json({ status: 'success', data: (data ?? []).map((row) => ({ artworkId: row.artwork_id, reactionType: row.reaction_type })) })
}

async function react(request: VercelRequest, response: VercelResponse) {
  const currentActor = await actor(request)
  const input = body(request)
  const artworkId = typeof input.artworkId === 'string' ? input.artworkId : ''
  const reactionType = input.reactionType === null ? null : typeof input.reactionType === 'string' ? input.reactionType : ''
  if (!artworkId || (reactionType !== null && !REACTION_TYPES.has(reactionType))) { fail(response, 400, 'Choose a supported reaction.'); return }
  const admin = getSupabaseAdmin()
  const { data: artwork, error: artworkError } = await admin.from('community_art_submissions').select('id').eq('id', artworkId).eq('status', 'published').maybeSingle()
  if (artworkError) throw artworkError
  if (!artwork) { fail(response, 404, 'Published artwork not found.'); return }
  if (reactionType === null) {
    const { error } = await admin.from('community_art_reactions').delete().eq('artwork_id', artworkId).eq('user_id', currentActor.userId)
    if (error) throw error
  } else {
    const { error } = await admin.from('community_art_reactions').upsert({ artwork_id: artworkId, user_id: currentActor.userId, reaction_type: reactionType }, { onConflict: 'artwork_id,user_id' })
    if (error) throw error
  }
  const counts = await reactionCounts([artworkId])
  response.status(200).json({ status: 'success', data: { artworkId, reactionCounts: counts.get(artworkId) ?? emptyReactionCounts(), myReaction: reactionType } })
}

async function submit(request: VercelRequest, response: VercelResponse) {
  const currentActor = await actor(request)
  const referenceId = correlationId(request)
  if (!currentActor.capabilities.includes('contributions.submit')) { fail(response, 403, 'Your account is not currently permitted to submit artwork. Contact Forge support if this looks wrong.', referenceId); return }
  const input = body(request)
  const title = typeof input.title === 'string' ? input.title : ''
  const description = typeof input.description === 'string' ? input.description : ''
  const artworkText = typeof input.artworkText === 'string' ? input.artworkText : ''
  const category = typeof input.category === 'string' ? input.category : ''
  const tags = Array.isArray(input.tags) ? input.tags.filter((tag): tag is string => typeof tag === 'string') : []
  const attributionType = typeof input.attributionType === 'string' ? input.attributionType : ''
  const submittedAttribution = typeof input.attributionName === 'string' ? input.attributionName : null
  const issues: TextArtworkValidationIssue[] = validateTextArtwork({ title, description, artwork: artworkText, tags, attributionType, attributionName: submittedAttribution })
  if (!CATEGORIES.has(category)) issues.push({ field: 'artwork', message: 'Choose a registered Art Studio category.' })
  if (!input.ownershipConfirmed || !input.guidelinesConfirmed) issues.push({ field: 'artwork', message: 'Confirm ownership and the community guidelines before submitting.' })
  if (issues.length) { fail(response, 400, issues[0].message); return }
  const profile = RENDER_PROFILES['kingshot-chat-bubble']
  const repaired = repairText(artworkText, profile)
  const diagnostics = analyseText(artworkText, profile)
  const admin = getSupabaseAdmin()
  const { data: recent } = await admin.from('community_art_submissions').select('id').eq('user_id', currentActor.userId).gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
  if ((recent?.length ?? 0) >= 5) { fail(response, 429, 'You have reached the submission limit for this hour.'); return }
  let attributionName = submittedAttribution
  if (attributionType === 'profile') {
    const { data: profile } = await admin.from('profiles').select('display_name').eq('id', currentActor.userId).maybeSingle()
    attributionName = typeof profile?.display_name === 'string' && profile.display_name.trim() ? profile.display_name : null
    if (!attributionName) { fail(response, 400, 'Complete a Forge display name before using profile attribution.'); return }
  }
  const submissionRequestId = requestId(input.requestId)
  const ingestionMode = input.ingestionMode === 'file_upload' || input.ingestionMode === 'text_paste' || input.ingestionMode === 'manual_entry' ? input.ingestionMode : null
  const rawBytesBase64 = typeof input.rawBytesBase64 === 'string' ? input.rawBytesBase64 : ''
  const originalFilename = typeof input.originalFilename === 'string' ? input.originalFilename : null
  const originalMimeType = typeof input.originalMimeType === 'string' ? input.originalMimeType : null
  const browserReceivedText = typeof input.browserReceivedText === 'string' ? input.browserReceivedText : null
  const normalisationOperations = Array.isArray(input.normalisationOperations) ? input.normalisationOperations : repaired.operations
  if (!ingestionMode) { fail(response, 400, 'Choose a supported source input mode.'); return }
  if (!rawBytesBase64) { fail(response, 400, 'Provide the source text or upload a .txt file.'); return }
  if (ingestionMode === 'file_upload' && (!originalFilename || !originalMimeType || originalMimeType !== 'text/plain')) { fail(response, 400, 'A file upload requires a .txt filename and text/plain MIME type.'); return }
  // The atomic command assigns status: 'pending' and never creates approved_copy_payload.
  const { data: command, error } = await admin.rpc('submit_community_art_submission', { p_request_id: submissionRequestId, p_user_id: currentActor.userId, p_submission: { title, description, category, tags, artworkText, attributionType, attributionName }, p_normalised_text: artworkText.replace(/\r\n?/g, '\n'), p_rendered_preview_payload: artworkText.replace(/\r\n?/g, '\n'), p_compatibility_profile: profile.id, p_repair_operations: repaired.operations, p_compatibility_status: diagnostics.warnings.length ? 'needs_testing' : 'untested', p_character_count: Array.from(artworkText).length, p_line_count: artworkText.replace(/\r\n?/g, '\n').split('\n').length, p_ingestion_mode: ingestionMode, p_original_filename: originalFilename, p_original_mime_type: originalMimeType, p_raw_bytes_base64: rawBytesBase64, p_browser_received_text: browserReceivedText, p_normalisation_operations: normalisationOperations })
  if (error || !command || typeof command !== 'object') { console.error('[art-studio-submit]', { referenceId, userId: currentActor.userId, code: error?.code, message: error?.message, details: error?.details, hint: error?.hint }); fail(response, 500, 'Your artwork could not be submitted right now. Please retry using the same form. Reference ID: ' + referenceId, referenceId); return }
  const result = command as { created?: boolean; submission?: Record<string, unknown> }
  if (!result.submission) { console.error('[art-studio-submit]', { referenceId, userId: currentActor.userId, message: 'Atomic command returned no submission.' }); fail(response, 500, 'Your artwork could not be submitted right now. Reference ID: ' + referenceId, referenceId); return }
  response.status(result.created === false ? 200 : 201).json({ status: 'success', data: record(result.submission), idempotent: result.created === false, referenceId })
}

async function moderateSubmission(request: VercelRequest, response: VercelResponse) {
  const currentActor = await moderator(request)
  const input = body(request)
  const id = typeof input.id === 'string' ? input.id : ''
  const action = input.action === 'approve' || input.action === 'reject' || input.action === 'publish' || input.action === 'update' ? input.action : ''
  const note = typeof input.note === 'string' ? input.note : ''
  const feedback = typeof input.feedback === 'string' ? input.feedback : ''
  const compatibilityStatus = typeof input.compatibilityStatus === 'string' ? input.compatibilityStatus : 'untested'
  const approvedPayload = typeof input.approvedPayload === 'string' ? input.approvedPayload : null
  const repairOperations = Array.isArray(input.repairOperations) ? input.repairOperations as RepairOperation[] : []
  if (!id || !action || !COMPATIBILITY.has(compatibilityStatus) || note.length > 4000 || feedback.length > 2000 || (approvedPayload !== null && approvedPayload.length > 20000)) { fail(response, 400, 'Check the moderation fields and try again.'); return }
  const admin = getSupabaseAdmin()
  const { data: current, error: readError } = await admin.from('community_art_submissions').select('status,normalised_text').eq('id', id).maybeSingle()
  if (readError || !current) { fail(response, 404, 'Submission not found.'); return }
  if ((action === 'approve' || action === 'reject') && current.status !== 'pending') { fail(response, 409, 'Only pending submissions can be reviewed.'); return }
  if (action === 'publish' && current.status !== 'approved') { fail(response, 409, 'Only approved submissions can be published.'); return }
  const nextStatus = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : action === 'publish' ? 'published' : current.status
  const payload = approvedPayload ?? (typeof current.normalised_text === 'string' ? current.normalised_text : null)
  const update = { status: nextStatus, compatibility_status: compatibilityStatus, moderation_note_private: note || null, submitter_feedback: feedback || null, approved_copy_payload: action === 'approve' || action === 'publish' ? payload : undefined, approved_payload_hash: action === 'approve' || action === 'publish' ? (payload ? await sha256Text(payload) : null) : undefined, repair_operations: repairOperations, approved_payload_version: action === 'approve' || action === 'publish' ? 1 : undefined, moderated_by: currentActor.userId, moderated_at: new Date().toISOString(), published_at: action === 'publish' ? new Date().toISOString() : null }
  const { data, error } = await admin.from('community_art_submissions').update(update).eq('id', id).eq('status', current.status).select(columns).maybeSingle()
  if (error || !data) { fail(response, 409, 'The submission changed before this action completed.'); return }
  if ((action === 'approve' || action === 'publish') && payload) {
    const { error: versionError } = await admin.from('community_art_payload_versions').upsert({ artwork_id: id, version: 1, payload, payload_hash: await sha256Text(payload), render_profile: String(data.compatibility_profile ?? 'kingshot-chat-bubble'), repair_operations: repairOperations, created_by: currentActor.userId }, { onConflict: 'artwork_id,version' })
    if (versionError) throw versionError
  }
  response.status(200).json({ status: 'success', data: record(data as Record<string, unknown>) })
}

export default async function handler(request: VercelRequest, response: VercelResponse): Promise<void> {
  const action = typeof request.query.action === 'string' ? request.query.action : 'gallery'
  try {
    if (request.method === 'GET' && action === 'gallery') return await gallery(response)
    if (request.method === 'GET' && action === 'mine') return await mine(request, response)
    if (request.method === 'GET' && action === 'queue') return await queue(request, response)
    if (request.method === 'GET' && action === 'my-reactions') return await myReactions(request, response)
    if (request.method === 'POST' && action === 'submit') return await submit(request, response)
    if (request.method === 'POST' && action === 'react') return await react(request, response)
    if (request.method === 'POST' && action === 'moderate') return await moderateSubmission(request, response)
    response.setHeader('Allow', 'GET, POST'); fail(response, 405, 'Method not allowed.')
  } catch (error) {
    const diagnostic = error && typeof error === 'object' ? error as { name?: unknown; message?: unknown; code?: unknown; details?: unknown; hint?: unknown; statusCode?: unknown } : null
    console.error('[art-studio]', {
      method: request.method,
      action,
      name: error instanceof Error ? error.name : diagnostic?.name,
      message: error instanceof Error ? error.message : diagnostic?.message,
      code: diagnostic?.code,
      details: diagnostic?.details,
      hint: diagnostic?.hint,
    })
    const statusCode = typeof error === 'object' && error && 'statusCode' in error && typeof error.statusCode === 'number' ? error.statusCode : 500
    const referenceId = correlationId(request)
    console.error('[art-studio]', { referenceId, method: request.method, action, name: error instanceof Error ? error.name : diagnostic?.name, code: diagnostic?.code, message: diagnostic?.message, details: diagnostic?.details, hint: diagnostic?.hint })
    fail(response, statusCode, statusCode === 500 ? `The Art Studio service is temporarily unavailable. Reference ID: ${referenceId}` : 'You do not have permission for this action.', referenceId)
  }
}
