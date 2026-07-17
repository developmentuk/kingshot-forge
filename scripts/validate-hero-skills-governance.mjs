import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import process from 'node:process'

const migrationPath =
  'supabase/migrations/20260717130617_hero_skill_source_governance_foundation.sql'

const expectations = [
  ['shared/platform/source-evidence.ts', [
    'SourceEvidenceRecord',
    'contentDigest',
    'licensingDecision',
    'canSourceEvidenceSupportCanonical',
    'toPublicSourceSummary',
  ]],
  ['shared/domains/heroes/heroSkills.ts', [
    'createHeroSkillIdentity',
    'createHeroSkillUnlockGroupIdentity',
    'HeroSkillProgressionLevel',
    'HeroSkillUnlockRequirement',
    'getHeroSkillPublicationBlockers',
    'toPublicHeroSkillProjection',
    'exclusiveGearEffects',
  ]],
  [migrationPath, [
    'create table public.source_evidence_records',
    'create table public.hero_skill_progression_levels',
    'create table public.hero_skill_unlock_groups',
    'create table public.hero_skill_unlock_requirements',
    'drop policy if exists "Hero skills are publicly readable"',
    'with (security_invoker = true)',
    'publication_eligible = true',
    'set local lock_timeout',
    'enforce_governed_record_revision',
    'enforce_hero_skill_child_publication',
    'grant select, insert, update on table public.source_evidence_records',
  ]],
]

const failures = []

for (const [path, fragments] of expectations) {
  let source
  try {
    source = await readFile(path, 'utf8')
  } catch {
    failures.push(`Missing required file: ${path}`)
    continue
  }
  for (const fragment of fragments) {
    if (!source.includes(fragment)) {
      failures.push(`${path} is missing: ${fragment}`)
    }
  }
}

const migration = await readFile(migrationPath, 'utf8')
const lower = migration.toLowerCase()
assert.equal((lower.match(/\bbegin;/g) ?? []).length, 1)
assert.equal((lower.match(/\bcommit;/g) ?? []).length, 1)

for (const forbiddenWrite of [
  /\binsert\s+into\b/,
  /\bupdate\s+public\.source_hero_skill_facts\b/,
  /\bdelete\s+from\b/,
  /\bcopy\s+public\./,
]) {
  if (forbiddenWrite.test(lower)) {
    failures.push(
      `Schema proposal contains a forbidden data write: ${forbiddenWrite}`,
    )
  }
}

if (
  lower.includes('alter table public.source_hero_skill_facts') ||
  lower.includes('alter table public.source_scrape_runs')
) {
  failures.push('Schema proposal must not promote or alter existing staged facts.')
}

const viewStart = lower.indexOf(
  'create or replace view public.published_hero_skills',
)
const viewEnd = lower.indexOf(
  'grant select on public.published_hero_skills',
  viewStart,
)
const publicView = lower.slice(viewStart, viewEnd)
for (const privateField of [
  'reviewed_by',
  'evidence_notes',
  'primary_source_evidence_id',
  'source_evidence_digest',
  'editorial_key',
]) {
  if (publicView.includes(privateField)) {
    failures.push(
      `Published Hero Skills view exposes private field: ${privateField}`,
    )
  }
}

if (failures.length > 0) {
  console.error('\nHero Skills governance validation failed:\n')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exitCode = 1
} else {
  console.log('Hero Skills governance structural validation passed.')
  console.log(
    'Verified source-evidence, canonical progression/unlock contracts, private public projection and unapplied no-data migration structure.',
  )
}
