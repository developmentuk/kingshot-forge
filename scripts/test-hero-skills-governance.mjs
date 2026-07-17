import assert from 'node:assert/strict'
import process from 'node:process'

import { createServer } from 'vite'

const vite = await createServer({
  appType: 'custom',
  server: { middlewareMode: true },
})

const now = '2026-07-17T12:00:00.000Z'
const heroId = '22222222-2222-4222-8222-222222222222'
const evidenceId = '11111111-1111-4111-8111-111111111111'
const digest = `sha256:${'a'.repeat(64)}`

try {
  const evidenceContracts = await vite.ssrLoadModule(
    '/shared/platform/source-evidence.ts',
  )
  const heroSkills = await vite.ssrLoadModule(
    '/shared/domains/heroes/heroSkills.ts',
  )

  const evidence = {
    id: evidenceId,
    datasetId: 'hero-skills',
    sourceKey: 'fixture:hero-skills:v1',
    origin: 'official',
    sourceName: 'Local contract fixture',
    sourceUrl: 'https://example.invalid/hero-skills/fixture',
    retrievedAt: now,
    contentDigest: digest,
    sourceVersion: 'fixture-v1',
    licensingDecision: 'approved',
    attribution: 'No external content; local contract fixture.',
    extractionMethod: 'structured-file',
    reviewedBy: 'fixture-reviewer',
    reviewedAt: now,
    reviewStatus: 'approved',
    evidenceNotes: 'Private fixture note.',
    supersededById: null,
    supersededAt: null,
    withdrawnAt: null,
    withdrawalReason: null,
    revision: 1,
    createdAt: now,
    updatedAt: now,
  }

  assert.deepEqual(
    evidenceContracts.validateSourceEvidenceRecord(evidence),
    [],
  )
  assert.equal(
    evidenceContracts.canSourceEvidenceSupportCanonical(evidence),
    true,
  )
  assert.ok(
    evidenceContracts.validateSourceEvidenceRecord({
      ...evidence,
      contentDigest: 'not-a-digest',
    }).some(({ path }) => path === 'contentDigest'),
  )
  assert.ok(
    evidenceContracts.validateSourceEvidenceRecord({
      ...evidence,
      sourceVersion: null,
    }).some(({ path }) => path === 'sourceVersion'),
  )
  assert.ok(
    evidenceContracts.validateSourceEvidenceRecord({
      ...evidence,
      reviewStatus: 'superseded',
      supersededById: evidenceId,
      supersededAt: now,
    }).some(({ message }) => message.includes('supersede itself')),
  )

  const identityInput = {
    heroId,
    category: 'conquest',
    slot: 1,
    variantKind: 'base',
    variantIndex: 1,
  }
  const identity = heroSkills.createHeroSkillIdentity(identityInput)
  assert.deepEqual(
    heroSkills.createHeroSkillIdentity(identityInput),
    identity,
  )
  assert.notEqual(
    heroSkills.createHeroSkillIdentity({
      ...identityInput,
      variantKind: 'awakening',
    }).id,
    identity.id,
  )

  const progressionIdentity =
    heroSkills.createHeroSkillProgressionIdentity(identity.id, 1)
  const progression = {
    id: progressionIdentity.id,
    identitySeed: progressionIdentity.identitySeed,
    skillId: identity.id,
    level: 1,
    canonicalText: 'Local fixture effect text.',
    effects: [],
    sourceEvidenceId: evidenceId,
    verificationState: 'verified',
    displayOrder: 1,
    withdrawnAt: null,
    withdrawalReason: null,
    revision: 1,
    createdAt: now,
    updatedAt: now,
  }

  const record = {
    ...identity,
    heroId,
    variantKind: 'base',
    variantIndex: 1,
    name: 'Local Fixture Skill',
    category: 'conquest',
    slot: 1,
    displayOrder: 1,
    description: 'Local fixture description.',
    maxLevel: 1,
    progressionAvailability: 'complete',
    progression: [progression],
    unlockAvailability: 'unavailable',
    unlocks: null,
    verificationState: 'verified',
    publicationEligibility: 'eligible',
    source: {
      sourceIdentity: evidence.sourceKey,
      sourceVersion: evidence.sourceVersion,
      sourceEvidenceDigest: digest,
      primaryEvidenceId: evidenceId,
      evidenceIds: [evidenceId],
    },
    reviewedBy: 'fixture-reviewer',
    reviewedAt: now,
    revision: 1,
    publishedVersionId: 'fixture-published-version',
    publishedAt: now,
    createdAt: now,
    updatedAt: now,
    withdrawnAt: null,
    withdrawalReason: null,
  }

  assert.deepEqual(
    heroSkills.validateHeroSkillRecord(record, [evidence]),
    [],
  )
  assert.deepEqual(
    heroSkills.getHeroSkillPublicationBlockers(record, [evidence]),
    [],
  )

  const renamed = { ...record, name: 'Corrected Fixture Name' }
  assert.equal(renamed.id, record.id)
  assert.deepEqual(
    heroSkills.validateHeroSkillRecord(renamed, [evidence]),
    [],
  )

  const correctedCategory = { ...record, category: 'expedition' }
  assert.equal(correctedCategory.id, record.id)
  assert.deepEqual(
    heroSkills.validateHeroSkillRecord(correctedCategory, [evidence]),
    [],
  )

  const duplicateIssues = heroSkills.validateHeroSkillCollection(
    [record, { ...record }],
    [evidence],
  )
  assert.ok(
    duplicateIssues.some(
      ({ path, message }) =>
        path === 'records.1.slot' &&
        message.includes('Hero/category/slot/variant'),
    ),
  )

  assert.ok(
    heroSkills.validateHeroSkillRecord(
      { ...record, name: '' },
      [evidence],
    ).some(({ path }) => path === 'name'),
  )
  assert.ok(
    heroSkills.validateHeroSkillRecord(
      { ...record, category: 'exclusive_gear' },
      [evidence],
    ).some(({ path }) => path === 'category'),
  )
  assert.ok(
    heroSkills.validateHeroSkillRecord(
      { ...record, maxLevel: 0 },
      [evidence],
    ).some(({ path }) => path === 'maxLevel'),
  )
  assert.ok(
    heroSkills.validateHeroSkillRecord(
      { ...record, upgradePriority: 1 },
      [evidence],
    ).some(({ path }) => path === 'upgradePriority'),
  )

  const levelTwoIdentity =
    heroSkills.createHeroSkillProgressionIdentity(identity.id, 2)
  const levelTwo = {
    ...progression,
    id: levelTwoIdentity.id,
    identitySeed: levelTwoIdentity.identitySeed,
    level: 2,
    displayOrder: 2,
  }
  assert.ok(
    heroSkills.validateHeroSkillRecord({
      ...record,
      maxLevel: 2,
      progression: [levelTwo, progression],
    }, [evidence]).some(({ message }) => message.includes('ascending')),
  )
  assert.ok(
    heroSkills.validateHeroSkillRecord({
      ...record,
      maxLevel: 2,
      progression: [progression, { ...progression }],
    }, [evidence]).some(({ message }) => message.includes('duplicated')),
  )

  const unlockIdentity = heroSkills.createHeroSkillUnlockIdentity(
    identity.id,
    1,
    1,
  )
  const unlockGroupIdentity =
    heroSkills.createHeroSkillUnlockGroupIdentity(identity.id, 1)
  assert.deepEqual(
    heroSkills.createHeroSkillUnlockGroupIdentity(identity.id, 1),
    unlockGroupIdentity,
  )
  const requirement = {
    id: unlockIdentity.id,
    identitySeed: unlockIdentity.identitySeed,
    skillId: identity.id,
    type: 'hero_level',
    operator: 'gte',
    value: 10,
    relatedDomainId: heroId,
    displayFallback: null,
    sourceEvidenceId: evidenceId,
    verificationState: 'verified',
    order: 1,
    withdrawnAt: null,
    withdrawalReason: null,
    revision: 1,
    createdAt: now,
    updatedAt: now,
  }
  const unlocks = {
    operator: 'all',
    groups: [{
      id: unlockGroupIdentity.id,
      identitySeed: unlockGroupIdentity.identitySeed,
      operator: 'all',
      order: 1,
      requirements: [requirement],
    }],
  }
  assert.deepEqual(
    heroSkills.validateHeroSkillUnlocks(unlocks, identity.id),
    [],
  )
  assert.ok(
    heroSkills.validateHeroSkillUnlocks({
      ...unlocks,
      groups: [{
        ...unlocks.groups[0],
        requirements: [{ ...requirement, type: 'unsupported' }],
      }],
    }, identity.id).some(({ path }) => path.endsWith('.type')),
  )
  assert.ok(
    heroSkills.validateHeroSkillUnlocks({
      ...unlocks,
      groups: [{
        ...unlocks.groups[0],
        requirements: [{
          ...requirement,
          type: 'awakening_state',
          operator: 'gte',
          value: 'awakened',
        }],
      }],
    }, identity.id).some(({ path }) => path.endsWith('.operator')),
  )

  assert.ok(
    heroSkills.getHeroSkillPublicationBlockers(record, [])
      .includes('missing-source-evidence'),
  )
  assert.ok(
    heroSkills.getHeroSkillPublicationBlockers({
      ...record,
      verificationState: 'unreviewed',
      publicationEligibility: 'blocked',
    }, [evidence]).includes('unverified-record'),
  )
  assert.ok(
    heroSkills.getHeroSkillPublicationBlockers(record, [{
      ...evidence,
      reviewStatus: 'staged',
      licensingDecision: 'pending',
      reviewedBy: null,
      reviewedAt: null,
    }]).includes('unapproved-source-evidence'),
  )
  assert.ok(
    heroSkills.getHeroSkillPublicationBlockers({
      ...record,
      withdrawnAt: now,
      withdrawalReason: 'Fixture withdrawal.',
    }, [evidence]).includes('withdrawn-record'),
  )

  const publicProjection = heroSkills.toPublicHeroSkillProjection(
    record,
    [evidence],
  )
  assert.ok(publicProjection)
  assert.equal(publicProjection.progression.length, 1)
  const serialisedProjection = JSON.stringify(publicProjection)
  for (const privateField of [
    'reviewedBy',
    'evidenceNotes',
    'primaryEvidenceId',
    'sourceEvidenceDigest',
    'identitySeed',
    'editorial_key',
  ]) {
    assert.equal(serialisedProjection.includes(privateField), false)
  }

  const noProgressionProjection = heroSkills.toPublicHeroSkillProjection({
    ...record,
    maxLevel: 5,
    progressionAvailability: 'unknown',
    progression: [],
  }, [evidence])
  assert.ok(noProgressionProjection)
  assert.deepEqual(noProgressionProjection.progression, [])

  assert.doesNotThrow(() => heroSkills.validateHeroSkillRecord({
    ...record,
    source: null,
  }, [evidence]))
  assert.doesNotThrow(() => heroSkills.validateHeroSkillRecord({
    ...record,
    unlockAvailability: 'partial',
    unlocks: { operator: 'all', groups: [null] },
  }, [evidence]))
  assert.ok(
    heroSkills.getHeroSkillPublicationBlockers({
      ...record,
      source: {
        ...record.source,
        evidenceIds: [
          evidenceId,
          '33333333-3333-4333-8333-333333333333',
        ],
      },
    }, [evidence]).includes('missing-source-evidence'),
  )

  console.log('Hero Skills source governance and canonical contract tests passed.')
  console.log(
    'Verified deterministic identities, validation, publication blockers, canonical/editorial separation and public projection privacy with local fixtures only.',
  )
} finally {
  await vite.close()
}

process.exitCode = 0
