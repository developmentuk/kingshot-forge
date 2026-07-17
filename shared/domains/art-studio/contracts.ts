import type {
  ArtStudioEventSink,
} from "./events.js";
import type {
  ArtStudioRateLimiter,
} from "./rateLimits.js";
import type {
  ArtStudioActor,
  ArtStudioArtworkDraft,
  ArtStudioArtworkReference,
  ArtStudioCapability,
  ArtStudioPublicArtwork,
  ArtStudioReportCategory,
  ArtStudioSubmissionReference,
} from "./types.js";

export interface ArtStudioCapabilityResolver {
  hasCapability(
    actor: ArtStudioActor,
    capability: ArtStudioCapability,
  ): Promise<boolean>;
}

export interface ArtStudioRepository {
  getArtworkById(artworkId: string): Promise<ArtStudioArtworkReference | null>;
  getPublicArtworkBySlug(slug: string): Promise<ArtStudioPublicArtwork | null>;
  listSubmissionsForOwner(ownerUserId: string): Promise<ArtStudioSubmissionReference[]>;
  getSubmissionForOwner(submissionId: string, ownerUserId: string): Promise<ArtStudioSubmissionReference | null>;
}

export interface ArtStudioCommunityService {
  createSubmission(input: { actor: ArtStudioActor; draft: ArtStudioArtworkDraft }): Promise<ArtStudioSubmissionReference>;
  updateDraft(input: { actor: ArtStudioActor; artworkId: string; expectedVersion: number; draft: ArtStudioArtworkDraft }): Promise<ArtStudioSubmissionReference>;
  submitForReview(input: { actor: ArtStudioActor; artworkId: string; revisionId: string; expectedVersion: number }): Promise<ArtStudioSubmissionReference>;
  withdrawSubmission(input: { actor: ArtStudioActor; artworkId: string; expectedVersion: number }): Promise<ArtStudioSubmissionReference>;
  listMySubmissions(actor: ArtStudioActor): Promise<ArtStudioSubmissionReference[]>;
  readMySubmissionStatus(input: { actor: ArtStudioActor; submissionId: string }): Promise<ArtStudioSubmissionReference>;
  likeArtwork(input: { actor: ArtStudioActor; artworkId: string }): Promise<void>;
  unlikeArtwork(input: { actor: ArtStudioActor; artworkId: string }): Promise<void>;
  reportArtwork(input: { actor: ArtStudioActor; artworkId: string; category: ArtStudioReportCategory; details: string }): Promise<{ reportId: string }>;
  reportRenderingFailure(input: { actor: ArtStudioActor; artworkId: string; details: string }): Promise<{ reportId: string }>;
}

export interface ArtStudioModerationService {
  listModerationQueue(input: { actor: ArtStudioActor; cursor?: string }): Promise<{ submissions: ArtStudioSubmissionReference[]; nextCursor: string | null }>;
  requestChanges(input: { actor: ArtStudioActor; artworkId: string; expectedVersion: number; note: string }): Promise<ArtStudioSubmissionReference>;
  approve(input: { actor: ArtStudioActor; artworkId: string; revisionId: string; expectedVersion: number; note?: string }): Promise<ArtStudioSubmissionReference>;
  reject(input: { actor: ArtStudioActor; artworkId: string; expectedVersion: number; note: string }): Promise<ArtStudioSubmissionReference>;
  publish(input: { actor: ArtStudioActor; artworkId: string; revisionId: string; expectedVersion: number }): Promise<ArtStudioPublicArtwork>;
  unpublish(input: { actor: ArtStudioActor; artworkId: string; expectedVersion: number; note: string }): Promise<void>;
  resolveReport(input: { actor: ArtStudioActor; reportId: string; expectedVersion: number; resolution: string }): Promise<void>;
  dismissReport(input: { actor: ArtStudioActor; reportId: string; expectedVersion: number; resolution: string }): Promise<void>;
}

export interface ArtStudioEndpointDependencies {
  repository: ArtStudioRepository;
  capabilities: ArtStudioCapabilityResolver;
  rateLimiter: ArtStudioRateLimiter;
  events: ArtStudioEventSink;
}
