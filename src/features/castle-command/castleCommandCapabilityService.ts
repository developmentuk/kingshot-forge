import { supabase } from '../../lib/supabase'

export type CastleCommandManagementCapability = 'allowed' | 'denied' | 'unavailable'

export async function checkCastleCommandManagement(
  allianceId: string,
): Promise<CastleCommandManagementCapability> {
  const result = await supabase.rpc('can_manage_castle_command', {
    target_alliance_id: allianceId,
  })

  if (!result.error) return result.data === true ? 'allowed' : 'denied'

  const code = result.error.code
  const message = result.error.message.toLowerCase()
  if (
    code === '42P01' ||
    code === 'PGRST202' ||
    code === 'PGRST205' ||
    (message.includes('can_manage_castle_command') && message.includes('schema cache'))
  ) {
    return 'unavailable'
  }

  throw new Error(result.error.message)
}
