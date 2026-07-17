import type {
  VerificationAggregateState,
  VerificationResultState,
} from "../../../../shared/platform/verification";

import {
  formatVerificationState,
} from "./verificationFormatting";

interface VerificationStatusBadgeProps {
  state: VerificationAggregateState | VerificationResultState;
}

export function VerificationStatusBadge({
  state,
}: VerificationStatusBadgeProps) {
  return (
    <span
      className={`verification-status verification-status--${state}`}
    >
      {formatVerificationState(state)}
    </span>
  );
}
