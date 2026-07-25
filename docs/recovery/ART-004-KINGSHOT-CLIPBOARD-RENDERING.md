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
