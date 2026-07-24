# FRKS record — ART-003 rendering fidelity

## Knowledge identity

- Domain: Creative / Render Engine
- Workstream: Art Studio Rendering Fidelity Recovery
- Canonical fixture: `community-art.wow-im-so-cute`
- Evidence status: measured and test-protected; owner visual acceptance pending
- Supersedes: no prior raw source or moderation ownership contract

## Lasting findings

Kingshot's observed chat rendering cannot be reproduced accurately by assigning the same visual advance to every source grapheme. The stable model is:

1. Preserve the source string and grapheme sequence exactly.
2. Build deterministic grapheme records in source order.
3. Assign a configurable logical advance by glyph family.
4. Paint each glyph inside that advance with independent scale, baseline, font family and weight.
5. Keep copy, approval and audit payloads independent from the visual simulation.

For the canonical fixture, ordinary spaces behave substantially narrower than ideographic spaces. The current evidence-backed candidate uses 0.60 logical cells for U+0020 and 2.00 cells for U+3000, full-width characters and emoji. This is a renderer calibration rule, not artwork-specific repair logic.

The canonical compact chat capture indicates a 426 × 352-pixel bubble, a 32-pixel row pitch and asymmetric padding: approximately 36 pixels horizontally and 14 pixels vertically. A single undifferentiated padding setting cannot reproduce both horizontal alignment and vertical height, so device profiles require separate horizontal and vertical bubble padding.

## Source-integrity finding

The fixture metadata and ART-002B certification define the source as 386 UTF-8 bytes with nine CRLF line endings and SHA-256:

```text
c4b0112b0e43312d1bbf3f2e18472814564d184f55c114c2749d0e921613cd79
```

The checked-out blob had been converted to LF, producing a different hash and 377 bytes. The source was restored to the certified CRLF bytes and protected with a path-specific `.gitattributes` rule. Visible text was not edited.

## Architectural decision

Device geometry and glyph-family advances belong to the shared Render Engine configuration. Art Studio cards, full previews, submission previews, moderation previews and the Calibration Lab must not maintain separate geometry or artwork-specific CSS.

Browser-local saved profiles remain schema version 1. Missing new family or device fields are upgraded from defaults; malformed values continue to fail closed. No Supabase dependency is introduced.

## Limitations and confidence

Confidence is high for source preservation, row pitch, bubble dimensions and the need for separate normal/ideographic-space advances. Confidence is moderate for exact font painting because the reference capture does not expose the underlying font and browser/OS fallback varies. The expanded game capture remains a separate calibration candidate.

Manual owner comparison remains the acceptance authority. Do not report a synthetic similarity score.
