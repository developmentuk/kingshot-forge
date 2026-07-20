# Relationship Engine

Relationship edges are derived from published Search records and persisted as rebuildable Search projection data. Edges identify a source dataset/record, target dataset/record, relationship type and optional explanation or weight.

The engine bounds expansion to two levels, filters by relationship type, skips broken targets and prevents cycles. Public consumers receive only relationships reachable through published, permission-visible records. Admin Search Explorer can inspect relationship paths and simulate supported role permissions server-side.

Hero Companion currently consumes `ForgeConnections` for published hero relationships. Additional Knowledge Experience consumers should use the same projection boundary and must not read drafts or create a second editable relationship store.
