# ART-003 Visual Fidelity Calibration

ART-003 calibrates Forge prediction for `fixtures/community-art/wow-im-so-cute/` in
Kingshot chat, alliance chat and mail. The workflow selects a fixture and context,
loads a reference screenshot, records line anchors, measures drift, adjusts a context
profile, reruns prediction, saves a versioned profile and compares the result.

Profiles support per-character and emoji widths, ideographic spaces, full-width
punctuation, line height, baseline, maximum safe line width, leading/trailing-space
rules and line-break rules. Calibration is prediction metadata only: source bytes,
raw hash, approved payload, moderation permissions and clipboard behavior are outside
the calibration write path.

The fixture has 10 lines, 258 graphemes, two emoji, 27 ideographic spaces and 40
full-width characters. Its raw SHA-256 is
`c4b0112b0e43312d1bbf3f2e18472814564d184f55c114c2749d0e921613cd79` over 386 bytes.
The committed profiles are version 2 for all three contexts and preserve line count
and visible breaks.

Residual mismatch is primarily font-family approximation, with secondary contributions
from emoji, ideographic spaces, full-width punctuation, line-height and baseline.
Cell width and screenshot/browser scaling amplify the error. There is no evidence of
context-specific trimming: spaces and line breaks remain preserved. A real device
scale and authenticated owner calibration run are still needed for pixel-level bounds.

Recommendation: **Ready for Owner Acceptance**, not Ready for Production Promotion.
The exact protected preview is ready, but player submission, moderation continuity,
authenticated role checks, clipboard equality and responsive browser checks require
owner-provided sessions.
