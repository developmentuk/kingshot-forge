import type {
  DatasetPublicationStatus,
} from "../../../platform";

interface EditorialStatusBadgeProps {
  status: DatasetPublicationStatus;
}

const labels: Record<
  DatasetPublicationStatus,
  string
> = {
  draft: "Draft",
  in_review: "In review",
  approved: "Approved",
  published: "Published",
  archived: "Archived",
};

export function EditorialStatusBadge({
  status,
}: EditorialStatusBadgeProps) {
  return (
    <span
      className={`editorial-status-badge editorial-status-badge--${status}`}
    >
      {labels[status]}
    </span>
  );
}
