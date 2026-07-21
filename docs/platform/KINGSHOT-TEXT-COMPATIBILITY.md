# Kingshot text compatibility

Text is analyzed as Unicode grapheme clusters, not JavaScript code units. Diagnostics distinguish ordinary, non-breaking and ideographic spaces; tabs; combining marks; emoji; full-width punctuation; CJK/full-width characters; box drawing; controls and zero-width characters.

The analyzer is conservative. Unknown characters are flagged, not silently replaced. Safe repairs are previewed and recorded as reversible operations. Approved payloads use deterministic LF line endings and are copied as plain text through the Clipboard API.

The width model is profile-driven. A cell estimate is a prediction, not evidence of actual game rendering; screenshot calibration records observed deviations manually.
