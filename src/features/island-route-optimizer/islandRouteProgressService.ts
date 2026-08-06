import { supabase } from '../../lib/supabase'
import {
  islandRouteProgressKey,
  mergeIslandRouteProgress,
  parseIslandRouteProgressState,
  type IslandRouteMode,
  type IslandRouteProgressState,
} from './islandRouteProgress.ts'

const TOOL_KEY = 'island-route-optimizer'

export async function loadIslandRouteProgress(userId: string, mode: IslandRouteMode): Promise<IslandRouteProgressState | null> {
  const progressKey = islandRouteProgressKey(mode)
  const { data, error } = await supabase
    .from('user_tool_progress')
    .select('state')
    .eq('user_id', userId)
    .eq('tool_key', TOOL_KEY)
    .eq('progress_key', progressKey)
    .maybeSingle()

  if (error) throw error
  return parseIslandRouteProgressState(data?.state, mode)
}

export async function saveIslandRouteProgress(userId: string, state: IslandRouteProgressState): Promise<void> {
  const progressKey = islandRouteProgressKey(state.mode)
  const { error } = await supabase
    .from('user_tool_progress')
    .upsert({
      user_id: userId,
      tool_key: TOOL_KEY,
      progress_key: progressKey,
      state,
    }, { onConflict: 'user_id,tool_key,progress_key' })

  if (error) throw error
}

export { islandRouteProgressKey, mergeIslandRouteProgress }
