import type { DatasetContract } from './contracts.js'

export const buildingsContract: DatasetContract = {
  key: 'buildings', version: 1, displayName: 'Buildings',
  description: 'Canonical buildings and per-level progression records.',
  acceptedFileTypes: ['xlsx', 'csv'],
  acceptedSheets: ['buildings_catalog', 'buildings_import', 'verification_notes'],
  canonicalEntitySheet: 'buildings_catalog', detailSheet: 'buildings_import', primaryKey: 'record_id',
  requiredColumns: {
    buildings_catalog: ['building_key', 'building_name', 'category', 'description', 'standard_max_level', 'truegold_supported', 'record_count', 'source_url', 'verification_note'],
    buildings_import: ['record_id', 'building_key', 'building_name', 'category', 'level_label', 'progression_phase', 'base_level', 'truegold_tier', 'stage', 'requirements_text', 'requirements_json', 'truegold', 'tempered_truegold', 'bread', 'wood', 'stone', 'iron', 'upgrade_time_seconds', 'upgrade_time_display', 'power', 'source_url', 'verification_status', 'verified_on', 'quality_flags', 'original_row'],
    verification_notes: [],
  },
  optionalColumns: { buildings_catalog: [], buildings_import: ['max_hero_level', 'training_capacity', 'rally_capacity', 'ally_help_count', 'training_speed_percent', 'troop_deploy_capacity', 'reinforcement_capacity'] },
  fields: {
    building_key: { type: 'string', required: true }, building_name: { type: 'string', required: true }, category: { type: 'string', required: true },
    description: { type: 'string', required: true }, standard_max_level: { type: 'integer', required: true }, truegold_supported: { type: 'boolean', required: true }, record_count: { type: 'integer', required: true },
    record_id: { type: 'string', required: true }, level_label: { type: 'string', required: true }, progression_phase: { type: 'string', required: true }, base_level: { type: 'integer', nullable: true }, truegold_tier: { type: 'integer', nullable: true }, stage: { type: 'integer', nullable: true },
    requirements_json: { type: 'json', required: true }, requirements_text: { type: 'string', nullable: true }, source_url: { type: 'url', required: true }, verification_status: { type: 'string', required: true }, verified_on: { type: 'date', nullable: true },
    truegold: { type: 'number', nullable: true }, tempered_truegold: { type: 'number', nullable: true }, bread: { type: 'number', nullable: true }, wood: { type: 'number', nullable: true }, stone: { type: 'number', nullable: true }, iron: { type: 'number', nullable: true }, upgrade_time_seconds: { type: 'number', nullable: true },
  },
  uniqueConstraints: [{ sheet: 'buildings_catalog', columns: ['building_key'] }, { sheet: 'buildings_import', columns: ['record_id'] }],
  relationships: [{ fromSheet: 'buildings_import', fromColumn: 'building_key', toSheet: 'buildings_catalog', toColumn: 'building_key' }],
  metadata: { rawCostWarning: 'Workbook resource costs are raw/base costs; preserve this warning in published metadata.', missingRecordPolicy: 'retain_existing', targetEntityTypes: ['building', 'building_progression'], publishedTables: ['buildings', 'building_progression'] },
}
