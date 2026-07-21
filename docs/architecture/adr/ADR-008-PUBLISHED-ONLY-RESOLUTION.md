# ADR-008 — Published-Only Public Resolution

**Status:** Accepted for future implementation

Public route, API, Search, Forge Connections and media resolution must resolve only published, visible and permission-eligible entities. Draft, staged, archived-private and failed-refresh state is excluded. A failed projection refresh retains the prior good index and marks freshness stale.

The existing editorial engine, publication queue, manifest and RLS boundaries remain authoritative; no second CMS or client-side authorization is introduced.
