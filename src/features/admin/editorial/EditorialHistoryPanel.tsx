import type {
  EditorialHistoryEntry,
  EditorialVersionComparison,
} from "../../../platform";

import {
  EditorialStatusBadge,
} from "./EditorialStatusBadge";

interface EditorialHistoryPanelProps {
  entries: EditorialHistoryEntry[];
  selectedVersionId?: string;
  comparison?: EditorialVersionComparison;
  loading?: boolean;
  onSelectVersion?: (
    versionId: string,
  ) => void;
  onCompareWithCurrent?: (
    versionId: string,
  ) => void;
  onPreviewRollback?: (
    versionId: string,
  ) => void;
}

function formatValue(
  value: unknown,
): string {
  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value, null, 2);
}

function formatDate(
  value: string,
): string {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString();
}

export function EditorialHistoryPanel({
  entries,
  selectedVersionId,
  comparison,
  loading = false,
  onSelectVersion,
  onCompareWithCurrent,
  onPreviewRollback,
}: EditorialHistoryPanelProps) {
  return (
    <section className="editorial-admin-card editorial-history-panel">
      <div className="editorial-admin-card__heading">
        <div>
          <p className="editorial-admin-eyebrow">
            Immutable history
          </p>
          <h3>Version history</h3>
        </div>

        <span className="editorial-admin-count">
          {entries.length}
        </span>
      </div>

      {loading ? (
        <p className="editorial-admin-empty">
          Loading version history…
        </p>
      ) : entries.length === 0 ? (
        <p className="editorial-admin-empty">
          No version history is available.
        </p>
      ) : (
        <div className="editorial-history-list">
          {entries.map((entry) => {
            const { version, auditEvent } =
              entry;
            const selected =
              selectedVersionId === version.id;

            return (
              <article
                key={version.id}
                className={`editorial-history-item ${
                  selected
                    ? "editorial-history-item--selected"
                    : ""
                }`}
              >
                <button
                  type="button"
                  className="editorial-history-item__main"
                  onClick={() =>
                    onSelectVersion?.(
                      version.id,
                    )
                  }
                >
                  <span>
                    <strong>
                      Version {version.version}
                    </strong>
                    <EditorialStatusBadge
                      status={version.status}
                    />
                  </span>

                  <small>
                    {formatDate(
                      version.createdAt,
                    )}{" "}
                    · {version.createdBy}
                  </small>

                  {auditEvent?.note && (
                    <p>{auditEvent.note}</p>
                  )}
                </button>

                <div className="editorial-history-item__actions">
                  <button
                    type="button"
                    className="button button--small"
                    onClick={() =>
                      onCompareWithCurrent?.(
                        version.id,
                      )
                    }
                  >
                    Compare
                  </button>

                  {onPreviewRollback && (
                    <button
                      type="button"
                      className="button button--small"
                      onClick={() =>
                        onPreviewRollback(
                          version.id,
                        )
                      }
                    >
                      Rollback preview
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {comparison && (
        <div className="editorial-diff">
          <div className="editorial-diff__heading">
            <h4>
              Version {comparison.fromVersion.version}
              {" → "}
              Version {comparison.toVersion.version}
            </h4>
            <span>
              {comparison.changedFieldCount} change
              {comparison.changedFieldCount === 1
                ? ""
                : "s"}
            </span>
          </div>

          {comparison.changes.length === 0 ? (
            <p className="editorial-admin-empty">
              These versions contain identical values.
            </p>
          ) : (
            <div className="editorial-diff-list">
              {comparison.changes.map(
                (change) => (
                  <article
                    key={`${change.path}-${change.kind}`}
                    className={`editorial-diff-item editorial-diff-item--${change.kind}`}
                  >
                    <div>
                      <strong>{change.path}</strong>
                      <span>{change.kind}</span>
                    </div>

                    <div className="editorial-diff-values">
                      <pre>
                        {formatValue(
                          change.before,
                        )}
                      </pre>
                      <span aria-hidden="true">
                        →
                      </span>
                      <pre>
                        {formatValue(
                          change.after,
                        )}
                      </pre>
                    </div>
                  </article>
                ),
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
