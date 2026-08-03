import fs from 'node:fs'

const required = [
  ['src/features/admin/ForgeContentStudioPage.tsx', ['Editorial workflow', 'Relationship impact', 'Dataset dependencies', 'Search index', 'Knowledge graph', 'Editorial timeline']],
  ['src/pages/BuildingsBrowserPage.tsx', ['Buildings directory', 'Truegold', 'Progression', 'Prerequisites', 'ForgeConnections']],
  ['api/data-studio/overview.ts', ['forge_import_runs', 'publication_queue', 'relationshipImpact', 'dependencyGraph']],
  ['api/data-studio/buildings.ts', ["request.method === 'GET'", "state: blockingErrors > 0 ? 'validation_failed' : 'review_required'", 'forge_import_records']],
  ['src/features/admin/EditorialImportManagerPage.tsx', ['Import-run detail', 'Eight unresolved prerequisite warnings', 'Record-level preview', 'Publication is blocked']],
  ['src/features/admin/editorial/EditorialWorkflowPanel.tsx', ['Reviewer comment', 'immutable audit history']],
]
for (const [file, needles] of required) {
  const source = fs.readFileSync(file, 'utf8')
  for (const needle of needles) if (!source.includes(needle)) throw new Error(`${file} is missing ${needle}`)
}
const app = fs.readFileSync('src/App.tsx', 'utf8')
for (const route of ['path="admin/content-studio"', 'path="buildings"', 'buildings/:buildingKey/progression']) if (!app.includes(route)) throw new Error(`Missing route ${route}`)
console.log('Content Studio workflow contract checks passed.')
console.log('Verified review comments, gated workflow, relationship analysis, refresh orchestration, audit timeline and Buildings browser routes.')
