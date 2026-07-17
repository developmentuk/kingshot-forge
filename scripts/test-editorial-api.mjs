import assert from "node:assert/strict";
import process from "node:process";
import {
  createServer,
} from "vite";

const vite = await createServer({
  appType: "custom",
  server: { middlewareMode: true },
});

function createResponse() {
  return {
    statusCode: 200,
    body: null,
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

try {
  const platform = await vite.ssrLoadModule(
    "/src/platform/index.ts",
  );
  const commandModule = await vite.ssrLoadModule(
    "/server/editorial/executeEditorialAction.ts",
  );
  const httpModule = await vite.ssrLoadModule(
    "/server/editorial/http.ts",
  );
  const actionApi = await vite.ssrLoadModule(
    "/api/editorial/action.ts",
  );

  function createRuntime() {
    const editorialRepository =
      new platform.InMemoryEditorialRepository();
    const queueRepository =
      new platform.InMemoryPublicationQueueRepository();
    const scheduleRepository =
      new platform.InMemoryScheduledPublicationRepository();
    const draftService =
      new platform.EditorialDraftService(
        editorialRepository,
      );
    const workflowService =
      new platform.EditorialWorkflowService(
        editorialRepository,
      );
    const historyService =
      new platform.EditorialHistoryService(
        editorialRepository,
      );
    const permissionService =
      new platform.EditorialPermissionService();
    const queueService =
      new platform.PublicationQueueService(
        queueRepository,
        async (context) => ({
          publishedVersionId:
            `mock-published-${context.item.versionId}`,
        }),
      );
    const scheduledPublishingService =
      new platform.ScheduledPublishingService(
        scheduleRepository,
        queueService,
      );

    return {
      editorialRepository,
      draftService,
      workflowService,
      historyService,
      permissionService,
      queueService,
      scheduledPublishingService,
    };
  }

  const actors = {
    viewer: {
      userId: "viewer-user",
      role: "viewer",
      roles: ["viewer"],
    },
    contributor: {
      userId: "contributor-user",
      role: "contributor",
      roles: ["contributor"],
    },
    moderator: {
      userId: "moderator-user",
      role: "moderator",
      roles: ["moderator"],
    },
    admin: {
      userId: "admin-user",
      role: "admin",
      roles: ["admin"],
    },
  };
  const validHeroValues = {
    name: "Synthetic Validation Hero",
    slug: "synthetic-validation-hero",
    generation: 1,
    troop_type: "infantry",
    rarity: "rare",
    tags: [],
    is_active: true,
  };
  const recordExists = async (_datasetId, recordId) =>
    [
      "synthetic-validation-hero",
      "synthetic-building",
    ].includes(recordId);

  async function execute(
    body,
    actor,
    runtime = createRuntime(),
  ) {
    return commandModule.executeEditorialAction(
      body,
      actor,
      { runtime, recordExists },
    );
  }

  async function expectStatus(
    statusCode,
    operation,
    message,
  ) {
    let error;
    try {
      await operation();
    } catch (caught) {
      error = caught;
    }
    assert.ok(error, `${message}: expected an error`);
    const response = createResponse();
    httpModule.sendEditorialError(response, error);
    assert.equal(
      response.statusCode,
      statusCode,
      `${message}: ${response.body?.message}`,
    );
  }

  const unauthenticatedResponse = createResponse();
  await actionApi.default(
    {
      method: "POST",
      headers: {},
      body: {},
    },
    unauthenticatedResponse,
  );
  assert.equal(unauthenticatedResponse.statusCode, 401);

  await expectStatus(
    403,
    () =>
      execute(
        {
          action: "save_draft",
          datasetId: "heroes",
          recordId: "synthetic-validation-hero",
          values: validHeroValues,
          expectedVersion: null,
        },
        actors.viewer,
      ),
    "unauthorised draft mutation",
  );

  await expectStatus(
    404,
    () =>
      execute(
        {
          action: "save_draft",
          datasetId: "unknown-dataset",
          recordId: "record",
          values: {},
          expectedVersion: null,
        },
        actors.admin,
      ),
    "unknown dataset mutation",
  );

  await expectStatus(
    422,
    () =>
      execute(
        {
          action: "save_draft",
          datasetId: "events",
          recordId: "event",
          values: {},
          expectedVersion: null,
        },
        actors.admin,
      ),
    "browse-only dataset mutation",
  );

  await expectStatus(
    422,
    () =>
      execute(
        {
          action: "queue_publish",
          datasetId: "buildings",
          recordId: "academy",
          expectedVersion: 1,
        },
        actors.admin,
      ),
    "Buildings publication capability",
  );

  await expectStatus(
    422,
    () =>
      execute(
        {
          action: "save_draft",
          datasetId: "heroes",
          recordId: "synthetic-validation-hero",
          values: {
            name: "",
            generation: 0,
          },
          expectedVersion: null,
        },
        actors.contributor,
      ),
    "invalid record payload",
  );

  const heroSkillDraft = await execute(
    {
      action: "save_draft",
      datasetId: "hero-skills",
      recordId: "synthetic-skill",
      values: {
        id: "synthetic-skill",
        hero_slug: "synthetic-validation-hero",
        name: "Synthetic validation skill",
        category: "conquest",
        display_order: 1,
        slot_index: 1,
        max_level: 5,
        is_active: true,
      },
      expectedVersion: null,
    },
    actors.contributor,
  );
  assert.equal(heroSkillDraft.head.status, "draft");

  const buildingDraft = await execute(
    {
      action: "save_draft",
      datasetId: "buildings",
      recordId: "synthetic-building",
      values: {
        key: "synthetic-building",
        name: "Synthetic validation building",
        maxLevel: 1,
        source: "https://example.invalid/validation",
        costs: [[1, 0, 0, 0, 0, 0, 0]],
      },
      expectedVersion: null,
    },
    actors.contributor,
  );
  assert.equal(buildingDraft.head.status, "draft");

  const runtime = createRuntime();
  const draft = await execute(
    {
      action: "save_draft",
      datasetId: "heroes",
      recordId: "synthetic-validation-hero",
      values: validHeroValues,
      expectedVersion: null,
    },
    actors.contributor,
    runtime,
  );

  await expectStatus(
    409,
    () =>
      execute(
        {
          action: "save_draft",
          datasetId: "heroes",
          recordId: "synthetic-validation-hero",
          values: validHeroValues,
          expectedVersion: draft.head.currentVersion + 1,
        },
        actors.contributor,
        runtime,
      ),
    "stale version",
  );

  const review = await execute(
    {
      action: "submit_for_review",
      datasetId: "heroes",
      recordId: "synthetic-validation-hero",
      expectedVersion: draft.head.currentVersion,
    },
    actors.contributor,
    runtime,
  );

  await expectStatus(
    409,
    () =>
      execute(
        {
          action: "submit_for_review",
          datasetId: "heroes",
          recordId: "synthetic-validation-hero",
          expectedVersion: review.head.currentVersion,
        },
        actors.contributor,
        runtime,
      ),
    "invalid transition",
  );

  await expectStatus(
    409,
    () =>
      execute(
        {
          action: "save_draft",
          datasetId: "heroes",
          recordId: "synthetic-validation-hero",
          values: validHeroValues,
          expectedVersion: review.head.currentVersion,
        },
        actors.contributor,
        runtime,
      ),
    "save draft status reset prevention",
  );

  const returnedDraft = await execute(
    {
      action: "reject",
      datasetId: "heroes",
      recordId: "synthetic-validation-hero",
      expectedVersion: review.head.currentVersion,
      note: "Synthetic validation request",
    },
    actors.moderator,
    runtime,
  );
  const secondReview = await execute(
    {
      action: "submit_for_review",
      datasetId: "heroes",
      recordId: "synthetic-validation-hero",
      expectedVersion:
        returnedDraft.head.currentVersion,
    },
    actors.contributor,
    runtime,
  );

  await expectStatus(
    403,
    () =>
      execute(
        {
          action: "approve",
          datasetId: "heroes",
          recordId: "synthetic-validation-hero",
          expectedVersion:
            secondReview.head.currentVersion,
        },
        actors.moderator,
        runtime,
      ),
    "unauthorised approval",
  );

  const approved = await execute(
    {
      action: "approve",
      datasetId: "heroes",
      recordId: "synthetic-validation-hero",
      expectedVersion:
        secondReview.head.currentVersion,
    },
    actors.admin,
    runtime,
  );
  const schedule = await execute(
    {
      action: "schedule_publish",
      datasetId: "heroes",
      recordId: "synthetic-validation-hero",
      expectedVersion: approved.head.currentVersion,
      scheduledFor: "2099-01-01T00:00:00.000Z",
    },
    actors.admin,
    runtime,
  );

  await expectStatus(
    409,
    () =>
      execute(
        {
          action: "cancel_schedule",
          datasetId: "heroes",
          recordId: "different-record",
          scheduleId: schedule.id,
        },
        actors.admin,
        runtime,
      ),
    "mismatched schedule resource",
  );

  const queueItem = await execute(
    {
      action: "queue_publish",
      datasetId: "heroes",
      recordId: "synthetic-validation-hero",
      expectedVersion: approved.head.currentVersion,
    },
    actors.admin,
    runtime,
  );

  const editorialHistory =
    await runtime.historyService.getHistory(
      "heroes",
      "synthetic-validation-hero",
    );
  assert.equal(editorialHistory.totalVersions, 5);
  assert.ok(
    editorialHistory.entries.some(
      (entry) =>
        entry.auditEvent?.action === "rejected" &&
        entry.auditEvent.actorId === "moderator-user",
    ),
  );
  assert.ok(
    editorialHistory.entries.some(
      (entry) =>
        entry.auditEvent?.action === "approved" &&
        entry.auditEvent.actorId === "admin-user",
    ),
  );

  await expectStatus(
    409,
    () =>
      execute(
        {
          action: "cancel_queue",
          datasetId: "heroes",
          recordId: "different-record",
          queueItemId: queueItem.id,
        },
        actors.admin,
        runtime,
      ),
    "mismatched queue resource",
  );

  const nonApprovedRuntime = createRuntime();
  const nonApprovedDraft = await execute(
    {
      action: "save_draft",
      datasetId: "heroes",
      recordId: "synthetic-validation-hero",
      values: validHeroValues,
      expectedVersion: null,
    },
    actors.contributor,
    nonApprovedRuntime,
  );
  await expectStatus(
    409,
    () =>
      execute(
        {
          action: "queue_publish",
          datasetId: "heroes",
          recordId: "synthetic-validation-hero",
          expectedVersion:
            nonApprovedDraft.head.currentVersion,
        },
        actors.admin,
        nonApprovedRuntime,
      ),
    "non-approved publication request",
  );

  await expectStatus(
    422,
    () =>
      execute(
        {
          action: "rollback",
          datasetId: "heroes",
          recordId: "synthetic-validation-hero",
          expectedVersion: approved.head.currentVersion,
          targetVersionId: draft.version.id,
        },
        actors.admin,
        runtime,
      ),
    "unsupported rollback",
  );

  for (const action of ["archive", "restore"]) {
    await expectStatus(
      422,
      () =>
        execute(
          {
            action,
            datasetId: "heroes",
            recordId: "synthetic-validation-hero",
            expectedVersion: approved.head.currentVersion,
          },
          actors.admin,
          runtime,
        ),
      `unsupported ${action}`,
    );
  }

  const failedQueueRepository =
    new platform.InMemoryPublicationQueueRepository();
  const failedQueueService =
    new platform.PublicationQueueService(
      failedQueueRepository,
      async () => {
        throw new Error(
          "Synthetic projection failure",
        );
      },
    );
  const failedItem = await failedQueueService.enqueue({
    datasetId: "heroes",
    recordId: "synthetic-validation-hero",
    versionId: "synthetic-approved-failure",
    expectedVersion: 3,
    requestedBy: "admin-user",
  });
  const failedResult =
    await failedQueueService.process(failedItem.id);
  assert.equal(failedResult.status, "failed");
  assert.equal(failedResult.attempts, 1);
  assert.equal(
    failedResult.failureMessage,
    "Synthetic projection failure",
  );
  const retriedResult =
    await failedQueueService.retry(failedItem.id);
  assert.equal(retriedResult.status, "pending");

  const atomicQueueRepository =
    new platform.InMemoryPublicationQueueRepository();
  const atomicQueueService =
    new platform.PublicationQueueService(
      atomicQueueRepository,
      async ({ item }) => {
        await atomicQueueRepository.update(
          {
            ...item,
            status: "completed",
            completedAt: "2026-07-17T17:00:00.000Z",
            metadata: {
              publishedVersionId:
                "synthetic-published-version",
            },
          },
          "processing",
        );
        return {
          publishedVersionId:
            "synthetic-published-version",
          queueOutcomeCommitted: true,
        };
      },
    );
  const atomicItem = await atomicQueueService.enqueue({
    datasetId: "heroes",
    recordId: "synthetic-validation-hero",
    versionId: "synthetic-approved-version",
    expectedVersion: 3,
    requestedBy: "admin-user",
  });
  const atomicResult =
    await atomicQueueService.process(atomicItem.id);
  assert.equal(atomicResult.status, "completed");

  console.log(
    "Editorial direct API contract tests passed (in-memory fixtures only).",
  );
  console.log(
    "Verified 401, 403, 404, 409 and 422 outcomes without Supabase writes.",
  );
} finally {
  await vite.close();
}

process.exitCode = 0;
