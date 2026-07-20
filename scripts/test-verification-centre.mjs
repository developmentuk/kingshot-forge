import assert from "node:assert/strict";
import process from "node:process";
import {
  createServer,
} from "vite";

const vite = await createServer({
  appType: "custom",
  server: { middlewareMode: true },
});

function capabilityStatus(dataset, capability) {
  return dataset.capabilities.find(
    (summary) => summary.capability === capability,
  )?.status;
}

try {
  const centre = await vite.ssrLoadModule(
    "/src/features/admin/verification/verificationCentreData.ts",
  );
  const platform = await vite.ssrLoadModule(
    "/src/platform/index.ts",
  );
  const verificationContracts = await vite.ssrLoadModule(
    "/shared/platform/verification.ts",
  );
  const registry = await vite.ssrLoadModule(
    "/shared/data-engine/verification-registry.ts",
  );

  const snapshot = centre.getVerificationSnapshot(
    "2026-07-17T12:00:00.000Z",
  );
  assert.equal(snapshot.datasets.length, 14);
  assert.equal(snapshot.environment.databaseClassification, "unproven");
  assert.equal(snapshot.environment.databaseAccess, "read-only");
  assert.equal(snapshot.readinessCounts.ready, 0);
  assert.equal(snapshot.readinessCounts.partial, 14);
  assert.equal(snapshot.resultCounts.failed, 1);
  assert.equal(snapshot.resultCounts.stale, 0);

  const heroes = snapshot.datasets.find(
    ({ datasetId }) => datasetId === "heroes",
  );
  const heroSkills = snapshot.datasets.find(
    ({ datasetId }) => datasetId === "hero-skills",
  );
  const buildings = snapshot.datasets.find(
    ({ datasetId }) => datasetId === "buildings",
  );
  const events = snapshot.datasets.find(
    ({ datasetId }) => datasetId === "events",
  );

  assert.equal(capabilityStatus(heroes, "publishing"), "blocked");
  assert.equal(capabilityStatus(heroes, "rls"), "blocked");
  assert.equal(capabilityStatus(heroSkills, "publishing"), "blocked");
  assert.ok(
    heroSkills.checks.some(
      ({ id, result }) =>
        id === "hero-skills:canonical-boundary" && result === "passed",
    ),
  );
  assert.ok(
    heroSkills.checks.some(
      ({ id, result }) =>
        id === "hero-skills:source-governance-contract" &&
        result === "passed",
    ),
  );
  assert.ok(
    heroSkills.checks.some(
      ({ id, result }) =>
        id === "hero-skills:approved-source-coverage" &&
        result === "blocked",
    ),
  );
  assert.ok(
    heroSkills.checks.some(
      ({ id, result }) =>
        id === "hero-skills:governance-schema-application" &&
        result === "blocked",
    ),
  );
  assert.equal(capabilityStatus(buildings, "publishing"), "blocked");
  assert.ok(
    buildings.checks.some(
      ({ id, result }) =>
        id === "buildings:atomic-publication" && result === "passed",
    ),
  );
  assert.equal(capabilityStatus(events, "browser"), "ready");
  assert.equal(capabilityStatus(events, "publishing"), "unsupported");
  assert.equal(
    snapshot.datasets.find(({ datasetId }) => datasetId === "unknown"),
    undefined,
  );

  const staleSnapshot = centre.getVerificationSnapshot(
    "2026-07-25T12:00:00.000Z",
  );
  assert.ok(staleSnapshot.resultCounts.stale > 0);
  assert.equal(staleSnapshot.readinessCounts.ready, 0);

  const customEnvironment = {
    id: "test",
    label: "Test",
    kind: "local",
    databaseClassification: "not-connected",
    databaseAccess: "none",
    description: "Synthetic aggregation test only.",
  };
  const customRun = {
    id: "test-run",
    startedAt: "2026-07-17T00:00:00.000Z",
    completedAt: "2026-07-17T00:01:00.000Z",
    environmentId: "test",
    verifier: "test",
    sourceRevision: "test",
    safeLog: [],
  };
  const customDefinition = {
    id: "test:required",
    datasetId: "test-dataset",
    capability: "verification",
    name: "Required test",
    description: "Test",
    expectedEvidence: "Test",
    severity: "high",
    requiredForReady: true,
    supportingSources: [],
  };

  const missingEvidenceService = new platform.VerificationService({
    definitions: [customDefinition],
    evidence: [],
    environments: [customEnvironment],
    run: customRun,
    datasetNames: { "test-dataset": "Test dataset" },
  });
  const missingSnapshot = missingEvidenceService.createSnapshot(
    "2026-07-17T00:02:00.000Z",
  );
  assert.equal(missingSnapshot.results[0].result, "not-run");
  assert.equal(missingSnapshot.datasets[0].status, "blocked");

  const unsupportedResult = {
    ...customDefinition,
    result: "not-applicable",
    reason: "Unsupported",
    environment: customEnvironment,
    confidence: "high",
    attemptedAt: customRun.completedAt,
    verifier: "test",
    evidenceReferences: [],
  };
  assert.equal(
    verificationContracts.aggregateDatasetVerification([unsupportedResult]),
    "unsupported",
  );

  const failedResult = {
    ...unsupportedResult,
    result: "failed",
  };
  assert.equal(
    verificationContracts.aggregateDatasetVerification([failedResult]),
    "blocked",
  );

  assert.equal(
    registry.getDatasetVerificationReadinessStatus("heroes"),
    "partial",
  );
  assert.equal(
    registry.getDatasetVerificationReadinessStatus(
      "heroes",
      "2026-07-25T12:00:00.000Z",
    ),
    "partial",
  );
  assert.equal(
    platform.canRolePerformStandardEditorialAction("viewer", "read"),
    true,
  );
  assert.equal(
    platform.canRolePerformStandardEditorialAction("viewer", "update"),
    false,
  );
  assert.equal(
    platform.canRolePerformStandardEditorialAction("contributor", "update"),
    true,
  );
  assert.equal(
    platform.canRolePerformStandardEditorialAction("moderator", "review"),
    true,
  );
  assert.equal(
    platform.canRolePerformStandardEditorialAction("moderator", "approve"),
    false,
  );
  assert.equal(
    platform.canRolePerformStandardEditorialAction("admin", "publish"),
    true,
  );
  assert.equal(
    platform.canRolePerformStandardEditorialAction("owner", "publish"),
    true,
  );

  const completedClient = {
    async rpc() {
      return { data: null, error: { message: "Ambiguous network response" } };
    },
    from() {
      return {
        select() { return this; },
        eq() { return this; },
        async maybeSingle() {
          return {
            data: {
              status: "completed",
              completed_at: "2026-07-17T00:00:00.000Z",
              metadata: { publishedVersionId: "published-version" },
            },
          };
        },
      };
    },
  };
  const atomicRepository = new platform.SupabaseAtomicPublicationRepository(
    completedClient,
    {
      now: () => "2026-07-17T00:00:00.000Z",
      createId: () => "generated-id",
    },
  );
  const recovered = await atomicRepository.publish({
    id: "queue-item",
    datasetId: "heroes",
    recordId: "hero",
    versionId: "approved-version",
    expectedVersion: 3,
    requestedBy: "admin-user",
    requestedAt: "2026-07-17T00:00:00.000Z",
    status: "processing",
    attempts: 1,
  });
  assert.equal(recovered.queueOutcomeCommitted, true);
  assert.equal(recovered.publishedVersionId, "published-version");
  assert.equal(recovered.metadata.recoveredAfterAmbiguousResponse, true);

  const incompleteClient = {
    ...completedClient,
    from() {
      return {
        select() { return this; },
        eq() { return this; },
        async maybeSingle() {
          return { data: { status: "processing", metadata: null } };
        },
      };
    },
  };
  const incompleteRepository =
    new platform.SupabaseAtomicPublicationRepository(incompleteClient);
  await assert.rejects(
    () => incompleteRepository.publish({
      id: "queue-item",
      datasetId: "heroes",
      recordId: "hero",
      versionId: "approved-version",
      expectedVersion: 3,
      requestedBy: "admin-user",
      requestedAt: "2026-07-17T00:00:00.000Z",
      status: "processing",
      attempts: 1,
    }),
    /Ambiguous network response/,
  );

  console.log("Verification Centre aggregation and evidence tests passed.");
  console.log("Verified 14 dataset summaries, honest blocked/unsupported states, staleness, permission matrix and ambiguous-response recovery without database writes.");
} finally {
  await vite.close();
}

process.exitCode = 0;
