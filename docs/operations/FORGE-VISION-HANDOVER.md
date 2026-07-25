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

## VISION-LINK-003 real-card calibration outcome

The genuine owner test was NO-GO. V2 correctly suppressed unsafe zero-confidence
numeric output; Kingdom was extracted successfully; the mandatory Player ID was
not accepted; and the display name remained a damaged, low-confidence supporting
observation. The likely causes were clipboard-icon contamination of the numeric
crop and an implemented threshold path that was not being executed. No lookup,
link mutation or additional cleanup occurred.

## VISION-LINK-004 v3 recovery

V3 adds a shared Kingshot profile mapping with a broad labelled Player ID line and
a configured numeric region ending before the clipboard-icon area. It executes
greyscale and threshold observations for both labelled and numeric passes, uses a
separate fail-closed consensus function, renders safe pass diagnostics, and marks
low-confidence or normalised names as review-only. V1 and V2 remain historical
regression mappings. Synthetic PNG/JPEG and adversarial consensus tests pass;
owner retest remains a separate NO-GO-until-deployed-checks gate.
The pinned Tesseract.js 7.0.0 fixture comparison selected `SINGLE_LINE` for the
numeric crop: `SINGLE_WORD` was less reliable on the bounded low-resolution
fixture. Numeric OCR is spatially isolated and post-parsed as digits only.

## VISION-LINK-005 component mapping

VISION-LINK-004 remained NO-GO because promising numeric confidence was blocked
by the broad line-agreement model. V4 separates label, digit, icon-exclusion
and supporting regions. Player ID uses label context plus four bounded digit
passes with strong `.55` and supporting `.35` thresholds. Synthetic fixtures
use fake repeated digits only; no real screenshot or account value is committed.

## VISION-LINK-006 final Kingdom regression repair

VISION-LINK-005 achieved exact Player ID extraction: both label-context passes
and all four digit passes agreed. Its Kingdom component short-token passes
could still conflict, despite the prior labelled-line strategy already having
worked. V5 freezes the v4 Player ID components and restores a separate
`kingdomLine` at `.27,.70,.48,.20`, with greyscale and threshold SINGLE_LINE
observations and explicit labelled parsing. Name and alliance remain
`review_required` supporting fields. Fixtures use fake values only; no real
screenshot or account value is committed.
## VISION-LINK-007 — OCR fallback profile hydration

V6 is an additive `account-linking-kingshot-profile-v6` mapping. V1 through V5 remain frozen. It retains the measured component geometry, adds Town Centre label and badge consensus (1–30, label context required), and normalises only V6 alliance tags to exactly three inner graphemes. The owner surface displays Player ID, name, Kingdom, alliance and Town Centre level; name, alliance and Town Centre remain review-only.

The screenshot-linking route is isolated from account-context refreshes and never saves on OCR completion. A successful Kingshot API lookup remains authoritative. Only an explicit owner action after lookup failure may call `/api/player/ocr-fallback`; that path records `linked`/`none`, never `verified`, carries bounded evidence provenance and correction flags, and cancels the exact scan evidence after the save. No avatar or alliance membership is persisted by this fallback.
## VISION-LINK-008 — final Town Centre badge calibration

VISION-LINK-007 passed exact Player ID, Kingdom and three-character alliance normalisation; display name remained populated, editable and review-only. Owner testing found Town Centre `could_not_read` because the V6 badge box missed the measured badge. V7 preserves V1–V6 and uses shared measured regions: tight `(0.59, 0.43, 0.13, 0.31)` and context `(0.56, 0.40, 0.19, 0.36)`. The tight crop runs six bounded pixel-preprocessing passes and the context crop runs two supporting passes. Consensus requires label context, two agreeing tight observations, one strong observation, a 1–30 value and no strong conflict. No real screenshot or account value is committed.
