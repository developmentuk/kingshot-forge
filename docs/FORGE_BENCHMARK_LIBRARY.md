# Forge Benchmark Library

The typed registry in `src/render-engine/benchmarks/` contains the initial benchmark set:

- Norway Flag — pixel benchmark
- Mental Hospital — ASCII architecture benchmark
- CAFÉ — mixed glyph benchmark
- Dancing Cat — emoji and ASCII benchmark
- Like My Island — emoji scene benchmark
- Alliance Cat Slide — ASCII scene benchmark

Each entry records an ID, expected class, renderer, target device, notes and validation status. Existing Art Studio records are referenced by ID where present. Metadata-only benchmarks remain explicit until their approved source artwork is added. No image-comparison scores are fabricated.

Benchmark workflow: choose a record, confirm fixed-cell dimensions and glyph-family counts, compare a local screenshot side by side or with a manually controlled overlay, then record human findings outside the app. OCR and automatic image matching are intentionally deferred.
