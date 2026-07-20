import {
  useCallback,
  useMemo,
  useState,
} from "react";

import type {
  RecordEditorRecord,
  RecordEditorSchema,
  RecordEditorValidationResult,
  RecordEditorValue,
} from "./recordEditorSchema.js";

import {
  validateRecordEditorRecord,
} from "./recordEditorValidation.js";

interface UseRecordEditorResult {
  originalRecord:
    RecordEditorRecord;

  workingRecord:
    RecordEditorRecord;

  validation:
    RecordEditorValidationResult;

  isDirty: boolean;

  updateField: (
    fieldKey: string,
    value: RecordEditorValue,
  ) => void;

  resetChanges: () => void;

  replaceRecord: (
    record: RecordEditorRecord,
  ) => void;

  commitChanges: (
    savedRecord?:
      RecordEditorRecord,
  ) => void;
}

function cloneRecordEditorValue(
  value: RecordEditorValue,
): RecordEditorValue {
  if (Array.isArray(value)) {
    return value.map((item) =>
      cloneRecordEditorValue(item),
    );
  }

  if (
    value !== null &&
    typeof value === "object"
  ) {
    return Object.fromEntries(
      Object.entries(value).map(
        ([key, childValue]) => [
          key,
          cloneRecordEditorValue(
            childValue,
          ),
        ],
      ),
    );
  }

  return value;
}

function cloneRecordEditorRecord(
  record: RecordEditorRecord,
): RecordEditorRecord {
  return {
    id: record.id,
    values: Object.fromEntries(
      Object.entries(
        record.values,
      ).map(
        ([key, value]) => [
          key,
          cloneRecordEditorValue(
            value,
          ),
        ],
      ),
    ),
  };
}

function normaliseValueForComparison(
  value: RecordEditorValue,
): RecordEditorValue {
  if (Array.isArray(value)) {
    return value.map((item) =>
      normaliseValueForComparison(
        item,
      ),
    );
  }

  if (
    value !== null &&
    typeof value === "object"
  ) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(
          (
            [firstKey],
            [secondKey],
          ) =>
            firstKey.localeCompare(
              secondKey,
            ),
        )
        .map(
          ([key, childValue]) => [
            key,
            normaliseValueForComparison(
              childValue,
            ),
          ],
        ),
    );
  }

  return value;
}

function areRecordsEqual(
  firstRecord: RecordEditorRecord,
  secondRecord: RecordEditorRecord,
): boolean {
  if (
    firstRecord.id !==
    secondRecord.id
  ) {
    return false;
  }

  const firstNormalised =
    normaliseValueForComparison(
      firstRecord.values,
    );

  const secondNormalised =
    normaliseValueForComparison(
      secondRecord.values,
    );

  return (
    JSON.stringify(
      firstNormalised,
    ) ===
    JSON.stringify(
      secondNormalised,
    )
  );
}

function normaliseFieldValue(
  schema: RecordEditorSchema,
  fieldKey: string,
  value: RecordEditorValue,
  record: RecordEditorRecord,
): RecordEditorValue {
  const field =
    schema.fields.find(
      (candidate) =>
        candidate.key ===
        fieldKey,
    );

  if (
    !field?.normaliseValue
  ) {
    return value;
  }

  return field.normaliseValue(
    value,
    record,
  );
}

export function useRecordEditor(
  schema: RecordEditorSchema,
  initialRecord: RecordEditorRecord,
): UseRecordEditorResult {
  const [
    originalRecord,
    setOriginalRecord,
  ] = useState<RecordEditorRecord>(
    () =>
      cloneRecordEditorRecord(
        initialRecord,
      ),
  );

  const [
    workingRecord,
    setWorkingRecord,
  ] = useState<RecordEditorRecord>(
    () =>
      cloneRecordEditorRecord(
        initialRecord,
      ),
  );

  const isDirty = useMemo(
    () =>
      !areRecordsEqual(
        originalRecord,
        workingRecord,
      ),
    [
      originalRecord,
      workingRecord,
    ],
  );

  const validation = useMemo(
    () =>
      validateRecordEditorRecord(
        schema,
        workingRecord,
      ),
    [schema, workingRecord],
  );

  const updateField = useCallback(
    (
      fieldKey: string,
      value: RecordEditorValue,
    ) => {
      setWorkingRecord(
        (currentRecord) => {
          const nextRecord:
            RecordEditorRecord = {
              ...currentRecord,
              values: {
                ...currentRecord.values,
              },
            };

          const normalisedValue =
            normaliseFieldValue(
              schema,
              fieldKey,
              value,
              nextRecord,
            );

          nextRecord.values[
            fieldKey
          ] = normalisedValue;

          return nextRecord;
        },
      );
    },
    [schema],
  );

  const resetChanges =
    useCallback(() => {
      setWorkingRecord(
        cloneRecordEditorRecord(
          originalRecord,
        ),
      );
    }, [originalRecord]);

  const replaceRecord =
    useCallback(
      (
        record:
          RecordEditorRecord,
      ) => {
        const clonedRecord =
          cloneRecordEditorRecord(
            record,
          );

        setOriginalRecord(
          clonedRecord,
        );

        setWorkingRecord(
          cloneRecordEditorRecord(
            clonedRecord,
          ),
        );
      },
      [],
    );

  const commitChanges =
    useCallback(
      (
        savedRecord?:
          RecordEditorRecord,
      ) => {
        const recordToCommit =
          savedRecord ??
          workingRecord;

        const clonedRecord =
          cloneRecordEditorRecord(
            recordToCommit,
          );

        setOriginalRecord(
          clonedRecord,
        );

        setWorkingRecord(
          cloneRecordEditorRecord(
            clonedRecord,
          ),
        );
      },
      [workingRecord],
    );

  return {
    originalRecord,
    workingRecord,
    validation,
    isDirty,
    updateField,
    resetChanges,
    replaceRecord,
    commitChanges,
  };
}