export type DatasetPermissionAction =
  | 'read'
  | 'create'
  | 'update'
  | 'delete'
  | 'review'
  | 'approve'
  | 'publish'
  | 'archive'
  | 'restore'
  | 'import'
  | 'export'
  | 'manage'

export interface DatasetPermissionContext {
  userId: string | null
  roles: string[]
  datasetId: string
  recordId?: string
}

export type DatasetPermissionRule =
  | string[]
  | ((context: DatasetPermissionContext) => boolean | Promise<boolean>)

export type DatasetPermissionPolicy = Partial<
  Record<DatasetPermissionAction, DatasetPermissionRule>
>
