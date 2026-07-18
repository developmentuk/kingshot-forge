# Forge Render Calibration

Calibration changes how a glyph is painted inside a fixed cell. It never changes the row, column or grapheme count.

Each glyph family has typed values for glyph scale, horizontal scale, vertical scale, baseline offset, font family and font weight. The default configuration lives in `src/render-engine/configuration/` and is merged with browser-local overrides in the Calibration Lab.

The initial device profiles configure cell width, cell height, grid font size, line height, emoji scale, chat bubble width, bubble padding and avatar size. Device profiles are presentation presets, not alternate artwork parsers.

Use `/admin/render-engine` to select a benchmark, device profile and glyph family. The lab reports the selected family's count in the active artwork and automatically chooses a significant family when switching benchmarks. A zero-count family is clearly marked and its controls are disabled. Missing source artwork remains metadata-only and is not replaced with invented text.

Changes are intentionally local to the current browser session for Sprint 9. A future persistence design may store versioned calibration records with reviewer, device, capture reference and approval status; it must not turn slider state into an ungoverned global default. Screenshot intelligence, OCR, automatic alignment and scoring remain future work.
