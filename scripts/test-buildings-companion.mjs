import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const page = readFileSync('src/pages/BuildingsBrowserPage.tsx', 'utf8')
const illustration = readFileSync('src/components/buildings/BuildingIllustration.tsx', 'utf8')
const styles = readFileSync('src/styles/buildingsBrowser.css', 'utf8')
const polish = readFileSync('src/styles/buildingsProgressionPolish.css', 'utf8')
const loader = readFileSync('server/data-engine/loadPublishedBuildingsDataset.ts', 'utf8')
const contract = readFileSync('shared/data-pipeline/buildingsContract.ts', 'utf8')
const editorSchema = readFileSync('src/features/admin/recordEditor/buildingsRecordEditorSchema.ts', 'utf8')
const editorForm = readFileSync('src/features/admin/recordEditor/RecordEditorForm.tsx', 'utf8')
const recordEditorPanel = readFileSync('src/features/admin/recordEditor/RecordEditorPanel.tsx', 'utf8')
const imageField = readFileSync('src/features/admin/recordEditor/CompanionImageField.tsx', 'utf8')
const connectedEditor = readFileSync('src/features/admin/editorial/ConnectedEditorialRecordEditor.tsx', 'utf8')
const editorialApi = readFileSync('src/features/admin/editorial/editorialApi.ts', 'utf8')
const workflowPanel = readFileSync('src/features/admin/editorial/EditorialWorkflowPanel.tsx', 'utf8')
const workflowService = readFileSync('src/platform/editorial/services/EditorialWorkflowService.ts', 'utf8')
const adapter = readFileSync('src/features/admin/buildingsDatasetAdapter.ts', 'utf8')
const migration = readFileSync('supabase/migrations/20260802193000_buildings_editorial_media_projection.sql', 'utf8')
const readiness = readFileSync('shared/data-engine/readiness-registry.ts', 'utf8')
const roleContext = readFileSync('src/context/RoleContext.tsx', 'utf8')

for (const buildingKey of [
  'academy',
  'barracks',
  'command-center',
  'embassy',
  'infirmary',
  'range',
  'stable',
  'storehouse',
  'town-center',
  'war-academy',
]) {
  assert.match(illustration, new RegExp(`case '${buildingKey}'`, 'u'), `Missing original Forge illustration for ${buildingKey}`)
}

assert.match(illustration, /original Kingshot Forge companion illustration/u)
assert.match(illustration, /role=\{decorative \? undefined : 'img'\}/u)
assert.match(illustration, /aria-hidden=\{decorative \? true : undefined\}/u)

for (const field of [
  'max_hero_level',
  'training_capacity',
  'training_speed_percent',
  'rally_capacity',
  'troop_deploy_capacity',
  'reinforcement_capacity',
  'ally_help_count',
]) {
  assert.match(page, new RegExp(field, 'u'), `Published Buildings effect ${field} is not exposed by the companion page`)
}

for (const field of [
  'image_url',
  'image_alt_text',
  'image_credit',
  'image_source_url',
  'image_license',
]) {
  assert.match(page, new RegExp(field, 'u'), `Public Buildings page does not consume ${field}`)
  assert.match(editorSchema, new RegExp(field, 'u'), `Buildings editor does not expose ${field}`)
  assert.match(adapter, new RegExp(field, 'u'), `Buildings adapter does not hydrate ${field}`)
  assert.match(contract, new RegExp(field, 'u'), `Buildings contract does not register ${field}`)
}

assert.match(editorForm, /schema\.datasetId === "buildings"/u)
assert.match(editorForm, /field\.key === "image_url"/u)
assert.match(editorForm, /kind=\{kind\}/u)
assert.match(imageField, /kind = "hero"/u)
assert.match(imageField, /folder: "buildings"/u)
assert.match(imageField, /minimumWidth: 800/u)
assert.match(imageField, /minimumHeight: 450/u)
assert.match(imageField, /companion-images/u)
assert.match(imageField, /Date\.now\(\)/u, 'replacement images must use immutable object paths')
assert.match(editorSchema, /Alt text is required when a building image is supplied/u)

assert.match(workflowPanel, /approved:\s*\[\s*"return_to_draft",\s*"publish",?\s*\]/u, 'approved records must expose a return-to-draft action')
assert.match(workflowPanel, /published:\s*\[\s*"return_to_draft",\s*"archive",?\s*\]/u, 'published records must expose a redraft action')
assert.match(workflowPanel, /Create editable draft/u)
assert.match(workflowPanel, /current public version remains live/u)
assert.match(workflowService, /from:\s*\['in_review', 'approved', 'published'\]/u, 'the server workflow must permit a governed redraft from published')
assert.match(connectedEditor, /canCreateInitialDraft/u, 'canonical records without an editorial head must be able to create their first draft')
assert.match(connectedEditor, /disabledActionLabel/u, 'the redraft action must be visible in the top disabled-state banner')
assert.match(connectedEditor, /current public version remains live/u)
assert.match(recordEditorPanel, /onDisabledAction/u)
assert.match(recordEditorPanel, /disabledActionBusy/u)

assert.match(roleContext, /resolvedUserIdRef = useRef/u, 'Admin permission refreshes must remember the resolved signed-in user')
assert.match(roleContext, /shouldBlockForUserChange/u, 'Only an actual user change may enter the route-blocking role loading state')
assert.match(roleContext, /if \(shouldBlockForUserChange\) \{\s*setLoadingRole\(true\)/u, 'Returning from the file picker must not unmount an active editor')

assert.match(connectedEditor, /loadSequenceRef = useRef/u, 'Editorial state refreshes must ignore stale overlapping requests')
assert.match(connectedEditor, /requestId !== loadSequenceRef\.current/u)
assert.match(connectedEditor, /\{ blocking: false \}/u, 'Post-action state refreshes must remain non-blocking')
assert.match(connectedEditor, /const initialLoading =\s*loading && state === null/u, 'Only the first load may replace the editor with a blocking state')
assert.match(connectedEditor, /Refreshing editorial status/u)
assert.match(editorialApi, /cache: "no-store"/u)
assert.match(editorialApi, /"Cache-Control": "no-store"/u)
assert.match(editorialApi, /cacheBust: Date\.now\(\)\.toString\(\)/u)

assert.match(page, /BuildingIllustration/u)
assert.match(page, /BuildingArtwork/u)
assert.match(page, /onError=\{\(\) => setImageFailed\(true\)\}/u)
assert.match(page, /Standard levels/u)
assert.match(page, /Truegold stages/u)
assert.match(page, /Tempered Truegold/u)
assert.match(page, /Raw base values/u)
assert.match(page, /Missing effects are not guessed/u)
assert.match(page, /owner-approved Buildings publication/u)
assert.match(page, /Open source reference/u)
assert.match(page, /original Kingshot Forge companion illustration/u)
assert.match(page, /fetchDataset\('buildings'/u)
assert.doesNotMatch(page, /from\(['"](?:\.\.\/)*lib\/supabase/u)

assert.match(styles, /\.building-card__image/u)
assert.match(styles, /\.building-detail-hero__art/u)
assert.match(styles, /\.building-overview-grid/u)
assert.match(styles, /\.building-phase-tabs/u)
assert.match(styles, /@media \(max-width: 560px\)/u)
assert.match(polish, /\.building-media-image/u)

assert.match(loader, /eq\('status', 'published'\)/u)
assert.match(loader, /eq\('is_current', true\)/u)
assert.match(loader, /building_editorial_overrides/u)
assert.match(loader, /applyEditorialOverride/u)
assert.match(loader, /applyCostOverrides/u)
assert.match(loader, /editorialOverrideCount/u)
assert.match(loader, /isMissingOverrideRelation/u, 'Preview must remain compatible before the additive migration is applied')
assert.match(loader, /sortBuildingProgression/u)
assert.match(contract, /max_hero_level/u)
assert.match(contract, /training_capacity/u)
assert.match(contract, /reinforcement_capacity/u)

for (const token of [
  'building_editorial_overrides',
  'force row level security',
  'apply_building_editorial_override',
  'publish_editorial_queue_item_core',
  "queue_item.dataset_id <> 'buildings'",
  "'projection', 'building_editorial_overrides'",
  'rollback_editorial_version_core',
  'service_role',
]) {
  assert.match(migration, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'u'), `Building media publication migration is missing ${token}`)
}
assert.doesNotMatch(migration, /grant .* authenticated/iu, 'Building editorial overrides must remain server-only')

assert.match(readiness, /return DATASET_CAPABILITY_REGISTRY\[key\]\.publishing\s*\? 'partial'/u)
assert.match(readiness, /live transaction remain unverified/u, 'Admin must remain Partial until the migration and live publish acceptance are complete')

console.log('Buildings Companion completion, governed media, published-record redraft, upload-state and post-publication refresh contracts passed.')
