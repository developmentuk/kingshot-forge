import type { DatasetRecord, DatasetRecordDraft } from './record'
import type { DatasetRecordValues } from './value'

export interface DatasetAdapter<
  TSource = unknown,
  TValues extends DatasetRecordValues = DatasetRecordValues,
> {
  fromSource(source: TSource): DatasetRecordDraft<TValues>
  toSource?(record: DatasetRecord<TValues>): TSource
  getRecordId?(source: TSource, index: number): string
}
