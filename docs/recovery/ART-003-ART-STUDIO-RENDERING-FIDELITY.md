# ART-003 — Art Studio rendering fidelity recovery

Status: implementation complete; owner visual acceptance pending

Branch: `feature/art-studio-recovery`

Canonical base: `37858ed20580a0337eb0929ea97c74b46bce257f`

Canonical fixture: `fixtures/community-art/wow-im-so-cute/`

## Scope

ART-003 repairs the existing shared Render Engine and its Art Studio consumers. It does not rebuild Community Art, change moderation ownership, alter player linking, add Supabase persistence, or change the Forge Vision workstream.

## Reproduced mismatch

The committed Kingshot chat reference is 759 × 418 pixels. Its message bubble is approximately 426 × 352 pixels and the ten artwork rows use an approximately 32-pixel vertical pitch. Before ART-003, the compact phone profile used 10 × 17-pixel cells, a 13-pixel grid font and a 360-pixel bubble. Gallery, submission and moderation previews could also bypass the device profile and render a bare compact grid. Bubble geometry, line height and emoji scale existed in configuration but were not consistently applied.

The source fixture also had a byte-integrity regression: the Git blob used LF line endings while `metadata.json` and the certified SHA-256 describe the original 386-byte source with nine CRLF sequences. ART-003 restores the documented bytes without changing any visible character.

## Calibration candidate

The default compact-chat profile is now:

| Setting | Value | Evidence basis |
| --- | ---: | --- |
| Cell width | 12.5 px | horizontal fit of the title and widest art rows |
| Cell height | 32 px | measured ten-row pitch in the chat capture |
| Grid font size | 22 px | visual glyph-height fit |
| Line height | 1.00 | deterministic row geometry |
| Bubble width | 426 px | measured chat bubble width |
| Vertical bubble padding | 14 px | 320 px grid + 28 px padding + border ≈ 352 px |
| Horizontal bubble padding | 36 px | measured source origin within the bubble |
| Emoji scale | 1.05 | cloud glyph fit inside a two-cell advance |
| Ordinary-space advance | 0.60 cells | indentation fit against the reference |
| Ideographic-space advance | 2.00 cells | explicit wide-space behaviour |
| Full-width advance | 2.00 cells | explicit East Asian full-width behaviour |
| Emoji advance | 2.00 cells | prevents overlap while retaining grapheme integrity |

These values are configuration-driven calibration candidates. They are not evidence that Kingshot exposes a literal CSS grid or that every operating system uses identical glyph metrics.

## Renderer correction

The renderer retains one immutable grapheme record per source grapheme. Each record receives a deterministic family-calibrated logical advance; glyph painting remains independent of neighbouring placement. Fractional ordinary-space advance is required to reproduce Kingshot's narrow normal spaces, while ideographic spaces, full-width glyphs and emoji retain wider advances.

All Kingshot-mode consumers now receive the same resolved device variables:

- Art Studio gallery cards;
- full Art Studio preview;
- submission preview;
- Community Art moderation preview;
- Calibration Lab artwork and chat views.

Studio mode remains a literal `<pre>` of the supplied source. Kingshot mode remains a simulation. Copy uses the untouched approved payload and has a DOM fallback when the modern clipboard API is blocked.

## Responsive and accessibility evidence

The shared bubble is viewport-contained and owns any necessary horizontal scrolling; the document must not overflow. The full preview modal traps focus, closes with Escape, restores focus and restores the previous body scroll state. Device controls and preview controls remain keyboard operable.

The deterministic geometry evidence index is stored in `docs/evidence/art-003/README.md`. Harness captures at 390, 768, 1280 and 1440 pixels are retained with the Draft PR/validation artifacts. They validate renderer geometry and containment only; they are not presented as screenshots of an authenticated production application.

## Canonical fixture status

`metadata.json` remains:

```text
expected_status: calibration_required
```

The fixture must not be changed to calibrated or verified until Clark compares the exact Vercel preview against both Kingshot captures and accepts that the preview represents what a player sees after pasting the exact source.

## Known uncertainty

- Browser font fallback differs across Windows, Android, iOS and Linux.
- Colour emoji shape and baseline are supplied by the host operating system.
- The 671 × 530 game capture includes different surrounding game chrome and may represent another UI scale.
- Kingshot does not publish font metrics or layout rules; the values above are empirical.
- No automated visual similarity percentage is claimed.

## Rollback

Revert the ART-003 implementation commit(s) on `feature/art-studio-recovery`. No database, Storage or production rollback is required. The canonical raw fixture bytes should not be re-normalised; their certified CRLF hash is part of regression protection.
