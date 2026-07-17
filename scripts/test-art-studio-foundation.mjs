import assert from "node:assert/strict";
import process from "node:process";
import {
  createServer,
} from "vite";

const vite = await createServer({
  appType: "custom",
  server: { middlewareMode: true },
});

try {
  const domain = await vite.ssrLoadModule(
    "/shared/domains/art-studio/index.ts",
  );
  const capabilities = await vite.ssrLoadModule(
    "/server/art-studio/capabilities.ts",
  );

  const contributorCapabilities = new Set([
    "contributions.submit",
  ]);
  const moderatorCapabilities = new Set([
    "moderation.manage",
  ]);
  const publisherCapabilities = new Set([
    "cms.publish",
  ]);

  assert.equal(
    domain.assertArtworkTransition(
      "draft",
      "submitted",
      {
        actorUserId: "owner-user",
        ownerUserId: "owner-user",
        capabilities: contributorCapabilities,
      },
    ).capability,
    "contributions.submit",
  );
  assert.equal(
    domain.assertArtworkTransition(
      "submitted",
      "approved",
      {
        actorUserId: "moderator-user",
        ownerUserId: "owner-user",
        capabilities: moderatorCapabilities,
      },
    ).actorRelationship,
    "non_owner",
  );
  assert.throws(
    () => domain.assertArtworkTransition(
      "draft",
      "published",
      {
        actorUserId: "publisher-user",
        ownerUserId: "owner-user",
        capabilities: publisherCapabilities,
      },
    ),
    (error) => error.code === "ART_STUDIO_INVALID_TRANSITION",
  );
  assert.throws(
    () => domain.assertArtworkTransition(
      "submitted",
      "approved",
      {
        actorUserId: "owner-user",
        ownerUserId: "owner-user",
        capabilities: moderatorCapabilities,
      },
    ),
    (error) => error.code === "ART_STUDIO_SELF_APPROVAL_FORBIDDEN",
  );
  assert.throws(
    () => domain.assertArtworkTransition(
      "approved",
      "published",
      {
        actorUserId: "owner-user",
        ownerUserId: "owner-user",
        capabilities: publisherCapabilities,
      },
    ),
    (error) => error.code === "ART_STUDIO_SELF_PUBLICATION_FORBIDDEN",
  );
  assert.doesNotThrow(() => domain.assertReportTransition(
    "open",
    "reviewing",
    moderatorCapabilities,
  ));
  assert.throws(
    () => domain.assertReportTransition(
      "resolved",
      "open",
      moderatorCapabilities,
    ),
    (error) => error.code === "ART_STUDIO_INVALID_TRANSITION",
  );

  const validDraft = {
    title: "王国 🏰 Alliance",
    description: "مرحبا · नमस्ते · שלום",
    content: "╔═⚔️═╗\n║ 王国 ║\n╚════╝\n👩‍🚀",
    category: "Alliance",
    tags: ["多言語", "KvK"],
    slug: "kingdom-alliance-art",
    attribution: {
      onBehalfOfAnotherCreator: false,
      displayName: null,
    },
  };
  assert.deepEqual(
    domain.validateArtStudioArtworkDraft(validDraft),
    [],
  );
  assert.equal(domain.isValidArtStudioSlug("valid-art-42"), true);
  assert.equal(domain.isValidArtStudioSlug("Invalid Art"), false);

  const invalidTextIssues = domain.validateArtStudioArtworkDraft({
    ...validDraft,
    title: "",
    content: `safe${String.fromCharCode(0x0007)}`,
    slug: "Not Valid",
    attribution: {
      onBehalfOfAnotherCreator: true,
      displayName: "",
    },
  });
  assert.ok(invalidTextIssues.some(({ code }) => code === "required"));
  assert.ok(invalidTextIssues.some(({ code }) => code === "control_character"));
  assert.ok(invalidTextIssues.some(({ code }) => code === "invalid_slug"));
  assert.ok(invalidTextIssues.some(({ code }) => code === "attribution_required"));

  const malformedUnicodeIssues = domain.validateArtStudioArtworkDraft({
    ...validDraft,
    content: `broken${String.fromCharCode(0xd800)}`,
  });
  assert.ok(malformedUnicodeIssues.some(
    ({ code }) => code === "malformed_unicode",
  ));
  const invisibleIssues = domain.validateArtStudioArtworkDraft({
    ...validDraft,
    description: `spoof${String.fromCharCode(0x202e)}`,
  });
  assert.ok(invisibleIssues.some(
    ({ code }) => code === "unsafe_invisible_character",
  ));
  const repetitionIssues = domain.validateArtStudioArtworkDraft({
    ...validDraft,
    content: "═".repeat(513),
  });
  assert.ok(repetitionIssues.some(
    ({ code }) => code === "excessive_repetition",
  ));

  const actor = {
    userId: "moderator-user",
    role: "moderator",
    roles: ["moderator"],
  };
  const resolver = {
    async hasCapability(_actor, capability) {
      return capability === "moderation.manage";
    },
  };
  await capabilities.assertArtStudioModerationCapability(
    actor,
    "owner-user",
    resolver,
  );
  await assert.rejects(
    () => capabilities.assertArtStudioPublicationCapability(
      actor,
      "owner-user",
      resolver,
    ),
    (error) => error.code === "ART_STUDIO_CAPABILITY_REQUIRED",
  );
  await assert.rejects(
    () => capabilities.assertArtStudioModerationCapability(
      actor,
      "moderator-user",
      resolver,
    ),
    (error) => error.code === "ART_STUDIO_SELF_APPROVAL_FORBIDDEN",
  );

  const queriedTables = [];
  const capabilityClient = {
    from(table) {
      queriedTables.push(table);
      if (table === "forge_user_roles") {
        return {
          select() { return this; },
          eq() { return this; },
          async maybeSingle() {
            return { data: { role: "admin" }, error: null };
          },
        };
      }
      return {
        select() { return this; },
        eq() { return this; },
        async limit() {
          return {
            data: [{ permission_key: "cms.publish" }],
            error: null,
          };
        },
      };
    },
  };
  const supabaseResolver =
    new capabilities.SupabaseArtStudioCapabilityResolver(
      capabilityClient,
    );
  assert.equal(
    await supabaseResolver.hasCapability(
      { userId: "publisher-user" },
      "cms.publish",
    ),
    true,
  );
  assert.deepEqual(queriedTables, [
    "forge_user_roles",
    "forge_role_permissions",
  ]);

  const rateLimitError = new domain.ArtStudioDomainError({
    code: "ART_STUDIO_RATE_LIMITED",
    message: "Try again later.",
    statusCode: 429,
    retryable: true,
    retryAfterSeconds: 30,
  });
  assert.deepEqual(domain.toArtStudioErrorEnvelope(rateLimitError), {
    error: {
      code: "ART_STUDIO_RATE_LIMITED",
      message: "Try again later.",
      retryable: true,
      retryAfterSeconds: 30,
    },
  });
  assert.deepEqual(
    domain.ART_STUDIO_RATE_LIMIT_POLICIES.report,
    { limit: 5, windowSeconds: 86_400 },
  );

  const event = domain.createArtStudioDomainEvent({
    id: "event-1",
    name: "ArtworkPublished",
    aggregateId: "artwork-1",
    actorUserId: "publisher-user",
    occurredAt: "2026-07-17T12:00:00.000Z",
    payload: { revisionId: "revision-1" },
  });
  assert.equal(event.schemaVersion, 1);
  assert.equal(event.name, "ArtworkPublished");

  console.log("Art Studio domain and server-boundary tests passed.");
  console.log("Verified lifecycle rules, owner restrictions, capability checks, Unicode validation, stable errors, rate-limit metadata and internal events without database access.");
} finally {
  await vite.close();
}

process.exitCode = 0;
