# ART-006 — Region-aware Kingshot clipboard rendering

Status: implementation complete; automated and structural evidence complete; owner visual review required

Branch: `hotfix/art-studio-region-aware-clipboard`

Starting main: `b481495454b121630f8a7177c1e92f70448d227a` (merged ART-005 / PR #22)

## Production defect evidence

The supplied production evidence archive was verified before use:

- Archive: `C:\Users\clark\Downloads\ART-006-production-rendering-evidence.zip`
- Archive SHA-256: `38df399ca40b5d6523d73818d944936b2828d40e776fcaafd3d3b066aecbde90`
- Manifest: `manifest.json`; the manifest hashes and byte lengths match all three PNGs.

| Fixture | Production screenshot | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| AH AH oops control | `ah-ah-oops-production-control.png` | 61,197 | `036a8ced1c8dd800b335fef10fc0dac3a748226a6d0919b68611923e4e5e93fd` |
| I have come to | `i-have-come-to-production-failing.png` | 62,473 | `bffa89a83c544349da85b40371b5f09e057041c5b361f70078fcbc10c04d25fd` |
| Dont ask me | `dont-ask-me-production-failing.png` | 52,787 | `31f25446ada5099ce7edd1bed11d7d46bf3236a85a34de1e83905e6cc9046ac2` |

The production images are preserved byte-for-byte in the generated comparison-board data. AH AH oops is the non-regression control.

## Architectural cause

ART-005 calibrated each line independently. A `hybrid-text-art` row therefore used the ordinary structural-gap transfer function, even when neighbouring rows formed one left-art/right-prose composition. The renderer also gave every source row the same visual line advance, so copied blank separator rows occupied a full ordinary row.

## Region/block model

`analyseClipboardDocument()` now creates a deterministic document layout in clipboard mode. It identifies structural body, hybrid-column, blank-separator, trailing-caption and prose blocks. Each row keeps its original row index and context, with optional `hybridTextStartIndex`, `columnAnchor` and `visualAdvanceCells` metadata.

The model is configuration-driven and contains no fixture title, database ID, caption, line number or shape-specific correction. Authored mode returns one visual advance per source row and no region calibration.

## Horizontal column calibration

Contiguous hybrid rows are treated as one block. The block derives the left structural bound from the source graphemes, then chooses one semantic column anchor for all neighbouring right-text rows. The anchor uses `hybridColumnGapBaseCells`, `hybridColumnGapIncrementCells` and `minimumColumnSeparationCells`. The grid moves only the visual token at the detected right-text boundary; source spaces remain grouped as source provenance and are not removed.

For `I have come to`, the detected hybrid block is source rows 1–3. The candidate has one shared logical right-column anchor of `29.59` cells and a semantic gap of `3.72` cells. The three right-text anchors are identical in logical layout; visible-ink tolerance still requires owner review against the supplied screenshot.

## Blank-separator and caption calibration

Clipboard rows now carry a visual advance independent of source row count. The configured values are:

| Row type | Advance |
| --- | ---: |
| Ordinary artwork row | `1` |
| Empty source row | `0.45` |
| First pre-caption separator row | `0.40` |
| Repeated separator row | `0.25` |
| Caption row | `1` |

For `Dont ask me`, source rows 6–7 remain present and become one blank-separator block with advances `0.40` and `0.25`; the source line count remains nine. The body-to-caption distance is therefore calibrated as a visual layout decision, not by deleting blank source rows. Authored mode does not use this compression.

## Production before / candidate after measurements

Production before is represented by the supplied, hash-verified screenshots and the ART-005 logical baseline. Candidate after is represented by the ART-006 layout metadata and comparison boards. The boards expose bubble bounds, structural/region guides, right-column anchors, separator runs and caption baselines.

| Fixture | Production before | Candidate after |
| --- | --- | --- |
| I have come to | Independent rows; right text starts vary with each row’s compressed gap; large source gaps are not a shared column region. | One rows 1–3 hybrid block; shared `29.59`-cell right anchor; `3.72`-cell semantic gap; source remains 9 lines / 387 bytes. |
| Dont ask me | Two blank rows paint at ordinary row height, leaving an excessive body-to-caption gap. | Blank-separator block rows 6–7 advance `0.40 + 0.25`; caption remains row 8; source remains 9 lines / 252 bytes. |
| AH AH oops | Passing control screenshot. | No blank/caption compression; all nine rows remain ordinary advance `1`; existing emoji/structural source provenance remains intact. |

The requested percentage measurements are visible-ink measurements and must be confirmed by owner review of the candidate boards at Fit. Logical anchor equality is automated; it is not a claim of pixel identity.

## Source-fidelity guarantees

The grid retains every source row and every source grapheme in `sourceGlyphs`. No source text, Unicode, emoji, line ending, whitespace or clipboard payload is rewritten. Studio/authored mode remains literal. Existing exact fixture hashes and ART-003/ART-004 clipboard checks remain in the regression suite.

## Evidence locations

- Comparison boards: `artifacts/art006/i-have-come-to.html`, `artifacts/art006/dont-ask-me.html`, `artifacts/art006/ah-ah-oops.html`
- 390px board variants: corresponding `*-mobile.html` files in `artifacts/art006/`
- Board generator: `scripts/generate-art006-evidence.mjs`
- Focused tests: `scripts/test-art006-region-aware-calibration.mjs`
- Supplied production evidence: the verified ZIP named above; it is not modified.

The in-app browser could not open local evidence-board HTML because its URL policy blocks local evidence-server pages. The supplied reference and production PNGs were inspected directly. Candidate-board HTML was structurally verified for the three panels and required guides; owner review must inspect the rendered boards in a permitted browser.

## Limitations and owner-review requirements

Host font and emoji fallback remain platform-dependent. The candidate has not been granted owner acceptance. Before merge, owner review must confirm visible-ink bounds, right-column start/line anchors, semantic gap, body-to-caption distance, caption centre, bubble bounds, Fit containment and no AH AH oops regression at normal 390 CSS-pixel screenshots.
