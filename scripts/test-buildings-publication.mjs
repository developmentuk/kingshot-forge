import assert from 'node:assert/strict'
import fs from 'node:fs'

const migration = fs.readFileSync('supabase/migrations/20260720200000_rel003_buildings_publication.sql', 'utf8')
const hardening = fs.readFileSync('supabase/migrations/20260720201000_rel003_publication_hardening.sql', 'utf8')
const api = fs.readFileSync('api/data-studio/buildings-publication.ts', 'utf8')
const loader = fs.readFileSync('server/data-engine/loadPublishedBuildingsDataset.ts', 'utf8')

for (const token of [
  'forge_warning_decisions', 'forge_warning_decision_audits', 'buildings_publication_versions',
  'buildings_publication_records', 'buildings_publication_prerequisites', 'buildings_publication_refreshes',
  'get_buildings_publication_manifest', 'record_buildings_warning_decision', 'publish_buildings_import_run',
  'complete_buildings_publication_refreshes', 'preview_buildings_rollback', 'rel003_actor_has_permission',
  'pg_advisory_xact_lock', 'manifest_hash', 'idempotency_key', 'service_role',
]) assert.match(migration, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `migration contract: ${token}`)
for (const token of ['rollback_buildings_publication', 'on conflict (run_id) do nothing', 'history.restore']) assert.match(hardening, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `hardening contract: ${token}`)
for (const token of ['record_buildings_warning_decision', 'publish_buildings_import_run', 'complete_buildings_publication_refreshes', 'preview_buildings_rollback', 'manifestHash', 'idempotencyKey']) assert.match(api, new RegExp(token), `API contract: ${token}`)
assert.match(loader, /editorial_status.*published/)
assert.match(loader, /published_version.*is', null/, 'published-only loader must exclude unpublished rows')
assert.match(loader, /buildings_publication_versions/)
assert.doesNotMatch(api, /\.from\(['"]buildings['"]\)\s*\.insert/)
console.log('REL-003 Buildings publication contract tests passed.')
