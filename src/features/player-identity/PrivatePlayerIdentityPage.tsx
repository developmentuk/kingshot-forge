import { useEffect, useState, type ReactNode } from "react"
import { trackForgePlayerEvent } from "../../platform/analytics/forgeAnalytics"
import { ActiveCharacterSelector } from "./ActiveCharacterSelector"
import { AliasManager } from "./AliasManager"
import { CharacterCard, type CharacterCardModel } from "./CharacterCard"
import { FeatureDisabledNotice } from "./FeatureDisabledNotice"
import { playerIdentityBrowserFlags, syntheticPlayerIdentityPreview } from "./featureFlags"
import { HeroShowcaseBoundaryPanel } from "./HeroShowcaseBoundaryPanel"
import { VisibilityEditor } from "./VisibilityEditor"

const SYNTHETIC_CHARACTERS: readonly CharacterCardModel[] = [
  { id: "synthetic-character-one", name: "Sentinel Vale", kingdom: "Kingdom 101", alliance: "FORGE", linkStatus: "linked", verificationStatus: "unverified", primary: true, activeEligible: true },
  { id: "synthetic-character-two", name: "Ember Scout", kingdom: "Kingdom 204", alliance: "No public alliance", linkStatus: "disputed", verificationStatus: "pending", primary: false, activeEligible: false },
]

export function PrivatePlayerIdentityPage() {
  const [primary, setPrimary] = useState("synthetic-character-one")
  const [activeForTab, setActiveForTab] = useState("")
  const [announcement, setAnnouncement] = useState("")
  useEffect(() => { trackForgePlayerEvent("player_identity_page_viewed", { surface: "private" }) }, [])

  if (!playerIdentityBrowserFlags.ui) {
    return <PlayerIdentityPageFrame><FeatureDisabledNotice /></PlayerIdentityPageFrame>
  }
  if (!syntheticPlayerIdentityPreview) {
    return <PlayerIdentityPageFrame><section className="player-identity__notice" role="alert"><div><p className="player-identity__eyebrow">Migration required</p><h2>Player persistence is not connected</h2><p>The UI gate is enabled, but the approved replacement schema and production adapter are not available. No data was loaded and no write was attempted.</p></div></section></PlayerIdentityPageFrame>
  }

  function choosePrimary(id: string) {
    setPrimary(id)
    setAnnouncement("Primary Character preview changed. No data was saved.")
    trackForgePlayerEvent("primary_character_changed", { outcome: "preview" })
  }
  function chooseActive(id: string) {
    setActiveForTab(id)
    const character = SYNTHETIC_CHARACTERS.find((candidate) => candidate.id === id)
    const message = character?.activeEligible ? "Active Character selected for requests in this tab." : "Active Character rejected because this link is not eligible."
    setAnnouncement(message)
    trackForgePlayerEvent(character?.activeEligible ? "active_character_selected" : "active_character_rejected", { outcome: character?.activeEligible ? "accepted" : "rejected" })
  }

  return (
    <PlayerIdentityPageFrame>
      <section className="player-identity__summary" aria-labelledby="identity-summary-title">
        <div><p className="player-identity__eyebrow">Private Player profile · synthetic test preview</p><h2 id="identity-summary-title">Your linked identities</h2><p>Forge User and Game Characters remain separate. A link is not proof of ownership.</p></div>
        <div className="player-identity__revision"><span>Identity revision</span><strong>12</strong></div>
      </section>
      <p className="player-identity__live" aria-live="polite">{announcement}</p>
      <div className="player-identity__layout">
        <section className="player-identity__main" aria-labelledby="linked-title">
          <div className="player-identity__section-heading"><div><p className="player-identity__eyebrow">Finite limit · 2 of 4</p><h2 id="linked-title">Linked characters</h2></div><button className="player-identity__button" type="button" onClick={() => { setAnnouncement("Link proposal flow opened. Verification remains unavailable."); trackForgePlayerEvent("linked_character_flow_started") }}>Propose character link</button></div>
          <div className="player-identity__cards">{SYNTHETIC_CHARACTERS.map((character) => <CharacterCard key={character.id} character={character} selectedPrimary={primary === character.id} onPrimaryChange={choosePrimary} onDispute={() => setAnnouncement("Dispute preview opened. No link was changed.")} />)}</div>
          <section className="player-identity__panel"><p className="player-identity__eyebrow">Historical status</p><h2>Link history</h2><div className="player-identity__scroll"><table><thead><tr><th>Character</th><th>Status</th><th>Reason</th><th>Revision</th></tr></thead><tbody><tr><td>Sentinel Vale</td><td>Linked</td><td>Proposal recorded</td><td>10</td></tr><tr><td>Ember Scout</td><td>Disputed</td><td>User dispute</td><td>12</td></tr></tbody></table></div></section>
        </section>
        <aside className="player-identity__side"><ActiveCharacterSelector characters={SYNTHETIC_CHARACTERS} value={activeForTab} onChange={chooseActive} announcement={announcement} /><AliasManager onPropose={() => trackForgePlayerEvent("public_alias_proposed", { outcome: "preview" })} /></aside>
      </div>
      <div className="player-identity__two-column"><VisibilityEditor onSave={() => trackForgePlayerEvent("player_visibility_updated", { outcome: "preview" })} /><HeroShowcaseBoundaryPanel onUpdate={() => { setAnnouncement("Hero Showcase preview changed. No data was saved."); trackForgePlayerEvent("hero_showcase_selection_updated", { outcome: "preview" }) }} /></div>
      <section className="player-identity__panel"><p className="player-identity__eyebrow">Safe audit summary</p><h2>Recent identity activity</h2><ul className="player-identity__timeline"><li><strong>Link disputed</strong><span>Synthetic preview · revision 12</span></li><li><strong>Primary selected</strong><span>Synthetic preview · revision 11</span></li></ul><p className="player-identity__hint">Evidence, support notes, reviewer identities, credentials, and security-sensitive audit data are never included here.</p></section>
    </PlayerIdentityPageFrame>
  )
}

function PlayerIdentityPageFrame({ children }: { children: ReactNode }) {
  return <main className="player-identity"><header className="player-identity__hero"><p className="player-identity__eyebrow">My Forge</p><h1>Player Identity</h1><p>Manage character links, request context, and what you choose to share.</p></header>{children}</main>
}
