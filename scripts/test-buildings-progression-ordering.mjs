import assert from 'node:assert/strict'
import { sortBuildingProgression } from '../shared/data-pipeline/buildingsProgressionOrdering.ts'

const rows = [
  { record_id: 'tg-2-7', level_label: 'TG7', progression_phase: 'truegold', base_level: 30, stage: 2, truegold_tier: 7 },
  { record_id: 'normal-33', level_label: '33', progression_phase: 'normal', base_level: 33 },
  { record_id: 'tg-1-1', level_label: 'TG1', progression_phase: 'truegold', base_level: 30, stage: 1, truegold_tier: 1 },
  { record_id: 'normal-1', level_label: 'TG5', progression_phase: 'normal', base_level: 1 },
  { record_id: 'transition-1', level_label: 'TG1', progression_phase: 'pre_truegold', base_level: 34 },
  { record_id: 'base', level_label: 'Level 0', progression_phase: 'normal', base_level: 0 },
  { record_id: 'normal-32', level_label: '32', progression_phase: 'normal', base_level: 32 },
  { record_id: 'tg-1-7', level_label: 'TG7', progression_phase: 'truegold', base_level: 30, stage: 1, truegold_tier: 7 },
  { record_id: 'tg-1-2', level_label: 'TG2', progression_phase: 'truegold', base_level: 30, stage: 1, truegold_tier: 2 },
]

assert.deepEqual(sortBuildingProgression(rows).map((row) => row.record_id), [
  'base', 'normal-1', 'normal-32', 'normal-33', 'transition-1', 'tg-1-1', 'tg-1-2', 'tg-1-7', 'tg-2-7',
])
console.log('Buildings progression ordering regression passed: structured phase, level, stage and tier ordering is independent of labels.')
