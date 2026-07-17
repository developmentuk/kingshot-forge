import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import process from 'node:process'

const root = process.cwd()

const expectations = [
  {
    path: 'shared/domains/heroes/heroSkills.ts',
    fragments: [
      'validateHeroSkillRecord',
      'validateHeroSkillCollection',
      'sortHeroSkills',
      'Hero Skill must be an object',
    ],
  },
  {
    path: 'server/editorial/publishLiveDatasetRecord.ts',
    fragments: [
      'case "hero-skills"',
      'publishHeroSkill',
      '.from("hero_skills")',
      'published_version_id',
      'onConflict: "editorial_key"',
    ],
  },
  {
    path: 'server/data-engine/loadCanonicalHeroSkillsDataset.ts',
    fragments: [
      ".from('published_hero_skills')",
      "dataset: 'hero-skills'",
      "visibility: 'published-only'",
    ],
  },
  {
    path: 'src/features/admin/heroSkillsDatasetAdapter.ts',
    fragments: [
      'datasetId: "hero-skills"',
      'createBrowserDefinition',
      'createEditorRecord',
    ],
  },
  {
    path: 'src/features/admin/recordEditor/heroSkillsRecordEditorSchema.ts',
    fragments: [
      'allowCreate: true',
      'createEmptyRecord',
      'Published active state',
      'Source and verification',
      'source_accuracy_score',
    ],
  },
  {
    path: 'src/features/admin/AdminDatasetDetailPage.tsx',
    fragments: [
      'editorSchema.createEmptyRecord()',
      'mode: "create"',
    ],
  },
  {
    path: 'src/features/admin/DatasetTable.tsx',
    fragments: [
      'Create record',
      'onCreateRow',
    ],
  },
  {
    path: 'src/repositories/heroSkillRepository.ts',
    fragments: [
      ".from('published_hero_skills')",
      ".eq('hero_slug', heroSlug)",
      ".order('display_order'",
    ],
  },
  {
    path: 'src/pages/HeroCompanionPage.tsx',
    fragments: [
      'PublishedHeroSkills',
      'Only reviewed and published canonical skills are shown here.',
    ],
  },
  {
    path: 'supabase/migrations/20260716110000_hero_skills_editorial_projection.sql',
    fragments: [
      'hero_skills_editorial_key_key unique',
      'hero_skills_active_hero_slot_uidx',
      'hero_skills_active_hero_display_order_uidx',
      'with (security_invoker = true)',
      'published_version_id is not null',
      'to anon, authenticated',
    ],
  },
]

const failures = []

for (const expectation of expectations) {
  let content

  try {
    content = await readFile(resolve(root, expectation.path), 'utf8')
  } catch {
    failures.push(`Missing required file: ${expectation.path}`)
    continue
  }

  for (const fragment of expectation.fragments) {
    if (!content.includes(fragment)) {
      failures.push(`${expectation.path} is missing: ${fragment}`)
    }
  }
}

if (failures.length > 0) {
  console.error('\nHero Skills milestone validation failed:\n')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exitCode = 1
} else {
  console.log('Hero Skills milestone structural validation passed.')
  console.log(`Verified ${expectations.length} implementation surfaces.`)
  console.log('Verified published-only projection, editorial creation, publication and public consumption wiring.')
}
