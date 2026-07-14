import {
  bulkUpsertHeroes,
  deactivateMissingHeroes,
  getAllHeroes,
  type HeroUpsertInput,
} from "../repositories/heroRepository";

import type { Hero } from "../types/hero";

import {
  countPreviewChanges,
  type ImportExecutionResult,
  type ImportPreview,
  type ImportRecordResult,
  type Importer,
} from "./baseImporter";

import {
  normaliseHeroSourceRecord,
  parseHeroSourcePayload,
  validateHeroSourceRecord,
  type HeroSourceMetadata,
  type HeroSourceRecord,
} from "./heroSource";

export interface HeroImporterOptions {
  sourceUrl: string;
  sourceName?: string;
}

function normaliseNullableString(
  value: string | null | undefined,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed || null;
}

function normaliseTags(
  tags: string[] | null | undefined,
): string[] {
  return [...(tags ?? [])]
    .map((tag) => tag.trim())
    .filter(Boolean)
    .sort((first, second) =>
      first.localeCompare(second),
    );
}

function heroMatchesImport(
  existingHero: Hero,
  importedHero: HeroUpsertInput,
): boolean {
  return (
    existingHero.name === importedHero.name &&
    existingHero.slug === importedHero.slug &&
    existingHero.generation ===
      importedHero.generation &&
    existingHero.troop_type ===
      importedHero.troop_type &&
    existingHero.rarity === importedHero.rarity &&
    normaliseNullableString(
      existingHero.portrait_url,
    ) ===
      normaliseNullableString(
        importedHero.portrait_url,
      ) &&
    normaliseNullableString(
      existingHero.description,
    ) ===
      normaliseNullableString(
        importedHero.description,
      ) &&
    normaliseNullableString(
      existingHero.rally_tier,
    ) ===
      normaliseNullableString(
        importedHero.rally_tier,
      ) &&
    normaliseNullableString(
      existingHero.garrison_tier,
    ) ===
      normaliseNullableString(
        importedHero.garrison_tier,
      ) &&
    normaliseNullableString(
      existingHero.bear_tier,
    ) ===
      normaliseNullableString(
        importedHero.bear_tier,
      ) &&
    normaliseNullableString(
      existingHero.joiner_tier,
    ) ===
      normaliseNullableString(
        importedHero.joiner_tier,
      ) &&
    existingHero.is_f2p === importedHero.is_f2p &&
    existingHero.is_vip === importedHero.is_vip &&
    normaliseNullableString(
      existingHero.best_use,
    ) ===
      normaliseNullableString(
        importedHero.best_use,
      ) &&
    JSON.stringify(
      normaliseTags(existingHero.tags),
    ) ===
      JSON.stringify(
        normaliseTags(importedHero.tags),
      ) &&
    existingHero.is_active ===
      importedHero.is_active &&
    normaliseNullableString(
      existingHero.source_updated_at,
    ) ===
      normaliseNullableString(
        importedHero.source_updated_at,
      ) &&
    normaliseNullableString(
      existingHero.source_verified,
    ) ===
      normaliseNullableString(
        importedHero.source_verified,
      ) &&
    existingHero.source_accuracy_score ===
      importedHero.source_accuracy_score &&
    normaliseNullableString(
      existingHero.source_name,
    ) ===
      normaliseNullableString(
        importedHero.source_name,
      ) &&
    normaliseNullableString(
      existingHero.source_url,
    ) ===
      normaliseNullableString(
        importedHero.source_url,
      )
  );
}

export class HeroImporter
  implements
    Importer<HeroSourceRecord, HeroUpsertInput>
{
  readonly dataset = "heroes";
  readonly sourceName: string;
  readonly sourceUrl: string;

  private sourceMetadata?: HeroSourceMetadata;

  constructor(options: HeroImporterOptions) {
    this.sourceUrl = options.sourceUrl;
    this.sourceName =
      options.sourceName ?? "Kingshot.net";
  }

  async fetchSource(): Promise<
    HeroSourceRecord[]
  > {
    const response = await fetch(this.sourceUrl, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Hero source request failed with status ${response.status}.`,
      );
    }

    const payload: unknown = await response.json();

    const parsed = parseHeroSourcePayload(payload);

    this.sourceMetadata = {
      ...parsed.metadata,
      sourceName:
        parsed.metadata?.sourceName ??
        this.sourceName,
      sourceUrl:
        parsed.metadata?.sourceUrl ??
        this.sourceUrl,
    };

    return parsed.heroes;
  }

  validateSourceRecord(record: HeroSourceRecord) {
    return validateHeroSourceRecord(record);
  }

  normaliseSourceRecord(
    record: HeroSourceRecord,
  ): HeroUpsertInput {
    return normaliseHeroSourceRecord(
      record,
      this.sourceMetadata,
    );
  }

  getRecordKey(
    record: HeroUpsertInput,
  ): string {
    return record.slug;
  }

  async preview(): Promise<
    ImportPreview<HeroUpsertInput>
  > {
    const fetchedAt = new Date().toISOString();

    const [sourceRecords, existingHeroes] =
      await Promise.all([
        this.fetchSource(),
        getAllHeroes(),
      ]);

    if (sourceRecords.length === 0) {
      throw new Error(
        "The hero source returned no records. Import preview has been stopped.",
      );
    }

    const existingBySlug = new Map(
      existingHeroes.map((hero) => [
        hero.slug,
        hero,
      ]),
    );

    const sourceSlugs = new Set<string>();

    const records: ImportRecordResult<HeroUpsertInput>[] =
      sourceRecords.map((sourceRecord, index) => {
        const validationIssues =
          this.validateSourceRecord(sourceRecord);

        if (validationIssues.length > 0) {
          const sourceName =
            typeof sourceRecord.name === "string"
              ? sourceRecord.name
              : `Source record ${index + 1}`;

          return {
            key: sourceName,
            changeType: "invalid",
            sourceRecord,
            normalisedRecord: null,
            validationIssues,
          };
        }

        try {
          const normalisedRecord =
            this.normaliseSourceRecord(sourceRecord);

          const key = this.getRecordKey(
            normalisedRecord,
          );

          if (sourceSlugs.has(key)) {
            return {
              key,
              changeType: "invalid",
              sourceRecord,
              normalisedRecord: null,
              validationIssues: [
                {
                  field: "slug",
                  message:
                    "The source contains more than one hero with this slug.",
                },
              ],
            };
          }

          sourceSlugs.add(key);

          const existingHero =
            existingBySlug.get(key);

          if (!existingHero) {
            return {
              key,
              changeType: "created",
              sourceRecord,
              normalisedRecord,
              validationIssues: [],
            };
          }

          return {
            key,
            changeType: heroMatchesImport(
              existingHero,
              normalisedRecord,
            )
              ? "unchanged"
              : "updated",
            sourceRecord,
            normalisedRecord,
            validationIssues: [],
          };
        } catch (error) {
          return {
            key: `Source record ${index + 1}`,
            changeType: "invalid",
            sourceRecord,
            normalisedRecord: null,
            validationIssues: [
              {
                message:
                  error instanceof Error
                    ? error.message
                    : "Hero normalisation failed.",
              },
            ],
          };
        }
      });

    for (const existingHero of existingHeroes) {
      if (
        existingHero.is_active &&
        !sourceSlugs.has(existingHero.slug)
      ) {
        records.push({
          key: existingHero.slug,
          changeType: "deactivated",
          sourceRecord: null,
          normalisedRecord: null,
          validationIssues: [],
        });
      }
    }

    const counts = countPreviewChanges(records);

    return {
      dataset: this.dataset,
      sourceName: this.sourceName,
      sourceUrl: this.sourceUrl,
      fetchedAt,

      totalSourceRecords: sourceRecords.length,

      ...counts,

      records,
    };
  }

  async execute(
    preview: ImportPreview<HeroUpsertInput>,
  ): Promise<ImportExecutionResult> {
    const startedAt = new Date().toISOString();

    if (preview.dataset !== this.dataset) {
      throw new Error(
        `Cannot execute a "${preview.dataset}" preview using the hero importer.`,
      );
    }

    if (preview.invalidCount > 0) {
      throw new Error(
        `Import stopped because ${preview.invalidCount} source record(s) are invalid.`,
      );
    }

    if (preview.totalSourceRecords === 0) {
      throw new Error(
        "Import stopped because the preview contains no source records.",
      );
    }

    const recordsToUpsert = preview.records
      .filter(
        (record) =>
          record.changeType === "created" ||
          record.changeType === "updated",
      )
      .map((record) => record.normalisedRecord)
      .filter(
        (
          record,
        ): record is HeroUpsertInput =>
          record !== null,
      );

    const activeSlugs = preview.records
      .filter(
        (record) =>
          record.normalisedRecord !== null,
      )
      .map(
        (record) =>
          record.normalisedRecord!.slug,
      );

    await bulkUpsertHeroes(recordsToUpsert);

    const deactivatedCount =
      await deactivateMissingHeroes(activeSlugs);

    const completedAt = new Date().toISOString();

    return {
      dataset: this.dataset,
      startedAt,
      completedAt,

      createdCount: preview.createdCount,
      updatedCount: preview.updatedCount,
      unchangedCount: preview.unchangedCount,
      deactivatedCount,
      invalidCount: preview.invalidCount,

      success: true,
      message:
        `Hero synchronisation completed. ` +
        `${preview.createdCount} created, ` +
        `${preview.updatedCount} updated, ` +
        `${preview.unchangedCount} unchanged and ` +
        `${deactivatedCount} deactivated.`,
    };
  }
}