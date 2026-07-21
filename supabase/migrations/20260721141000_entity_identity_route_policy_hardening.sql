-- Keep registry metadata honest: no public route is advertised where the
-- product has no implemented route. This changes configuration only.
update public.entity_type_registry
set route_policy = '', updated_at = now()
where entity_type in ('event', 'troop', 'gear', 'charm', 'research', 'war_academy', 'guide', 'article', 'video', 'creator', 'tool', 'calculator', 'dataset');
