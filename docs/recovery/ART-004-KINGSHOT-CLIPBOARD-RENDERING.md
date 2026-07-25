# ART-004 — Kingshot clipboard rendering profile

Kingshot chat can expand ordinary spaces in copied artwork while preserving the
same visible structure. Forge therefore keeps the pasted string as the
immutable raw source and applies a rendering-only source context:

- `authored` keeps the ART-003 calibrated spacing rules.
- `kingshot-clipboard` uses a narrower advance for ordinary internal artwork
  spaces while preserving prose spaces, leading indentation, ideographic spaces
  and line-art glyph advances.

The context is selected by the submitter and carried through the existing
`compatibility_profile` metadata field (`kingshot-clipboard` is the new value),
so no database migration is required. Missing or older values safely resolve to
`authored`. Hashes, byte counts, provenance, approved payloads and clipboard
copy operations continue to use the original stored source/payload exactly.

The advisory detector only suggests the mode when multiple structural lines
contain expanded ordinary-space runs. It never changes the source or selects a
mode automatically. The profile is evidence-led and intentionally approximate:
host font metrics and device differences can still produce accepted visual
differences from a Kingshot screenshot.

## Owner acceptance — PR #21

At commit `b34d24cdc0c0bd42fca988b8bbe97a5bf53f13d3` (the accepted head of
`feature/art-studio-kingshot-clipboard-profile`), the owner completed real
mobile visual review using two independent complex artworks copied directly
from Kingshot:

1. `Wow I’m so cute` cat artwork.
2. `Bring dat recipe to mehhh` artwork.

Both passed. The owner confirmed that copying from Kingshot is the correct
recommended default; raw source and clipboard fidelity remain exact; complex
spacing is visually de-expanded without mutating source; the complete artwork
fits on mobile; left/right structural alignment is acceptable; and no
unexpected wrapping or clipping was observed. The directional glyph
calibration generalises beyond the original cat fixture.

The owner accepts emoji appearance, exact font shape, stroke thickness and
minor letter-spacing differences from Kingshot as non-blocking simulation
differences. Final decision: **GO FOR MERGE PREPARATION**.
