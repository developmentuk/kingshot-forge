import type {
  CompanionItemRecord,
  CompanionItemRelationship,
} from "../../../shared/companion/itemProjection";

import type {
  DatasetLoadResult,
} from "./dataEngineApi";

import type {
  DatasetBrowserDefinition,
} from "./datasetBrowserTypes";

import {
  createRowsFromRecords,
  isRecordObject,
  type DatasetAdapter,
} from "./datasetAdapters";

function asItemRecord(
  value: unknown,
): CompanionItemRecord | null {
  return isRecordObject(value)
    ? value as unknown as CompanionItemRecord
    : null;
}

function formatAliases(
  item: CompanionItemRecord,
): string {
  const canonicalAliases = item.aliases.length > 0
    ? item.aliases.join(", ")
    : "None";
  const searchAliases = item.search_aliases.length > 0
    ? item.search_aliases.join(", ")
    : "None";

  return `Canonical: ${canonicalAliases}; Search-only: ${searchAliases}`;
}

function formatRelationships(
  relationships: readonly CompanionItemRelationship[],
): string {
  if (relationships.length === 0) {
    return "None published";
  }

  return relationships
    .map((relationship) => (
      `${relationship.availability}: ${relationship.type} → ${relationship.label} (${relationship.targetForgeId})`
    ))
    .join("; ");
}

function mediaState(item: CompanionItemRecord): string {
  return item.image_url
    ? "Published governed media"
    : "No published media";
}

function mediaDimensions(item: CompanionItemRecord): string {
  if (item.media_width === null || item.media_height === null) {
    return "Not available";
  }

  return `${item.media_width} × ${item.media_height}`;
}

export const itemsDatasetAdapter: DatasetAdapter = {
  datasetId: "items",

  createBrowserDefinition(
    result: DatasetLoadResult,
  ): DatasetBrowserDefinition {
    const records = result.records
      .map(asItemRecord)
      .filter((item): item is CompanionItemRecord => item !== null);

    const rows = createRowsFromRecords(
      records,
      (value) => {
        const item = value as unknown as CompanionItemRecord;
        const researchState = item.trust_state === "research_needed"
          ? "Research needed"
          : "No separate research flag";

        return {
          id: item.key,
          values: {
            name: item.name,
            key: item.key,
            forgeId: item.forge_id,
            aliases: formatAliases(item),
            category: item.category_label,
            trustState: item.trust_label,
            researchState,
            summary: item.summary,
            source: `${item.source_name} — ${item.source_reference}`,
            sourceUpdatedAt: item.source_updated_at,
            verification: item.verification_note,
            confidence: item.confidence_label,
            rights: item.rights_status,
            rightsNote: item.rights_note,
            mediaState: mediaState(item),
            mediaRole: item.media_role ?? "No media role",
            mediaPath: item.image_url ?? "No published media",
            plannedMediaPath: item.planned_media_path ?? "No planned media path",
            mediaChecksum: item.media_sha256 ?? "No checksum",
            mediaDimensions: mediaDimensions(item),
            relationships: formatRelationships(item.companion_relationships),
            playerRoute: item.canonical_url,
          },
        };
      },
    );

    return {
      datasetId: "items",
      rows,
      columns: [
        { key: "name", label: "Item", sortable: true, width: "220px" },
        { key: "key", label: "Immutable key", sortable: true, width: "170px" },
        { key: "forgeId", label: "Forge ID", sortable: true, width: "170px" },
        { key: "aliases", label: "Aliases", sortable: true, width: "250px" },
        { key: "category", label: "Category", sortable: true, width: "170px" },
        { key: "trustState", label: "Trust", sortable: true, width: "130px" },
        { key: "researchState", label: "Research", sortable: true, width: "170px" },
        { key: "summary", label: "Summary", sortable: true, width: "360px" },
        { key: "source", label: "Source", sortable: true, width: "260px" },
        { key: "sourceUpdatedAt", label: "Source updated", sortable: true, width: "150px" },
        { key: "verification", label: "Verification", sortable: true, width: "360px" },
        { key: "mediaState", label: "Media state", sortable: true, width: "170px" },
        { key: "mediaRole", label: "Media role", sortable: true, width: "140px" },
        { key: "confidence", label: "Confidence", sortable: true, width: "220px" },
        { key: "rights", label: "Rights", sortable: true, width: "240px" },
        { key: "rightsNote", label: "Rights note", sortable: true, width: "360px" },
        { key: "mediaPath", label: "Published media path", sortable: true, width: "300px" },
        { key: "plannedMediaPath", label: "Planned media path", sortable: true, width: "300px" },
        { key: "mediaChecksum", label: "Media SHA-256", sortable: true, width: "360px" },
        { key: "mediaDimensions", label: "Media dimensions", sortable: true, width: "160px" },
        { key: "relationships", label: "Relationships", sortable: true, width: "420px" },
        { key: "playerRoute", label: "Player route", sortable: true, width: "260px" },
      ],
      filters: [
        {
          key: "category",
          label: "Category",
          options: [...new Set(rows
            .map((row) => row.values.category)
            .filter((value): value is string => typeof value === "string"))]
            .sort()
            .map((value) => ({ value, label: value })),
        },
        {
          key: "trustState",
          label: "Trust state",
          options: [...new Set(rows
            .map((row) => row.values.trustState)
            .filter((value): value is string => typeof value === "string"))]
            .sort()
            .map((value) => ({ value, label: value })),
        },
        {
          key: "mediaState",
          label: "Media state",
          options: [...new Set(rows
            .map((row) => row.values.mediaState)
            .filter((value): value is string => typeof value === "string"))]
            .sort()
            .map((value) => ({ value, label: value })),
        },
        {
          key: "mediaRole",
          label: "Media role",
          options: [...new Set(rows
            .map((row) => row.values.mediaRole)
            .filter((value): value is string => typeof value === "string"))]
            .sort()
            .map((value) => ({ value, label: value })),
        },
      ],
    };
  },
};
