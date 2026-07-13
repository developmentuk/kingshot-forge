import { supabase } from '../lib/supabase'
import type {
  AllianceMemberRole,
} from '../types/community'

export type AllianceMembershipStatus =
  | 'pending'
  | 'current'
  | 'previous'
  | 'rejected'
  | 'removed'
  | 'disputed'

export type AllianceMembershipDetails = {
  id: string
  alliance_id: string
  player_account_id: string
  user_id: string
  kingdom_id: string
  kingdom_number: number
  status: AllianceMembershipStatus
  member_role: AllianceMemberRole
  request_message: string | null
  review_notes: string | null
  joined_at: string | null
  left_at: string | null
  created_at: string
  updated_at: string

  alliance_tag: string
  alliance_name: string | null
  recruitment_status: string
  alliance_verification_status: string

  player_id: string
  player_name: string
  profile_photo: string | null
  player_level: number | null
  level_rendered: string | null
  level_rendered_detailed: string | null

  forge_id: string
}

export async function getMyAllianceMemberships(
  userId: string,
): Promise<AllianceMembershipDetails[]> {
  const { data, error } = await supabase
    .from('alliance_membership_details')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', {
      ascending: false,
    })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as AllianceMembershipDetails[]
}

export async function requestAllianceMembership(
  allianceId: string,
  message: string,
) {
  const { data, error } = await supabase.rpc(
    'request_alliance_membership',
    {
      target_alliance_id: allianceId,
      request_text: message.trim() || null,
    },
  )

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function cancelAllianceMembershipRequest(
  membershipId: string,
) {
  const { error } = await supabase.rpc(
    'cancel_alliance_membership_request',
    {
      membership_id: membershipId,
    },
  )

  if (error) {
    throw new Error(error.message)
  }
}

export async function approveAllianceMembership(
  membershipId: string,
  role: AllianceMemberRole = 'member',
  notes = '',
) {
  const { data, error } = await supabase.rpc(
    'approve_alliance_membership',
    {
      membership_id: membershipId,
      approved_role: role,
      review_text: notes.trim() || null,
    },
  )

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function rejectAllianceMembership(
  membershipId: string,
  notes = '',
) {
  const { data, error } = await supabase.rpc(
    'reject_alliance_membership',
    {
      membership_id: membershipId,
      review_text: notes.trim() || null,
    },
  )

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function leaveCurrentAlliance() {
  const { error } = await supabase.rpc(
    'leave_current_alliance',
  )

  if (error) {
    throw new Error(error.message)
  }
}