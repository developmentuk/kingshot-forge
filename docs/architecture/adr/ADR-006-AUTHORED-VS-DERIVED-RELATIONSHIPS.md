# ADR-006 — Authored Versus Derived Relationships

**Status:** Accepted for future implementation

Authored relationships are versioned editorial edges validated and published with their endpoints. Search relationship projections are derived, rebuildable read models. Domain-derived edges are allowed only when their derivation is documented and deterministic.

Forge Connections and public Search consume published projections only. Neither surface may author, infer from arbitrary labels, expose drafts or invent broken links.
