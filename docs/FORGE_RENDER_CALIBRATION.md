# Forge Render Calibration

Calibration changes how a glyph is painted inside a fixed cell. It never changes the row, column or grapheme count.

Each glyph family has typed values for glyph scale, horizontal scale, vertical scale, baseline offset, font family and font weight. The default configuration lives in `src/render-engine/configuration/` and is merged with browser-local overrides in the Calibration Lab.

The initial device profiles configure cell width, cell height, grid font size, line height, emoji scale, chat bubble width, bubble padding and avatar size. Device profiles are presentation presets, not alternate artwork parsers.

Use `/admin/render-engine` to select a benchmark, device profile and glyph family. The lab reports the selected family's count in the active artwork and automatically chooses a significant family when switching benchmarks. A zero-count family is clearly marked and its controls are disabled. Missing source artwork remains metadata-only and is not replaced with invented text.

Changes are intentionally local to the current browser session for Sprint 9. A future persistence design may store versioned calibration records with reviewer, device, capture reference and approval status; it must not turn slider state into an ungoverned global default. Screenshot intelligence, OCR, automatic alignment and scoring remain future work.

## Sprint 9.3 local profiles

Profiles are stored as JSON records in `forge.renderEngine.calibrationProfiles.v1`. A record contains `schemaVersion`, local ID, name, created/updated timestamps, base device profile, complete glyph-family calibration, device-profile overrides and optional benchmark ID. Malformed records are ignored on load; imported profiles must pass the same schema and numeric-range validation before being saved as a new profile.

The lab supports save, save-as-new, update, load, rename, duplicate, delete, JSON export and JSON import. Exported files contain calibration metadata only and never screenshots. Destructive delete and working-session reset require confirmation. Unsaved changes are identified separately from named profiles and benchmark/device changes prompt before discarding them.

Reset scopes are independent: selected family, all glyph calibration, device overrides and entire working session. Defaults are cloned before use and are never mutated.

The Sprint 9.2 reset failures had two separate causes: the visible “reset all” affordance was not connected to a complete calibration-state reset, and “reset device profile” had no device-override state or callback behind it. Sprint 9.3 gives each scope its own state update and disabled condition.

## Visual comparison

Artwork-only mode removes chat chrome while using the same fixed-cell renderer. Chat simulation uses the selected device profile. Forge and reference viewports have keyboard-accessible zoom controls, wheel zoom, pointer pan, fit/100% reset, manual reference offsets, scale, rotation and opacity. Side-by-side, overlay, reference-only, Forge-only and clearly-labelled difference viewing modes are visual aids only; no OCR, automatic alignment, image matching or score is generated.

## ART-003 measured calibration model

Glyph calibration now includes `advanceCells`. The value is the deterministic logical advance assigned to the grapheme record before its glyph is painted. It may be fractional. It does not mutate, remove or replace the source grapheme.

The compact chat candidate uses:

- ordinary space: `0.60` cells;
- ideographic space: `2.00` cells;
- full-width glyph: `2.00` cells;
- emoji/pixel/hearts: `2.00` cells;
- ordinary ASCII, box drawing, general Unicode and decorative symbols: `1.00` cell.

Device calibration separates vertical bubble padding (`bubblePadding`) from horizontal bubble padding (`bubbleInlinePadding`). Existing browser-local profiles without the new fields are upgraded with immutable defaults. The canonical fixture remains `calibration_required` until owner visual acceptance.
