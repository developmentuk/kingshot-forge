# Kingshot text compatibility

Text is analyzed as Unicode grapheme clusters, not JavaScript code units. Diagnostics distinguish ordinary, non-breaking and ideographic spaces; tabs; combining marks; emoji; full-width punctuation; CJK/full-width characters; box drawing; controls and zero-width characters.

The analyzer is conservative. Unknown characters are flagged, not silently replaced. Safe repairs are previewed and recorded as reversible operations. Approved payloads use deterministic LF line endings and are copied as plain text through the Clipboard API.

The width model is profile-driven. A cell estimate is a prediction, not evidence of actual game rendering; screenshot calibration records observed deviations manually.

## ART-003 context profiles

Forge keeps separate versioned profiles for `kingshot-chat`,
`kingshot-alliance-chat` and `kingshot-mail`. Each profile supports per-character and
emoji widths, ideographic-space and full-width-punctuation widths, line height,
baseline, maximum safe line width, leading/trailing-space rules and line-break rules.
Calibration changes prediction only; it cannot edit raw source, approved payloads,
moderation permissions or clipboard text.

The canonical `wow-im-so-cute` evidence preserves 10 lines and visible breaks. The
reference screenshots still have residual differences from the unavailable Kingshot
font, device rasterisation and unrecorded browser/device scale. Exact pixel
equivalence is not claimed until owner-provided screenshots include that metadata.
## Preservation policy

Compatibility classification is evidence, not permission to mutate. `unverified` does not mean `unsupported`; width warnings, emoji, ideographic spaces and full-width characters remain unchanged. Kingshot screenshot/source observations are fixture-scoped evidence for their specific context.
