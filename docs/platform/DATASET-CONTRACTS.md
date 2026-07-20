# Dataset contracts

Contracts are declarative definitions containing accepted file types and sheets, canonical/detail sheet roles, keys, fields, types, nullability, unique constraints, relationships, metadata, and validation policy. Domain validators consume the same contract shape so future Troops, Gear, Events, Heroes, VIP, Truegold and KvK imports use the same pipeline.

Buildings uses `buildings_catalog` as the canonical entity sheet and `buildings_import` as progression detail. `record_id` is the detail identity and `building_key` is the relational identity. Requirements JSON is required to remain an array, while `requirements_text` preserves the source display.

