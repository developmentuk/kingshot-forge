import type {
  DatasetCellValue,
  DatasetTableColumn,
  DatasetTableRow,
} from "../datasetBrowserTypes";

export type RecordEditorValue =
  | DatasetCellValue
  | RecordEditorValue[]
  | {
      [key: string]:
        RecordEditorValue;
    };

export function isDatasetCellValue(
  value: unknown,
): value is DatasetCellValue {
  return (
    value === null ||
    value === undefined ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

export function toRecordEditorValue(
  value: unknown,
): RecordEditorValue {
  if (isDatasetCellValue(value)) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(
      (item) =>
        toRecordEditorValue(item),
    );
  }

  if (
    typeof value === "object" &&
    value !== null
  ) {
    const editorObject: Record<
      string,
      RecordEditorValue
    > = {};

    for (
      const [key, childValue] of
      Object.entries(value)
    ) {
      editorObject[key] =
        toRecordEditorValue(
          childValue,
        );
    }

    return editorObject;
  }

  return null;
}

export type RecordEditorFieldType =
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "select"
  | "url"
  | "json"
  | "building-costs"
  | "readonly";

export interface RecordEditorSelectOption {
  label: string;
  value:
    | string
    | number
    | boolean;
}

export interface RecordEditorValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  integer?: boolean;
  message?: string;

  validate?: (
    value: RecordEditorValue,
    record: RecordEditorRecord,
  ) => string | null;
}

export interface RecordEditorFieldSchema {
  key: string;
  label: string;
  type: RecordEditorFieldType;

  description?: string;
  placeholder?: string;

  section?: string;
  order?: number;

  required?: boolean;
  readOnly?: boolean;
  hidden?: boolean;

  options?:
    RecordEditorSelectOption[];

  validation?:
    RecordEditorValidationRule;

  formatValue?: (
    value: RecordEditorValue,
    record: RecordEditorRecord,
  ) => string;

  normaliseValue?: (
    value: RecordEditorValue,
    record: RecordEditorRecord,
  ) => RecordEditorValue;
}

export interface RecordEditorSectionSchema {
  id: string;
  title: string;
  description?: string;
  order?: number;
  collapsedByDefault?: boolean;
}

export interface RecordEditorRecord {
  id: string;

  values: Record<
    string,
    RecordEditorValue
  >;
}

export interface RecordEditorSchema {
  datasetId: string;

  singularLabel: string;
  pluralLabel: string;

  idField: string;
  titleField: string;

  fields:
    RecordEditorFieldSchema[];

  sections?:
    RecordEditorSectionSchema[];

  tableColumns?:
    DatasetTableColumn[];

  allowCreate?: boolean;
  allowDuplicate?: boolean;
  allowDelete?: boolean;

  createEmptyRecord?: () =>
    RecordEditorRecord;

  validateRecord?: (
    record: RecordEditorRecord,
  ) => Record<string, string>;

  toEditorRecord?: (
    row: DatasetTableRow,
  ) => RecordEditorRecord;

  toTableRow?: (
    record: RecordEditorRecord,
  ) => DatasetTableRow;
}

export interface RecordEditorFieldError {
  fieldKey: string;
  message: string;
}

export interface RecordEditorValidationResult {
  isValid: boolean;

  errors:
    RecordEditorFieldError[];

  errorsByField: Record<
    string,
    string
  >;
}

export function defaultRowToEditorRecord(
  row: DatasetTableRow,
): RecordEditorRecord {
  return {
    id: row.id,

    values: {
      ...row.values,
    },
  };
}

export function defaultEditorRecordToRow(
  record: RecordEditorRecord,
): DatasetTableRow {
  const values: Record<
    string,
    DatasetCellValue
  > = {};

  for (
    const [key, value] of
    Object.entries(
      record.values,
    )
  ) {
    if (isDatasetCellValue(value)) {
      values[key] = value;
    }
  }

  return {
    id: record.id,
    values,
  };
}

export function getOrderedEditorFields(
  schema: RecordEditorSchema,
): RecordEditorFieldSchema[] {
  return [...schema.fields]
    .filter(
      (field) =>
        !field.hidden,
    )
    .sort(
      (
        first,
        second,
      ) =>
        (first.order ?? 0) -
        (second.order ?? 0),
    );
}

export function getOrderedEditorSections(
  schema: RecordEditorSchema,
): RecordEditorSectionSchema[] {
  return [
    ...(schema.sections ?? []),
  ].sort(
    (
      first,
      second,
    ) =>
      (first.order ?? 0) -
      (second.order ?? 0),
  );
}