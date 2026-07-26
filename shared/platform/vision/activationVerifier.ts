export type VisionActivationMetadata = {
  migrationApplied: string[]
  enums: string[]
  tables: Array<{ name: string; rlsEnabled: boolean; forceRls: boolean }>
  functions: Array<{ name: string; identityArgs?: string; security?: string; volatility?: string; searchPath?: string[] }>
  triggers: string[]
  indexes: string[]
  policies: string[]
  grants: Array<{ object: string; grantee: string; privilege: string }>
  permissions: string[]
  extractorPlugins: string[]
  screenTypeCount: number
  mappingVersionCount: number
  fieldMappingCount: number
  storageBucket?: { name: string; public: boolean; fileSizeLimit: number; mimeTypes: string[] } | null
}

const expectedMigration = '20260722193000_vision_001a_contracts_and_persistence.sql'
const expectedEnums = [
  'vision_mapping_status', 'vision_scan_status', 'vision_value_status', 'vision_extractor_family',
  'vision_execution_mode', 'vision_plugin_status', 'vision_detection_method',
]
const expectedTables = [
  'vision_field_registry', 'vision_extractor_plugins', 'vision_screen_types', 'vision_mapping_versions',
  'vision_evidence_images', 'vision_mapping_reference_images', 'vision_regions', 'vision_field_mappings',
  'vision_mapping_extractors', 'vision_mapping_regions', 'vision_test_cases', 'vision_test_results',
  'vision_scan_runs', 'vision_scan_values', 'vision_extraction_evidence', 'vision_user_corrections', 'vision_audit_events',
]
const expectedPolicies = [
  'vision_registry_read', 'vision_plugins_read', 'vision_screen_types_read', 'vision_versions_read',
  'vision_regions_read', 'vision_mappings_read', 'vision_mapping_extractors_read', 'vision_mapping_regions_read',
  'vision_admin_references_read', 'vision_admin_test_cases_read', 'vision_admin_test_results_read', 'vision_images_read',
  'vision_scans_read', 'vision_values_read', 'vision_extraction_evidence_read', 'vision_corrections_read', 'vision_audit_read',
]
const expectedTriggers = [
  'guard_published_vision_version', 'guard_published_vision_region', 'guard_published_vision_mapping',
  'guard_published_vision_reference', 'guard_published_vision_test_case', 'guard_published_vision_mapping_extractor',
  'guard_published_vision_mapping_region', 'vision_test_results_append_only', 'vision_extraction_evidence_append_only',
  'vision_user_corrections_append_only', 'vision_audit_events_append_only',
]
const expectedIndexes = ['vision_versions_screen_status_idx', 'vision_scans_user_created_idx', 'vision_evidence_scan_value_idx', 'vision_audit_entity_idx']
const expectedFunctions = ['guard_published_vision_version_mutation', 'guard_published_vision_direct_child_mutation', 'guard_published_vision_mapping_child_mutation', 'guard_append_only_vision_evidence', 'publish_vision_mapping_version']
const expectedPermissions = ['vision.admin.read', 'vision.admin.edit', 'vision.mapping.publish', 'vision.scan.run', 'vision.evidence.review']

function missing(expected: string[], actual: string[]) {
  return expected.filter((value) => !actual.includes(value))
}

export function verifyVisionActivation(metadata: VisionActivationMetadata, includeStorage = false) {
  const errors: string[] = []
  const checks: string[] = []
  if (!metadata.migrationApplied.includes(expectedMigration)) errors.push(`migration not recorded: ${expectedMigration}`)
  for (const [label, expected, actual] of [
    ['enum', expectedEnums, metadata.enums], ['table', expectedTables, metadata.tables.map((table) => table.name)],
    ['function', expectedFunctions, metadata.functions.map((fn) => fn.name)], ['trigger', expectedTriggers, metadata.triggers],
    ['index', expectedIndexes, metadata.indexes], ['policy', expectedPolicies, metadata.policies], ['permission', expectedPermissions, metadata.permissions],
  ] as const) {
    const absent = missing(expected, actual)
    if (absent.length) errors.push(`missing ${label}: ${absent.join(', ')}`)
  }
  const unexpectedTables = metadata.tables.map((table) => table.name).filter((name) => !expectedTables.includes(name))
  if (unexpectedTables.length) errors.push(`unexpected vision table: ${unexpectedTables.join(', ')}`)
  const nonRls = metadata.tables.filter((table) => !table.rlsEnabled || !table.forceRls).map((table) => table.name)
  if (nonRls.length) errors.push(`RLS/FORCE RLS incomplete: ${nonRls.join(', ')}`)
  if (!metadata.extractorPlugins.includes('tesseract')) errors.push('canonical Tesseract extractor plugin is missing')
  if (metadata.screenTypeCount !== 0 || metadata.mappingVersionCount !== 0 || metadata.fieldMappingCount !== 0) errors.push('activation metadata contains screen, mapping, or field-mapping seeds')
  if (!metadata.grants.some((grant) => grant.grantee === 'authenticated' && grant.privilege === 'SELECT')) errors.push('authenticated SELECT grants are missing')
  if (metadata.grants.some((grant) => grant.grantee === 'anon' && ['INSERT', 'UPDATE', 'DELETE'].includes(grant.privilege))) errors.push('anon mutation grant detected')
  if (includeStorage) {
    const bucket = metadata.storageBucket
    if (!bucket || bucket.name !== 'vision-evidence' || bucket.public || bucket.fileSizeLimit !== 16777216 || bucket.mimeTypes.join('|') !== 'image/png|image/jpeg|image/webp|image/tiff') errors.push('vision-evidence storage bucket configuration is not canonical')
  }
  if (!errors.length) checks.push('VISION-001A persistence contract matches the canonical activation metadata')
  return { ok: errors.length === 0, errors, checks }
}

export const visionActivationExpectations = { expectedMigration, expectedEnums, expectedTables, expectedFunctions, expectedTriggers, expectedIndexes, expectedPolicies, expectedPermissions }
