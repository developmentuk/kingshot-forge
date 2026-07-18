import { supabase } from '../lib/supabase'

export type CommunityArtCategory = 'Cats' | 'Animals' | 'Characters' | 'Announcements' | 'Battle' | 'KvK' | 'Alliance' | 'Flags' | 'Pixel Art' | 'Nature' | 'Funny' | 'Gaming' | 'Seasonal' | 'Other'
export type CommunityArtAttribution = 'profile' | 'custom' | 'anonymous'
export type CommunityArtCompatibility = 'untested' | 'needs_testing' | 'verified' | 'known_issues'
export type CommunityArtRecord = {
  id: string
  title: string
  description: string
  category: CommunityArtCategory
  tags: string[]
  artworkText: string
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

export function submitCommunityArt(input: {
  title: string
  description: string
  category: CommunityArtCategory
  tags: string[]
  artworkText: string
  attributionType: CommunityArtAttribution
  attributionName: string | null
  ownershipConfirmed: boolean
  guidelinesConfirmed: boolean
}) {
  return api<CommunityArtRecord>('submit', { method: 'POST', body: JSON.stringify(input) })
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
}) {
  return api<CommunityArtRecord>('moderate', { method: 'POST', body: JSON.stringify(input) })
}
