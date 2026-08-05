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

export interface DatasetBrowserFilterOption {
  value: string;
  label: string;
}

export interface DatasetBrowserFilter {
  key: string;
  label: string;
  options: DatasetBrowserFilterOption[];
}

export interface DatasetTableRow {
  id: string;
  values: Record<string, DatasetCellValue>;
}

export interface DatasetBrowserDefinition {
  datasetId: string;
  columns: DatasetTableColumn[];
  rows: DatasetTableRow[];
  filters?: DatasetBrowserFilter[];
}
