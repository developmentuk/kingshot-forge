import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getPublicPlayerProfile, type PublicPlayerProfile } from '../services/playerProfileService'
import { getPublicProgression, type PlayerProgressionSnapshot } from '../services/playerProgressionService'

const formatNumber = (value:number|null) => value === null ? '—' : value.toLocaleString('en-GB')

export default function PublicPlayerProgressionPage() {
  const { forgeId } = useParams<{forgeId:string}>()
  const [profile,setProfile] = useState<PublicPlayerProfile|null>(null)
  const [snapshots,setSnapshots] = useState<PlayerProgressionSnapshot[]>([])
  const [loading,setLoading] = useState(true)
  const [error,setError] = useState('')

  useEffect(()=>{let cancelled=false;async function load(){if(!forgeId){setError('No Forge ID was provided.');setLoading(false);return}try{const player=await getPublicPlayerProfile(forgeId);if(!player){if(!cancelled)setProfile(null);return}const history=await getPublicProgression(player.playerAccountId);if(!cancelled){setProfile(player);setSnapshots(history)}}catch(caught){if(!cancelled)setError(caught instanceof Error?caught.message:'Progression could not be loaded.')}finally{if(!cancelled)setLoading(false)}}void load();return()=>{cancelled=true}},[forgeId])

  if(loading)return <main className="player-domain-state"><h1>Loading player progression…</h1></main>
  if(error)return <main className="player-domain-state"><h1>Progression unavailable</h1><p>{error}</p></main>
  if(!profile)return <main className="player-domain-state"><h1>Profile not found</h1><p>This player has not published a Forge profile.</p></main>

  const latest=snapshots[0]
  return <main className="player-progression-page">
    <header className="player-domain-hero"><div><p className="eyebrow">Public player profile</p><h1>{profile.playerName}'s progression</h1><p>Only snapshots the player has chosen to share are shown.</p></div><div className="player-domain-actions"><Link className="button button--secondary" to={`/player/${encodeURIComponent(profile.forgeId)}`}>Profile overview</Link><Link className="button button--secondary" to="/companion/heroes">Hero Companion</Link></div></header>
    {latest&&<section className="player-progress-summary"><article><span>Current power</span><strong>{formatNumber(latest.currentPower)}</strong></article><article><span>Town Center</span><strong>{latest.townCenterLevel??'—'}</strong></article><article><span>Truegold</span><strong>{latest.truegoldLevel??'—'}</strong></article><article><span>VIP</span><strong>{latest.vipLevel??'—'}</strong></article></section>}
    <section className="player-domain-card"><div><p className="eyebrow">Shared history</p><h2>Progression snapshots</h2></div>{snapshots.length===0?<p>This player has not shared any progression snapshots yet.</p>:<div className="player-snapshot-list">{snapshots.map(snapshot=><article key={snapshot.id}><div><strong>{new Date(snapshot.recordedAt).toLocaleDateString('en-GB')}</strong><span>Shared</span></div><p>{formatNumber(snapshot.currentPower)} power · Infantry T{snapshot.infantryTier??'—'} · Lancer T{snapshot.lancerTier??'—'} · Marksman T{snapshot.marksmanTier??'—'}</p>{snapshot.notes&&<small>{snapshot.notes}</small>}</article>)}</div>}</section>
  </main>
}
