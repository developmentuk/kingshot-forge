# ART-006 — Region-aware Kingshot clipboard rendering

Status: owner review at `d831798d0ce6b717180e5e8a4927da28a0e6542f` failed; semantic-gap correction implemented; automated and structural evidence complete; owner re-review required

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

## Failed owner-review evidence

The owner reviewed the exact Vercel preview for `d831798d0ce6b717180e5e8a4927da28a0e6542f` on a phone at Fit and rejected it. The verified failure archive is `ART-006-owner-review-fail-evidence.zip`, SHA-256 `da9714e21734a8069c99d6d46c1d395911a61c8effcf29aacf7bbadabec36128`.

| Fixture | Failure screenshot | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| I have come to | `i-have-come-to-art006-owner-fail.png` | 73,935 | `8c7e8e337c902bb6160443f43bfe05a0d4ad313eded21f743adcc58bec053e03` |
| Dont ask me | `dont-ask-me-art006-owner-fail.png` | 65,068 | `fe427764930e114850eea09fc27e04f01f60a1d08c06167598cd98f14f1b302b` |
| AH AH oops | `ah-ah-oops-art006-control-regression.png` | 57,367 | `55f004dfa3d1561ae061d560ffae71c132e5c7f6f255d44be9bde5e895430b37` |

## Architectural cause

The failed ART-006 implementation treated any Unicode `\p{Letter}` as possible prose and applied the hybrid gap formula to every internal space on a classified row. Structural glyphs such as `Д`/`Դ`, `ω`, `U` and `I` could therefore trigger hybrid treatment, while spaces inside faces, bodies, limbs and prose were expanded globally. The vertical blank-separator model was not implicated and is retained.

## Region/block model

`analyseClipboardDocument()` creates a deterministic document layout in clipboard mode. It identifies structural body, verified hybrid-column, blank-separator, trailing-caption and prose blocks. Each verified column row records the exact source-indexed `semanticGapStartIndex`, exclusive `semanticGapEndIndex`, `rightRegionStartIndex`, `sourceGapGlyphs`, left-region bound, gap width and shared `columnAnchor`.

Candidates require a two-or-more-space internal run, meaningful structural density on the left, a low-structural-density right region with at least three ASCII letters in word-like clusters, and at least two neighbouring candidates with compatible right-region starts. Punctuation inside words is supported. A lone Unicode or ASCII letter is insufficient. The model is configuration-driven and contains no fixture title, database ID, caption, line number or shape-specific correction. Authored mode returns one visual advance per source row and no region calibration.

## Horizontal column calibration

Contiguous verified rows are treated as one block. The block derives each left structural bound using ART-005 spacing, then chooses one semantic column anchor for all neighbouring right-text rows. The anchor uses `hybridColumnGapBaseCells`, `hybridColumnGapIncrementCells` and `minimumColumnSeparationCells`.

The grid applies special width only to the exact source separator run. Every other leading, left-region, right-region and trailing space retains ART-005 resolution. The separator cell preserves every source grapheme and skips only the spaces represented by that cell.

For `I have come to`, the detected hybrid block is source rows 1–4. The exact semantic gaps are indexes `[37,39)`, `[37,39)`, `[34,36)` and `[34,36)`, each preserving two source spaces. The corrected candidate has one shared logical right-column anchor; visible-ink tolerance still requires owner re-review.

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
| I have come to | Failed ART-006 expanded ordinary internal spaces and displaced the structural figure. | Rows 1–4 share one source-indexed right anchor; only each exact two-space semantic separator receives special width; all other horizontal spans equal ART-005; source remains 9 lines / 387 bytes. |
| Dont ask me | Failed ART-006 improved vertical separation but distorted the structural body. | No hybrid block or semantic gap is detected; horizontal geometry equals ART-005; blank rows 6–7 retain `0.40 + 0.25`; caption remains row 8; source remains 9 lines / 252 bytes. |
| AH AH oops | Failed ART-006 regressed the passing control by treating a letter-shaped glyph as prose evidence. | No hybrid block or semantic gap is detected; every horizontal cell equals ART-005; all nine rows retain advance `1`; source remains 9 lines / 199 bytes. |

The requested percentage measurements are visible-ink measurements and must be confirmed by owner review of the candidate boards at Fit. Logical anchor equality is automated; it is not a claim of pixel identity.

## Source-fidelity guarantees

The grid retains every source row and every source grapheme in `sourceGlyphs`. No source text, Unicode, emoji, line ending, whitespace or clipboard payload is rewritten. Studio/authored mode remains literal. Existing exact fixture hashes and ART-003/ART-004 clipboard checks remain in the regression suite.

## Evidence locations

- Comparison boards: `artifacts/art006/i-have-come-to.html`, `artifacts/art006/dont-ask-me.html`, `artifacts/art006/ah-ah-oops.html`
- 390px board variants: corresponding `*-mobile.html` files in `artifacts/art006/`
- Board generator: `scripts/generate-art006-evidence.mjs`
- Focused tests: `scripts/test-art006-region-aware-calibration.mjs`
- Supplied production evidence: the verified ZIP named above; it is not modified.

Each board contains four panels: Kingshot reference, ART-005 production baseline, failed ART-006 owner screenshot and corrected candidate. Source-index diagnostics list verified gaps, rejected rows, rejection reasons and ART-005 ordinary-span equality. The boards were regenerated and structurally verified without browser automation; owner re-review must inspect the rendered preview.

## Limitations and owner-review requirements

Host font and emoji fallback remain platform-dependent. The candidate has not been granted owner acceptance. Before merge, owner review must confirm visible-ink bounds, right-column start/line anchors, semantic gap, body-to-caption distance, caption centre, bubble bounds, Fit containment and no AH AH oops regression at normal 390 CSS-pixel screenshots.
