import type {
  DatasetPublicationStatus,
  EditorialHistoryEntry,
  EditorialVersionComparison,
  PublicationQueueItem,
  ScheduledPublication,
} from "../../../platform";

import {
  EditorialHistoryPanel,
} from "./EditorialHistoryPanel";
import {
  EditorialWorkflowPanel,
  type EditorialWorkflowAction,
} from "./EditorialWorkflowPanel";
import {
  PublicationOperationsPanel,
} from "./PublicationOperationsPanel";

interface EditorialAdminWorkspaceProps {
  status: DatasetPublicationStatus;
  version: number;
  updatedAt?: string;
  updatedBy?: string;
  historyEntries: EditorialHistoryEntry[];
  comparison?: EditorialVersionComparison;
  queueItems?: PublicationQueueItem[];
  schedules?: ScheduledPublication[];
  allowedActions?: EditorialWorkflowAction[];
  busyAction?: EditorialWorkflowAction | null;
  loadingHistory?: boolean;
  selectedVersionId?: string;
  onWorkflowAction?: (
    action: EditorialWorkflowAction,
  ) => void | Promise<void>;
  onSelectVersion?: (
    versionId: string,
  ) => void;
  onCompareWithCurrent?: (
    versionId: string,
  ) => void;
  onPreviewRollback?: (
    versionId: string,
  ) => void;
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

export function EditorialAdminWorkspace({
  status,
  version,
  updatedAt,
  updatedBy,
  historyEntries,
  comparison,
  queueItems = [],
  schedules = [],
  allowedActions,
  busyAction,
  loadingHistory,
  selectedVersionId,
  onWorkflowAction,
  onSelectVersion,
  onCompareWithCurrent,
  onPreviewRollback,
  onRetryQueueItem,
  onCancelQueueItem,
  onCancelSchedule,
}: EditorialAdminWorkspaceProps) {
  return (
    <div className="editorial-admin-workspace">
      <EditorialWorkflowPanel
        status={status}
        version={version}
        updatedAt={updatedAt}
        updatedBy={updatedBy}
        allowedActions={allowedActions}
        busyAction={busyAction}
        onAction={onWorkflowAction}
      />

      <EditorialHistoryPanel
        entries={historyEntries}
        comparison={comparison}
        loading={loadingHistory}
        selectedVersionId={
          selectedVersionId
        }
        onSelectVersion={
          onSelectVersion
        }
        onCompareWithCurrent={
          onCompareWithCurrent
        }
        onPreviewRollback={
          onPreviewRollback
        }
      />

      <PublicationOperationsPanel
        queueItems={queueItems}
        schedules={schedules}
        onRetryQueueItem={
          onRetryQueueItem
        }
        onCancelQueueItem={
          onCancelQueueItem
        }
        onCancelSchedule={
          onCancelSchedule
        }
      />
    </div>
  );
}
