import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { addProgressionSnapshot, getMyProgression, type PlayerProgressionInput, type PlayerProgressionSnapshot } from '../services/playerProgressionService'
import { usePlayerIdentity } from '../context/PlayerIdentityContext'

const emptyInput: PlayerProgressionInput = { currentPower:null, highestPower:null, townCenterLevel:null, truegoldLevel:null, vipLevel:null, infantryTier:null, lancerTier:null, marksmanTier:null, governorGearScore:null, governorCharmScore:null, notes:null, isPublic:false }
const numberValue = (value:string) => value === '' ? null : Number(value)
const formatNumber = (value:number|null) => value === null ? '—' : value.toLocaleString('en-GB')

export default function PlayerProgressionPage() {
  const { user, loading:authLoading, signInWithGoogle } = useAuth()
  const { playerAccount, loadingPlayerAccount, playerIdentityError, refreshPlayerIdentity } = usePlayerIdentity()
  const [snapshots,setSnapshots] = useState<PlayerProgressionSnapshot[]>([])
  const [form,setForm] = useState<PlayerProgressionInput>(emptyInput)
  const [loading,setLoading] = useState(true)
  const [saving,setSaving] = useState(false)
  const [message,setMessage] = useState('')
  const [error,setError] = useState('')

  useEffect(() => { let cancelled=false; async function load(){ if(authLoading||loadingPlayerAccount)return; if(!user||!playerAccount){setLoading(false);return} setLoading(true);setError(''); try { const history=await getMyProgression(playerAccount.id); if(!cancelled){setSnapshots(history);const latest=history[0];if(latest)setForm({currentPower:latest.currentPower,highestPower:latest.highestPower,townCenterLevel:latest.townCenterLevel,truegoldLevel:latest.truegoldLevel,vipLevel:latest.vipLevel,infantryTier:latest.infantryTier,lancerTier:latest.lancerTier,marksmanTier:latest.marksmanTier,governorGearScore:latest.governorGearScore,governorCharmScore:latest.governorCharmScore,notes:null,isPublic:latest.isPublic})}} catch(caught){if(!cancelled)setError(caught instanceof Error?caught.message:'Progression could not be loaded.')} finally{if(!cancelled)setLoading(false)}} void load(); return()=>{cancelled=true} },[authLoading,loadingPlayerAccount,playerAccount,user])

  const powerGain=useMemo(()=>{if(snapshots.length<2)return null;const newest=snapshots[0].currentPower;const previous=snapshots[1].currentPower;return newest!==null&&previous!==null?newest-previous:null},[snapshots])

  async function save(event:FormEvent){event.preventDefault();if(!playerAccount)return;setSaving(true);setError('');setMessage('');try{await addProgressionSnapshot(playerAccount.id,form);setSnapshots(await getMyProgression(playerAccount.id));window.dispatchEvent(new Event('kingshot-player-updated'));setMessage('Progression snapshot saved.')}catch(caught){setError(caught instanceof Error?caught.message:'Progression could not be saved.')}finally{setSaving(false)}}

  if(authLoading||loading)return <main className="player-domain-state"><h1>Loading progression…</h1></main>
  if(!user)return <main className="player-domain-state"><h1>Sign in to track progression</h1><p>Your snapshots are owned by your Forge account.</p><button className="button button--primary" onClick={()=>void signInWithGoogle()}>Sign in with Google</button></main>
  if(playerIdentityError)return <main className="player-domain-state"><h1>Progression is temporarily unavailable</h1><p>{playerIdentityError}</p><button className="button button--primary" onClick={()=>void refreshPlayerIdentity()}>Retry identity load</button></main>
  if(!playerAccount)return <main className="player-domain-state"><h1>Link a player first</h1><p>A primary Kingshot player account is required.</p><Link className="button button--primary" to="/my-forge/player-identity">Link player</Link></main>

  const numericFields:Array<[keyof PlayerProgressionInput,string,number,number?]>=[['currentPower','Current power',0],['highestPower','Highest power',0],['townCenterLevel','Town Center',1,30],['truegoldLevel','Truegold',0,8],['vipLevel','VIP',0,12],['infantryTier','Infantry tier',1,12],['lancerTier','Lancer tier',1,12],['marksmanTier','Marksman tier',1,12],['governorGearScore','Governor gear score',0],['governorCharmScore','Governor charm score',0]]

  return <main className="player-progression-page">
    <header className="player-domain-hero"><div><p className="eyebrow">Player Domain</p><h1>Personal progression</h1><p>Record private or public snapshots without changing canonical game data.</p></div><div className="player-domain-actions"><Link className="button button--secondary" to="/my-forge/profile">Edit profile</Link><Link className="button button--secondary" to="/my-forge/hero-collection">Hero collection</Link></div></header>
    <section className="player-progress-summary"><article><span>Latest power</span><strong>{formatNumber(snapshots[0]?.currentPower??null)}</strong></article><article><span>Change</span><strong>{powerGain===null?'—':`${powerGain>=0?'+':''}${powerGain.toLocaleString('en-GB')}`}</strong></article><article><span>Snapshots</span><strong>{snapshots.length}</strong></article><article><span>Latest visibility</span><strong>{snapshots[0]?.isPublic?'Public':'Private'}</strong></article></section>
    <div className="player-progression-layout"><form className="player-domain-card player-progression-form" onSubmit={save}><div><p className="eyebrow">New snapshot</p><h2>Record current position</h2></div><div className="player-domain-form-grid">{numericFields.map(([key,label,min,max])=><label key={String(key)}>{label}<input type="number" min={min} max={max} value={(form[key] as number|null)??''} onChange={event=>setForm({...form,[key]:numberValue(event.target.value)})}/></label>)}</div><label>Notes<textarea rows={3} value={form.notes??''} onChange={event=>setForm({...form,notes:event.target.value})} placeholder="What changed since your last snapshot?"/></label><label className="player-domain-checkbox"><input type="checkbox" checked={form.isPublic} onChange={event=>setForm({...form,isPublic:event.target.checked})}/><span>Show this snapshot on my public profile</span></label>{error&&<p className="profile-panel__error">{error}</p>}{message&&<p className="profile-panel__success">{message}</p>}<button className="button button--primary" disabled={saving}>{saving?'Saving…':'Save snapshot'}</button></form>
    <section className="player-domain-card"><div><p className="eyebrow">History</p><h2>Recent snapshots</h2></div>{snapshots.length===0?<p>No snapshots yet. Record your first position to begin tracking.</p>:<div className="player-snapshot-list">{snapshots.map(snapshot=><article key={snapshot.id}><div><strong>{new Date(snapshot.recordedAt).toLocaleDateString('en-GB')}</strong><span>{snapshot.isPublic?'Public':'Private'}</span></div><p>{formatNumber(snapshot.currentPower)} power · TC {snapshot.townCenterLevel??'—'} · TG {snapshot.truegoldLevel??'—'} · VIP {snapshot.vipLevel??'—'}</p>{snapshot.notes&&<small>{snapshot.notes}</small>}</article>)}</div>}</section></div>
  </main>
}
