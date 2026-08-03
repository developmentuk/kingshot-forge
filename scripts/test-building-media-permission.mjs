import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const editorSchema = readFileSync(
  'src/features/admin/recordEditor/buildingsRecordEditorSchema.ts',
  'utf8',
)
const migration = readFileSync(
  'supabase/migrations/20260803131500_building_media_permission_guard.sql',
  'utf8',
)

assert.match(
  editorSchema,
  /const imageLicense = record\.values\.image_license/u,
  'Buildings editor must read the image permission field during record validation.',
)
assert.match(
  editorSchema,
  /Image licence or permission is required when a building image is supplied\./u,
  'Buildings editor must reject uploaded imagery without a permission basis.',
)
assert.match(
  editorSchema,
  /Required when an image is supplied\. Record the applicable licence, ownership or explicit permission basis\./u,
  'Buildings editor must explain the required permission metadata.',
)

assert.match(
  migration,
  /building_editorial_overrides_image_permission/u,
  'Database migration must add the building image permission constraint.',
)
assert.match(
  migration,
  /nullif\(trim\(values->>'image_url'\), ''\) is null/u,
  'The database guard must allow records that do not use an uploaded image.',
)
assert.match(
  migration,
  /nullif\(trim\(values->>'image_license'\), ''\) is not null/u,
  'The database guard must require permission metadata for uploaded images.',
)
assert.match(
  migration,
  /not valid/u,
  'The additive guard must preserve existing immutable history while enforcing future writes.',
)
assert.doesNotMatch(
  migration,
  /grant .* authenticated/iu,
  'The permission guard must not widen authenticated database access.',
)

console.log('Building media permission validation and database guard contracts passed.')
