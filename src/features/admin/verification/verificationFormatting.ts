import type {
  DatasetVerificationSummary,
  VerificationAggregateState,
  VerificationCapability,
  VerificationResultState,
} from "../../../../shared/platform/verification";

export function formatVerificationState(
  state: VerificationAggregateState | VerificationResultState,
): string {
  switch (state) {
    case "ready":
      return "Ready";
    case "partial":
      return "Partial";
    case "passed":
      return "Passed";
    case "failed":
      return "Failed";
    case "blocked":
      return "Blocked";
    case "not-run":
      return "Not run";
    case "stale":
      return "Stale";
    case "unsupported":
    case "not-applicable":
      return "Unsupported";
  }
}

export function formatVerificationDate(
  value: string | undefined,
): string {
  if (!value) {
    return "No passing evidence";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString();
}

export function getCapabilityStatus(
  dataset: DatasetVerificationSummary,
  capability: VerificationCapability,
): VerificationAggregateState {
  return dataset.capabilities.find(
    (summary) => summary.capability === capability,
  )?.status ?? "unsupported";
}
