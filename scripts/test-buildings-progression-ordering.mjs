import assert from 'node:assert/strict'
import { getBuildingProgressionLabel, getBuildingProgressionSemantics, sortBuildingProgression } from '../shared/data-pipeline/buildingsProgressionOrdering.ts'

const rows = [
  { record_id: 'tg-2-1', level_label: 'TG1', progression_phase: 'truegold', base_level: 30, stage: 1, truegold_tier: 2 },
  { record_id: 'normal-33', level_label: '33', progression_phase: 'normal', base_level: 33 },
  { record_id: 'tg-1-0', level_label: 'TG99', progression_phase: 'truegold', base_level: 30, stage: 0, truegold_tier: 1 },
  { record_id: 'normal-1', level_label: 'TG5', progression_phase: 'normal', base_level: 1 },
  { record_id: 'transition-1', level_label: 'TG1', progression_phase: 'pre_truegold', base_level: 34 },
  { record_id: 'base', level_label: 'Level 0', progression_phase: 'normal', base_level: 0 },
  { record_id: 'normal-32', level_label: '32', progression_phase: 'normal', base_level: 32 },
  { record_id: 'tg-1-1', level_label: 'TG1', progression_phase: 'truegold', base_level: 30, stage: 1, truegold_tier: 1 },
  { record_id: 'tg-1-2', level_label: 'TG2', progression_phase: 'truegold', base_level: 30, stage: 2, truegold_tier: 1 },
  { record_id: 'tg-2-0', level_label: 'TG2', progression_phase: 'truegold', base_level: 30, stage: 0, truegold_tier: 2 },
  { record_id: 'tg-2-2', level_label: 'TG2', progression_phase: 'truegold', base_level: 30, stage: 2, truegold_tier: 2 },
  { record_id: 'tg-10-0', level_label: 'TG2', progression_phase: 'truegold', base_level: 30, stage: 0, truegold_tier: 10 },
]

assert.deepEqual(sortBuildingProgression(rows).map((row) => row.record_id), [
  'base', 'normal-1', 'normal-32', 'normal-33', 'transition-1', 'tg-1-0', 'tg-1-1', 'tg-1-2', 'tg-2-0', 'tg-2-1', 'tg-2-2', 'tg-10-0',
])
assert.equal(getBuildingProgressionLabel(rows.find((row) => row.record_id === 'tg-1-0')), 'TG1')
assert.equal(getBuildingProgressionLabel(rows.find((row) => row.record_id === 'tg-1-1')), 'TG1-1')
assert.equal(getBuildingProgressionSemantics(rows.find((row) => row.record_id === 'tg-2-2')).rowKind, 'truegold-sub-stage')

const variableCounts = [
  { record_id: 'tier-1', progression_phase: 'truegold', truegold_tier: 1, stage: 0 },
  { record_id: 'tier-1-1', progression_phase: 'truegold', truegold_tier: 1, stage: 1 },
  { record_id: 'tier-1-2', progression_phase: 'truegold', truegold_tier: 1, stage: 2 },
  { record_id: 'tier-2', progression_phase: 'truegold', truegold_tier: 2, stage: 0 },
  { record_id: 'tier-3', progression_phase: 'truegold', truegold_tier: 3, stage: 0 },
  { record_id: 'tier-3-1', progression_phase: 'truegold', truegold_tier: 3, stage: 1 },
  { record_id: 'tier-3-2', progression_phase: 'truegold', truegold_tier: 3, stage: 2 },
  { record_id: 'tier-3-3', progression_phase: 'truegold', truegold_tier: 3, stage: 3 },
]
assert.deepEqual(sortBuildingProgression(variableCounts).map((row) => getBuildingProgressionLabel(row)), [
  'TG1', 'TG1-1', 'TG1-2', 'TG2', 'TG3', 'TG3-1', 'TG3-2', 'TG3-3',
])
assert.equal(variableCounts.length, sortBuildingProgression(variableCounts).length, 'variable-stage rows are not collapsed')
assert.equal(getBuildingProgressionLabel({ progression_phase: 'truegold', truegold_tier: 4, stage: 0 }), 'TG4')
console.log('Buildings progression ordering regression passed: structured phase, level, stage and tier ordering is independent of labels.')
