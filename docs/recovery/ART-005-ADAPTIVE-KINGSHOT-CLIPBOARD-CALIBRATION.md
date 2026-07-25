# ART-005 — Adaptive Kingshot clipboard calibration

Status: implementation and deterministic source-evidence recovery complete; owner visual review pending

Branch: `feature/art-studio-adaptive-clipboard-calibration`

Starting `origin/main`: `0c26cdbaf2b6a92bc865b26665e060b22e3daf8a`

## Recovered source evidence

All records were read-only verified in `public.community_art_submissions`.
For every record, `raw_source_text = artwork_text`, the calculated UTF-8 SHA-256
equals `raw_source_sha256`, the calculated byte length equals
`raw_source_byte_length`, and the status remains `pending`.

| Fixture | Record ID | Source SHA-256 | Bytes | Code points | Lines | Profile |
| --- | --- | --- | ---: | ---: | ---: | --- |
| AH AH oops | `5e496c7d-294d-4a2e-b20a-6ae780b1fef4` | `3eb998a5526650229360f453bab2506f7ee3a54f1f28b4645431451c7bc923c6` | 199 | 96 | 9 | kingshot-clipboard |
| Free hard spanking | `7d4dd5d5-af9a-4975-894a-af683ec5662d` | `ceb4e2b817146c1714b02edcfba0bb6dcbc9b93fc72fd3b88c08522d63315ae4` | 226 | 196 | 8 | kingshot-clipboard |
| Where is all the good text art | `3a57a724-afdd-4193-9eef-f7dd9d9cf381` | `cfacdd29930f5a94438291406e56360c7139253c74aadb294f27bb77c042bff6` | 245 | 117 | 7 | kingshot-clipboard |
| Dont ask me | `3dbd4af9-61f3-4b6f-8456-a6d04e180504` | `7cfbe9fcb122a6412a25b6d665f5924c242b03a2dac898149c87ef7c569a5fa7` | 252 | 170 | 9 | kingshot-clipboard |
| I have come to | `3c490bb3-31d1-481a-a4c8-a45ad6bd7562` | `3bea8beb8d0a1345306552abe1f3e395ff0aeb84595d1c8a0897c66f159d8985` | 387 | 342 | 9 | kingshot-clipboard |
| Alliance Coffee Time (control) | `8ad59659-531a-412c-86e1-5006de55c864` | `c4b0c423a3501da0e77b26b08a40b4af41937dd433cc3e0f6efd6d98bbf6a6d5` | 227 | 80 | 7 | kingshot-clipboard |
| Expanded Wow I’m so cute (control) | `70e96272-7f37-4021-89f6-d34610c27969` | `fe6bfe732d320f75e810be9071788a5b749424a7cff20e7e2407161964cf14d2` | 431 | 321 | 10 | kingshot-clipboard |

The corrected `Dont ask me` ID is recorded above. The previously supplied
one-character variant ending in `...4b6c...` is intentionally not present.

Permanent source fixtures are under
`fixtures/community-art/adaptive-clipboard/` and use base64-encoded UTF-8 to
avoid newline or Unicode rewriting. Clipboard payloads are always copied from
the decoded source without transformation.

## Adaptive model

`src/render-engine/adaptiveCalibration.ts` classifies each line from its glyph
families and measurable structure, not from fixture titles, IDs, captions, line
numbers or shape-specific rules. The deterministic contexts are prose, caption,
leading structural, sparse structural, dense structural, mixed emoji/ASCII,
trailing emoji, horizontal structural run, and hybrid text-art.

The model applies context-specific ordinary-space advances only during visual
layout. Authored source remains literal and unchanged. The established ART-004
clipboard transfer values remain the controls for the structural seven-space
and leading-run regressions: the seven-space internal run resolves to `1.29`
cells and the 24-space leading run resolves to `10.55` cells. Source grapheme
spans remain attached to each visual token, so no source characters are removed.

The renderer still uses paint-only directional calibration and responsive
containment. No font, emoji, or source text is substituted to manufacture a
visual match.

## Submission-rate-limit correction

The existing policy remains five submissions per rolling 3,600-second window.
The API now selects the five oldest records in the active window, returns HTTP
429 with `code: submission_rate_limit`, `limit`, `windowSeconds`, and an exact
`retryAfterSeconds`, and sets the HTTP `Retry-After` header. The service keeps
the structured fields on the thrown error.

The mobile form explains the five-per-hour limit beside the submit action. A
429 is an assertive inline alert, receives focus without an unrelated page jump,
and says the draft was preserved. No field, checkbox, pasted source, source
context, or preview state is reset.

## Evidence status and limitation

Logical current-production and candidate reports are in
`artifacts/art005/current-production-baseline.json` and
`artifacts/art005/adaptive-candidate-report.json`. Seven comparison-board SVGs
are in `artifacts/art005/boards/` with bubble-centre guides and per-line
contexts.

The five matching Kingshot screenshot files described by the recovery request
were not available in the workspace attachment manifest; only pasted-text
attachments were present. Therefore no screenshot bytes were added, no
reference SHA-256 was invented, and no visible-ink, left/right, centre,
caption, emoji-anchor, mobile-containment, or 3%-threshold result is claimed.
Owner visual review requires those exact screenshots (or a reattachment) and
the Vercel preview before this task can be marked ready.
