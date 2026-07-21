export type RenderEngineCapability = 'render_engine.view' | 'render_engine.inspect' | 'render_engine.calibrate' | 'render_engine.manage_profiles' | 'community_art.moderate' | 'community_art.approve'
export type RenderEngineActor = 'anonymous' | 'player' | 'verified_player' | 'contributor' | 'moderator' | 'administrator' | 'owner'

export const RENDER_ENGINE_ROLE_CAPABILITIES: Record<Exclude<RenderEngineActor, 'anonymous' | 'player' | 'verified_player' | 'contributor'>, RenderEngineCapability[]> = {
  moderator: ['render_engine.view', 'render_engine.inspect', 'community_art.moderate', 'community_art.approve'],
  administrator: ['render_engine.view', 'render_engine.inspect', 'render_engine.calibrate', 'render_engine.manage_profiles', 'community_art.moderate', 'community_art.approve'],
  owner: ['render_engine.view', 'render_engine.inspect', 'render_engine.calibrate', 'render_engine.manage_profiles', 'community_art.moderate', 'community_art.approve'],
}

export const RENDER_ENGINE_CAPABILITIES = Object.keys(RENDER_ENGINE_ROLE_CAPABILITIES.owner) as RenderEngineCapability[]
export function canUseRenderEngine(actor: RenderEngineActor, capability: RenderEngineCapability): boolean { return actor in RENDER_ENGINE_ROLE_CAPABILITIES && RENDER_ENGINE_ROLE_CAPABILITIES[actor as keyof typeof RENDER_ENGINE_ROLE_CAPABILITIES].includes(capability) }
