import type { TextDiagnostics, RenderProfile } from './rendering.ts'

export type CanonicalFixtureMetadata = {
  fixture_id: string
  title: string
  fixture_version: number
  render_profile: string
  expected_status: string
  notes: string
  text: { filename: string; sha256: string; line_count: number; code_point_count: number; grapheme_count: number; utf16_code_unit_count: number; unicode_statistics: { ordinary_spaces: number; non_breaking_spaces: number; ideographic_spaces: number; tabs: number; emoji: number; full_width_characters: number; combining_marks: number; invisible_characters: number } }
  screenshots: Array<{ label: string; filename: string; sha256: string; width: number; height: number }>
}

export type CanonicalRenderFixture = {
  id: string
  title: string
  text: string
  metadata: CanonicalFixtureMetadata
  screenshots: Record<string, string>
  diagnostics: TextDiagnostics
  profile: RenderProfile
}

export function metadataMatchesDiagnostics(metadata: CanonicalFixtureMetadata, diagnostics: TextDiagnostics) {
  return metadata.text.line_count === diagnostics.lineCount && metadata.text.code_point_count === diagnostics.codePointCount && metadata.text.grapheme_count === diagnostics.graphemeCount && metadata.text.utf16_code_unit_count === diagnostics.utf16Length && metadata.text.unicode_statistics.ordinary_spaces === diagnostics.ordinarySpaces && metadata.text.unicode_statistics.ideographic_spaces === diagnostics.ideographicSpaces && metadata.text.unicode_statistics.emoji === diagnostics.emoji
}
