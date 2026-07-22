import assert from 'node:assert/strict'
import fs from 'node:fs'

const contracts = fs.readFileSync('shared/domains/vision-mapper/contracts.ts', 'utf8')
const migration = fs.readFileSync('supabase/migrations/20260722193000_vision_001a_contracts_and_persistence.sql', 'utf8')
const architecture = fs.readFileSync('docs/architecture/FORGE-VISION-MAPPER.md', 'utf8')

const initialFields = [
  'player.game_name',
  'player.game_id',
  'player.power',
  'player.kills',
  'player.alliance_name',
  'player.kingdom_id',
  'player.avatar_evidence',
]

for (const field of initialFields) {
  assert.match(contracts, new RegExp(field.replace('.', '\\.')), `contracts must register ${field}`)
  assert.match(migration, new RegExp(field.replace('.', '\\.')), `migration must seed ${field}`)
}

for (const table of [
  'vision_field_registry',
  'vision_screen_types',
  'vision_screen_versions',
  'vision_reference_images',
  'vision_regions',
  'vision_field_mappings',
  'vision_scan_runs',
  'vision_scan_values',
  'vision_user_corrections',
  'vision_audit_events',
]) {
  assert.match(migration, new RegExp(`create table public\\.${table}`), `${table} must exist`)
  assert.match(migration, new RegExp(`alter table public\\.${table} force row level security`), `${table} must FORCE RLS`)
}

for (const permission of [
  'vision.admin.read',
  'vision.admin.edit',
  'vision.admin.test',
  'vision.admin.publish',
  'vision.scan.create',
  'vision.scan.review-own',
  'vision.evidence.review',
]) assert.match(migration, new RegExp(permission.replace('.', '\\.')), `${permission} must be registered`)

assert.match(migration, /guard_published_vision_version_mutation/, 'published versions need an immutable guard')
assert.match(migration, /guard_published_vision_child_mutation/, 'published regions need an immutable guard')
assert.match(migration, /guard_published_vision_mapping_mutation/, 'published mappings need an immutable guard')
assert.match(migration, /field_key text not null references public\.vision_field_registry/, 'mappings must target the governed registry')
assert.doesNotMatch(migration, /target_table|target_column|arbitrary_sql|custom_code/, 'mapping persistence must not expose arbitrary write targets')
assert.match(migration, /x numeric\(9,8\).*check \(x >= 0 and x <= 1\)/, 'regions must use normalised x coordinates')
assert.match(migration, /retention_until/, 'screenshot evidence needs retention metadata')
assert.match(migration, /deleted_at/, 'screenshot evidence needs deletion metadata')
assert.match(architecture, /OCR extracts evidence\. It does not prove identity or account ownership\./, 'identity boundary must stay explicit')

assert.match(contracts, /assertEditableVisionVersion/, 'contracts need an immutable-version guard')
assert.match(contracts, /assertRegistryTarget/, 'contracts need a registry-target guard')
assert.match(contracts, /isNormalisedGeometry/, 'contracts need geometry validation')

console.log('Vision Mapper contract tests passed: registry targets, immutable publication, RLS, retention, geometry and identity boundary.')
