import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import DashboardCard from '../components/dashboard/DashboardCard'
import ForgeProgressPanel, { ForgeGlyph } from '../components/ForgeProgressPanel'
import { clearRecentNames, loadRecentNames, RECENT_NAMES_UPDATED_EVENT } from '../data/recentNames'

const NAME_FAVOURITES_KEY = 'kingshot-forge-name-favourites'
const ART_FAVOURITES_KEY = 'kingshot-forge-art-favourites'

function loadStoredCount(key: string) {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) ?? '[]')
    return Array.isArray(value) ? value.length : 0
  } catch {
    return 0
  }
}

export default function MyForgePage() {
  const [nameCount, setNameCount] = useState(() => loadStoredCount(NAME_FAVOURITES_KEY))
  const [artCount, setArtCount] = useState(() => loadStoredCount(ART_FAVOURITES_KEY))
  const [recentCount, setRecentCount] = useState(() => loadRecentNames().length)

  useEffect(() => {
    const refreshLibrary = () => {
      setNameCount(loadStoredCount(NAME_FAVOURITES_KEY))
      setArtCount(loadStoredCount(ART_FAVOURITES_KEY))
      setRecentCount(loadRecentNames().length)
    }
    window.addEventListener(RECENT_NAMES_UPDATED_EVENT, refreshLibrary)
    window.addEventListener('storage', refreshLibrary)
    window.addEventListener('focus', refreshLibrary)
    return () => {
      window.removeEventListener(RECENT_NAMES_UPDATED_EVENT, refreshLibrary)
      window.removeEventListener('storage', refreshLibrary)
      window.removeEventListener('focus', refreshLibrary)
    }
  }, [])

  const totalSaved = nameCount + artCount + recentCount

  return <main className="section page-section my-forge-landing">
    <header className="section-heading"><p className="eyebrow">My Forge</p><h1 className="page-title">Your Forge home</h1><p>Open your Passport, track progress, or jump straight to a player tool.</p></header>
    <DashboardCard title="Player Headquarters" subtitle="A quick view of your linked player and required Forge progress." icon="⭐" accent="gold"><ForgeProgressPanel compact /></DashboardCard>
    <DashboardCard title="Player tools" subtitle="Open a focused player surface." icon="🧭" accent="blue"><div className="my-forge-shortcuts">
      <ToolCard to="/my-forge/player-identity" icon="passport" title="Player Passport" copy="Your full player record" />
      <ToolCard to="/my-forge/profile" icon="link" title="Edit Passport" copy="Update your player fields" />
      <ToolCard to="/my-forge/progression" icon="progress" title="Personal Progression" copy="Track saved snapshots" />
      <ToolCard to="/my-forge/heroes" icon="hero" title="Hero Showcase" copy="Curate six featured heroes" />
      <ToolCard to="/my-forge/transfer-profile" icon="transfer" title="Transfer Profile" copy="Optional transfer planning" badge="Optional" />
    </div></DashboardCard>
    <DashboardCard title="Forge Library" subtitle="Saved locally on this device." icon="📚" accent="green"><div className="my-forge-summary"><div><strong>{nameCount}</strong><span>Favourite name styles</span></div><div><strong>{artCount}</strong><span>Favourite artwork</span></div><div><strong>{recentCount}</strong><span>Recent names</span></div><div><strong>{totalSaved}</strong><span>Total saved items</span></div></div><div className="my-forge-library-actions"><Link className="button button--secondary" to="/name-studio">Open Name Studio</Link><Link className="button button--secondary" to="/art-studio">Open Art Studio</Link><button className="button button--secondary" type="button" onClick={() => { clearRecentNames(); setRecentCount(0) }}>Clear recent names</button></div></DashboardCard>
  </main>
}

function ToolCard({ to, icon, title, copy, badge }: { to: string; icon: 'link' | 'passport' | 'hero' | 'progress' | 'transfer'; title: string; copy: string; badge?: string }) {
  return <Link className="my-forge-tool" to={to}><span className="my-forge-tool__visual"><ForgeGlyph name={icon} size={34} /></span><span className="my-forge-tool__body"><strong>{title}</strong><span>{copy}</span></span>{badge ? <span className="my-forge-tool__badge">{badge}</span> : <span className="my-forge-tool__arrow" aria-hidden="true">↗</span>}</Link>
}
