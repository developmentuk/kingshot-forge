import type { ForgePermission, ForgePlatformRole } from '../context/RoleContext'

export type ForgeWorkspaceId = 'player' | 'contributor' | 'creator' | 'moderation' | 'operations'

export type WorkspaceAccess = {
  user: boolean
  role: ForgePlatformRole
  hasPermission: (permission: ForgePermission) => boolean
}

export type WorkspaceNavItem = {
  label: string
  shortLabel: string
  icon: string
  path: string
  permission?: ForgePermission
  status?: 'partial' | 'planned' | 'unavailable'
}

export type ForgeWorkspace = {
  id: ForgeWorkspaceId
  label: string
  description: string
  homePath: string
  canAccess: (access: WorkspaceAccess) => boolean
  groups: ReadonlyArray<{ title: string; items: ReadonlyArray<WorkspaceNavItem> }>
}

const playerGroups = [
  { title: 'Forge tools', items: [
    { label: 'Name Studio', shortLabel: 'Names', icon: '✨', path: '/name-studio' },
    { label: 'Art Studio', shortLabel: 'Art', icon: '🎨', path: '/art-studio' },
    { label: 'Chat Studio', shortLabel: 'Chat', icon: '💬', path: '/chat-studio' },
  ] },
  { title: 'My Forge', items: [
    { label: 'Dashboard', shortLabel: 'Dashboard', icon: '⭐', path: '/my-forge' },
    { label: 'Player Passport', shortLabel: 'Passport', icon: '🛡️', path: '/my-forge/player-identity' },
    { label: 'Edit Passport', shortLabel: 'Edit Passport', icon: '🪪', path: '/my-forge/profile' },
    { label: 'Hero Collection', shortLabel: 'Heroes', icon: '🦸', path: '/my-forge/hero-collection' },
    { label: 'Hero Showcase', shortLabel: 'Showcase', icon: '🏆', path: '/my-forge/heroes' },
    { label: 'Personal Progression', shortLabel: 'Progression', icon: '📈', path: '/my-forge/progression' },
    { label: 'Transfer Profile', shortLabel: 'Transfer', icon: '🎫', path: '/my-forge/transfer-profile' },
    { label: 'Settings', shortLabel: 'Settings', icon: '⚙️', path: '/settings' },
  ] },
  { title: 'Kingshot companion', items: [
    { label: 'Buildings', shortLabel: 'Buildings', icon: '🏛️', path: '/buildings' },
    { label: 'Hero Companion', shortLabel: 'Heroes', icon: '🦸', path: '/companion/heroes' },
    { label: 'Player Lookup', shortLabel: 'Players', icon: '👤', path: '/player-lookup' },
    { label: 'Gift Codes', shortLabel: 'Codes', icon: '🎁', path: '/gift-codes' },
    { label: 'Kingdom Explorer', shortLabel: 'Kingdoms', icon: '🏰', path: '/kingdom-explorer' },
    { label: 'Kingdom Community', shortLabel: 'Community', icon: '🌍', path: '/kingdom-community' },
    { label: 'Alliance Directory', shortLabel: 'Alliances', icon: '🛡️', path: '/alliance-directory' },
    { label: 'KvK Tracker', shortLabel: 'KvK', icon: '⚔️', path: '/kvk-tracker' },
    { label: 'Transfer Hub', shortLabel: 'Hub', icon: '🌐', path: '/transfer-hub' },
  ] },
  { title: 'Library and updates', items: [
    { label: 'Character Library', shortLabel: 'Characters', icon: '🔤', path: '/characters' },
    { label: 'Compatibility', shortLabel: 'Compatibility', icon: '✅', path: '/compatibility' },
    { label: 'Codex', shortLabel: 'Codex', icon: '📚', path: '/codex' },
    { label: 'Roadmap', shortLabel: 'Roadmap', icon: '🗺️', path: '/roadmap' },
    { label: 'Release Notes', shortLabel: 'Updates', icon: '🚀', path: '/release-notes' },
    { label: 'Join Forge', shortLabel: 'Join', icon: '🤝', path: '/join' },
  ] },
] as const

const contributorGroups = [
  { title: 'Contribution', items: [
    { label: 'Contributor overview', shortLabel: 'Overview', icon: '✍️', path: '/contributor' },
    { label: 'My Application', shortLabel: 'Application', icon: '📨', path: '/join/my-application' },
    { label: 'My drafts', shortLabel: 'Drafts', icon: '📝', path: '/contributor/drafts', status: 'planned' as const },
    { label: 'Submission history', shortLabel: 'History', icon: '🗂️', path: '/contributor/submissions', status: 'planned' as const },
    { label: 'Verification Centre', shortLabel: 'Verify', icon: '🧭', path: '/admin/verification', permission: 'cms.view' as ForgePermission },
  ] },
] as const

const creatorGroups = [
  { title: 'Creator tools', items: [
    { label: 'Creator overview', shortLabel: 'Overview', icon: '🎬', path: '/creator' },
    { label: 'My content', shortLabel: 'Content', icon: '🎨', path: '/creator/content', status: 'planned' as const },
    { label: 'Creator verification', shortLabel: 'Verification', icon: '✅', path: '/creator/verification', status: 'planned' as const },
  ] },
] as const

const moderationGroups = [
  { title: 'Community review', items: [
    { label: 'Moderation overview', shortLabel: 'Overview', icon: '🛡️', path: '/moderation' },
    { label: 'Community Art queue', shortLabel: 'Art queue', icon: '🎨', path: '/admin/community-art', permission: 'moderation.manage' as ForgePermission },
    { label: 'Feedback Queue', shortLabel: 'Feedback', icon: '💬', path: '/admin/feedback', permission: 'moderation.manage' as ForgePermission, status: 'partial' as const },
    { label: 'Reports', shortLabel: 'Reports', icon: '🚩', path: '/moderation/reports', status: 'planned' as const },
  ] },
] as const

const operationsGroups = [
  { title: 'Overview', items: [{ label: 'Operations dashboard', shortLabel: 'Overview', icon: '🛠️', path: '/operations' }] },
  { title: 'Observability', items: [{ label: 'Analytics', shortLabel: 'Analytics', icon: '📊', path: '/admin/analytics', permission: 'cms.view' as ForgePermission }] },
  { title: 'Content operations', items: [
    { label: 'Content Studio', shortLabel: 'Studio', icon: '🧩', path: '/admin/content-studio', permission: 'cms.view' as ForgePermission },
    { label: 'Datasets', shortLabel: 'Data', icon: '🗄️', path: '/admin/datasets', permission: 'cms.view' as ForgePermission },
    { label: 'Verification Centre', shortLabel: 'Verify', icon: '🧭', path: '/admin/verification', permission: 'cms.view' as ForgePermission },
    { label: 'Import Manager', shortLabel: 'Import', icon: '📥', path: '/admin/imports', permission: 'cms.import.run' as ForgePermission, status: 'planned' as const },
    { label: 'Publish Centre', shortLabel: 'Publish', icon: '🚀', path: '/admin/publish', permission: 'cms.publish' as ForgePermission, status: 'planned' as const },
    { label: 'Version History', shortLabel: 'History', icon: '🕒', path: '/admin/history', permission: 'cms.history.view' as ForgePermission, status: 'planned' as const },
    { label: 'Data Engine', shortLabel: 'Engine', icon: '⚙️', path: '/admin/data-engine', permission: 'cms.view' as ForgePermission },
    { label: 'Render Engine', shortLabel: 'Render', icon: '🖼️', path: '/admin/render-engine', permission: 'render_engine.view' as ForgePermission },
  ] },
  { title: 'Community operations', items: [
    { label: 'Contributor Applications', shortLabel: 'Applications', icon: '🤝', path: '/operations/applications', permission: 'applications.read' as ForgePermission },
  ] },
  { title: 'Player and community operations', items: [
    { label: 'User Management', shortLabel: 'Users', icon: '👥', path: '/operations/users', permission: 'users.read' as ForgePermission },
    { label: 'Player Identity', shortLabel: 'Identity', icon: '🛡️', path: '/admin/player-identity', permission: 'platform.users.manage' as ForgePermission, status: 'partial' as const },
    { label: 'Gift Redemption', shortLabel: 'Gifts', icon: '🎁', path: '/admin/gift-redemption', permission: 'cms.view' as ForgePermission },
    { label: 'Community Art', shortLabel: 'Art', icon: '🎨', path: '/admin/community-art', permission: 'moderation.manage' as ForgePermission },
  ] },
  { title: 'Security and governance', items: [
    { label: 'Roles and Permissions', shortLabel: 'Roles', icon: '🔐', path: '/operations/roles', permission: 'platform.users.manage' as ForgePermission, status: 'planned' as const },
    { label: 'Audit Log', shortLabel: 'Audit', icon: '📜', path: '/operations/audit-log', permission: 'platform.users.manage' as ForgePermission, status: 'planned' as const },
    { label: 'Feature Flags', shortLabel: 'Flags', icon: '🚦', path: '/operations/feature-flags', permission: 'platform.users.manage' as ForgePermission, status: 'planned' as const },
  ] },
] as const

export const forgeWorkspaces: ReadonlyArray<ForgeWorkspace> = [
  { id: 'player', label: 'Player View', description: 'Player and public Forge tools.', homePath: '/', canAccess: () => true, groups: playerGroups },
  { id: 'contributor', label: 'Contributor Centre', description: 'Contribution and editorial tools for approved contributors.', homePath: '/contributor', canAccess: ({ user, hasPermission }) => user && (hasPermission('contributions.submit') || hasPermission('cms.records.edit')), groups: contributorGroups },
  { id: 'creator', label: 'Creator Centre', description: 'Creator profile and content workflow tools.', homePath: '/creator', canAccess: ({ user, role, hasPermission }) => user && (role === 'content_creator' || hasPermission('contributions.submit') || hasPermission('cms.records.edit')), groups: creatorGroups },
  { id: 'moderation', label: 'Moderation Centre', description: 'Community review and moderation queues.', homePath: '/moderation', canAccess: ({ user, hasPermission }) => user && hasPermission('moderation.manage'), groups: moderationGroups },
  { id: 'operations', label: 'Forge Operations Centre', description: 'Platform, player, content and security operations.', homePath: '/operations', canAccess: ({ user, role, hasPermission }) => user && (role === 'owner' || role === 'admin' || hasPermission('platform.users.manage') || hasPermission('cms.view')), groups: operationsGroups },
]

export function getWorkspace(id: ForgeWorkspaceId) {
  return forgeWorkspaces.find((workspace) => workspace.id === id) ?? forgeWorkspaces[0]
}

export function accessibleWorkspaces(access: WorkspaceAccess) {
  return forgeWorkspaces.filter((workspace) => workspace.canAccess(access))
}

export function workspaceForPath(pathname: string): ForgeWorkspaceId {
  if (pathname.startsWith('/operations') || pathname.startsWith('/admin')) return 'operations'
  if (pathname.startsWith('/moderation')) return 'moderation'
  if (pathname.startsWith('/creator')) return 'creator'
  if (pathname.startsWith('/contributor')) return 'contributor'
  return 'player'
}
