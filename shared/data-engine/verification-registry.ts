import {
  aggregateDatasetVerification,
  resolveVerificationResult,
  verificationAggregateToReadinessStatus,
  type VerificationCheckDefinition,
  type VerificationEvidence,
  type VerificationEnvironment,
  type VerificationResultState,
  type VerificationRunDefinition,
} from "../platform/verification.js";

import {
  DATASET_CAPABILITY_REGISTRY,
} from "./dataset-capabilities.js";
import {
  DATASET_KEYS,
  type DatasetKey,
} from "./datasets.js";

const ATTEMPTED_AT = "2026-07-17T11:30:00.000Z";
const EXPIRES_AT = "2026-07-24T11:30:00.000Z";
const VERIFIER = "Sprint 9.2 Milestone 4 local verification";

export const VERIFICATION_DATASET_NAMES: Readonly<
  Record<DatasetKey, string>
> = {
  heroes: "Heroes",
  "hero-skills": "Hero Skills",
  "hero-xp": "Hero XP",
  shards: "Hero Shards",
  gear: "Hero Gear",
  charm: "Chief Charms",
  troops: "Troops",
  buildings: "Buildings",
  truegold: "Truegold",
  "war-academy": "War Academy",
  vip: "VIP",
  events: "Events",
  masters: "Mastery Forging",
  kvk: "KvK Scoring",
};

export const LOCAL_VERIFICATION_ENVIRONMENT:
  VerificationEnvironment = {
    id: "local-unproven-database",
    label: "Local application / database classification unproven",
    kind: "local",
    databaseProjectId: "hrvdhjscwitqpwjhnjkm",
    databaseClassification: "unproven",
    databaseAccess: "read-only",
    description:
      "Application checks run locally. The only connected Supabase project could not be proven non-production, so migration, RLS and live publication writes were not run.",
  };

export const LOCAL_VERIFICATION_RUN:
  VerificationRunDefinition = {
    id: "sprint-9.2-m4-local-20260717",
    startedAt: "2026-07-17T11:20:00.000Z",
    completedAt: ATTEMPTED_AT,
    environmentId: LOCAL_VERIFICATION_ENVIRONMENT.id,
    verifier: VERIFIER,
    sourceRevision: "release/0.7.0-player-domain (local, unpushed)",
    safeLog: [
      "Repository and worktree checks completed without file overlap.",
      "Supabase project identity and migration history were inspected read-only.",
      "No safe non-production database environment was proven; live database checks are blocked.",
      "Deterministic structural, aggregation, API and in-memory publication checks were executed locally.",
      "No database write, deployment or production-data mutation was performed.",
    ],
  };

const definitions: VerificationCheckDefinition[] = [];
const evidence: VerificationEvidence[] = [];

interface AddCheckInput {
  id: string;
  datasetId?: DatasetKey;
  capability: VerificationCheckDefinition["capability"];
  name: string;
  description: string;
  expectedEvidence: string;
  severity: VerificationCheckDefinition["severity"];
  requiredForReady: boolean;
  supportingSources: readonly string[];
  result: Exclude<VerificationResultState, "stale">;
  reason: string;
  confidence: VerificationEvidence["confidence"];
  remediation?: string;
  evidenceReferences?: readonly string[];
  expiring?: boolean;
}

function addCheck(input: AddCheckInput): void {
  definitions.push({
    id: input.id,
    datasetId: input.datasetId,
    capability: input.capability,
    name: input.name,
    description: input.description,
    expectedEvidence: input.expectedEvidence,
    severity: input.severity,
    requiredForReady: input.requiredForReady,
    supportingSources: input.supportingSources,
  });

  evidence.push({
    checkId: input.id,
    result: input.result,
    reason: input.reason,
    environmentId: LOCAL_VERIFICATION_ENVIRONMENT.id,
    confidence: input.confidence,
    attemptedAt: ATTEMPTED_AT,
    verifiedAt:
      input.result === "passed"
        ? ATTEMPTED_AT
        : undefined,
    expiresAt: input.expiring ? EXPIRES_AT : undefined,
    verifier: VERIFIER,
    remediation: input.remediation,
    evidenceReferences:
      input.evidenceReferences ?? input.supportingSources,
  });
}

for (const datasetId of DATASET_KEYS) {
  const name = VERIFICATION_DATASET_NAMES[datasetId];
  const capabilities =
    DATASET_CAPABILITY_REGISTRY[datasetId];
  const isEditorBacked = capabilities.editing;
  const isPublishable = capabilities.publishing;

  addCheck({
    id: `${datasetId}:adapter-contract`,
    datasetId,
    capability: "adapter",
    name: `${name} source adapter contract`,
    description:
      "The registered source mode and Admin browser adapter agree with the canonical dataset registry.",
    expectedEvidence: "Registry and adapter consistency validation passes.",
    severity: "high",
    requiredForReady: true,
    supportingSources: [
      "shared/data-engine/dataset-capabilities.ts",
      "src/features/admin/datasetAdapterRegistry.ts",
      "scripts/validate-verification-centre.mjs",
    ],
    result: "passed",
    reason: "The dataset is registered with a matching browser adapter and source mode.",
    confidence: "high",
  });

  addCheck({
    id: `${datasetId}:browse`,
    datasetId,
    capability: "browser",
    name: `${name} browser`,
    description: "The Admin dataset route reaches an intentional loaded, empty or error state.",
    expectedEvidence: "Local route and responsive browser verification.",
    severity: "high",
    requiredForReady: true,
    supportingSources: [
      "docs/EDITORIAL_DATASET_AUDIT.md",
      "docs/testing/SPRINT-9.2-MILESTONE-3.md",
    ],
    result: "passed",
    reason: "The registered Admin route was exercised without fallback records or a broken terminal state.",
    confidence: "medium",
    expiring: true,
  });

  addCheck({
    id: `${datasetId}:record-view`,
    datasetId,
    capability: "viewer",
    name: `${name} record view`,
    description: "A loaded record can be inspected without exposing unavailable mutations.",
    expectedEvidence: "Admin record-view behavior is exercised locally.",
    severity: "medium",
    requiredForReady: true,
    supportingSources: [
      "src/features/admin/DatasetRecordPanel.tsx",
      "docs/EDITORIAL_DATASET_AUDIT.md",
    ],
    result: "passed",
    reason: "Record viewing is available through the shared Admin dataset browser.",
    confidence: "medium",
    expiring: true,
  });

  addCheck({
    id: `${datasetId}:editor`,
    datasetId,
    capability: "editor",
    name: `${name} Record Editor`,
    description: "Editing is exposed only when an adapter and Record Editor schema are registered.",
    expectedEvidence: isEditorBacked
      ? "Editor adapter and schema consistency tests pass."
      : "The dataset exposes no editing action.",
    severity: "high",
    requiredForReady: isEditorBacked,
    supportingSources: [
      "shared/data-engine/dataset-capabilities.ts",
      "src/features/admin/recordEditor/recordEditorSchemaRegistry.ts",
    ],
    result: isEditorBacked ? "passed" : "not-applicable",
    reason: isEditorBacked
      ? "A browser adapter, editor adapter and Record Editor schema are registered."
      : "This dataset is intentionally browse-only.",
    confidence: "high",
  });

  addCheck({
    id: `${datasetId}:workflow`,
    datasetId,
    capability: "workflow",
    name: `${name} editorial workflow`,
    description: "Draft and workflow transitions follow the shared editorial state machine.",
    expectedEvidence: isEditorBacked
      ? "Focused in-memory workflow tests pass."
      : "No editorial mutation workflow is declared.",
    severity: "critical",
    requiredForReady: isEditorBacked,
    supportingSources: [
      "scripts/test-editorial-api.mjs",
      "src/platform/editorial/services/EditorialWorkflowService.ts",
    ],
    result: isEditorBacked ? "passed" : "not-applicable",
    reason: isEditorBacked
      ? "Draft, review and role-governed transition contracts passed with in-memory persistence."
      : "Browse-only datasets do not expose editorial transitions.",
    confidence: isEditorBacked ? "high" : "medium",
    expiring: isEditorBacked,
  });

  addCheck({
    id: `${datasetId}:validation`,
    datasetId,
    capability: "validation",
    name: `${name} editorial validation`,
    description: "Server mutations reuse the registered Record Editor schema at the trust boundary.",
    expectedEvidence: capabilities.validation
      ? "Invalid payloads are rejected before persistence."
      : "No editable payload is accepted.",
    severity: "critical",
    requiredForReady: capabilities.validation,
    supportingSources: [
      "server/editorial/validation.ts",
      "scripts/test-editorial-api.mjs",
    ],
    result: capabilities.validation
      ? "passed"
      : "not-applicable",
    reason: capabilities.validation
      ? "Authoritative schema-driven validation is registered and covered by direct API tests."
      : "Editorial validation is not applicable because mutation is unsupported.",
    confidence: "high",
    expiring: capabilities.validation,
  });

  addCheck({
    id: `${datasetId}:permissions`,
    datasetId,
    capability: "permissions",
    name: `${name} mutation boundary`,
    description: "Direct API use cannot exceed the dataset capability and role policies.",
    expectedEvidence: "Permission or unsupported-capability responses are exercised without database writes.",
    severity: "critical",
    requiredForReady: true,
    supportingSources: [
      "scripts/test-editorial-api.mjs",
      "server/editorial/executeEditorialAction.ts",
    ],
    result: "passed",
    reason: isEditorBacked
      ? "Viewer and role-inappropriate mutations are rejected; supported role actions use the shared policy."
      : "Direct mutation is rejected for this browse-only dataset.",
    confidence: "high",
    expiring: true,
  });

  if (isPublishable) {
    addCheck({
      id: `${datasetId}:publication-contract`,
      datasetId,
      capability: "publishing",
      name: `${name} atomic publication contract`,
      description: "Queue binding, approval, concurrency, audit and atomic outcome contracts are verified locally.",
      expectedEvidence: "Structural and in-memory publication tests pass.",
      severity: "critical",
      requiredForReady: true,
      supportingSources: [
        "scripts/test-editorial-api.mjs",
        "scripts/validate-editorial-platform.mjs",
        "src/platform/persistence/supabase/SupabaseAtomicPublicationRepository.ts",
      ],
      result: "passed",
      reason: "The application and transaction boundary passed deterministic local contract checks.",
      confidence: "medium",
      expiring: true,
    });

    addCheck({
      id: `${datasetId}:publication-live`,
      datasetId,
      capability: "publishing",
      name: `${name} live publication`,
      description: "A controlled non-production transaction proves projection, history, audit and queue atomicity.",
      expectedEvidence: "Success and forced-failure transactions pass in a proven non-production database.",
      severity: "critical",
      requiredForReady: true,
      supportingSources: [
        "supabase/migrations/20260717170000_secure_atomic_editorial_publication.sql",
        "docs/testing/SPRINT-9.2-MILESTONE-4.md",
      ],
      result: "blocked",
      reason: "No safe non-production Supabase environment could be proven, so no live publication write was attempted.",
      confidence: "high",
      remediation: "Provision or identify an approved non-production branch, then execute the controlled migration and transaction plan.",
    });

    addCheck({
      id: `${datasetId}:queue-and-schedule`,
      datasetId,
      capability: "publishing",
      name: `${name} queue and schedule contract`,
      description: "Publication queueing and scheduling remain bound to the supplied dataset, record and approved head.",
      expectedEvidence: "Direct API tests pass for valid queue/schedule actions and reject mismatched resources.",
      severity: "critical",
      requiredForReady: true,
      supportingSources: [
        "scripts/test-editorial-api.mjs",
        "src/platform/publishing/PublicationQueueService.ts",
        "src/platform/publishing/scheduling/ScheduledPublishingService.ts",
      ],
      result: "passed",
      reason: "Local API contracts covered queueing, scheduling and resource-mismatch rejection without database writes.",
      confidence: "high",
      expiring: true,
    });

    addCheck({
      id: `${datasetId}:projection-live`,
      datasetId,
      capability: "projection",
      name: `${name} live projection`,
      description: "The published projection changes only when the atomic transaction succeeds.",
      expectedEvidence: "Controlled projection before/after evidence and rollback-on-error evidence.",
      severity: "critical",
      requiredForReady: true,
      supportingSources: [
        "supabase/migrations/20260717170000_secure_atomic_editorial_publication.sql",
      ],
      result: "blocked",
      reason: "The projection SQL is reviewable but has not been applied or exercised against a controlled database.",
      confidence: "high",
      remediation: "Run the approved publication success and forced-failure cases outside production.",
    });

    addCheck({
      id: `${datasetId}:recovery`,
      datasetId,
      capability: "recovery",
      name: `${name} publication recovery`,
      description: "Failure, retry, duplicate execution and ambiguous-response behavior cannot report false success.",
      expectedEvidence: "In-memory and repository-mock recovery tests pass.",
      severity: "high",
      requiredForReady: true,
      supportingSources: [
        "scripts/test-editorial-api.mjs",
        "scripts/test-verification-centre.mjs",
      ],
      result: "passed",
      reason: "Failure-to-Failed, valid retry, duplicate rejection and ambiguous completed-response recovery passed locally.",
      confidence: "medium",
      expiring: true,
    });
  } else {
    addCheck({
      id: `${datasetId}:publication-unsupported`,
      datasetId,
      capability: "publishing",
      name: `${name} publication capability`,
      description: "The dataset does not claim a live publication projection.",
      expectedEvidence: "UI and API expose an explicit unsupported state.",
      severity: "high",
      requiredForReady: false,
      supportingSources: [
        "shared/data-engine/dataset-capabilities.ts",
      ],
      result: "not-applicable",
      reason: "Publication is not declared for this dataset.",
      confidence: "high",
    });

    addCheck({
      id: `${datasetId}:projection-unsupported`,
      datasetId,
      capability: "projection",
      name: `${name} live projection`,
      description: "No editorial live-projection operation is declared.",
      expectedEvidence: "The operation is shown as Unsupported rather than Ready.",
      severity: "medium",
      requiredForReady: false,
      supportingSources: [
        "shared/data-engine/dataset-capabilities.ts",
      ],
      result: "not-applicable",
      reason: "No editorial publication projection is supported for this dataset.",
      confidence: "high",
    });
  }

  addCheck({
    id: `${datasetId}:rls-live`,
    datasetId,
    capability: "rls",
    name: `${name} live RLS matrix`,
    description: "Unauthenticated and Forge roles receive only the database reads declared by policy.",
    expectedEvidence: "Role-switched live queries pass in a proven non-production environment.",
    severity: "critical",
    requiredForReady: true,
    supportingSources: [
      "supabase/migrations/20260717170000_secure_atomic_editorial_publication.sql",
      "docs/testing/SPRINT-9.2-MILESTONE-4.md",
    ],
    result: isEditorBacked ? "blocked" : "not-run",
    reason: isEditorBacked
      ? "The proposed editorial RLS policies are unapplied and no safe database target exists."
      : "Live RLS for this browse-only canonical source was not exercised in this milestone.",
    confidence: "high",
    remediation: isEditorBacked
      ? "Apply the reviewed policy migration to an approved non-production branch and execute the role matrix."
      : "Audit and exercise the canonical source read policies in a controlled environment.",
  });

  addCheck({
    id: `${datasetId}:public-read`,
    datasetId,
    capability: "public-pages",
    name: `${name} public read behavior`,
    description: "Public consumers use only the intended canonical projection and never editorial drafts.",
    expectedEvidence: "Published-only consumer inspection and controlled runtime evidence.",
    severity: "critical",
    requiredForReady: true,
    supportingSources: [
      "docs/EDITORIAL_DATASET_AUDIT.md",
    ],
    result:
      datasetId === "heroes" || datasetId === "hero-skills"
        ? "blocked"
        : "not-run",
    reason:
      datasetId === "heroes" || datasetId === "hero-skills"
        ? "Published-only wiring is structurally covered, but the live projection and RLS path remain unverified."
        : "Public/API consumption remains outside the exercised evidence for this dataset.",
    confidence: "medium",
    remediation: "Exercise the public consumer against a controlled published projection and capture the source boundary.",
  });

  addCheck({
    id: `${datasetId}:unsupported-operations`,
    datasetId,
    capability: "unsupported-operations",
    name: `${name} archive, restore and rollback boundary`,
    description: "Ambiguous live-projection operations remain unavailable in API and UI.",
    expectedEvidence: "Unsupported operations return explicit capability results and expose no dead controls.",
    severity: "high",
    requiredForReady: true,
    supportingSources: [
      "server/editorial/executeEditorialAction.ts",
      "scripts/test-editorial-api.mjs",
    ],
    result: "passed",
    reason: "Archive, restore and rollback remain explicitly unsupported; no semantics were invented.",
    confidence: "high",
    expiring: true,
  });

  if (isEditorBacked) {
    addCheck({
      id: `${datasetId}:migration-application`,
      datasetId,
      capability: "migration",
      name: `${name} migration dependency`,
      description: "Required editorial policy and publication objects exist in the target database.",
      expectedEvidence: "Migration history and object inspection pass in an approved environment.",
      severity: "critical",
      requiredForReady: true,
      supportingSources: [
        "supabase/migrations/20260717170000_secure_atomic_editorial_publication.sql",
      ],
      result: "blocked",
      reason: "The approved migration exists locally but is absent from the connected project's migration history.",
      confidence: "high",
      remediation: "Review and apply the migration only to a proven non-production branch after explicit approval.",
    });
  }

  if (datasetId === "hero-skills") {
    addCheck({
      id: `${datasetId}:first-draft`,
      datasetId,
      capability: "editor",
      name: "Hero Skills first-draft creation",
      description: "The schema-driven create flow can establish the first editorial draft without a synthetic source record.",
      expectedEvidence: "The direct API creates a valid first draft and rejects invalid payloads before persistence.",
      severity: "critical",
      requiredForReady: true,
      supportingSources: [
        "scripts/test-editorial-api.mjs",
        "src/features/admin/recordEditor/recordEditorSchemaRegistry.ts",
      ],
      result: "passed",
      reason: "Schema-driven Hero Skills first-draft creation passed with in-memory persistence; no canonical record was changed.",
      confidence: "high",
      expiring: true,
    });

    addCheck({
      id: `${datasetId}:canonical-boundary`,
      datasetId,
      capability: "canonical-boundary",
      name: "Hero Skills canonical-data boundary",
      description: "Verification plumbing must not change canonical Hero Skills records, meanings or recommendations.",
      expectedEvidence: "Source diff and focused structural validation show no canonical content change.",
      severity: "critical",
      requiredForReady: true,
      supportingSources: [
        "scripts/test-hero-skills-governance.mjs",
        "docs/HERO_SKILLS_DATASET.md",
      ],
      result: "passed",
      reason: "The canonical contract rejects editorial recommendation fields and Exclusive Gear facts; the public projection contract selects safe fields only.",
      confidence: "high",
      expiring: true,
    });

    addCheck({
      id: `${datasetId}:source-governance-contract`,
      datasetId,
      capability: "verification",
      name: "Hero Skills source-governance contract",
      description: "Source identity, digest, licensing, attribution, review and withdrawal rules are explicit and locally validated.",
      expectedEvidence: "Focused source-evidence and canonical-contract tests pass using local fixtures only.",
      severity: "critical",
      requiredForReady: true,
      supportingSources: [
        "shared/platform/source-evidence.ts",
        "scripts/test-hero-skills-governance.mjs",
        "docs/governance/hero-skills-source-governance.md",
      ],
      result: "passed",
      reason: "Local fixtures prove the governance boundary without treating staged facts as approved.",
      confidence: "high",
      expiring: true,
    });

    addCheck({
      id: `${datasetId}:stable-identity-contract`,
      datasetId,
      capability: "validation",
      name: "Hero Skills stable identity contract",
      description: "Skill, progression and unlock identities are deterministic, collision-constrained and independent from names and source-row UUIDs.",
      expectedEvidence: "Stable identity tests cover renames, variants, duplicate slots and immutable seeds.",
      severity: "critical",
      requiredForReady: true,
      supportingSources: [
        "docs/architecture/adr/ADR-0003-hero-skill-stable-identifiers.md",
        "scripts/test-hero-skills-governance.mjs",
      ],
      result: "passed",
      reason: "UUID-v5 identity minting is deterministic and corrections retain the stored identity seed.",
      confidence: "high",
      expiring: true,
    });

    addCheck({
      id: `${datasetId}:approved-source-coverage`,
      datasetId,
      capability: "canonical-boundary",
      name: "Hero Skills approved source coverage",
      description: "Every canonical fact must be supported by approved, licensed and record-reviewed evidence.",
      expectedEvidence: "An approved source inventory covers the intended Hero roster with canonical names and record-level review decisions.",
      severity: "critical",
      requiredForReady: true,
      supportingSources: [
        "docs/audits/HERO_SKILLS_SOURCE_INVENTORY.md",
      ],
      result: "blocked",
      reason: "The 60 staged facts cover 10 heroes, all remain unreviewed, 36 lack canonical names and no licensing decision is recorded.",
      confidence: "high",
      remediation: "Clark and Aegis must approve a licensed source and record-level review plan before canonical promotion.",
    });

    addCheck({
      id: `${datasetId}:governance-schema-application`,
      datasetId,
      capability: "migration",
      name: "Hero Skills governance schema application",
      description: "The reviewed source-evidence, progression, unlock and publication-eligibility schema is applied in a controlled environment.",
      expectedEvidence: "Approved non-production migration history, constraints, RLS and rollback evidence.",
      severity: "critical",
      requiredForReady: true,
      supportingSources: [
        "supabase/migrations/20260717130617_hero_skill_source_governance_foundation.sql",
        "docs/testing/SPRINT-9.3-HERO-SKILLS-GOVERNANCE.md",
      ],
      result: "blocked",
      reason: "The Sprint 9.3 migration is a local unapplied proposal and production remains unchanged.",
      confidence: "high",
      remediation: "Approve the ADR and schema, update publication compatibility, then validate only in a proven non-production database.",
    });
  }

  if (datasetId === "buildings") {
    addCheck({
      id: `${datasetId}:publication-rejection`,
      datasetId,
      capability: "unsupported-operations",
      name: "Buildings publication rejection",
      description: "Buildings remains editable without claiming a live publication projection.",
      expectedEvidence: "The UI shows Unsupported and direct API publication returns 422.",
      severity: "critical",
      requiredForReady: true,
      supportingSources: [
        "scripts/test-editorial-api.mjs",
        "shared/data-engine/dataset-capabilities.ts",
      ],
      result: "passed",
      reason: "Buildings publishing is absent from the UI and rejected through the direct API contract.",
      confidence: "high",
      expiring: true,
    });
  }
}

const platformChecks: readonly AddCheckInput[] = [
  {
    id: "platform:unknown-dataset",
    capability: "permissions",
    name: "Unknown dataset boundary",
    description: "Unknown dataset routes and mutations cannot receive fallback capabilities.",
    expectedEvidence: "The UI shows not found and direct mutation returns 404.",
    severity: "critical",
    requiredForReady: true,
    supportingSources: [
      "src/features/admin/AdminDatasetDetailPage.tsx",
      "scripts/test-editorial-api.mjs",
    ],
    result: "passed",
    reason: "Unknown dataset behavior is intentional in both Admin and API paths.",
    confidence: "high",
    expiring: true,
  },
  {
    id: "platform:role-matrix",
    capability: "permissions",
    name: "Editorial role and permission matrix",
    description: "Unauthenticated, Viewer, Contributor, Moderator and Admin behavior agrees with shared policy.",
    expectedEvidence: "Direct API and policy-matrix tests pass without database writes.",
    severity: "critical",
    requiredForReady: true,
    supportingSources: [
      "scripts/test-editorial-api.mjs",
      "scripts/test-verification-centre.mjs",
    ],
    result: "passed",
    reason: "Local API and policy tests cover the supported role actions and rejections.",
    confidence: "high",
    expiring: true,
  },
  {
    id: "platform:service-role-boundary",
    capability: "permissions",
    name: "Service-role publication boundary",
    description: "The atomic transaction has no browser or authenticated-role execution grant.",
    expectedEvidence: "Migration source scan verifies explicit revokes and service-role-only grant.",
    severity: "critical",
    requiredForReady: true,
    supportingSources: [
      "supabase/migrations/20260717170000_secure_atomic_editorial_publication.sql",
      "scripts/validate-verification-centre.mjs",
    ],
    result: "passed",
    reason: "The proposed function revokes PUBLIC, anon and authenticated execution before granting service_role.",
    confidence: "high",
  },
  {
    id: "platform:migration-structure",
    capability: "migration",
    name: "Atomic publication migration structure",
    description: "The unapplied migration contains the minimum policies, grants, safe search paths and transaction boundary.",
    expectedEvidence: "Structural migration validation passes.",
    severity: "critical",
    requiredForReady: true,
    supportingSources: [
      "scripts/validate-editorial-platform.mjs",
      "scripts/validate-verification-centre.mjs",
    ],
    result: "passed",
    reason: "Local structural validation covers policy replacement, explicit grants, search-path safety and atomic writes.",
    confidence: "medium",
    expiring: true,
  },
  {
    id: "platform:migration-applied",
    capability: "migration",
    name: "Controlled migration application",
    description: "The migration is applied and rollback-tested outside production.",
    expectedEvidence: "Approved non-production migration history, object inspection and rollback evidence.",
    severity: "critical",
    requiredForReady: true,
    supportingSources: [
      "docs/testing/SPRINT-9.2-MILESTONE-4.md",
    ],
    result: "blocked",
    reason: "The only connected project could not be proven non-production; the migration remains unapplied.",
    confidence: "high",
    remediation: "Identify or provision an approved Supabase development branch and repeat Phase 1 before any write.",
  },
  {
    id: "platform:live-rls-matrix",
    capability: "rls",
    name: "Live role and RLS matrix",
    description: "Database grants and policies agree with UI and API permissions for every role.",
    expectedEvidence: "Role-switched queries pass in a proven non-production environment.",
    severity: "critical",
    requiredForReady: true,
    supportingSources: [
      "docs/testing/SPRINT-9.2-MILESTONE-4.md",
    ],
    result: "blocked",
    reason: "No live RLS query was run because the database target classification is unproven.",
    confidence: "high",
    remediation: "Execute the documented role matrix after controlled migration approval.",
  },
  {
    id: "platform:responsive-accessibility",
    capability: "mobile",
    name: "Verification Centre responsive and keyboard behavior",
    description: "Overview and detail routes remain operable at required desktop/mobile sizes and by keyboard.",
    expectedEvidence: "Browser dimensions, overflow, focus and keyboard checks pass.",
    severity: "high",
    requiredForReady: true,
    supportingSources: [
      "docs/testing/SPRINT-9.2-MILESTONE-4.md",
      "src/features/admin/verification/verificationCentre.css",
    ],
    result: "passed",
    reason: "Desktop, mobile, overflow, focus visibility and keyboard navigation were exercised locally.",
    confidence: "medium",
    expiring: true,
  },
  {
    id: "platform:secret-scan",
    capability: "verification",
    name: "Tracked-source secret scan",
    description: "Tracked source contains no credential-bearing environment file or recognisable secret material.",
    expectedEvidence: "Focused tracked-source scan passes.",
    severity: "critical",
    requiredForReady: true,
    supportingSources: [
      "scripts/validate-verification-centre.mjs",
    ],
    result: "passed",
    reason: "The focused scan found no tracked environment credential file or recognised secret literal.",
    confidence: "high",
    expiring: true,
  },
  {
    id: "platform:dependency-audit",
    capability: "verification",
    name: "Dependency vulnerability audit",
    description: "npm audit reports no known dependency vulnerability requiring review.",
    expectedEvidence: "npm audit exits successfully without automatic fixes.",
    severity: "high",
    requiredForReady: true,
    supportingSources: [
      "package-lock.json",
      "docs/testing/SPRINT-9.2-MILESTONE-4.md",
    ],
    result: "failed",
    reason: "npm audit reports 10 vulnerabilities: 6 high and 4 moderate, primarily through @vercel/node tooling.",
    confidence: "high",
    remediation: "Review an intentional @vercel/node/toolchain upgrade separately; the advertised automatic fix is a semver-major downgrade and was not applied.",
  },
  {
    id: "platform:worktree-overlap",
    capability: "verification",
    name: "Parallel worktree overlap",
    description: "Milestone 4 files do not accidentally overlap active Codex B or Codex C changes.",
    expectedEvidence: "Git worktree status and unique-file intersections show no overlap.",
    severity: "high",
    requiredForReady: true,
    supportingSources: [
      "docs/testing/SPRINT-9.2-MILESTONE-4.md",
    ],
    result: "passed",
    reason: "Both other worktrees were clean and the Milestone 4 file intersection was empty.",
    confidence: "high",
    expiring: true,
  },
];

for (const check of platformChecks) {
  addCheck(check);
}

export const DATASET_VERIFICATION_CHECKS:
  readonly VerificationCheckDefinition[] = definitions;

export const LOCAL_VERIFICATION_EVIDENCE:
  readonly VerificationEvidence[] = evidence;

export function getDatasetVerificationReadinessStatus(
  datasetId: DatasetKey,
  now: string = new Date().toISOString(),
) {
  const datasetDefinitions = definitions.filter(
    (check) => check.datasetId === datasetId,
  );
  const datasetEvidence = evidence.filter(
    (item) =>
      datasetDefinitions.some(
        (check) => check.id === item.checkId,
      ),
  );
  const syntheticResults = datasetDefinitions.map((check) => {
    const current = datasetEvidence.find(
      (item) => item.checkId === check.id,
    ) as VerificationEvidence;

    return {
      ...check,
      ...current,
      result: resolveVerificationResult(current, now),
      environment: LOCAL_VERIFICATION_ENVIRONMENT,
    };
  });

  return verificationAggregateToReadinessStatus(
    aggregateDatasetVerification(syntheticResults),
  );
}
