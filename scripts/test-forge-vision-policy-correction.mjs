import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'

const migrationDir = new URL('../supabase/migrations/', import.meta.url)
const correctionPath = new URL('./20260723120000_vision_screen_types_read_policy_fix.sql', migrationDir)
const persistencePath = 'supabase/migrations/20260722193000_vision_001a_contracts_and_persistence.sql'
const storagePath = 'supabase/migrations/20260723181223_vision_evidence_storage.sql'
const correction = readFileSync(correctionPath, 'utf8').replace(/\r\n/g, '\n')
const persistence = execFileSync('git', ['show', `HEAD:${persistencePath}`], { encoding: 'utf8' })
const storage = execFileSync('git', ['show', `HEAD:${storagePath}`], { encoding: 'utf8' })
const manifest = JSON.parse(readFileSync(new URL('../docs/operations/FORGE-VISION-ACTIVATION-MANIFEST.json', import.meta.url), 'utf8'))
const digest = (value) => createHash('sha256').update(value).digest('hex')
const correctionManifest = manifest.persistenceCorrections.find((entry) => entry.path.endsWith('20260723120000_vision_screen_types_read_policy_fix.sql'))
const migrationNames = readdirSync(migrationDir)

assert.equal(digest(Buffer.from(persistence)), '762dab82ccd9cbbbbec499184d8adfc285b9af9a3d40acbbdabe8a25aebacdaa')
assert.equal(digest(Buffer.from(storage)), '0b7a3f7a0c8ac2db78bc9d172c7efcdff17ed4c807867ef67af80aadc77104dd')
assert.equal(migrationNames.filter((name) => name.startsWith('20260723120000_')).length, 1)
assert.ok(Number(correctionManifest.version) > 20260722193000)
assert.ok(Number(correctionManifest.version) < 20260723181223)
assert.equal(digest(readFileSync(correctionPath)), correctionManifest.canonicalSha256)

assert.match(correction, /begin;[\s\S]*drop policy if exists vision_screen_types_read[\s\S]*create policy vision_screen_types_read[\s\S]*commit;/i)
assert.match(correction, /for select\s+to authenticated/i)
assert.match(correction, /public\.has_forge_permission\('vision\.admin\.read'\)/)
assert.match(correction, /v\.screen_type_id = vision_screen_types\.id/)
assert.doesNotMatch(correction, /v\.screen_type_id = v\.id/)
assert.doesNotMatch(correction, /\b(create|alter|drop)\s+table\b|\b(insert|update|delete)\s+into?\b|\b(grant|revoke)\b|storage\.buckets|storage\.objects/i)
assert.equal((correction.match(/drop policy/gi) ?? []).length, 1)
assert.equal((correction.match(/create policy/gi) ?? []).length, 1)

const canRead = ({ adminRead, enabled, hasPublishedMapping }) => adminRead || (enabled && hasPublishedMapping)
assert.equal(canRead({ adminRead: false, enabled: true, hasPublishedMapping: true }), true)
assert.equal(canRead({ adminRead: false, enabled: false, hasPublishedMapping: true }), false)
assert.equal(canRead({ adminRead: false, enabled: true, hasPublishedMapping: false }), false)
assert.equal(canRead({ adminRead: true, enabled: false, hasPublishedMapping: false }), true)

console.log('Forge Vision screen-type policy correction tests passed: canonical digests, ordering, scoped policy replacement, qualification, SELECT-only semantics, access cases and write/storage exclusion.')
