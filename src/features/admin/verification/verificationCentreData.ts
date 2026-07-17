import {
  DATASET_VERIFICATION_CHECKS,
  LOCAL_VERIFICATION_ENVIRONMENT,
  LOCAL_VERIFICATION_EVIDENCE,
  LOCAL_VERIFICATION_RUN,
  VERIFICATION_DATASET_NAMES,
} from "../../../../shared/data-engine/verification-registry";

import {
  VerificationService,
} from "../../../platform/verification";

const verificationService = new VerificationService({
  definitions: DATASET_VERIFICATION_CHECKS,
  evidence: LOCAL_VERIFICATION_EVIDENCE,
  environments: [LOCAL_VERIFICATION_ENVIRONMENT],
  run: LOCAL_VERIFICATION_RUN,
  datasetNames: VERIFICATION_DATASET_NAMES,
});

export function getVerificationSnapshot(
  now?: string,
) {
  return verificationService.createSnapshot(now);
}
