import type {
  PublicationQueueItem,
  ScheduledPublication,
} from "../../../platform";

import {
  runEditorialAction,
} from "./editorialApi";

interface PublicationOperationsPanelProps {
  queueItems: PublicationQueueItem[];
  schedules: ScheduledPublication[];
  onProcessQueueItem?: (
    itemId: string,
  ) => void | Promise<void>;
  onRetryQueueItem?: (
    itemId: string,
  ) => void;
  onCancelQueueItem?: (
    itemId: string,
  ) => void;
  onCancelSchedule?: (
    scheduleId: string,
  ) => void;
}

function formatDate(
  value: string | undefined,
): string {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString();
}

export function PublicationOperationsPanel({
  queueItems,
  schedules,
  onProcessQueueItem,
  onRetryQueueItem,
  onCancelQueueItem,
  onCancelSchedule,
}: PublicationOperationsPanelProps) {
  async function processQueueItem(
    item: PublicationQueueItem,
  ): Promise<void> {
    if (onProcessQueueItem) {
      await onProcessQueueItem(item.id);
      return;
    }

    await runEditorialAction(
      "process_queue",
      {
        datasetId: item.datasetId,
        recordId: item.recordId,
        queueItemId: item.id,
      },
    );

    window.location.reload();
  }

  return (
    <section className="editorial-admin-card">
      <div className="editorial-admin-card__heading">
        <div>
          <p className="editorial-admin-eyebrow">
            Operations
          </p>
          <h3>Publishing activity</h3>
        </div>
      </div>

      <div className="publication-operations-grid">
        <div>
          <h4>Publish queue</h4>

          {queueItems.length === 0 ? (
            <p className="editorial-admin-empty">
              No publication requests.
            </p>
          ) : (
            <div className="publication-operation-list">
              {queueItems.map((item) => (
                <article
                  key={item.id}
                  className="publication-operation-item"
                >
                  <div>
                    <strong>
                      Version {item.expectedVersion}
                    </strong>
                    <span
                      className={`publication-operation-status publication-operation-status--${item.status}`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <small>
                    Requested{" "}
                    {formatDate(item.requestedAt)}
                  </small>

                  {item.failureMessage && (
                    <p>{item.failureMessage}</p>
                  )}

                  <div className="editorial-admin-actions">
                    {item.status === "pending" && (
                      <button
                        type="button"
                        className="button button--small"
                        onClick={() => {
                          void processQueueItem(item);
                        }}
                      >
                        Process now
                      </button>
                    )}

                    {item.status === "failed" && (
                      <button
                        type="button"
                        className="button button--small"
                        onClick={() =>
                          onRetryQueueItem?.(
                            item.id,
                          )
                        }
                      >
                        Retry
                      </button>
                    )}

                    {(item.status === "pending" ||
                      item.status === "failed") && (
                      <button
                        type="button"
                        className="button button--small button--danger"
                        onClick={() =>
                          onCancelQueueItem?.(
                            item.id,
                          )
                        }
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div>
          <h4>Scheduled publishing</h4>

          {schedules.length === 0 ? (
            <p className="editorial-admin-empty">
              No scheduled publications.
            </p>
          ) : (
            <div className="publication-operation-list">
              {schedules.map((schedule) => (
                <article
                  key={schedule.id}
                  className="publication-operation-item"
                >
                  <div>
                    <strong>
                      {formatDate(
                        schedule.scheduledFor,
                      )}
                    </strong>
                    <span
                      className={`publication-operation-status publication-operation-status--${schedule.status}`}
                    >
                      {schedule.status}
                    </span>
                  </div>

                  <small>
                    Version{" "}
                    {
                      schedule.publication
                        .expectedVersion
                    }
                  </small>

                  {schedule.failureMessage && (
                    <p>
                      {schedule.failureMessage}
                    </p>
                  )}

                  {schedule.status ===
                    "scheduled" && (
                    <div className="editorial-admin-actions">
                      <button
                        type="button"
                        className="button button--small button--danger"
                        onClick={() =>
                          onCancelSchedule?.(
                            schedule.id,
                          )
                        }
                      >
                        Cancel schedule
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
