import type {
  DatasetPermissionPolicy,
} from '../datasets/index.js'

export const standardEditorialPermissionPolicy:
  DatasetPermissionPolicy = {
    read: [
      'owner',
      'admin',
      'moderator',
      'content_creator',
      'contributor',
      'viewer',
    ],
    create: [
      'owner',
      'admin',
      'content_creator',
      'contributor',
    ],
    update: [
      'owner',
      'admin',
      'content_creator',
      'contributor',
    ],
    delete: [
      'owner',
      'admin',
    ],
    review: [
      'owner',
      'admin',
      'moderator',
    ],
    approve: [
      'owner',
      'admin',
    ],
    publish: [
      'owner',
      'admin',
    ],
    archive: [
      'owner',
      'admin',
    ],
    restore: [
      'owner',
      'admin',
    ],
    import: [
      'owner',
      'admin',
    ],
    export: [
      'owner',
      'admin',
      'moderator',
      'content_creator',
    ],
    manage: [
      'owner',
      'admin',
    ],
  }
