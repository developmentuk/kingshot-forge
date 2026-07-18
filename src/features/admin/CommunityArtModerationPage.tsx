import { useEffect, useState } from 'react'
import { listCommunityArtQueue, moderateCommunityArt, type CommunityArtRecord } from '../../services/communityArtService'

export function CommunityArtModerationPage() {
  const [queue, setQueue] = useState<CommunityArtRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [working, setWorking] = useState<string | null>(null)

  useEffect(() => {
    void listCommunityArtQueue().then(setQueue).catch(() => setError('The moderation queue could not be loaded.')).finally(() => setLoading(false))
  }, [])

  async function act(id: string, action: 'approve' | 'reject' | 'publish') {
    const note = action === 'reject' ? window.prompt('Reason for rejection') ?? '' : window.prompt('Optional moderation note') ?? ''
    if (action === 'reject' && !note.trim()) return
    setWorking(id)
    try {
      const updated = await moderateCommunityArt(id, action, note)
      setQueue((current) => action === 'approve' ? current.map((item) => item.id === id ? updated : item) : current.filter((item) => item.id !== id))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Moderation action failed.')
    } finally { setWorking(null) }
  }

  return <main className="admin-page">
    <section className="admin-page__header"><p className="admin-page__eyebrow">Community Art Studio</p><h1>Artwork moderation</h1><p>Review pending community artwork before it can be approved or published.</p></section>
    {error && <div className="error-state" role="alert">{error}</div>}
    {loading && <div className="loading-state" role="status">Loading moderation queue…</div>}
    {!loading && queue.length === 0 && <div className="empty-state"><h2>Queue clear</h2><p>No pending or approved artwork needs action.</p></div>}
    <div className="community-art-moderation-grid">{queue.map((item) => <article className="community-art-moderation-card" key={item.id}>
      {item.imageUrl && <img src={item.imageUrl} alt={item.title} />}
      <div><p className="eyebrow">{item.category}</p><h2>{item.title}</h2><p>{item.description}</p><p>Attribution: {item.attribution ?? 'Anonymous'}</p>
        <div className="community-art-moderation-actions">{item.status === 'pending' && <><button className="button button--primary" disabled={working === item.id} onClick={() => void act(item.id, 'approve')}>Approve</button><button className="button button--secondary" disabled={working === item.id} onClick={() => void act(item.id, 'reject')}>Reject</button></>}{item.status === 'approved' && <button className="button button--primary" disabled={working === item.id} onClick={() => void act(item.id, 'publish')}>Publish</button>}</div>
      </div>
    </article>)}</div>
  </main>
}
