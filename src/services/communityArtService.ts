import { supabase } from '../lib/supabase'

export type CommunityArtCategory = 'alliance_banner' | 'profile_banner' | 'player_name_design' | 'chat_decoration' | 'alliance_art' | 'other'
export type CommunityArtAttribution = 'profile' | 'custom' | 'anonymous'
export type CommunityArtRecord = {
  id: string
  title: string
  description: string
  category: CommunityArtCategory
  tags: string[]
  attribution: string | null
  status: 'pending' | 'approved' | 'rejected' | 'published'
  createdAt: string
  moderatedAt: string | null
  publishedAt: string | null
  imageUrl: string | null
  imageWidth: number
  imageHeight: number
  mimeType: string
}

export const COMMUNITY_ART_CATEGORIES: Array<{ value: CommunityArtCategory; label: string }> = [
  { value: 'alliance_banner', label: 'Alliance Banner' },
  { value: 'profile_banner', label: 'Profile Banner' },
  { value: 'player_name_design', label: 'Player Name Design' },
  { value: 'chat_decoration', label: 'Chat Decoration' },
  { value: 'alliance_art', label: 'Alliance Art' },
  { value: 'other', label: 'Other' },
]

async function api<T>(action: string, init?: RequestInit): Promise<T> {
  const session = (await supabase.auth.getSession()).data.session
  const response = await fetch(`/api/art-studio?action=${action}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}), ...(init?.headers ?? {}) },
  })
  const payload = await response.json() as { status: string; data?: T; message?: string }
  if (!response.ok || payload.status !== 'success') throw new Error(payload.message ?? 'Community Art Studio request failed.')
  return payload.data as T
}

export function listCommunityGallery() {
  return api<CommunityArtRecord[]>('gallery')
}

export function listMyCommunityArt() {
  return api<CommunityArtRecord[]>('mine')
}

export function listCommunityArtQueue() {
  return api<CommunityArtRecord[]>('queue')
}

export async function submitCommunityArt(input: {
  title: string
  description: string
  category: CommunityArtCategory
  tags: string[]
  file: File
  attributionType: CommunityArtAttribution
  attributionName: string | null
  ownershipConfirmed: boolean
  guidelinesConfirmed: boolean
  imageWidth: number
  imageHeight: number
}) {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) throw new Error('Sign in to submit community artwork.')
  const extension = input.file.type === 'image/jpeg' ? 'jpg' : input.file.type.split('/')[1]
  const storagePath = `${user.id}/${crypto.randomUUID()}.${extension}`
  const { error: uploadError } = await supabase.storage.from('community-art-submissions').upload(storagePath, input.file, {
    cacheControl: '3600', contentType: input.file.type, upsert: false,
  })
  if (uploadError) throw new Error('The artwork upload failed. Check the file and try again.')
  return api<CommunityArtRecord>('submit', {
    method: 'POST',
    body: JSON.stringify({
      title: input.title, description: input.description, category: input.category, tags: input.tags,
      storagePath, mimeType: input.file.type, fileSizeBytes: input.file.size,
      imageWidth: input.imageWidth, imageHeight: input.imageHeight,
      attributionType: input.attributionType, attributionName: input.attributionName,
      ownershipConfirmed: input.ownershipConfirmed, guidelinesConfirmed: input.guidelinesConfirmed,
    }),
  })
}

export function moderateCommunityArt(id: string, action: 'approve' | 'reject' | 'publish', note: string) {
  return api<CommunityArtRecord>('moderate', { method: 'POST', body: JSON.stringify({ id, action, note }) })
}
