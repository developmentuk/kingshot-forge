import { supabase } from '../lib/supabase'
import type { UserDetail, UserListItem } from '../../server/identity/contracts'
import type { NormalizedPlayerLookup } from '../types/player'

type ApiResponse<T> = { status: 'success' | 'error'; data?: T; message?: string }

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession()
  const response = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}), ...(init?.headers ?? {}) } })
  const payload = await response.json() as ApiResponse<T>
  if (!response.ok || payload.status !== 'success' || payload.data === undefined) throw new Error(payload.message ?? 'Forge identity request failed.')
  return payload.data
}

export type UserListQuery = { search?: string; role?: string; status?: string; page?: number; pageSize?: number }
export type UserListResponse = { items: UserListItem[]; page: number; pageSize: number; total: number; totalPages: number }
export type ManagedPlayerLookup = { source: 'mightpulse'; player: NormalizedPlayerLookup }
export type ManagedPlayerInput = {
  playerId: string
  kingdomId: string
  playerName?: string
  reason?: string
  mode?: 'lookup' | 'manual'
  replaceExisting?: boolean
}

export function getUsers(query: UserListQuery) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) if (value !== undefined && value !== '') params.set(key, String(value))
  return request<UserListResponse>(`/api/operations/users?${params.toString()}`)
}

export function getUser(userId: string) { return request<UserDetail>(`/api/operations/users?userId=${encodeURIComponent(userId)}`) }

export function mutateUser(userId: string, payload: { action: 'assign_role' | 'revoke_role' | 'change_status'; role?: string; status?: string; reason: string }) {
  return request<Record<string, unknown>>(`/api/operations/users?userId=${encodeURIComponent(userId)}`, { method: 'POST', body: JSON.stringify(payload) })
}

export function lookupPlayerForUser(userId: string, input: Pick<ManagedPlayerInput, 'playerId' | 'kingdomId'>) {
  return request<ManagedPlayerLookup>(`/api/operations/users?userId=${encodeURIComponent(userId)}`, { method: 'POST', body: JSON.stringify({ action: 'lookup_player', ...input }) })
}

export function linkPlayerForUser(userId: string, input: ManagedPlayerInput) {
  return request<Record<string, unknown>>(`/api/operations/users?userId=${encodeURIComponent(userId)}`, { method: 'POST', body: JSON.stringify({ action: 'link_player', ...input }) })
}
