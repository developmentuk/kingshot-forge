export const ART_STUDIO_ARTWORK_STATUSES = [
  "draft",
  "submitted",
  "changes_requested",
  "approved",
  "published",
  "unpublished",
  "rejected",
  "archived",
] as const;

export type ArtStudioArtworkStatus =
  (typeof ART_STUDIO_ARTWORK_STATUSES)[number];

export const ART_STUDIO_REPORT_STATUSES = [
  "open",
  "reviewing",
  "resolved",
  "dismissed",
] as const;

export type ArtStudioReportStatus =
  (typeof ART_STUDIO_REPORT_STATUSES)[number];

export const ART_STUDIO_REPORT_CATEGORIES = [
  "rendering_issue",
  "offensive_abusive",
  "copyright_ownership",
  "misleading_misclassified",
  "other",
] as const;

export type ArtStudioReportCategory =
  (typeof ART_STUDIO_REPORT_CATEGORIES)[number];

export const ART_STUDIO_CATEGORIES = [
  "Cats",
  "Animals",
  "Characters",
  "Announcements",
  "Battle",
  "KvK",
  "Alliance",
  "Flags",
  "Pixel Art",
  "Nature",
  "Funny",
  "Gaming",
  "Seasonal",
  "Other",
] as const;

export type ArtStudioCategory =
  (typeof ART_STUDIO_CATEGORIES)[number];

export const ART_STUDIO_CAPABILITIES = [
  "contributions.submit",
  "moderation.manage",
  "cms.publish",
] as const;

export type ArtStudioCapability =
  (typeof ART_STUDIO_CAPABILITIES)[number];

export interface ArtStudioActor {
  userId: string;
}

export interface ArtStudioAttribution {
  onBehalfOfAnotherCreator: boolean;
  displayName?: string | null;
}

export interface ArtStudioArtworkDraft {
  title: string;
  description: string;
  content: string;
  category: ArtStudioCategory;
  tags?: string[];
  slug: string;
  attribution: ArtStudioAttribution;
}

export interface ArtStudioPublicArtwork {
  slug: string;
  title: string;
  description: string;
  content: string;
  category: ArtStudioCategory;
  tags: string[];
  creatorAttribution: string | null;
  likeCount: number;
  publishedAt: string;
  updatedAt: string;
}

export interface ArtStudioArtworkReference {
  artworkId: string;
  ownerUserId: string;
  revisionId: string;
  version: number;
  status: ArtStudioArtworkStatus;
}

export interface ArtStudioSubmissionReference {
  submissionId: string;
  artworkId: string;
  revisionId: string;
  version: number;
  status: ArtStudioArtworkStatus;
}
