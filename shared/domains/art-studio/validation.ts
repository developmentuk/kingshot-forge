import {
  ART_STUDIO_CATEGORIES,
  type ArtStudioArtworkDraft,
} from "./types.js";

export const ART_STUDIO_VALIDATION_LIMITS = {
  titleCodePoints: 120,
  descriptionCodePoints: 2_000,
  contentCodePoints: 20_000,
  slugCharacters: 80,
  tagCount: 10,
  tagCodePoints: 32,
  attributionCodePoints: 120,
  repeatedCodePoints: 512,
} as const;

export type ArtStudioValidationCode =
  | "required"
  | "too_long"
  | "invalid_category"
  | "invalid_slug"
  | "control_character"
  | "unsafe_invisible_character"
  | "malformed_unicode"
  | "excessive_repetition"
  | "attribution_required"
  | "too_many_tags";

export interface ArtStudioValidationIssue {
  field: keyof ArtStudioArtworkDraft | "tags";
  code: ArtStudioValidationCode;
  message: string;
}

const UNSAFE_INVISIBLE_CHARACTERS =
  /[\u200B\u202A-\u202E\u2060\u2066-\u2069\uFEFF]/u;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

function codePointLength(value: string): number {
  return Array.from(value).length;
}

function hasForbiddenControlCharacter(
  value: string,
): boolean {
  for (const codePoint of value) {
    const number = codePoint.codePointAt(0) ?? 0;
    const isC0 = number <= 0x1f &&
      number !== 0x09 &&
      number !== 0x0a &&
      number !== 0x0d;
    const isDeleteOrC1 = number >= 0x7f && number <= 0x9f;
    if (isC0 || isDeleteOrC1) {
      return true;
    }
  }
  return false;
}

function hasMalformedUnicode(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const unit = value.charCodeAt(index);
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (
        !Number.isInteger(next) ||
        next < 0xdc00 ||
        next > 0xdfff
      ) {
        return true;
      }
      index += 1;
    } else if (unit >= 0xdc00 && unit <= 0xdfff) {
      return true;
    }
  }
  return false;
}

function hasExcessiveRepetition(value: string): boolean {
  let previous = "";
  let run = 0;
  for (const codePoint of value) {
    if (codePoint === previous) {
      run += 1;
    } else {
      previous = codePoint;
      run = 1;
    }
    if (run > ART_STUDIO_VALIDATION_LIMITS.repeatedCodePoints) {
      return true;
    }
  }
  return false;
}

function validateUnicodeText(
  field: ArtStudioValidationIssue["field"],
  value: string,
  maximum: number,
  issues: ArtStudioValidationIssue[],
  options: { required?: boolean; repetition?: boolean } = {},
): void {
  if (options.required && value.trim().length === 0) {
    issues.push({ field, code: "required", message: `${field} is required.` });
  }
  if (codePointLength(value) > maximum) {
    issues.push({ field, code: "too_long", message: `${field} exceeds ${maximum} Unicode code points.` });
  }
  if (hasMalformedUnicode(value)) {
    issues.push({ field, code: "malformed_unicode", message: `${field} contains malformed Unicode.` });
  }
  if (hasForbiddenControlCharacter(value)) {
    issues.push({ field, code: "control_character", message: `${field} contains a forbidden control character.` });
  }
  if (UNSAFE_INVISIBLE_CHARACTERS.test(value)) {
    issues.push({ field, code: "unsafe_invisible_character", message: `${field} contains an unsafe invisible formatting character.` });
  }
  if (options.repetition && hasExcessiveRepetition(value)) {
    issues.push({ field, code: "excessive_repetition", message: `${field} contains an excessive repeated-character run.` });
  }
}

export function validateArtStudioArtworkDraft(
  draft: ArtStudioArtworkDraft,
): ArtStudioValidationIssue[] {
  const issues: ArtStudioValidationIssue[] = [];
  validateUnicodeText("title", draft.title, ART_STUDIO_VALIDATION_LIMITS.titleCodePoints, issues, { required: true });
  validateUnicodeText("description", draft.description, ART_STUDIO_VALIDATION_LIMITS.descriptionCodePoints, issues);
  validateUnicodeText("content", draft.content, ART_STUDIO_VALIDATION_LIMITS.contentCodePoints, issues, { required: true, repetition: true });

  if (!(ART_STUDIO_CATEGORIES as readonly string[]).includes(draft.category)) {
    issues.push({ field: "category", code: "invalid_category", message: "category is not registered for Art Studio." });
  }

  if (
    draft.slug.length > ART_STUDIO_VALIDATION_LIMITS.slugCharacters ||
    !SLUG_PATTERN.test(draft.slug)
  ) {
    issues.push({ field: "slug", code: "invalid_slug", message: "slug must be lowercase kebab-case and no longer than 80 characters." });
  }

  const tags = draft.tags ?? [];
  if (tags.length > ART_STUDIO_VALIDATION_LIMITS.tagCount) {
    issues.push({ field: "tags", code: "too_many_tags", message: `tags cannot contain more than ${ART_STUDIO_VALIDATION_LIMITS.tagCount} values.` });
  }
  for (const tag of tags) {
    validateUnicodeText("tags", tag, ART_STUDIO_VALIDATION_LIMITS.tagCodePoints, issues, { required: true });
  }

  const attribution = draft.attribution.displayName ?? "";
  validateUnicodeText("attribution", attribution, ART_STUDIO_VALIDATION_LIMITS.attributionCodePoints, issues);
  if (draft.attribution.onBehalfOfAnotherCreator && attribution.trim().length === 0) {
    issues.push({ field: "attribution", code: "attribution_required", message: "Creator attribution is required when submitting on behalf of another creator." });
  }

  return issues;
}

export function isValidArtStudioSlug(slug: string): boolean {
  return slug.length <= ART_STUDIO_VALIDATION_LIMITS.slugCharacters &&
    SLUG_PATTERN.test(slug);
}
