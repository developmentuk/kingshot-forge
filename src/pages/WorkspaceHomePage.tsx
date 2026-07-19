import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useRole } from '../context/RoleContext'
import { useAuth } from '../context/AuthContext'
import { getWorkspace, type ForgeWorkspaceId } from '../navigation/workspaceRegistry'
import { getMyApplication } from '../services/contributorApplicationService'
import type { ApplicantApplication } from '../../server/recruitment/contracts'

const workspaceCopy: Record<ForgeWorkspaceId, { eyebrow: string; title: string; intro: string }> = {
  player: { eyebrow: 'Player View', title: 'Forge your Kingshot experience.', intro: 'Your player tools stay together here: identity, companions, community and creative studios.' },
  contributor: { eyebrow: 'Contributor Centre', title: 'Contribute to the Forge.', intro: 'A focused home for approved contribution and editorial work. Planned tools are marked honestly.' },
  creator: { eyebrow: 'Creator Centre', title: 'Create with the Forge.', intro: 'Creator workflow foundations are established here; automated platform ingestion is intentionally deferred.' },
  moderation: { eyebrow: 'Moderation Centre', title: 'Keep the community healthy.', intro: 'Review community work and feedback with the narrow permissions assigned to your account.' },
  operations: { eyebrow: 'Forge Operations Centre', title: 'Operate the Forge with confidence.', intro: 'Actionable platform operations, governed content workflows and safe player support belong here.' },
}

export default function WorkspaceHomePage({ workspaceId }: { workspaceId: ForgeWorkspaceId }) {
  const workspace = getWorkspace(workspaceId)
  const copy = workspaceCopy[workspaceId]
  const { hasPermission } = useRole()
  const { user } = useAuth()
  const [application, setApplication] = useState<ApplicantApplication | null>(null)
  useEffect(() => { if (workspaceId !== 'contributor' || !user) { setApplication(null); return } void getMyApplication().then(setApplication).catch(() => setApplication(null)) }, [workspaceId, user])
  const items = workspace.groups.flatMap((group) => group.items).filter((item) => !item.permission || hasPermission(item.permission))

  return (
    <main className="workspace-home">
      <header className="workspace-home__header">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1>{copy.title}</h1>
        <p>{copy.intro}</p>
      </header>
      {workspaceId === 'contributor' && <section className="workspace-home__section" aria-labelledby="contributor-status"><div className="workspace-home__section-heading"><div><p className="eyebrow">Application status</p><h2 id="contributor-status">{application ? application.status.replaceAll('_', ' ') : 'Not applied'}</h2></div><Link className="button button--secondary" to={application ? '/join/my-application' : '/join'}>{application ? 'View My Application' : 'Explore roles'}</Link></div><p>{application ? 'Your application is private to your account. Applicant-visible updates appear in My Application.' : 'Explore flexible, unpaid community roles and start an application when you are ready.'}</p></section>}
      <section className="workspace-home__section" aria-labelledby={`${workspaceId}-workspace-links`}>
        <div className="workspace-home__section-heading">
          <div><p className="eyebrow">Workspace navigation</p><h2 id={`${workspaceId}-workspace-links`}>Available tools</h2></div>
          <span className="status-badge">{items.length} destinations</span>
        </div>
        <div className="workspace-home__grid">
          {items.map((item) => {
            const content = <><span aria-hidden="true">{item.icon}</span><div><h3>{item.label}</h3><p>{item.status ? `${item.status[0].toUpperCase()}${item.status.slice(1)} — this area is not presented as complete.` : 'Open workspace tool'}</p></div>{!item.status && <strong aria-hidden="true">→</strong>}</>
            return item.status ? <div className="workspace-home__card workspace-home__card--disabled" aria-disabled="true" key={item.path}>{content}</div> : <Link className="workspace-home__card" to={item.path} key={item.path}>{content}</Link>
          })}
        </div>
      </section>
      <div className="workspace-home__note" role="note"><strong>Access is server-authorized.</strong><span>Workspace visibility only changes presentation. Direct routes and mutations still require their own permissions.</span></div>
    </main>
  )
}
