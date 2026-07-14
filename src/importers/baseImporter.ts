export type ImportChangeType =
  | "created"
  | "updated"
  | "unchanged"
  | "deactivated"
  | "invalid";

export interface ImportValidationIssue {
  field?: string;
  message: string;
}

export interface ImportRecordResult<TRecord> {
  key: string;
  changeType: ImportChangeType;
  sourceRecord: unknown;
  normalisedRecord: TRecord | null;
  validationIssues: ImportValidationIssue[];
}

export interface ImportPreview<TRecord> {
  dataset: string;
  sourceName: string;
  sourceUrl: string;
  fetchedAt: string;

  totalSourceRecords: number;
  createdCount: number;
  updatedCount: number;
  unchangedCount: number;
  deactivatedCount: number;
  invalidCount: number;

  records: ImportRecordResult<TRecord>[];
}

export interface ImportExecutionResult {
  dataset: string;
  startedAt: string;
  completedAt: string;

  createdCount: number;
  updatedCount: number;
  unchangedCount: number;
  deactivatedCount: number;
  invalidCount: number;

  success: boolean;
  message: string;
}

export interface Importer<TSourceRecord, TNormalisedRecord> {
  readonly dataset: string;
  readonly sourceName: string;
  readonly sourceUrl: string;

  fetchSource(): Promise<TSourceRecord[]>;

  validateSourceRecord(
    record: TSourceRecord,
  ): ImportValidationIssue[];

  normaliseSourceRecord(
    record: TSourceRecord,
  ): TNormalisedRecord;

  getRecordKey(
    record: TNormalisedRecord,
  ): string;

  preview(): Promise<ImportPreview<TNormalisedRecord>>;

  execute(
    preview: ImportPreview<TNormalisedRecord>,
  ): Promise<ImportExecutionResult>;
}

export function countPreviewChanges<TRecord>(
  records: ImportRecordResult<TRecord>[],
): Pick<
  ImportPreview<TRecord>,
  | "createdCount"
  | "updatedCount"
  | "unchangedCount"
  | "deactivatedCount"
  | "invalidCount"
> {
  return {
    createdCount: records.filter(
      (record) => record.changeType === "created",
    ).length,

    updatedCount: records.filter(
      (record) => record.changeType === "updated",
    ).length,

    unchangedCount: records.filter(
      (record) => record.changeType === "unchanged",
    ).length,

    deactivatedCount: records.filter(
      (record) => record.changeType === "deactivated",
    ).length,

    invalidCount: records.filter(
      (record) => record.changeType === "invalid",
    ).length,
  };
}