import type {
  DatasetLoadResult,
} from './dataEngineApi'

import type {
  DatasetBrowserDefinition,
  DatasetTableRow,
} from './datasetBrowserTypes'

import {
  isRecordObject,
  readStringValue,
  type DatasetAdapter,
} from './datasetAdapters'

function relationshipCount(record: Record<string, unknown>): number {
  return Array.isArray(record.companion_relationships)
    ? record.companion_relationships.length
    : 0
}

function createRows(result: DatasetLoadResult): DatasetTableRow[] {
  return result.records.flatMap((value, index) => {
    if (!isRecordObject(value)) return []

    const key = readStringValue(value.key)
      ?? readStringValue(value.id)
      ?? `item-${index + 1}`

    return [{
      id: key,
      values: {
        name: readStringValue(value.name),
        category: readStringValue(value.category_label)
          ?? readStringValue(value.category),
        trust: readStringValue(value.trust_label)
          ?? readStringValue(value.trust_state),
        relationships: relationshipCount(value),
        media: value.image_url
          ? 'Published'
          : 'Withheld',
        status: readStringValue(value.status),
      },
    }]
  })
}

export const itemsDatasetAdapter: DatasetAdapter = {
  datasetId: 'items',

  createBrowserDefinition(
    result: DatasetLoadResult,
  ): DatasetBrowserDefinition {
    return {
      datasetId: 'items',
      columns: [
        {
          key: 'name',
          label: 'Item',
          width: '190px',
          sortable: true,
        },
        {
          key: 'category',
          label: 'Category',
          width: '180px',
          sortable: true,
        },
        {
          key: 'trust',
          label: 'Trust state',
          width: '140px',
          sortable: true,
        },
        {
          key: 'relationships',
          label: 'Relationships',
          width: '120px',
          sortable: true,
        },
        {
          key: 'media',
          label: 'Media',
          width: '110px',
          sortable: true,
        },
        {
          key: 'status',
          label: 'Status',
          width: '100px',
          sortable: true,
        },
      ],
      rows: createRows(result),
    }
  },
}
