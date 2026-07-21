# ADR-003 — Semantic Progression Hierarchy

**Status:** Accepted for future implementation

Progression rows store phase, tier, stage, explicit sequence, row kind and parent identity. Rendered labels are presentation output. Sorting uses semantic ordinals and a stable ID tie-breaker; labels are never parsed or sorted.

Legacy fields (`base_level`, `stage`, `truegold_tier`, T1–T6) are compatibility inputs. Existing Buildings records remain readable through an adapter.
