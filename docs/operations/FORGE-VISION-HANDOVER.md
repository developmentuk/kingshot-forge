# Forge Vision handover

The three evidence-storage migrations are applied, but the synthetic activation remains halted and acceptance remains NO-GO. The live incident is unchanged; no cleanup or activation was performed by VISION-001D1A3.

D1A3 repaired typed validation errors but left the cleanup runner non-executable. D1A4 completes the boundary with a structured exact incident manifest, separate historical activation and cleanup execution SHA gates, clean branch/synchronization checks, corrected credential-expiry-plus-five-minute logic, audit-count handling from seven to eight, and a server-only Supabase gateway.

D1A5 closes two preflight mismatches: total Vision audits are tracked separately from incident-specific audits (7/8/8 total and 3/4/4 incident-specific), while the four original C3 audit records are retained; migration verification uses the actual ledger names from a separately captured read-only operator result and exact live schema evidence, never repository filename strings or a PostgREST system-schema query.

The final gateway repair replaces unavailable PostgreSQL system-view reads with `FORGE_VISION_EVIDENCE_INCIDENT_GOVERNANCE_RESULT_PATH`. The structured capture must exactly match the manifest’s bucket, MIME/size, policy, constraint, grant and enabled/forced-RLS evidence. No live cleanup has occurred yet.

## Final incident closure

The single owner-approved exact cleanup executed successfully on 24 July 2026 at `2026-07-24T17:37:18.700791Z` using pushed cleanup SHA `125c40a4f9d5c894c13a9bcd2f0a25bf726eca25`. The exact object was removed through Storage API operations; both exact intents were abandoned/deleted as ordered. Final read-only verification found zero Storage objects, intents and evidence rows; total audits 8; incident audits 4; and the original four C3 audits retained. The private bucket, three migrations, policies, constraints, grants and forced RLS remain active. Activation was not retried and no further cleanup attempt is permitted without a new owner decision.

Future exact cleanup requires a separately approved execution and must provide the manifest path, current approved cleanup SHA, project reference, actor UUID, approval flag, and provider expiry evidence. Plan mode is non-mutating. A failed or ambiguous step stops without automatic retry; audit events are never deleted.

## VISION-LINK-001A account-linking correction

The current Vision workstream includes the screenshot-assisted account-linking
MVP. It uses the existing private evidence bucket and `scan_source` policy;
it does not recreate the closed evidence incident. OCR candidates prefill the
existing manual Player ID form only. Lookup and link confirmation remain
separate explicit actions through the existing player-link service.

Completed screenshot evidence has an exact owner cancellation path. The
Storage API deletes only the verified object path, metadata is marked deleted,
and `vision.evidence.owner_cancelled` is retained in the append-only audit.
No prefix, wildcard or `storage.objects` SQL deletion is permitted. Raw OCR
text is not part of the browser response. Preview runtime Tesseract health,
real-screen calibration and authenticated synthetic acceptance remain open
owner gates.
## VISION-LINK-001B bundled OCR runtime

The default server adapter is the pinned `tesseract.js@7.0.0` WebAssembly
runtime with `@tesseract.js-data/eng@1.0.0`. Worker, core and language assets
are bundled locally through `vercel.json`; the function is bounded to 60
seconds, disables the CDN/cache path and always terminates the worker. The
CLI adapter remains available but is not selected by the account-linking
service. Import and focused runtime tests prove no network access, bounded
failure projection and timeout termination. The local runtime smoke is
passing; exact synthetic fixture values still require real-screen calibration
and the separately authorised authenticated preview acceptance.

## VISION-LINK-001C synthetic runtime acceptance

The acceptance fixture is now a checked-in deterministic PNG at
`fixtures/vision/account-linking/synthetic-profile.png`, rendered with
ordinary Arial sans-serif text on a high-contrast light background. Its
SHA-256 is
`c1293cf0d08e9aa41cdc10f0bf484d1f1805d376b96b043cc22fd570c3f29071` and its
manifest explicitly records that it is synthetic-only and not evidence of
real-screen Kingshot accuracy. The real Tesseract.js integration test loads
that PNG and asserts the actual OCR candidate `987654321`; local recognition
also returned `EMBER FOX` and `42` in 524 ms. Parser-only assertions remain
separate. Authenticated preview acceptance and exact cancellation remain
owner-scoped gates for the new preview.
