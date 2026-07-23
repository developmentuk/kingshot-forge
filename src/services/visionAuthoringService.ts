import { supabase } from '../lib/supabase'
import type { VisionField, VisionExtractor, VisionMappingVersion, VisionScreenType } from '../../shared/domains/vision-mapper/authoring'

export type VisionAuthoringSnapshot = { screenTypes: VisionScreenType[]; versions: VisionMappingVersion[]; fields: VisionField[]; extractors: VisionExtractor[] }
export async function loadVisionAuthoring(): Promise<VisionAuthoringSnapshot> {
  const session = (await supabase.auth.getSession()).data.session
  const response = await fetch('/api/vision', { headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined })
  const body = await response.json() as { data?: VisionAuthoringSnapshot; message?: string }
  if (!response.ok) throw new Error(body.message ?? 'Vision persistence is unavailable.')
  return body.data ?? { screenTypes: [], versions: [], fields: [], extractors: [] }
}
