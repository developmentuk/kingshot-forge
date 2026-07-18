import assert from 'node:assert/strict'
import fs from 'node:fs'

const migration = fs.readFileSync('supabase/migrations/20260718100000_community_art_submission_slice.sql', 'utf8')
const api = fs.readFileSync('api/art-studio.ts', 'utf8')
const client = fs.readFileSync('src/services/communityArtService.ts', 'utf8')
const page = fs.readFileSync('src/pages/ArtStudioPage.tsx', 'utf8')

assert.match(migration, /status text not null default 'pending'/)
assert.match(migration, /status = 'pending'/)
assert.match(migration, /community_art_submissions_select_published_public/)
assert.match(migration, /community-art-submissions/)
assert.match(migration, /image\/jpeg.*image\/png.*image\/webp/s)
assert.match(migration, /security_invoker/)
assert.match(migration, /values \(\s*'community-art-submissions',[\s\S]*?false,\s*5242880/)
assert.match(api, /status: 'pending'/)
assert.match(api, /moderation.manage/)
assert.match(api, /Only approved submissions can be published/)
assert.match(api, /metadata\.mimetype !== mimeType/)
assert.doesNotMatch(client, /SUPABASE_SERVICE_ROLE|SUPABASE_SECRET_KEY/)
assert.match(page, /accept="image\/jpeg,image\/png,image\/webp"/)
assert.match(page, /disabled=\{saving\}/)
console.log('Community Art Studio submission boundary tests passed.')
