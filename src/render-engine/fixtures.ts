import metadataRaw from '../../fixtures/community-art/wow-im-so-cute/metadata.json?raw'
import sourceText from '../../fixtures/community-art/wow-im-so-cute/wow-im-so-cute.txt?raw'
import chatScreenshot from '../../fixtures/community-art/wow-im-so-cute/kingshot-reference-chat.png?url'
import gameScreenshot from '../../fixtures/community-art/wow-im-so-cute/kingshot-reference-game.png?url'
import { analyseText, RENDER_PROFILES } from '../../shared/domains/art-studio/rendering.ts'
import type { CanonicalFixtureMetadata, CanonicalRenderFixture } from '../../shared/domains/art-studio/fixtureContracts.ts'

const metadata = JSON.parse(metadataRaw) as CanonicalFixtureMetadata
export const CANONICAL_RENDER_FIXTURES: CanonicalRenderFixture[] = [{
  id: metadata.fixture_id,
  title: metadata.title,
  text: sourceText,
  metadata,
  screenshots: { chat: chatScreenshot, game: gameScreenshot },
  diagnostics: analyseText(sourceText, RENDER_PROFILES[metadata.render_profile] ?? RENDER_PROFILES['kingshot-chat']),
  profile: RENDER_PROFILES[metadata.render_profile] ?? RENDER_PROFILES['kingshot-chat'],
}]

export function getCanonicalFixture(id = CANONICAL_RENDER_FIXTURES[0].id) {
  return CANONICAL_RENDER_FIXTURES.find((fixture) => fixture.id === id) ?? CANONICAL_RENDER_FIXTURES[0]
}
