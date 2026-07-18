# Forge Render Engine

## Status

Forge Render Engine 2.0 is the canonical rendering subsystem for Kingshot-compatible artwork previews. Sprint 9 places the subsystem under `src/render-engine/`; `src/components/art/KingshotArtRenderer.tsx` remains the stable public adapter used by Art Studio.

## Core principle

Kingshot artwork is rendered on a fixed logical character grid. Every grapheme occupies one cell regardless of whether it is ASCII, box drawing, Unicode, decorative text or emoji.

The glyph may be visually adjusted inside its cell, but it must never change the position of neighbouring cells.

This prevents cumulative drift across ASCII scenes, buildings, banners and mixed artwork.

## Pipeline

1. Normalise line endings.
2. Convert tabs to four spaces.
3. Segment each line into Unicode grapheme clusters.
4. Build a two-dimensional row and column grid.
5. Classify each cell as space, ASCII, box drawing, Unicode, emoji, pixel circles, hearts or decorative symbols.
6. Paint every glyph inside a fixed-size cell.
7. Apply device calibration only through cell size, line height, glyph scale and chat bubble dimensions.
8. Preserve the original artwork text for copying.

## Invariants

- One grapheme equals one logical cell.
- No glyph changes the width of another cell.
- No per-character overlap or kerning correction is permitted.
- Artwork alignment must remain deterministic.
- Copy output must always use the untouched source text.
- Studio view remains a plain monospace reference.

## Glyph families

### ASCII

Latin letters, numbers and ASCII punctuation. Painted with a stable monospace font.

### Box drawing

Box-drawing and line characters. Painted in the same fixed grid as ASCII.

### Unicode

Non-ASCII text and decorative characters. Painted with the closest available Unicode-capable font while retaining one cell.

### Emoji

Extended pictographic graphemes. Painted with the platform emoji font and scaled within one cell. Emoji may visually overflow a cell but may not affect grid geometry.

### Space

An empty cell that retains its exact grid position.

## Device profiles

Phone, tablet and desktop presets alter:

- logical cell width
- logical cell height
- font size
- chat bubble width
- chat bubble padding
- avatar scale

They do not alter the artwork matrix. The initial profiles are Android default, iPhone default, Tablet and Desktop preview.

## Calibration suite

The following artworks are reference benchmarks:

- Norway Flag — emoji and pixel grid
- Mental Hospital — wide ASCII architecture
- CAFÉ — mixed Unicode, emoji and ASCII
- Dancing Cat — emoji and ASCII scene
- Alliance Cat Slide — ASCII scene and dialogue
- Like My Island — dense emoji scene

Every renderer change should be checked against these examples before release.

## Analysis engine

The artwork analyser remains separate from rendering. It can classify artwork, estimate width, score compatibility and surface warnings, but it must not change the fixed-cell rendering model.

## Future work

- screenshot-based calibration records
- platform-specific emoji baseline profiles
- artwork DNA visualisation
- character inspector
- community device validation
- automated regression screenshots

## Sprint 9 implementation map

- `parser/` owns line-ending normalisation, tab expansion and grapheme segmentation.
- `grid/` owns deterministic row and column assignment; calibration never changes these coordinates.
- `analyser/` owns glyph-family and artwork classification, counts and compatibility warnings.
- `configuration/` owns typed, browser-local glyph calibration.
- `device-profiles/` owns device geometry and chat presentation presets.
- `benchmarks/` owns benchmark metadata and links to existing artwork records where available.
- `simulator/` contains style translation for future simulator consumers.

The admin Calibration Lab is available at `/admin/render-engine` behind the existing `cms.view` permission. It does not persist slider changes and local reference screenshots are held only by the browser session. The lab reports family relevance and intentionally disables controls for unavailable benchmark artwork rather than presenting an empty render.

The proposed Forge Screenshot Intelligence Engine is future work only. Screenshot classification, OCR, artwork extraction, automatic alignment, comparison scoring and confidence-reviewed imports are not implemented in Release 0.7.0 Sprint 9.2.
