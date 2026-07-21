# Render fixtures and regression

Canonical rendering evidence lives under `fixtures/community-art/<fixture-id>/`:

- `<fixture-id>.txt` is the immutable raw source. Read it as UTF-8 and do not trim or normalise it.
- `metadata.json` identifies the fixture, its render profile, generated source statistics, and screenshot evidence.
- PNG files named by metadata are the Kingshot reference captures.

The Render Engine imports the committed fixture bytes through its fixture loader (`src/render-engine/fixtures.ts`). This keeps the browser calibration view, diagnostics, and regression runner on the same source. Adding a fixture requires adding its folder and a loader entry, then generating metadata from the files; hashes and Unicode counts must never be hand-authored.

Run `npm run test:render` to scan every fixture folder. The runner generates SHA-256 hashes, PNG dimensions, Unicode statistics, per-line width diagnostics, safe-repair payload hashes, and equality checks for moderation, gallery, and clipboard payloads. A non-zero result blocks release.

## Profiles and calibration

Profiles are versioned in `shared/domains/art-studio/rendering.ts`: Desktop, Forge Browser, Kingshot Chat, Kingshot Mail, and Kingshot Alliance Chat. They are approximation profiles, not claims of pixel-perfect game rendering.

In Render Engine, select a canonical fixture, choose a profile, and use the screenshot comparison view. The left/source and centre/Forge views expose the generated diagnostics; the reference view accepts the chat or game capture. Zoom, pan, opacity, overlay, difference mode, and alignment controls are local calibration aids. Record observed drift by line in the calibration notes or moderation record, including limitations of the selected profile.

Safe repairs are previews. Approval must create/use the approved payload version; raw source remains immutable and is never a public copy source.
