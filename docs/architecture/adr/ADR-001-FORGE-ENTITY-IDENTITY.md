# ADR-001 — Forge Stable Entity IDs

**Status:** Accepted for future implementation

Forge IDs use `namespace.local-key`, lowercase ASCII with hyphenated words. They are permanent, version-independent public identifiers and are distinct from UUIDs, URLs, display names, editable slugs and import IDs.

Aliases and redirects resolve to the stable ID. Renames do not change identity; deprecation does not recycle it. Database keys and routes remain adapter details. This preserves links and lets datasets, Search, API, Discord and mobile share identity without coupling to Supabase implementation.

**Consequences:** every entity type needs a resolver and collision test; existing `forge_id`, `building_key` and Search dataset/record pairs require compatibility adapters before any migration.
