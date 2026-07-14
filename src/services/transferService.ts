import { supabase } from '../lib/supabase'
import type { TransferProfile } from '../types/transfer'

export async function getMyTransferProfile(
  userId: string,
): Promise<TransferProfile | null> {
  const { data, error } = await supabase
    .from('transfer_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data
    ? (data as TransferProfile)
    : null
}

export async function createTransferProfile(
  values: Omit<
    TransferProfile,
    | 'id'
    | 'created_at'
    | 'updated_at'
    | 'last_refreshed_at'
  >,
): Promise<TransferProfile> {
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('transfer_profiles')
    .insert({
      ...values,
      last_refreshed_at: now,
      created_at: now,
      updated_at: now,
    })
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as TransferProfile
}

export async function updateTransferProfile(
  profileId: string,
  userId: string,
  values: Partial<TransferProfile>,
): Promise<TransferProfile> {
  const { data, error } = await supabase
    .from('transfer_profiles')
    .update({
      ...values,
      updated_at: new Date().toISOString(),
    })
    .eq('id', profileId)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as TransferProfile
}

export async function deleteTransferProfile(
  profileId: string,
  userId: string,
) {
  const { error } = await supabase
    .from('transfer_profiles')
    .delete()
    .eq('id', profileId)
    .eq('user_id', userId)

  if (error) {
    throw new Error(error.message)
  }
}