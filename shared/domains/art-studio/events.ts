import type {
  ArtStudioReportCategory,
} from "./types.js";

export type ArtStudioEventName =
  | "ArtworkSubmissionCreated"
  | "ArtworkSubmittedForReview"
  | "ArtworkChangesRequested"
  | "ArtworkApproved"
  | "ArtworkPublished"
  | "ArtworkUnpublished"
  | "ArtworkRejected"
  | "ArtworkLiked"
  | "ArtworkUnliked"
  | "ArtworkReported"
  | "ArtworkRenderingIssueReported"
  | "ArtworkReportResolved";

export interface ArtStudioDomainEvent<
  TName extends ArtStudioEventName = ArtStudioEventName,
  TPayload extends Readonly<Record<string, unknown>> = Readonly<Record<string, unknown>>,
> {
  id: string;
  name: TName;
  aggregateId: string;
  actorUserId: string;
  occurredAt: string;
  schemaVersion: 1;
  payload: TPayload;
}

export interface ArtStudioEventSink {
  append(event: ArtStudioDomainEvent): Promise<void>;
}

export type ArtworkReportedPayload = Readonly<{
  reportId: string;
  category: ArtStudioReportCategory;
}>;

export function createArtStudioDomainEvent<
  TName extends ArtStudioEventName,
  TPayload extends Readonly<Record<string, unknown>>,
>(input: {
  id: string;
  name: TName;
  aggregateId: string;
  actorUserId: string;
  occurredAt: string;
  payload: TPayload;
}): ArtStudioDomainEvent<TName, TPayload> {
  return { ...input, schemaVersion: 1 };
}
