import {
  COMPANION_ITEM_GAMEPLAY_CONTENT,
} from './itemGameplayContent.js'
import {
  COMPANION_ITEM_GAMEPLAY_RECOVERY_PHASE2,
} from './itemGameplayRecoveryPhase2.js'

import type {
  CompanionItemGameplayContent,
} from './itemGameplayContent.js'

export const COMPANION_ITEM_GAMEPLAY:
Readonly<Record<string, CompanionItemGameplayContent>> = Object.freeze({
  ...COMPANION_ITEM_GAMEPLAY_CONTENT,
  ...COMPANION_ITEM_GAMEPLAY_RECOVERY_PHASE2,
})

export const COMPANION_ITEM_GAMEPLAY_PHASE1_KEYS = Object.freeze(
  Object.keys(COMPANION_ITEM_GAMEPLAY_CONTENT),
)

export const COMPANION_ITEM_GAMEPLAY_PHASE2_KEYS = Object.freeze(
  Object.keys(COMPANION_ITEM_GAMEPLAY_RECOVERY_PHASE2),
)
