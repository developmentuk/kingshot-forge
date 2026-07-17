import { useEffect } from "react"
import { useParams } from "react-router-dom"
import { trackForgePlayerEvent } from "../../platform/analytics/forgeAnalytics"
import { FeatureDisabledNotice } from "./FeatureDisabledNotice"
import { playerIdentityBrowserFlags, syntheticPlayerIdentityPreview } from "./featureFlags"

export function PublicPlayerIdentityPage() {
  const { publicAlias = "" } = useParams()
  useEffect(() => { trackForgePlayerEvent("public_profile_viewed", { outcome: "route_view" }) }, [])
  if (!playerIdentityBrowserFlags.ui || !playerIdentityBrowserFlags.publicProfiles) return <main className="player-identity player-identity--public"><FeatureDisabledNotice area="Public Player profiles" /></main>
  if (!syntheticPlayerIdentityPreview) return <PublicState title="Profile unavailable" message="Public profiles require approved persistence and an explicitly enabled alias." />
  if (publicAlias === "private-player") return <PublicState title="This profile is private" message="The player has not enabled a public profile." />
  if (publicAlias === "stale-player") return <PublicState title="Profile temporarily unavailable" message="The public projection is stale and has defaulted to hidden." />
  if (publicAlias !== "forge-sentinel") return <PublicState title="Player not found" message="Check the public alias and try again." />
  return (
    <main className="player-identity player-identity--public">
      <header className="player-public-hero"><div className="player-public-hero__avatar" aria-hidden="true">SV</div><div><p className="player-identity__eyebrow">Public Player profile · synthetic preview</p><h1>Sentinel Vale</h1><p>Kingdom 101 · FORGE</p></div></header>
      <section className="player-identity__panel"><p className="player-identity__eyebrow">Selected by this player</p><h2>Hero Showcase</h2><div className="player-showcase"><article><strong>Amadeus</strong><span>User-claimed level 70</span></article><article><strong>Helga</strong><span>User-claimed level 68</span></article></div><p className="player-identity__hint">Progression is user-claimed and is not a canonical Hero fact or ownership verification.</p></section>
      <section className="player-public-privacy"><strong>Privacy-safe projection</strong><p>Only explicitly selected fields are shown. Internal IDs, link records, verification data, support activity, and private membership history are excluded.</p></section>
    </main>
  )
}

function PublicState({ title, message }: { title: string; message: string }) {
  return <main className="player-identity player-identity--public"><section className="player-identity__notice" role="status"><div><p className="player-identity__eyebrow">Player profile</p><h1>{title}</h1><p>{message}</p></div></section></main>
}
