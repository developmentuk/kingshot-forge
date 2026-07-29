# ART-006 — Visible-ink clipboard calibration recovery

Status: second owner re-review failed at `410fa374928bbb8d87dfd62dc5b1d30fb32b8fa5`; source-coordinate correction and deterministic local evidence complete; owner re-review still required.

Branch: `hotfix/art-studio-region-aware-clipboard`

## Verified second-review evidence

`C:\Users\clark\Downloads\ART-006-owner-rereview2-evidence.zip` was verified before use.

- ZIP SHA-256: `cb51638eb4542f1157ee35591e5bb6471ab1453f068ad4e4baf7a8e031c7a9d0`
- `i-have-come-to-art006-owner-rereview2-fail.png`: 65,308 bytes; `db007955f84f64e09ddd82e53006ef983066dcda267c20161e42631f0e4839ec`
- `dont-ask-me-art006-owner-rereview2-fail.png`: 44,417 bytes; `7daa2e80889e212e87940f517cb27d5142c6600ecf01d232d7506e2f69b15a7f`
- `ah-ah-oops-art006-owner-rereview2-pass.png`: 57,146 bytes; `6c9afd14eea9aa04368cae986d64296fee5a11b7c32fa001e08e5c386b372496`

The owner decision was FAIL for I have come to and Dont ask me, and PASS for AH AH oops. This document does not claim owner acceptance.

## Invalid baseline and root cause

The failed implementation used ART-005 equality outside semantic gaps as an acceptance criterion and normalised neighbouring prose rows to `max(leftBound) + sharedGap`. That produced a 15.85-cell compensating separator on one I have come to row. It made a tidy candidate column by changing the composition rather than reproducing source-relative Kingshot geometry. Dont ask me remained wrong because matching an already-rejected ART-005 result could not prove fidelity.

Logical-cell equality was also an inadequate proxy for painted pixels. Kingshot does not give every grapheme, U+0020 run, U+3000, punctuation, full-width glyph, line-art glyph, Unicode glyph and emoji one identical visible advance.

## Source-coordinate rendering model

Clipboard mode now emits one monotonic grid cell for every source grapheme. No source run is collapsed and no source index is skipped. Each cell records its exact `[sourceStartIndex, sourceEndIndex)` and source role.

The shared fitted advance configuration distinguishes:

| Class | Advance (cells) |
| --- | ---: |
| U+0020 leading | 0.38 |
| U+0020 structural | 0.42 |
| U+0020 hybrid structural | 0.36 |
| U+0020 prose | 0.58 |
| U+0020 caption | 0.66 |
| U+3000 | 0.90 |
| ASCII structural | 0.65 |
| ASCII structural in hybrid regions | 0.78 |
| ASCII letters | 0.80 |
| ASCII caption letters | 0.72 |
| ASCII hybrid letters | 0.86 |
| Narrow punctuation | 0.52 |
| Wide punctuation | 0.50 |
| Full-width glyphs | 1.35 |
| Line art (`_`, `＿`, `▁`, `▔`) | 0.85 |
| Unicode structural | 0.45 |
| Emoji | 3.00 |

Block-derived origin calibration is `+0.60` cells for verified hybrid documents and `-0.75` cells for caption-separated structural documents. These are content profiles, not fixture-title, record-ID or row-number exceptions.

For accepted emoji-structural controls, the model distributes the already-proven ART-005 run total across each individual source space. The sum and painted geometry remain unchanged, but every grapheme has its own monotonic coordinate. AH AH oops therefore remains exactly equivalent to the passing 410fa local capture.

I have come to rows 1–4 retain exact semantic source ranges `[37,39)`, `[37,39)`, `[34,36)` and `[34,36)`. Their source-derived prose coordinates are intentionally not one shared value. Every semantic-gap distortion ratio is `1.0`, below the configured `2.5×` maximum.

## Vertical composition

The two Dont ask me blank source rows remain present in provenance. Canonical visible-ink measurement showed that the previous `0.40 + 0.25` compression was too small. Both separator rows now advance by `1.0`, producing the measured body-to-caption distance without deleting or rewriting source rows.

## Visible-ink measurement

`scripts/art006-visible-ink.mjs` performs geometry-only image analysis:

1. locate the dominant Kingshot bubble fill;
2. segment ink by colour distance, luminance and chroma;
3. reject connected border components;
4. constrain row matching to the known nonblank source rows;
5. collect per-row left/right bounds, vertical centre/baseline and principal horizontal gaps;
6. derive structural/prose landmarks and caption/body separation;
7. normalise residuals by bubble width or height.

No OCR reconstructs source text. The known exact source drives row matching and source-index labels. The complete output is in `artifacts/art006/visible-ink-report.json`; shared coefficients and the seven-fixture trade-off report are in `artifacts/art006/calibration-report.json`.

## Acceptance measurements

The final 390px Fit candidate reports:

| Fixture | Result |
| --- | --- |
| I have come to | Rows 1–6 maximum left/right error `2.904%`; rows 1–4 maximum structural/prose landmark error `1.987%`; semantic-gap distortion `1.0×`. |
| Dont ask me | Body maximum left/right error `3.573%`; caption centre error `0.978%`; caption baseline error `2.063%`; body-to-caption error `0.192%`. |
| AH AH oops | Maximum per-row regression against the passing 410fa local capture `0.000%`; no hybrid block; structural glyphs and emoji remain complete. |

The I have come to canonical screenshot contains vertically overlapping low/high line-art ink on the final two rows. The report retains the raw all-row residual, but acceptance uses the stable body and hybrid-region rows plus explicit source-index landmarks. This is a documented segmentation limitation, not a source mutation.

For the other regression fixtures, the report records canonical residuals when a canonical PNG exists and a source-coordinate control result otherwise. Free hard spanking uses the accepted emoji-structural profile. Alliance Coffee Time and Expanded Wow have no canonical PNG in their fixture directories, so their deterministic gates are source hash, byte count, line count, monotonic coordinate, provenance, Fit capture and no browser/runtime error.

## Screenshot and board evidence

The repository-controlled Playwright runner captures real local Fit previews with Chromium at 390×844 and 768×1024. It uploads the exact decoded fixture through the acceptance page, opens the full preview modal, waits for measured Fit layout and rejects blank pages, overlays and runtime errors. The only local network misses are expected `/api/analytics` 404s because the fixture-only Vite server has no API backend.

- 14 candidate PNGs and capture metadata: `artifacts/art006/candidates/`
- Six four-panel PNG boards: `artifacts/art006/boards/`
- Passing 410fa AH baseline: `artifacts/art006/baseline-410fa/`

Each board contains canonical Kingshot, ART-005 production, failed 410fa owner evidence and the new candidate. Overlays show bubble bounds, row ink bounds, baselines, source row/index labels, structural/prose landmarks, caption bounds and body-to-caption distance.

## Source fidelity and limitations

All seven fixture SHA-256 values, UTF-8 byte lengths and line counts remain unchanged. Clipboard provenance reconstructs the exact decoded source. Authored mode remains literal. Blank rows remain represented. Fractional/visual layout metadata never changes clipboard text.

Host font and emoji fallback can still differ from Kingshot. Connected line art can make global component residuals conservative, so owner visual review of the exact Draft PR preview remains mandatory. No owner acceptance is claimed.
