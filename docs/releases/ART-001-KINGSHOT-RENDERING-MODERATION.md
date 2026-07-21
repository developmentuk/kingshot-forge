# ART-001 — Kingshot rendering and moderation

ART-001 separates four values throughout Community Art: immutable `raw_source_text`, editorial `normalised_text`, versioned `approved_copy_payload`, and `rendered_preview_payload`. Public gallery and clipboard paths use the approved payload only; source text is never reconstructed from HTML or `innerText`.

The shared analyzer in `shared/domains/art-studio/rendering.ts` reports code points, Unicode block/name, grapheme count, UTF-16 length, whitespace classes, emoji, invisible controls, width class, profile-based predicted width, line overflow, risk and replacement candidates. Profiles are versioned data, not a global width constant.

Automatic repairs are deterministic and logged: CRLF/CR to LF, tabs to configured spaces, and known width-unstable punctuation replacements. Full-width and ideographic spaces are preserved unless a moderator explicitly edits them. Every approved payload stores its hash, profile and repair operations; raw source is protected by a database immutability trigger.

Known limitation: the ART-001 brief references a separate “Wow I’m so cute…” upload, but no artwork attachment was present in the workspace. The checked-in mixed-width fixture is therefore a reproducible proxy and must be replaced or re-run with the exact supplied source during protected-preview acceptance.

No production deployment, Buildings publication change, Media Library work or Entity Identity work is part of ART-001.
