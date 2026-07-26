# VISION-REL-001 — Vision merge readiness and release integration

Status: **Automated integration accepted — owner preview acceptance required**  
Date: 26 July 2026  
Owner: Clark  
Engineering partner: Aegis

## Objective

Integrate the completed Forge Vision screenshot-assisted account-linking programme into the accepted Forge release line without regressing Art Studio, Player Identity, serverless routing, evidence governance or production behaviour.

## Canonical refs

- Repository: `developmentuk/kingshot-forge`
- Production base: `main`
- Base commit: `0c26cdbaf2b6a92bc865b26665e060b22e3daf8a`
- Preserved Vision source branch: `feature/vision-mapper`
- Vision source commit: `e779d0b2ab2d9ce2b27bce78a2b124c9fe94cec2`
- Integration branch: `integration/vision-release-readiness`
- Vision history merge commit: `9d963a52e3f065aa0547bd8d1c3af5bbeefb955b`
- Integration source PR: #23
- Release candidate PR: #24
- Supabase project: `hrvdhjscwitqpwjhnjkm`

## Integration method

The Vision branch had diverged from `main` by 83 Vision commits and 19 accepted Art Studio commits. A direct merge into `main` was rejected.

A dedicated integration branch was created from the exact current `main` commit. The overlapping files were identified as:

- `.gitattributes`
- `package.json`
- `src/App.tsx`

Those files were aligned temporarily to permit a normal history merge through PR #23. After the merge, each file was rebuilt as an explicit union of the accepted contracts:

- `.gitattributes` preserves both the Art Studio CRLF fixture rule and Vision migration LF rule.
- `package.json` preserves current Art Studio rendering and acceptance scripts, adds the complete Vision suite and retains the locked Vision runtime dependencies.
- `src/App.tsx` preserves the development-only Art Studio acceptance route and adds the governed Vision Studio and account-linking acceptance routes.

No side was selected wholesale and no accepted `main` behaviour was intentionally discarded.

## Accepted Vision boundary

The integrated candidate preserves the VISION-LINK-011 closeout decision:

- Player ID and Kingdom are the supported automatic screenshot fields.
- Display name and alliance tag are editable, supporting and review-only.
- Town Centre OCR is untrusted supporting information and never pre-fills the canonical review field.
- Town Centre requires explicit manual confirmation as a whole number from 1 through 30.
- OCR completion never saves, verifies ownership or grants alliance membership, rank or authority.
- Successful Kingshot Player API values remain authoritative and conflicts remain visible.
- API-unavailable fallback is explicit, server-controlled and stored as unverified/pending.
- Fallback does not set `verified_at` or `verified_by`.
- Server fallback recomputes OCR from exact owner evidence, validates reviewed identity values, records append-only audit history and deletes only the exact evidence after success.
- No further Town Centre calibration is planned.

## Preserved Art Studio boundary

The candidate retains accepted work from PRs #18 through #21:

- ART-003 rendering fidelity recovery;
- deterministic acceptance harness;
- raw source hash and byte-length provenance;
- NodeNext serverless import correction;
- Kingshot clipboard rendering profile;
- mobile containment and visible-ink alignment checks;
- development-only Art Studio acceptance route.

## Integration corrections

Automated integration validation exposed four assumptions that were safe on the original developer workstation but not portable to the combined release line:

1. `Intl.Segmenter` was available at runtime but absent from the current TypeScript library declaration. The helper now uses a narrow optional runtime type and retains the existing `Array.from` fallback without raising the application-wide compiler target.
2. Vision activation-precondition tests required Windows CRLF working-tree hashes even though the merged `.gitattributes` correctly enforces LF for SQL migrations. The guard now accepts canonical LF or the recorded legacy CRLF form and still requires the exact canonical digest after normalisation.
3. Render context calibration and Art Studio acceptance tests referenced a sibling `kingshot-text-lab` checkout. They now read the same hash-locked, byte-locked fixtures checked into Kingshot Forge.
4. The visible-ink Node test imported the browser-facing render-engine barrel, which transitively loads a raw text fixture. It now imports the grid and calibration modules directly; calibrated values and product runtime behaviour are unchanged.

## Database and evidence state

No Supabase mutation was performed during merge integration.

The five checked-in Vision migrations are carried into the candidate. Previously applied live Vision schema, private evidence bucket, forced RLS, grants, policies and retained audit history must be verified read-only before promotion. Migrations must not be reapplied or duplicated merely because the branch is being merged.

The closed evidence incident remains closed. No cleanup retry, synthetic activation or additional evidence mutation is authorised by this release integration.

## Automated evidence

- Integration branch contains current `main` with zero commits behind.
- Vercel preview builds succeeded after the TypeScript integration correction; only the repository's documented large-chunk warning remained.
- GitHub Actions run `30205423700` passed on implementation commit `0d60dba8ecec51b415d608d434d31a9428dbaaff`.
- The successful gate included locked dependency installation, all canonical Forge validations and domain tests, every Vision platform/worker/OCR/evidence/policy test, lint, production build, all five extended rendering checks, the Art Studio acceptance harness and submission-provenance regression.
- The temporary visible-ink diagnostic workflow was removed after its isolated check passed.
- The PR check on the final documentation/cleanup head remains the authoritative exact-candidate result.

## Remaining gates

- The final PR head retains a successful `Vision integration gate` and READY protected Vercel deployment.
- Protected preview is tested through an authenticated owner session.
- Screenshot upload and review workflow is tested on a genuine owner screenshot.
- Player ID and Kingdom extraction remain correct.
- Display name and alliance remain editable and review-only.
- Town Centre remains blank until manual confirmation.
- Successful Player API lookup remains authoritative.
- API-unavailable fallback remains explicit and unverified/pending.
- Exact evidence deletion and recovery controls are verified.
- Vision Studio and acceptance routes enforce server-backed permissions.
- Desktop and mobile layouts are accepted at supported viewport sizes.
- Art Studio rendering, clipboard and submission workflows are smoke-tested against the same preview.
- Release Notes and Roadmap reflect the accepted release state.
- Clark gives explicit promotion approval.

## Recommendation

**NO-GO for merging PR #24 while any owner/runtime gate remains open.**

Automated integration is accepted. `main`, production and canonical live data remain unchanged until authenticated preview acceptance, documentation closure and explicit owner approval are complete.
