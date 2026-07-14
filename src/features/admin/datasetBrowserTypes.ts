export type DatasetCellValue =
  | string
  | number
  | boolean
  | null
  | undefined;

export interface DatasetTableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
}

export interface DatasetTableRow {
  id: string;
  values: Record<string, DatasetCellValue>;
}

export interface DatasetBrowserDefinition {
  datasetId: string;
  columns: DatasetTableColumn[];
  rows: DatasetTableRow[];
}