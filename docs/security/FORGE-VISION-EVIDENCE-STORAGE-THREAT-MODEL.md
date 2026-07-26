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

## OCR account-linking correction

The account-linking OCR response excludes raw OCR text, private paths, signed
URLs, tokens and image bytes. Only bounded candidates and safe provenance are
returned. Owner cancellation is exact-object only, rejects cross-owner and
non-`scan_source` evidence, blocks legal holds, and retains audit metadata.
OCR candidates cannot perform canonical or ownership mutations.
## D1A3 boundary repair

Malformed digests, dimensions, excessive pixel counts, and malformed image metadata are represented by stable typed storage errors and bounded 4xx responses. Provider infrastructure failures remain generic 500 responses without secrets, URLs, tokens, or image bytes. Incident cleanup is exact-ID, exact-path, expiry-gated, and containment-first.
## D1A4 cleanup controls

Cleanup execution is gated by the current clean synchronized branch and an explicit approved cleanup SHA. Credential expiry must be at least five minutes in the past; provider creation fallback is exactly two hours, with no intent-expiry substitution. Exact object removal is containment-first and no SQL storage deletion, listing, prefixes, wildcard paths, or audit deletion is permitted.

Audit and migration prechecks fail closed on count or evidence mismatch. Migration names come from a separately captured read-only operator ledger result and exact live schema checks, avoiding inaccessible system-schema PostgREST assumptions.

Governance evidence is likewise captured outside the repository and compared structurally; policy, constraint, grant and RLS omissions fail closed before mutation.
