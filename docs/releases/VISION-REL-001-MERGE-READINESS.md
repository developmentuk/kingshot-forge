# VISION-REL-001 — Vision merge readiness and release integration

Status: **Integration candidate — not approved for production**  
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

## Database and evidence state

No Supabase mutation was performed during merge integration.

The five checked-in Vision migrations are carried into the candidate. Previously applied live Vision schema, private evidence bucket, forced RLS, grants, policies and retained audit history must be verified read-only before promotion. Migrations must not be reapplied or duplicated merely because the branch is being merged.

The closed evidence incident remains closed. No cleanup retry, synthetic activation or additional evidence mutation is authorised by this release integration.

## Automated evidence

- Integration branch contains current `main` with zero commits behind.
- Exact integrated application commit `64f9ee1b0ba235b75dbfdaf595e6987f57b87747` deployed successfully to Vercel preview deployment `dpl_4zFfcjhTpwEWFhry9vgjTgBr7kWd` with state `READY`.
- A scoped GitHub Actions workflow, `Vision integration gate`, runs locked installation, the canonical `npm run check` suite, full rendering regressions, Art Studio acceptance and submission-provenance tests.
- CI result is pending at the time of this record and remains a blocking gate.

## Remaining gates

- GitHub Actions integration gate passes on the exact final candidate commit.
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

**NO-GO for merging PR #24 while any remaining gate is open.**

The integration history and preview build are ready for validation. `main`, production and canonical live data remain unchanged until explicit owner approval and final gate closure.
