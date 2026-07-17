import type {
  ReadinessCapability,
  ReadinessStatus,
} from "./readiness.js";

export type VerificationResultState =
  | "passed"
  | "failed"
  | "blocked"
  | "not-run"
  | "stale"
  | "not-applicable";

export type VerificationAggregateState =
  | "ready"
  | "partial"
  | "blocked"
  | "unsupported";

export type VerificationSeverity =
  | "critical"
  | "high"
  | "medium"
  | "low"
  | "info";

export type VerificationConfidence =
  | "high"
  | "medium"
  | "low";

export type VerificationCapability =
  | ReadinessCapability
  | "workflow"
  | "permissions"
  | "projection"
  | "rls"
  | "migration"
  | "recovery"
  | "canonical-boundary"
  | "unsupported-operations";

export interface VerificationEnvironment {
  id: string;
  label: string;
  kind:
    | "local"
    | "preview"
    | "non-production"
    | "production";
  databaseProjectId?: string;
  databaseClassification:
    | "not-connected"
    | "unproven"
    | "non-production"
    | "production";
  databaseAccess: "none" | "read-only" | "controlled-write";
  description: string;
}

export interface VerificationCheckDefinition {
  id: string;
  datasetId?: string;
  capability: VerificationCapability;
  name: string;
  description: string;
  expectedEvidence: string;
  severity: VerificationSeverity;
  requiredForReady: boolean;
  supportingSources: readonly string[];
}

export interface VerificationEvidence {
  checkId: string;
  result: Exclude<VerificationResultState, "stale">;
  reason: string;
  environmentId: string;
  confidence: VerificationConfidence;
  attemptedAt: string;
  verifiedAt?: string;
  expiresAt?: string;
  verifier: string;
  remediation?: string;
  evidenceReferences: readonly string[];
}

export interface VerificationCheckResult
  extends VerificationCheckDefinition {
  result: VerificationResultState;
  reason: string;
  environment: VerificationEnvironment;
  confidence: VerificationConfidence;
  attemptedAt: string;
  verifiedAt?: string;
  expiresAt?: string;
  verifier: string;
  remediation?: string;
  evidenceReferences: readonly string[];
}

export interface VerificationCapabilitySummary {
  capability: VerificationCapability;
  status: VerificationAggregateState;
  checks: readonly VerificationCheckResult[];
}

export interface DatasetVerificationSummary {
  datasetId: string;
  datasetName: string;
  status: VerificationAggregateState;
  confidence: VerificationConfidence;
  capabilities: readonly VerificationCapabilitySummary[];
  checks: readonly VerificationCheckResult[];
  blockers: readonly VerificationCheckResult[];
  lastVerifiedAt?: string;
}

export interface VerificationRunDefinition {
  id: string;
  startedAt: string;
  completedAt: string;
  environmentId: string;
  verifier: string;
  sourceRevision: string;
  safeLog: readonly string[];
}

export interface VerificationResultCounts {
  passed: number;
  failed: number;
  blocked: number;
  notRun: number;
  stale: number;
  notApplicable: number;
}

export interface VerificationReadinessCounts {
  ready: number;
  partial: number;
  blocked: number;
  unsupported: number;
}

export interface VerificationSnapshot {
  run: VerificationRunDefinition;
  environment: VerificationEnvironment;
  results: readonly VerificationCheckResult[];
  datasets: readonly DatasetVerificationSummary[];
  resultCounts: VerificationResultCounts;
  readinessCounts: VerificationReadinessCounts;
}

export function resolveVerificationResult(
  evidence: VerificationEvidence,
  now: string,
): VerificationResultState {
  if (
    evidence.result === "passed" &&
    evidence.expiresAt &&
    Date.parse(evidence.expiresAt) <= Date.parse(now)
  ) {
    return "stale";
  }

  return evidence.result;
}

export function aggregateCapabilityVerification(
  results: readonly VerificationCheckResult[],
): VerificationAggregateState {
  const applicable = results.filter(
    ({ result }) => result !== "not-applicable",
  );

  if (applicable.length === 0) {
    return "unsupported";
  }

  if (
    applicable.some(
      ({ result }) =>
        result === "failed" || result === "blocked",
    )
  ) {
    return "blocked";
  }

  if (
    applicable.some(
      ({ result }) =>
        result === "not-run" || result === "stale",
    )
  ) {
    return "partial";
  }

  return "ready";
}

export function aggregateDatasetVerification(
  results: readonly VerificationCheckResult[],
): VerificationAggregateState {
  const required = results.filter(
    ({ requiredForReady, result }) =>
      requiredForReady && result !== "not-applicable",
  );

  if (required.length === 0) {
    return "unsupported";
  }

  if (
    required.some(({ result }) => result === "failed")
  ) {
    return "blocked";
  }

  if (
    required.every(
      ({ result }) => result === "passed",
    )
  ) {
    return "ready";
  }

  if (
    !required.some(({ result }) => result === "passed")
  ) {
    return "blocked";
  }

  return "partial";
}

export function verificationAggregateToReadinessStatus(
  status: VerificationAggregateState,
): ReadinessStatus {
  switch (status) {
    case "ready":
      return "implemented";
    case "partial":
    case "blocked":
      return "partial";
    case "unsupported":
      return "not-applicable";
  }
}
