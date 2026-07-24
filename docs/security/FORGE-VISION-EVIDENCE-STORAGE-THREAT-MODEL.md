# Forge Vision evidence storage threat model

Status: VISION-001D1 prepared; storage inactive
Scope: private screenshot evidence, upload intents, metadata, signed access and retention

| Threat | Control | Residual gate |
| --- | --- | --- |
| Public or permanent image access | Private bucket; no public policy; five-minute signed reads | Activation must test anonymous denial and URL expiry |
| Cross-user upload or read | Actor-owner equality plus explicit reviewer permission | Authenticated owner/admin/user matrix |
| Path traversal or bucket escape | Fixed bucket, server-generated UUID path, exact path grammar | Provider adapter collision tests |
| MIME/extension spoofing | Allowlist, intent match, byte-signature parsing, dimensions and digest verification | Test each MIME and malformed extension |
| Oversized payload/resource exhaustion | 16 MiB reservation and completion ceiling | Provider must enforce upload limit too |
| Untracked object after metadata failure | Mark intent abandoned; exact-object containment; no trusted record | Failure-injection and orphan reconciliation |
| Unverified object referenced as evidence | `verified_at` only after exact private-byte download, signature/dimensions and SHA-256 comparison | Corrective migrations and completion transaction |
| Duplicate or replay upload | Active SHA-256 duplicate guard and one intent/path | Race/idempotency review during activation |
| Retention bypass | Purpose-specific default/max policy, exact deletion, legal hold | Retention operator evidence |
| Deletion of another user’s object | Delete by verified evidence ID and exact stored path only | Cross-owner deletion tests |
| Sensitive data leakage | No image bytes, URLs, raw OCR or secrets in logs/audit | Log review and payload scan |
| Automatic canonical mutation | Provider/service has no canonical write operation and no worker submission | Worker/proposal boundary review |
| Mutable application metadata authorization | Server actor permissions and database RLS; no user-editable metadata claims | Live RLS/policy preflight |
| Storage/database disagreement | Fail closed, preserve reviewable metadata, reconcile exact object state | Failure-containment runbook |
| Legal/moderation hold deletion | `legal_hold` blocks retention deletion | Hold lifecycle approval |

No legal compliance, deletion guarantee or privacy certification is claimed by this document. Those require separate legal, policy and operational review.
