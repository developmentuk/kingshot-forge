# Render Engine

`/admin/render-engine` is the shared calibration and diagnostics workspace for Community Art submission, moderation and public gallery previews. It supports benchmark loading, source editing, profile selection, fixed-cell preview, per-line diagnostics, safe-repair preview, screenshot upload/overlay, manual alignment, local profile versioning, import/export and calibration controls.

Render profiles currently include Browser Forge preview, Kingshot chat bubble, Kingshot alliance message and Kingshot name/banner. Each profile defines width multipliers, safe line width, emoji handling, whitespace policy and line-break policy. Browser rendering remains an approximation; the UI must show warnings where in-game output cannot be proven identical.

Calibration profiles remain browser-local until an authenticated, versioned persistence workflow is approved. A live profile is never overwritten without a new version.
