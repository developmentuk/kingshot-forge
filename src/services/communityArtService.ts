import { supabase } from '../lib/supabase'
import type { IngestionMode } from '../../shared/domains/art-studio/sourceEvidence'

export type CommunityArtCategory = 'Cats' | 'Animals' | 'Characters' | 'Announcements' | 'Battle' | 'KvK' | 'Alliance' | 'Flags' | 'Pixel Art' | 'Nature' | 'Funny' | 'Gaming' | 'Seasonal' | 'Other'
export type CommunityArtAttribution = 'profile' | 'custom' | 'anonymous'
export type CommunityArtCompatibility = 'untested' | 'needs_testing' | 'verified' | 'known_issues'
export type CommunityArtReactionType = 'like' | 'heart' | 'smile' | 'wow'
export type CommunityArtReactionCounts = Record<CommunityArtReactionType, number>
export type CommunityArtRecord = {
  id: string
  title: string
  description: string
  category: CommunityArtCategory
  tags: string[]
  artworkText: string
  rawSourceText?: string
  normalisedText: string
  approvedCopyPayload: string | null
  renderedPreviewPayload: string
  compatibilityProfile: string
  repairOperations: Array<Record<string, unknown>>
  sourceHash: string | null
  approvedPayloadHash: string | null
  attribution: string | null
  status: 'pending' | 'approved' | 'rejected' | 'published'
  compatibilityStatus: CommunityArtCompatibility
  characterCount: number
  lineCount: number
  sizeClass: 'compact' | 'standard' | 'large'
  createdAt: string
  moderatedAt: string | null
  publishedAt: string | null
  submitterFeedback?: string | null
  source?: string
  testedInKingshot?: boolean
  reactionCounts: CommunityArtReactionCounts
  myReaction: CommunityArtReactionType | null
  ingestionMode?: IngestionMode
  originalFilename?: string | null
  originalMimeType?: string | null
  exactBytePreserved?: boolean
  detectedLineEnding?: string | null
  crlfCount?: number | null
  lfCount?: number | null
  rawSourceSha256?: string | null
  rawSourceByteLength?: number | null
  submitterContext?: {
    userId: string
    attributionType: CommunityArtAttribution
    attributionName: string | null
  }
}

export const COMMUNITY_ART_CATEGORIES: Array<'All' | CommunityArtCategory> = ['All', 'Cats', 'Animals', 'Characters', 'Announcements', 'Battle', 'KvK', 'Alliance', 'Flags', 'Pixel Art', 'Nature', 'Funny', 'Gaming', 'Seasonal', 'Other']

async function api<T>(action: string, init?: RequestInit): Promise<T> {
  const session = (await supabase.auth.getSession()).data.session
  let response: Response
  try {
    response = await fetch(`/api/art-studio?action=${action}`, { ...init, headers: { 'Content-Type': 'application/json', ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}), ...(init?.headers ?? {}) } })
  } catch {
    throw new Error('We couldn’t submit your artwork. Your draft is still here — please try again.')
  }
  let payload: { status: string; data?: T; message?: string }
  try {
    payload = await response.json() as { status: string; data?: T; message?: string }
  } catch {
    throw new Error('We couldn’t submit your artwork. Your draft is still here — please try again.')
  }
  if (!response.ok || payload.status !== 'success') throw new Error(payload.message ?? 'Art Studio request failed.')
  return payload.data as T
}

export function listCommunityGallery() { return api<CommunityArtRecord[]>('gallery') }
export function listMyCommunityArt() { return api<CommunityArtRecord[]>('mine') }
export function listCommunityArtQueue() { return api<CommunityArtRecord[]>('queue') }
export function listMyCommunityArtReactions() { return api<Array<{ artworkId: string; reactionType: CommunityArtReactionType }>>('my-reactions') }
export function reactToCommunityArt(input: { artworkId: string; reactionType: CommunityArtReactionType | null }) { return api<{ artworkId: string; reactionCounts: CommunityArtReactionCounts; myReaction: CommunityArtReactionType | null }>('react', { method: 'POST', body: JSON.stringify(input) }) }

export function submitCommunityArt(input: {
  requestId?: string
  title: string
  description: string
  category: CommunityArtCategory
  tags: string[]
  artworkText: string
  attributionType: CommunityArtAttribution
  attributionName: string | null
  ownershipConfirmed: boolean
  guidelinesConfirmed: boolean
  ingestionMode: Exclude<IngestionMode, 'legacy_import'>
  originalFilename?: string | null
  originalMimeType?: string | null
  rawBytesBase64: string
  browserReceivedText?: string | null
  normalisationOperations?: Array<Record<string, unknown>>
}) {
  return api<CommunityArtRecord>('submit', { method: 'POST', body: JSON.stringify({ ...input, requestId: input.requestId ?? crypto.randomUUID() }) })
}

export function moderateCommunityArt(input: {
  id: string
  action: 'approve' | 'reject' | 'publish' | 'update'
  note: string
  feedback: string
  compatibilityStatus: CommunityArtCompatibility
  title?: string
  description?: string
  category?: CommunityArtCategory
  tags?: string[]
  approvedPayload?: string
  repairOperations?: Array<Record<string, unknown>>
}) {
  return api<CommunityArtRecord>('moderate', { method: 'POST', body: JSON.stringify(input) })
}
