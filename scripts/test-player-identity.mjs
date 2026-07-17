import assert from "node:assert/strict"

import {
  createServer,
} from "vite"

const vite = await createServer({
  appType: "custom",
  logLevel: "silent",
  server: {
    middlewareMode: true,
  },
})

function requireValid(result) {
  assert.equal(result.valid, true, result.reason)
  return result.value
}

function assertForbiddenKeysAbsent(value, forbiddenKeys) {
  const serialized = JSON.stringify(value).toLowerCase()

  for (const key of forbiddenKeys) {
    assert.equal(
      serialized.includes(key.toLowerCase()),
      false,
      `Projection leaked forbidden key: ${key}`,
    )
  }
}

try {
  const domain = await vite.ssrLoadModule(
    "/shared/domains/player-identity/index.ts",
  )
  const activeServer = await vite.ssrLoadModule(
    "/server/player-identity/activeCharacterResolution.ts",
  )
  const actorServer = await vite.ssrLoadModule(
    "/server/player-identity/actorResolution.ts",
  )

  const forgeUserId = requireValid(domain.validateForgeUserId("forge_user_0001"))
  const otherForgeUserId = requireValid(domain.validateForgeUserId("forge_user_0002"))
  const characterOneId = requireValid(domain.validateGameCharacterId("game_character_0001"))
  const characterTwoId = requireValid(domain.validateGameCharacterId("game_character_0002"))
  const linkOneId = requireValid(domain.validateCharacterLinkId("character_link_0001"))
  const linkTwoId = requireValid(domain.validateCharacterLinkId("character_link_0002"))
  const revisionOne = requireValid(domain.validatePlayerIdentityRevision(1))
  const revisionTwo = requireValid(domain.validatePlayerIdentityRevision(2))
  const publicAlias = requireValid(domain.validatePublicPlayerAlias("player_safe_0001"))
  const eventId = requireValid(domain.validatePlayerIdentityEventId("identity_event_0001"))

  assert.notEqual(forgeUserId, characterOneId)

  const createLink = (overrides = {}) => ({
    id: linkOneId,
    forgeUserId,
    gameCharacterId: characterOneId,
    state: "linked",
    createdAt: "2026-07-17T09:00:00.000Z",
    disputeState: "none",
    revision: revisionOne,
    isPrimary: true,
    activeCharacterEligible: true,
    ...overrides,
  })
  const linkOne = createLink()
  const linkTwo = createLink({
    id: linkTwoId,
    gameCharacterId: characterTwoId,
    isPrimary: false,
  })
  const unverified = {
    state: "unverified",
    revision: revisionOne,
    assurance: "none",
  }
  const syntheticVerified = {
    state: "verified",
    issuedAt: "2026-07-17T09:00:00.000Z",
    expiresAt: "2026-07-17T11:00:00.000Z",
    revision: revisionOne,
    assurance: "moderate",
  }
  const actor = {
    kind: "authenticated_user",
    forgeUserId,
    globalRoles: ["viewer"],
  }

  function createActiveResolver({
    links = [linkOne],
    identityRevision = revisionOne,
    verification = unverified,
    allowed = true,
    requiresVerifiedCharacter = false,
  } = {}) {
    return activeServer.createServerActiveCharacterResolver({
      characterLinks: {
        async findLinkByUserAndCharacter(input) {
          return {
            link: links.find(
              (candidate) =>
                candidate.forgeUserId === input.forgeUserId &&
                candidate.gameCharacterId === input.gameCharacterId,
            ),
            identityRevision,
          }
        },
        async listLinksByForgeUserId(userId) {
          return links.filter((candidate) => candidate.forgeUserId === userId)
        },
      },
      verifications: {
        async findCurrentByCharacterLinkId(characterLinkId) {
          return links.some(({ id }) => id === characterLinkId)
            ? verification
            : undefined
        },
        async findRecordByCharacterLinkId() {
          return undefined
        },
      },
      operationPolicy: {
        async evaluateOperation() {
          return {
            allowed,
            requiresVerifiedCharacter,
          }
        },
      },
      clock: {
        now() {
          return new Date("2026-07-17T10:00:00.000Z")
        },
      },
    })
  }

  const linkedButUnverified = await createActiveResolver({
    requiresVerifiedCharacter: true,
  }).resolveActiveCharacter({
    actor,
    requestedCharacterId: characterOneId,
    requestedOperation: "synthetic_sensitive_operation",
  })
  assert.equal(linkedButUnverified.outcome, "character_not_verified")

  const primaryState = domain.evaluatePrimaryCharacterState([linkOne, linkTwo])
  assert.equal(primaryState.status, "primary_resolved")
  const primaryWithoutActiveEligibility = domain.evaluatePrimaryCharacterState([
    createLink({ activeCharacterEligible: false }),
  ])
  assert.equal(primaryWithoutActiveEligibility.status, "primary_resolved")

  const explicitSecondCharacter = await createActiveResolver({
    links: [linkOne, linkTwo],
  }).resolveActiveCharacter({
    actor,
    requestedCharacterId: characterTwoId,
    requestedOperation: "synthetic_non_sensitive_operation",
  })
  assert.equal(explicitSecondCharacter.outcome, "resolved")
  assert.equal(explicitSecondCharacter.context.characterId, characterTwoId)

  const noSilentPrimaryFallback = await createActiveResolver({
    links: [linkOne, linkTwo],
  }).resolveActiveCharacter({
    actor,
    requestedOperation: "synthetic_sensitive_operation",
  })
  assert.equal(noSilentPrimaryFallback.outcome, "character_required")

  const revoked = await createActiveResolver({
    links: [createLink({ state: "revoked", revokedAt: "2026-07-17T09:30:00.000Z" })],
  }).resolveActiveCharacter({
    actor,
    requestedCharacterId: characterOneId,
    requestedOperation: "synthetic_operation",
  })
  assert.equal(revoked.outcome, "character_revoked")

  const disputed = await createActiveResolver({
    links: [createLink({
      state: "disputed",
      disputeState: "open",
      disputedAt: "2026-07-17T09:30:00.000Z",
    })],
  }).resolveActiveCharacter({
    actor,
    requestedCharacterId: characterOneId,
    requestedOperation: "synthetic_operation",
  })
  assert.equal(disputed.outcome, "character_disputed")

  const expiredVerification = await createActiveResolver({
    requiresVerifiedCharacter: true,
    verification: {
      ...syntheticVerified,
      expiresAt: "2026-07-17T09:59:59.000Z",
    },
  }).resolveActiveCharacter({
    actor,
    requestedCharacterId: characterOneId,
    requestedOperation: "synthetic_sensitive_operation",
  })
  assert.equal(expiredVerification.outcome, "verification_expired")

  const verificationWithoutFiniteExpiry = await createActiveResolver({
    requiresVerifiedCharacter: true,
    verification: {
      ...syntheticVerified,
      expiresAt: undefined,
    },
  }).resolveActiveCharacter({
    actor,
    requestedCharacterId: characterOneId,
    requestedOperation: "synthetic_sensitive_operation",
  })
  assert.equal(
    verificationWithoutFiniteExpiry.outcome,
    "character_not_verified",
  )

  const revisionConflict = await createActiveResolver({
    identityRevision: revisionTwo,
  }).resolveActiveCharacter({
    actor,
    requestedCharacterId: characterOneId,
    requestedOperation: "synthetic_operation",
    expectedIdentityRevision: revisionOne,
  })
  assert.equal(revisionConflict.outcome, "revision_conflict")

  const multiTabResolver = createActiveResolver({
    links: [linkOne, linkTwo],
  })
  const [tabOne, tabTwo] = await Promise.all([
    multiTabResolver.resolveActiveCharacter({
      actor,
      requestedCharacterId: characterOneId,
      requestedOperation: "tab_one_operation",
      expectedIdentityRevision: revisionOne,
    }),
    multiTabResolver.resolveActiveCharacter({
      actor,
      requestedCharacterId: characterTwoId,
      requestedOperation: "tab_two_operation",
      expectedIdentityRevision: revisionOne,
    }),
  ])
  assert.equal(tabOne.context.characterId, characterOneId)
  assert.equal(tabTwo.context.characterId, characterTwoId)

  const noPrimary = domain.evaluatePrimaryCharacterState([
    createLink({ isPrimary: false }),
  ])
  assert.equal(noPrimary.status, "primary_missing")
  const invalidPrimary = domain.evaluatePrimaryCharacterState([
    createLink({ state: "removed", removedAt: "2026-07-17T10:00:00.000Z" }),
    linkTwo,
  ])
  assert.equal(invalidPrimary.status, "primary_invalid")
  const revokedPrimary = domain.evaluatePrimaryCharacterState([
    createLink({
      state: "revoked",
      revokedAt: "2026-07-17T10:00:00.000Z",
    }),
  ])
  assert.equal(revokedPrimary.status, "primary_invalid")
  assert.equal(revokedPrimary.reason, "revoked")
  const allowedPrimaryChange = domain.evaluatePrimaryCharacterChange({
    links: [linkOne, linkTwo],
    requestedCharacterLinkId: linkTwoId,
    expectedIdentityRevision: revisionOne,
    currentIdentityRevision: revisionOne,
  })
  assert.equal(allowedPrimaryChange.outcome, "allowed")
  const stalePrimaryChange = domain.evaluatePrimaryCharacterChange({
    links: [linkOne, linkTwo],
    requestedCharacterLinkId: linkTwoId,
    expectedIdentityRevision: revisionOne,
    currentIdentityRevision: revisionTwo,
  })
  assert.equal(stalePrimaryChange.outcome, "revision_conflict")

  const NON_PRODUCTION_TEST_LIMIT_CONFIGURATION = Object.freeze({
    baseAccountLimit: 3,
    entitlementAdjustment: 0,
    allianceRoleAdjustment: 0,
    subscriptionAdjustment: 0,
    absoluteSafetyCeiling: 10,
  })
  assert.equal(domain.evaluateCharacterLimit({
    currentLinkedCharacterCount: 2,
    configuration: NON_PRODUCTION_TEST_LIMIT_CONFIGURATION,
  }).outcome, "allowed")
  assert.equal(domain.evaluateCharacterLimit({
    currentLinkedCharacterCount: 3,
    configuration: NON_PRODUCTION_TEST_LIMIT_CONFIGURATION,
  }).outcome, "limit_reached")
  assert.equal(domain.evaluateCharacterLimit({
    currentLinkedCharacterCount: 1,
    configuration: {
      ...NON_PRODUCTION_TEST_LIMIT_CONFIGURATION,
      baseAccountLimit: Number.POSITIVE_INFINITY,
    },
  }).outcome, "invalid_configuration")
  assert.equal(domain.evaluateCharacterLimit({
    currentLinkedCharacterCount: 1,
    configuration: {
      ...NON_PRODUCTION_TEST_LIMIT_CONFIGURATION,
      entitlementAdjustment: 20,
    },
  }).outcome, "override_required")
  assert.equal(domain.evaluateCharacterLimit({
    currentLinkedCharacterCount: 3,
    configuration: {
      ...NON_PRODUCTION_TEST_LIMIT_CONFIGURATION,
      administrativeOverride: {
        limit: 5,
        reason: "synthetic_test_exception",
      },
    },
  }).outcome, "allowed")

  const visibility = {
    audience: "public",
    visibleFields: ["publicAlias", "displayName", "visibility"],
    revision: revisionOne,
  }
  const publicProjection = domain.projectPublicPlayer({
    publicAlias,
    displayName: "安全 Player",
    avatar: { url: "https://example.invalid/avatar.png" },
    visibility,
    rawPlayerId: "123456789",
    forgeUserId,
    characterLinkId: linkOneId,
  })
  assert.equal(publicProjection.displayName, "安全 Player")
  assert.equal("avatar" in publicProjection, false)
  assertForbiddenKeysAbsent(publicProjection, [
    "rawPlayerId",
    "playerId",
    "forgeUserId",
    "characterLinkId",
    "evidenceReference",
  ])

  const privateProjection = {
    ownerForgeUserId: forgeUserId,
    linkedCharacters: [],
    identityRevision: revisionOne,
  }
  assert.equal(
    domain.projectPrivatePlayerForOwner(forgeUserId, privateProjection).outcome,
    "projected",
  )
  assert.equal(
    domain.projectPrivatePlayerForOwner(otherForgeUserId, privateProjection).outcome,
    "projection_not_allowed",
  )

  assert.equal(domain.evaluatePlayerFieldVisibility({
    field: "unknownField",
    visibility,
    viewer: { kind: "anonymous" },
  }).reason, "unknown_field")
  assert.equal(domain.evaluatePlayerFieldVisibility({
    field: "rawPlayerId",
    visibility,
    viewer: { kind: "anonymous" },
  }).reason, "internal_field")
  assert.equal(domain.validateVisibilitySelection({
    audience: "public",
    visibleFields: ["displayName", "unexpected"],
  }).valid, false)

  const giftProjection = {
    characterId: characterOneId,
    actorRelationship: "owner",
    activeCharacterStatus: "rejected",
    authorizationState: "not_authorised",
    verificationState: "unverified",
    linkState: "linked",
    providerPlayerIdProjectionAvailable: false,
    identityRevision: revisionOne,
    display: { displayName: "Synthetic Player" },
  }
  assertForbiddenKeysAbsent(giftProjection, [
    "consent",
    "credential",
    "redemption",
    "retry",
    "transport",
    "signing",
  ])

  const artAttribution = domain.projectArtStudioAttribution({
    publicAlias,
    displayName: "Synthetic Player",
    visibilityRevision: revisionOne,
  })
  assertForbiddenKeysAbsent(artAttribution, [
    "playerId",
    "forgeUserId",
    "characterLinkId",
  ])

  const heroBoundary = {
    characterId: characterOneId,
    ownershipClaimState: "unclaimed",
    progressionClaims: [],
    publicSelection: {
      entries: [],
      selectionRevision: revisionOne,
      visibilityRevision: revisionOne,
    },
    canonicalHeroFactsOwner: "hero_domain",
    editorialRecommendationsOwner: "editorial_domain",
  }
  assert.equal(heroBoundary.canonicalHeroFactsOwner, "hero_domain")
  assert.equal(heroBoundary.editorialRecommendationsOwner, "editorial_domain")

  const immutableEvent = domain.createImmutablePlayerIdentityEvent({
    eventId,
    name: "CharacterLinked",
    occurredAt: "2026-07-17T10:00:00.000Z",
    identityRevision: revisionOne,
    actorForgeUserId: forgeUserId,
    characterId: characterOneId,
    characterLinkId: linkOneId,
    metadata: { reasonCode: "synthetic_link" },
  })
  assert.equal(Object.isFrozen(immutableEvent), true)
  assert.equal(Object.isFrozen(immutableEvent.metadata), true)
  assert.throws(() => domain.createImmutablePlayerIdentityEvent({
    eventId,
    name: "CharacterLinked",
    occurredAt: "2026-07-17T10:00:00.000Z",
    identityRevision: revisionOne,
    metadata: { providerSecret: "not-a-real-secret" },
  }), /Sensitive event metadata key rejected/)
  assert.throws(() => domain.createImmutablePlayerIdentityEvent({
    eventId,
    name: "CharacterVerificationGranted",
    occurredAt: "2026-07-17T10:00:00.000Z",
    identityRevision: revisionOne,
    metadata: {},
  }), /disabled until an approved provider exists/)
  const syntheticGrant = domain.createImmutablePlayerIdentityEvent({
    eventId,
    name: "CharacterVerificationGranted",
    occurredAt: "2026-07-17T10:00:00.000Z",
    identityRevision: revisionOne,
    metadata: { fixtureKind: "synthetic_unit_test" },
    syntheticUnitTestData: true,
  })
  assert.equal(syntheticGrant.syntheticUnitTestData, true)

  const requiredCodes = [
    "authentication_required",
    "actor_not_resolved",
    "character_not_found",
    "character_already_linked",
    "character_link_limit_reached",
    "character_link_revoked",
    "character_link_disputed",
    "character_link_removed",
    "primary_character_missing",
    "primary_character_invalid",
    "active_character_required",
    "active_character_not_linked",
    "active_character_revoked",
    "active_character_disputed",
    "active_character_not_verified",
    "active_character_verification_expired",
    "active_character_revision_conflict",
    "projection_not_allowed",
    "field_not_visible",
    "public_alias_unavailable",
    "invalid_request",
    "conflict",
    "stale_revision",
    "operation_not_supported",
  ]
  assert.deepEqual(domain.PLAYER_IDENTITY_RESULT_CODES, requiredCodes)
  assert.equal(
    new Set(domain.PLAYER_IDENTITY_RESULT_CODES).size,
    domain.PLAYER_IDENTITY_RESULT_CODES.length,
  )
  for (const code of requiredCodes) {
    assert.equal(domain.isPlayerIdentityResultCode(code), true)
  }

  const anonymousActor = await actorServer.createServerActorResolver({
    requestReader: {
      readRequestContext(requestContext) {
        return requestContext
      },
    },
    authenticator: {
      async authenticateCredential() {
        return undefined
      },
    },
    classifier: {
      async classifyActor() {
        return { kind: "authenticated_user" }
      },
    },
  }).resolveActor({})
  assert.equal(anonymousActor.actor.kind, "anonymous")

  const unresolvedActor = await actorServer.createServerActorResolver({
    requestReader: {
      readRequestContext() {
        return undefined
      },
    },
    authenticator: {
      async authenticateCredential() {
        return undefined
      },
    },
    classifier: {
      async classifyActor() {
        return { kind: "authenticated_user" }
      },
    },
  }).resolveActor({ malformed: true })
  assert.equal(unresolvedActor.outcome, "actor_not_resolved")

  const administratorActor = await actorServer.createServerActorResolver({
    requestReader: {
      readRequestContext(requestContext) {
        return requestContext
      },
    },
    authenticator: {
      async authenticateCredential() {
        return {
          forgeUserId,
          globalRoles: ["admin"],
        }
      },
    },
    classifier: {
      async classifyActor() {
        return { kind: "administrator" }
      },
    },
  }).resolveActor({ authorizationCredential: "synthetic-test-credential" })
  assert.equal(administratorActor.actor.kind, "administrator")

  const supportActor = await actorServer.createServerActorResolver({
    requestReader: {
      readRequestContext(requestContext) {
        return requestContext
      },
    },
    authenticator: {
      async authenticateCredential() {
        return {
          forgeUserId,
          globalRoles: ["moderator"],
        }
      },
    },
    classifier: {
      async classifyActor() {
        return {
          kind: "support",
          supportGrantReference: "synthetic_support_grant",
        }
      },
    },
  }).resolveActor({ authorizationCredential: "synthetic-test-credential" })
  assert.equal(supportActor.actor.kind, "support")

  const allianceId = requireValid(domain.validateAllianceId("alliance_0001"))
  const allianceCandidate = await actorServer.createServerActorResolver({
    requestReader: {
      readRequestContext(requestContext) {
        return requestContext
      },
    },
    authenticator: {
      async authenticateCredential() {
        return {
          forgeUserId,
          globalRoles: ["viewer"],
        }
      },
    },
    classifier: {
      async classifyActor({ requestedAllianceContext }) {
        return {
          kind: "alliance_resource_candidate",
          allianceId: requestedAllianceContext,
        }
      },
    },
  }).resolveActor({
    authorizationCredential: "synthetic-test-credential",
    requestedAllianceContext: allianceId,
  })
  assert.equal(allianceCandidate.actor.kind, "alliance_resource_candidate")
  assert.deepEqual(allianceCandidate.actor.globalRoles, ["viewer"])

  assert.equal(domain.validateDisplayName("  Łukasz 王 🧭  ").value, "Łukasz 王 🧭")
  assert.equal(domain.validateDisplayName("bad\u0000name").valid, false)
  assert.equal(domain.validateDisplayName("bad\u202Ename").valid, false)
  assert.equal(
    domain.validateDisplayName(String.fromCharCode(0xD800)).valid,
    false,
  )
  assert.equal(domain.validateExternalCharacterIdentifier("１２３４").valid, false)

  console.log("Player Identity focused tests passed.")
} finally {
  await vite.close()
}
