import type {
  DatasetPublicationStatus,
} from "../../../platform";
import { useState } from "react";

import {
  EditorialStatusBadge,
} from "./EditorialStatusBadge";

export type EditorialWorkflowAction =
  | "submit_for_review"
  | "return_to_draft"
  | "approve"
  | "reject"
  | "publish"
  | "archive"
  | "restore";

interface EditorialWorkflowPanelProps {
  status: DatasetPublicationStatus;
  version: number;
  updatedAt?: string;
  updatedBy?: string;
  disabled?: boolean;
  allowedActions?: EditorialWorkflowAction[];
  busyAction?: EditorialWorkflowAction | null;
  onAction?: (
    action: EditorialWorkflowAction,
    note?: string,
  ) => void | Promise<void>;
}

const actionLabels: Record<
  EditorialWorkflowAction,
  string
> = {
  submit_for_review: "Submit for review",
  return_to_draft: "Return to draft",
  approve: "Approve",
  reject: "Request changes",
  publish: "Publish",
  archive: "Archive",
  restore: "Restore",
};

const statusActions: Record<
  DatasetPublicationStatus,
  EditorialWorkflowAction[]
> = {
  draft: ["submit_for_review"],
  in_review: [
    "return_to_draft",
    "reject",
    "approve",
  ],
  approved: [
    "return_to_draft",
    "publish",
  ],
  published: [
    "return_to_draft",
    "archive",
  ],
  archived: ["restore"],
};

function getActionLabel(
  action: EditorialWorkflowAction,
  status: DatasetPublicationStatus,
): string {
  if (
    action === "return_to_draft" &&
    status === "published"
  ) {
    return "Create editable draft";
  }

  return actionLabels[action];
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

export function EditorialWorkflowPanel({
  status,
  version,
  updatedAt,
  updatedBy,
  disabled = false,
  allowedActions,
  busyAction = null,
  onAction,
}: EditorialWorkflowPanelProps) {
  const [note, setNote] = useState("");
  const availableActions =
    statusActions[status].filter((action) =>
      allowedActions
        ? allowedActions.includes(action)
        : true,
    );
  const canCreateEditableDraft =
    status === "published" &&
    availableActions.includes("return_to_draft");

  return (
    <section className="editorial-admin-card">
      <div className="editorial-admin-card__heading">
        <div>
          <p className="editorial-admin-eyebrow">
            Publication workflow
          </p>
          <h3>Editorial status</h3>
        </div>

        <EditorialStatusBadge
          status={status}
        />
      </div>

      <dl className="editorial-admin-meta">
        <div>
          <dt>Current version</dt>
          <dd>v{version}</dd>
        </div>
        <div>
          <dt>Last updated</dt>
          <dd>{formatDate(updatedAt)}</dd>
        </div>
        <div>
          <dt>Updated by</dt>
          <dd>{updatedBy || "Unknown"}</dd>
        </div>
      </dl>

      {availableActions.length > 0 ? (
        <>
          {canCreateEditableDraft && (
            <p className="editorial-admin-empty">
              Create a new draft from the live version to make changes. The current public version remains live until the replacement is approved and published.
            </p>
          )}
          <label className="editorial-review-note">
            Reviewer comment
            <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add context, evidence or approval rationale. It is stored in immutable audit history." rows={3} />
          </label>
          <div className="editorial-admin-actions">
          {availableActions.map((action) => (
            <button
              key={action}
              type="button"
              className={`button ${
                action === "reject" ||
                action === "archive"
                  ? "button--danger"
                  : ""
              }`}
              disabled={
                disabled ||
                busyAction !== null
              }
              onClick={() => {
                void onAction?.(action, note.trim());
              }}
            >
              {busyAction === action
                ? "Working…"
                : getActionLabel(action, status)}
            </button>
          ))}
          </div>
        </>
      ) : (
        <p className="editorial-admin-empty">
          No workflow actions are available for
          your role at this stage.
        </p>
      )}
    </section>
  );
}
