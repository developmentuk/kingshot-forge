# Character Preservation Policy

Community Art is preservation-first. The decoded submitted source is immutable, never trimmed, normalised, collapsed, relabelled or reconstructed from a preview. Warnings are diagnostics; they are not mutations.

Unknown and unverified characters are distinct from `unsupported_confirmed`. Width uncertainty, full-width punctuation, ideographic spaces, emoji and mixed scripts remain in the payload. Fixture evidence is scoped to the observed Kingshot context and does not make a character globally safe.

The moderation draft starts as an exact decoded copy. A moderator may edit it explicitly, but the operation records before/after hashes, affected positions, whitespace and line-ending deltas, the reason and active approval. Keep original is the default. Automatic repair is limited to explicitly rejected unsafe controls or separately declared transport representation.

Approved payload is the exact moderator-approved sequence. Gallery and clipboard use that payload directly; rendering may approximate width but never changes the payload. Restore exact submitted text copies the raw source back into the draft and verifies equality by hash and code points.

The canonical `wow-im-so-cute` fixture has 276 code points, 258 visible graphemes, 27 ideographic spaces, 2 emoji and 40 full-width characters. Its expected inventory is machine-readable at `fixtures/community-art/wow-im-so-cute/expected-inventory.json`.
