# Text Transformation Pipeline

Every transform is explicit, reversible and auditable. The inspector reports before/after values, operation names, SHA-256, byte and text lengths, code-point/grapheme/UTF-16/line deltas, and exact changed positions with code points.

Safe automatic rules include derived line-ending conversion and profile-based tab expansion. Punctuation replacement is reviewable, never silent. Manual moderator edits record actor, reason and `manual` mode.

Raw source is not a normalised value. Approved and clipboard payloads are independent stages, and clipboard writes originate only from approved payload state. Equality compares bytes, hash, UTF-16 units, code points and graphemes.

Fixtures cover ASCII, emoji, full-width, mixed-width, ideographic spaces, invisible characters, names, banners, chat, Alliance Mail and Community Art. Regression compares raw/stage hashes, statistics, approved payload, prediction and clipboard equality.

The canonical fixture proves the source boundary with 276 code points and 278 UTF-16 units. Local pipeline tests prove CRLF and tab deltas are explicit and auditable. Live clipboard equality and authenticated browser transition capture remain owner-session checks.
