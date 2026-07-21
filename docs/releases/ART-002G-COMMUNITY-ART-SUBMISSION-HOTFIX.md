# ART-002G / Community Art submission hotfix

## Diagnosis

Starting HEAD: `37858ed20580a0337eb0929ea97c74b46bce257f`.

The production-equivalent 500 is a schema/handler contract mismatch introduced by ART-002. The live `community_art_submissions` table requires `raw_source_sha256` and `raw_source_byte_length` (`NOT NULL`), while the submit handler inserted `raw_source_text` but omitted both required columns. The insert therefore failed before the response was created. The live schema and grants were inspected read-only; no production row was changed.

The handler also used a direct service-role insert, had no explicit `contributions.submit` check, no idempotency key, and no atomic submission audit write.

## Contract after the fix

`POST /api/art-studio?action=submit` now requires an authenticated actor with `contributions.submit`, validates the existing ART-002 text contract, accepts a UUID `requestId`, and calls the service-role-only `submit_community_art_submission` RPC. The RPC writes the pending submission, immutable raw source metadata, normalized/rendered preview values and one `submitted` audit event in one transaction. Repeating the same `(user_id, requestId)` returns the existing row without creating a duplicate.

Submission does not set `approved_copy_payload`, `approved_payload_hash`, `approved_payload_version`, or create a payload-version row. Moderation remains the only approval path.

## Safety and evidence

- Raw fixture hash: `c4b0112b0e43312d1bbf3f2e18472814564d184f55c114c2749d0e921613cd79`.
- Raw fixture byte length: 386 bytes.
- Raw CRLF evidence: 9 CRLF sequences preserved by the client and hashed from UTF-8 bytes.
- Anonymous users are denied by bearer authentication.
- Contributors/explicitly permitted actors submit; verified status does not grant moderation.
- Moderation and raw-source reads remain capability/RLS protected.
- Player errors contain a safe category and correlation/reference ID; SQL details stay in server logs.

## Preview gate

No production application deployment, merge or tag was made. Migration
`20260721213000_art002g_atomic_community_art_submission.sql` was applied to
Supabase project `hrvdhjscwitqpwjhnjkm` as `art002g_atomic_community_art_submission`
at `20260721194617`.

The original code candidate is `a1f77b52375430fdceec967afa5ccdd3e0e5a824`; the
final branch HEAD is `da0031120b9745a8e7251955b4e7d208e1ea63ef` after documentation
and calibration-measurement follow-ups. The final HEAD is deployed as protected
Vercel preview `dpl_BddrLUggLLj5RcGpnQLzjbzzyXmx` at
`https://kingshot-forge-rbcnor9jv-clarksim-7474s-projects.vercel.app` with target
`preview` and state `READY`. Unauthenticated submit against the preview returned a
safe 401 `Protected deployment`; authenticated player/moderator acceptance remains
owner-gated.

## Validation

Passed: `npm run test:art002g-submission`, `npm run test:art-studio`, `npm run test:render`, `npm run test:render-engine`, `npm run check`, `npm run build`, `npx tsc -p tsconfig.server.json --noEmit`, `npm run validate:nodenext`, and `git diff --check`.

No submission or audit data rows were created during migration or preview checks.

Recommendation: **Ready for Owner Acceptance**. Production promotion remains blocked
until the owner supplies permitted player and moderator sessions and completes the
labelled fixture submission, duplicate retry, moderation, Gallery, clipboard and
responsive browser checks.

## ART-002H correction

The ART-002G textarea path was not an exact external-file ingestion path: the
browser-received value used LF line endings and differed from the canonical CRLF
fixture bytes. ART-002H preserves that fact and introduces separate exact `.txt`
upload and browser-paste evidence. It does not alter an approved payload to hide
the discrepancy.
