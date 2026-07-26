export type VisionPermissionGate = 'cms.view' | 'vision.admin.read'

export type VisionPermissionReadiness = {
  persistenceMigrationApplied: boolean
  livePermissionVerified: boolean
  authenticatedApiChecksPassed: boolean
}

export function resolveVisionStudioGate(readiness: VisionPermissionReadiness): VisionPermissionGate {
  return readiness.persistenceMigrationApplied && readiness.livePermissionVerified && readiness.authenticatedApiChecksPassed
    ? 'vision.admin.read'
    : 'cms.view'
}
