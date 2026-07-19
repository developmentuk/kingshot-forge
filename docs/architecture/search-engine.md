# Search Engine

The RC Search Engine is a derived, published-only consumer of canonical Forge datasets. Providers load published records, the projection builder validates the public contract, and the persistence repository stores rebuildable projections and relationship edges. The in-memory engine handles ranking, permissions, filters, diagnostics and bounded relationship expansion.

Public search is served by `/api/search` and the player route `/search`. Admin Search Explorer is served by `/api/admin/search` and `/admin/search`, protected by the existing `cms.view` route gate plus server-side owner/admin permission checks. Full refreshes require explicit confirmation.

Editorial publication requests invalidate the Search cache after the canonical publication transaction succeeds. Search persistence is represented by `supabase/migrations/20260719090000_search_persistent_projections.sql`; it is a local proposal and has not been applied to Supabase.

Search does not author canonical facts, expose drafts to public users, or maintain an independent editable dataset. Failed refreshes leave the previous projection set available and mark index metadata stale for operational review.
