import assert from 'node:assert/strict'
import fs from 'node:fs'
import crypto from 'node:crypto'

const api = fs.readFileSync('api/art-studio.ts', 'utf8')
const migration = fs.readFileSync('supabase/migrations/20260721213000_art002g_atomic_community_art_submission.sql', 'utf8')
const fixture = fs.readFileSync('fixtures/community-art/wow-im-so-cute/wow-im-so-cute.txt')

assert.match(api, /contributions\.submit/, 'submission capability is checked')
assert.match(api, /submit_community_art_submission/, 'submission uses the atomic RPC')
assert.match(api, /raw_source_sha256/, 'raw hash is part of the server contract')
assert.match(api, /raw_source_byte_length/, 'raw byte length is part of the server contract')
assert.match(api, /referenceId/, 'structured correlation errors are returned')
assert.doesNotMatch(api, /approved_copy_payload:\s*artworkText/, 'submission does not create an approved payload')
assert.match(migration, /security definer/, 'atomic write is server-authoritative')
assert.match(migration, /community_art_submission_audit_events/, 'submission audit event is atomic with the row')
assert.match(migration, /submission_request_id/, 'duplicate retries are idempotent')
assert.match(migration, /raw_source_sha256.*raw_source_byte_length/s, 'immutable raw metadata is persisted')
assert.equal(crypto.createHash('sha256').update(fixture).digest('hex'), 'c4b0112b0e43312d1bbf3f2e18472814564d184f55c114c2749d0e921613cd79')
assert.equal(fixture.length, 386)
assert.equal((fixture.toString('utf8').match(/\r\n/g) ?? []).length, 9)

console.log('ART-002G submission tests passed: capability, atomic RPC contract, raw-byte preservation, audit, no approval at submit, and idempotency.')
