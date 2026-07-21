import type { TextDiagnostics, RenderProfile } from './rendering.ts'

export type CanonicalFixtureMetadata = {
  fixture_id: string
  title: string
  fixture_version: number
  render_profile: string
  expected_status: string
  notes: string
  text: { filename: string; sha256: string; line_count: number; code_point_count: number; utf16_code_unit_count: number }
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
  return metadata.text.line_count === diagnostics.lineCount && metadata.text.code_point_count === diagnostics.codePointCount && metadata.text.utf16_code_unit_count === diagnostics.utf16Length
}
