import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const page = readFileSync('src/pages/BuildingsBrowserPage.tsx', 'utf8')
const dataModel = readFileSync('src/features/buildings/buildingData.ts', 'utf8')
const artwork = readFileSync('src/components/buildings/BuildingArtwork.tsx', 'utf8')
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
assert.match(artwork, /building\.imageUrl && !imageFailed/u)
assert.match(artwork, /const imageIdentity = building\.imageUrl/u)
assert.match(artwork, /`\$\{building\.key\}:\$\{building\.imageUrl\}`/u)
assert.match(artwork, /failedImageIdentity === imageIdentity/u)
assert.match(artwork, /onError=\{\(\) => setFailedImageIdentity\(imageIdentity\)\}/u)
assert.match(artwork, /<BuildingIllustration/u, 'Approved imagery must fall back to the Forge illustration')

for (const field of [
  'max_hero_level',
  'training_capacity',
  'training_speed_percent',
  'rally_capacity',
  'troop_deploy_capacity',
  'reinforcement_capacity',
  'ally_help_count',
]) {
  assert.match(dataModel, new RegExp(field, 'u'), `Published Buildings effect ${field} is not registered by the companion model`)
}

for (const field of [
  'image_url',
  'image_alt_text',
  'image_credit',
  'image_source_url',
  'image_license',
]) {
  assert.match(dataModel, new RegExp(field, 'u'), `Buildings companion model does not consume ${field}`)
  assert.match(editorSchema, new RegExp(field, 'u'), `Buildings editor does not expose ${field}`)
  assert.match(adapter, new RegExp(field, 'u'), `Buildings adapter does not hydrate ${field}`)
  assert.match(contract, new RegExp(field, 'u'), `Buildings contract does not register ${field}`)
}

assert.match(page, /Buildings compendium/u)
assert.match(page, /building-compendium-list/u)
assert.match(page, /building-compendium-card/u)
assert.match(page, /Open Building Planner/u)
assert.match(page, /Plan upgrades/u)
assert.match(page, /<BuildingPlanner/u)
assert.match(page, /Calculator/u)
assert.match(page, /Progression/u)
assert.match(page, /Prerequisites/u)
assert.match(page, /ForgeConnections/u)
assert.match(page, /Standard & transition/u)
assert.match(page, /Truegold stages/u)
assert.match(page, /Tempered Truegold/u)
assert.match(page, /Missing effects are not guessed/u)
assert.match(page, /fetchDataset\('buildings'/u)
assert.match(page, /normaliseBuildings\(result\.records\)/u)
assert.doesNotMatch(page, /from\(['"](?:\.\.\/)*lib\/supabase/u)

assert.match(styles, /\.building-compendium-list/u)
assert.match(styles, /\.building-compendium-card/u)
assert.match(styles, /\.building-profile-hero/u)
assert.match(styles, /\.building-profile-nav/u)
assert.match(styles, /\.building-profile-overview/u)
assert.match(styles, /@media \(max-width: 580px\)/u)
assert.match(polish, /\.building-media-image/u)

assert.match(editorForm, /schema\.datasetId === "buildings"/u)
assert.match(editorForm, /field\.key === "image_url"/u)
assert.match(editorForm, /kind=\{kind\}/u)
assert.match(imageField, /folder: "buildings"/u)
assert.match(imageField, /minimumWidth: 800/u)
assert.match(imageField, /minimumHeight: 450/u)
assert.match(imageField, /companion-images/u)
assert.match(imageField, /Date\.now\(\)/u, 'replacement images must use immutable object paths')
assert.match(editorSchema, /Alt text is required when a building image is supplied/u)

assert.match(workflowPanel, /approved:\s*\[\s*"return_to_draft",\s*"publish",?\s*\]/u)
assert.match(workflowPanel, /published:\s*\[\s*"return_to_draft",\s*"archive",?\s*\]/u)
assert.match(workflowPanel, /Create editable draft/u)
assert.match(workflowPanel, /current public version remains live/u)
assert.match(workflowService, /from:\s*\['in_review', 'approved', 'published'\]/u)
assert.match(connectedEditor, /canCreateInitialDraft/u)
assert.match(connectedEditor, /disabledActionLabel/u)
assert.match(recordEditorPanel, /onDisabledAction/u)
assert.match(recordEditorPanel, /disabledActionBusy/u)

assert.match(roleContext, /resolvedUserIdRef = useRef/u)
assert.match(roleContext, /shouldBlockForUserChange/u)
assert.match(roleContext, /if \(shouldBlockForUserChange\) \{\s*setLoadingRole\(true\)/u)
assert.match(connectedEditor, /loadSequenceRef = useRef/u)
assert.match(connectedEditor, /requestId !== loadSequenceRef\.current/u)
assert.match(connectedEditor, /\{ blocking: false \}/u)
assert.match(connectedEditor, /const initialLoading =\s*loading && state === null/u)
assert.match(connectedEditor, /Refreshing editorial status/u)
assert.match(editorialApi, /cache: "no-store"/u)
assert.match(editorialApi, /"Cache-Control": "no-store"/u)
assert.match(editorialApi, /cacheBust: Date\.now\(\)\.toString\(\)/u)

assert.match(loader, /eq\('status', 'published'\)/u)
assert.match(loader, /eq\('is_current', true\)/u)
assert.match(loader, /building_editorial_overrides/u)
assert.match(loader, /applyEditorialOverride/u)
assert.match(loader, /applyCostOverrides/u)
assert.match(loader, /upgrade_time_seconds: readNumber\(cost\[6\]\),\s*upgrade_time_display: null/u)
assert.match(loader, /editorialOverrideCount/u)
assert.match(loader, /isMissingOverrideRelation/u)
assert.match(loader, /sortBuildingProgression/u)

const missingRelationFunction = loader.match(
  /function isMissingOverrideRelation[\s\S]*?\n}/u,
)?.[0]
assert.ok(missingRelationFunction, 'Missing-relation classifier is not defined')
assert.match(missingRelationFunction, /error\.code === '42P01'/u)
assert.match(missingRelationFunction, /error\.code === 'PGRST205'/u)
assert.doesNotMatch(
  missingRelationFunction,
  /error\.message/u,
  'Only explicit missing-relation codes may suppress editorial override failures',
)

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
assert.doesNotMatch(migration, /grant .* authenticated/iu)
assert.match(readiness, /return key === 'buildings'\s*\? 'implemented'\s*:\s*'partial'/u)
assert.match(readiness, /Live draft, review, approval, publication, rollback and restoration acceptance passed/u)
assert.doesNotMatch(readiness, /live transaction remain unverified/u)

console.log('Buildings Companion redesign, governed media, release review and implemented publication contracts passed.')
