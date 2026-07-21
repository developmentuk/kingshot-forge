# ART-002H — Exact Source Ingestion

## Decision

Community Art submission now has an explicit source contract. A `.txt` file
upload preserves the exact bytes received from disk. Paste/manual entry preserves
the browser-received text and does not claim equality with an external file.

## Evidence contract

The atomic submission command stores the ingestion mode, filename/MIME where
applicable, raw bytes, raw byte length/hash, decoded text/hash, line-ending type,
CRLF/LF counts, trailing-newline and BOM flags, browser-received text/hash and
normalisation operations. Raw source remains immutable and protected; public and
own-submission responses expose provenance but not raw bytes.

The canonical fixture is 386 bytes with SHA-256
`c4b0112b0e43312d1bbf3f2e18472814564d184f55c114c2749d0e921613cd79`, 9 CRLF
sequences and no approved payload at submission time. The old textarea acceptance
was not treated as exact-file evidence because its browser value differed.

## Security and release scope

The service-role-only RPC remains idempotent on `(user_id, request_id)` and writes
the pending row plus audit event atomically. Submission does not approve or
publish. Moderation, raw source and private notes retain their existing capability
and RLS boundaries. Source preservation, moderation permissions, approved payload
storage and clipboard behaviour are unchanged.

ART-003 calibration is excluded from the production candidate. Its profiles may
continue evolving on the feature branch; the prediction remains labelled
approximate until measured drift is materially reduced.

## Acceptance sequence

1. Upload the canonical file and verify byte/hash/line-ending evidence.
2. Submit the same fixture as browser text and verify the distinct evidence path.
3. Retry a request UUID and verify deterministic idempotency.
4. Inspect both pending records in own-submissions and moderation provenance.
5. Run role, responsive, console/network and automated validation gates.
6. If certified, create a clean ART-002H-only candidate from production main;
   keep ART-003 on its feature branch. Do not merge, tag or promote production.
