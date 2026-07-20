# Forge Analytics Administration

Analytics is available at `/admin/analytics` to users with `cms.view`. It is a read-only operational report over anonymous, allow-listed events. The page is responsive and groups insight into Overview, Users, Search, Content, Performance, Errors and Operations.

The ingestion endpoint accepts only registered event names and approved aggregate properties. It never accepts player identifiers or free-form query text. The database table is service-role-only with RLS enabled.
