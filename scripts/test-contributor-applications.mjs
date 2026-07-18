import assert from 'node:assert/strict'
import fs from 'node:fs'

const migration = fs.readFileSync('supabase/migrations/20260718220000_contributor_applications_foundation.sql', 'utf8')
const service = fs.readFileSync('server/recruitment/service.ts', 'utf8')
const contracts = fs.readFileSync('server/recruitment/contracts.ts', 'utf8')
for (const table of ['forge_contributor_applications', 'forge_contributor_application_answers', 'forge_contributor_application_reviews', 'forge_contributor_application_messages', 'forge_contributor_application_events', 'forge_contributor_onboarding']) assert.match(migration, new RegExp(`create table if not exists public\\.${table}`))
for (const table of ['forge_contributor_applications', 'forge_contributor_application_answers', 'forge_contributor_application_reviews', 'forge_contributor_application_messages', 'forge_contributor_application_events', 'forge_contributor_onboarding']) { assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`)); assert.match(migration, new RegExp(`alter table public\\.${table} force row level security`)) }
for (const status of ['draft','submitted','under_review','more_information_requested','conversation','accepted','declined','withdrawn','onboarding','active','closed']) assert.match(contracts, new RegExp(`'${status}'`))
for (const capability of ['applications.read','applications.review','applications.request_information','applications.change_status','applications.assign_reviewer','applications.view_internal_notes','applications.manage_onboarding','applications.manage_role_catalogue']) assert.match(migration, new RegExp(capability.replace('.', '\\.')))
assert.match(service, /function canTransition|canTransition\(/)
assert.match(service, /application_submitted/)
assert.match(service, /internal_note_created/)
assert.match(service, /approvedRoleKey/)
assert.doesNotMatch(service, /assignRole\(|roles\.assign/)
console.log('Contributor application architecture checks passed.')
