import type { DatasetRecord, DatasetRecordDraft } from './record.js'
import type { DatasetRecordValues } from './value.js'

export interface DatasetAdapter<
  TSource = unknown,
  TValues extends DatasetRecordValues = DatasetRecordValues,
> {
  fromSource(source: TSource): DatasetRecordDraft<TValues>
  toSource?(record: DatasetRecord<TValues>): TSource
  getRecordId?(source: TSource, index: number): string
}
