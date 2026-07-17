import {
  aggregateCapabilityVerification,
  aggregateDatasetVerification,
  resolveVerificationResult,
  type DatasetVerificationSummary,
  type VerificationCapability,
  type VerificationCapabilitySummary,
  type VerificationCheckDefinition,
  type VerificationCheckResult,
  type VerificationConfidence,
  type VerificationEnvironment,
  type VerificationEvidence,
  type VerificationReadinessCounts,
  type VerificationResultCounts,
  type VerificationRunDefinition,
  type VerificationSnapshot,
} from "../../../shared/platform/verification.js";

export interface VerificationServiceOptions {
  definitions: readonly VerificationCheckDefinition[];
  evidence: readonly VerificationEvidence[];
  environments: readonly VerificationEnvironment[];
  run: VerificationRunDefinition;
  datasetNames: Readonly<Record<string, string>>;
}

function latestEvidence(
  items: readonly VerificationEvidence[],
): VerificationEvidence | undefined {
  return [...items].sort((left, right) =>
    right.attemptedAt.localeCompare(left.attemptedAt),
  )[0];
}

function confidenceForStatus(
  status: DatasetVerificationSummary["status"],
): VerificationConfidence {
  switch (status) {
    case "ready":
    case "unsupported":
      return "high";
    case "partial":
      return "medium";
    case "blocked":
      return "low";
  }
}

function lastVerifiedAt(
  results: readonly VerificationCheckResult[],
): string | undefined {
  return results
    .flatMap(({ verifiedAt }) =>
      verifiedAt ? [verifiedAt] : [],
    )
    .sort((left, right) => right.localeCompare(left))[0];
}

function resultCounts(
  results: readonly VerificationCheckResult[],
): VerificationResultCounts {
  return {
    passed: results.filter(({ result }) => result === "passed").length,
    failed: results.filter(({ result }) => result === "failed").length,
    blocked: results.filter(({ result }) => result === "blocked").length,
    notRun: results.filter(({ result }) => result === "not-run").length,
    stale: results.filter(({ result }) => result === "stale").length,
    notApplicable: results.filter(
      ({ result }) => result === "not-applicable",
    ).length,
  };
}

function readinessCounts(
  datasets: readonly DatasetVerificationSummary[],
): VerificationReadinessCounts {
  return {
    ready: datasets.filter(({ status }) => status === "ready").length,
    partial: datasets.filter(({ status }) => status === "partial").length,
    blocked: datasets.filter(({ status }) => status === "blocked").length,
    unsupported: datasets.filter(
      ({ status }) => status === "unsupported",
    ).length,
  };
}

function isBlocker(result: VerificationCheckResult): boolean {
  return (
    result.requiredForReady &&
    ["failed", "blocked", "not-run", "stale"].includes(
      result.result,
    )
  );
}

export class VerificationService {
  private readonly options: VerificationServiceOptions;

  constructor(options: VerificationServiceOptions) {
    this.options = options;
  }

  createSnapshot(
    now: string = new Date().toISOString(),
  ): VerificationSnapshot {
    const environment = this.options.environments.find(
      ({ id }) => id === this.options.run.environmentId,
    );

    if (!environment) {
      throw new Error(
        `Verification environment "${this.options.run.environmentId}" is not registered.`,
      );
    }

    const results = this.options.definitions.map(
      (definition): VerificationCheckResult => {
        const matchingEvidence = this.options.evidence.filter(
          ({ checkId }) => checkId === definition.id,
        );
        const current = latestEvidence(matchingEvidence);

        if (!current) {
          return {
            ...definition,
            result: "not-run",
            reason: "No verification evidence has been recorded for this check.",
            environment,
            confidence: "low",
            attemptedAt: this.options.run.completedAt,
            verifier: this.options.run.verifier,
            remediation: "Run the supporting check and record its evidence.",
            evidenceReferences: definition.supportingSources,
          };
        }

        const evidenceEnvironment =
          this.options.environments.find(
            ({ id }) => id === current.environmentId,
          );

        if (!evidenceEnvironment) {
          throw new Error(
            `Verification evidence for "${definition.id}" references unknown environment "${current.environmentId}".`,
          );
        }

        return {
          ...definition,
          ...current,
          result: resolveVerificationResult(current, now),
          environment: evidenceEnvironment,
        };
      },
    );

    const datasets = Object.entries(
      this.options.datasetNames,
    ).map(([datasetId, datasetName]) =>
      this.createDatasetSummary(
        datasetId,
        datasetName,
        results,
      ),
    );

    return {
      run: this.options.run,
      environment,
      results,
      datasets,
      resultCounts: resultCounts(results),
      readinessCounts: readinessCounts(datasets),
    };
  }

  private createDatasetSummary(
    datasetId: string,
    datasetName: string,
    results: readonly VerificationCheckResult[],
  ): DatasetVerificationSummary {
    const datasetResults = results.filter(
      (result) => result.datasetId === datasetId,
    );
    const capabilities = [
      ...new Set(
        datasetResults.map(({ capability }) => capability),
      ),
    ].map(
      (capability): VerificationCapabilitySummary => {
        const checks = datasetResults.filter(
          (result) => result.capability === capability,
        );

        return {
          capability: capability as VerificationCapability,
          status: aggregateCapabilityVerification(checks),
          checks,
        };
      },
    );
    const status = aggregateDatasetVerification(datasetResults);

    return {
      datasetId,
      datasetName,
      status,
      confidence: confidenceForStatus(status),
      capabilities,
      checks: datasetResults,
      blockers: datasetResults.filter(isBlocker),
      lastVerifiedAt: lastVerifiedAt(datasetResults),
    };
  }
}
