# ADR-004 — Variable Truegold Stages

**Status:** Accepted for future implementation

Truegold stage cardinality is data-driven per entity, phase and tier. A tier may have zero sub-stages, or any number of ordered sub-stages. The renderer and validators must not encode TG1–TGn counts. `TG1`, `TG1-1`, `TG1-2` and `TG2-1` are generated labels, not hierarchy.

Publication fails for duplicate semantic sequence, invalid parentage or orphaned stage rows.
