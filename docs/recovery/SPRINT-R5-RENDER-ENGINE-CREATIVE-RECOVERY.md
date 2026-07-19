# Sprint R5 — Render Engine and Creative Platform Recovery

Status: validation in progress

Branch: `recovery/0.9.0-rc3-feature-reconciliation`

Starting HEAD: `b6196010c1bfbaaa828cadeff57a0873362dec3f`

Supabase project: `hrvdhjscwitqpwjhnjkm`

## Scope and recovery sources

R5 reconciles the completed Render Engine and Creative Platform foundations into
the canonical RC3 recovery branch. The implementation was already present in
the starting checkout from the Render Engine history, including commits
`65fe2b4`, `a59ae14`, `d0e1383`, `006e7b1`, `0257805`, `ac65376`, `fe81cac`,
`fb99a74`, `753c685`, `3fbf4b3` and `9f8d196`. These commits were inspected in
dependency order; no blind cherry-pick was needed.

No Supabase migration, storage change, production write, push, merge, tag or
production promotion is part of R5.

## Canonical architecture

The public Render Engine API is `src/render-engine/index.ts`. It exports the
parser, fixed-cell grid, analyser, configuration, device profiles, benchmarks,
browser-local persistence, simulator helpers and shared types. The simulator
barrel was restored to the public export surface during R5.

`src/components/art/KingshotArtRenderer.tsx` remains the stable React adapter.
It parses normalised text into grapheme-aware rows, assigns one logical cell to
each grapheme, applies family calibration inside that cell, and optionally
wraps the grid in the device simulation frame. It preserves source text for
copying and offers a separate studio `<pre>` mode for exact text display.

Unsupported or malformed input is handled as ordinary text: line endings are
normalised, tabs become four spaces, grapheme segmentation uses `Intl.Segmenter`
when available with an `Array.from` fallback, and empty input produces a stable
empty row rather than a render exception.

## Calibration Lab

The protected route is `/admin/render-engine` and uses the existing `cms.view`
capability through `ProtectedRoute`. Navigation visibility comes from the
existing workspace registry; direct-route authorization remains independent.
The lab includes benchmark and device selection, glyph-family calibration,
device overrides, comparison/reference controls, diagnostics, reset controls,
JSON import/export and responsive admin layout.

Calibration profiles are browser-local only under
`forge.renderEngine.calibrationProfiles.v1`. Records are schema-versioned,
validated on load, and discarded when malformed. Defaults remain available when
storage is empty. No private or sensitive data is persisted.

## Creative integrations

Art Studio library cards, full previews and submission previews use the shared
renderer. Community Art moderation now uses the same renderer for its preview;
the original artwork string remains the value used for exact copy and service
validation. Attribution and moderation state remain owned by Community Art.
Chat Studio and Name/Banner surfaces were not forced onto the engine because no
completed R5 integration existed for them.

## Validation evidence

Record the final results below when the candidate is validated:

| Check | Result | Evidence |
| --- | --- | --- |
| Focused Render Engine tests | Pending | `node scripts/test-render-engine.mjs`; `node scripts/test-render-engine-persistence.mjs` |
| Full project check | Pending | `npm run check` |
| Server TypeScript | Pending | `npx tsc -p tsconfig.server.json --noEmit` |
| NodeNext validation | Pending | `npm run validate:nodenext` |
| Production build | Pending | `npm run build` |
| Responsive checks | Pending | 390px, 768px and 1280px creative surfaces |
| Exact preview deployment | Pending | Candidate commit, deployment ID and preview URL |

## Remaining risks

Screenshot comparison remains a manual calibration activity; the repository
does not fabricate OCR or image-comparison scores. Authenticated deployed
smoke coverage depends on the temporary fixture workflow documented by R4.
Existing project-wide lint and bundle-size warnings must remain unchanged and
be reported with the final evidence.

## Version 1.0 readiness

R5 is not release-ready until the focused tests, full local gates, responsive
checks and exact-commit controlled preview smoke all pass. Production promotion,
merge and release tagging remain outside this sprint.
