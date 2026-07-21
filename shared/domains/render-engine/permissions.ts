export type RenderEngineCapability = 'render_engine.inspect' | 'render_engine.calibrate' | 'render_engine.queue.read' | 'render_engine.moderate' | 'render_engine.raw.read' | 'render_engine.calibration.write'
export type RenderEngineActor = 'anonymous' | 'player' | 'verified_player' | 'contributor' | 'moderator' | 'administrator' | 'owner'

export const RENDER_ENGINE_CAPABILITY_MATRIX: Record<RenderEngineCapability, RenderEngineActor[]> = {
  'render_engine.inspect': ['moderator', 'administrator', 'owner'],
  'render_engine.calibrate': ['administrator', 'owner'],
  'render_engine.queue.read': ['moderator', 'administrator', 'owner'],
  'render_engine.moderate': ['moderator', 'administrator', 'owner'],
  'render_engine.raw.read': ['moderator', 'administrator', 'owner'],
  'render_engine.calibration.write': ['administrator', 'owner'],
}

export function canUseRenderEngine(actor: RenderEngineActor, capability: RenderEngineCapability): boolean { return RENDER_ENGINE_CAPABILITY_MATRIX[capability].includes(actor) }
