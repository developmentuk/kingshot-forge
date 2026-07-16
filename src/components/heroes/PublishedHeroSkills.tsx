import { useEffect, useState } from 'react'
import { getPublishedHeroSkills } from '../../repositories/heroSkillRepository'
import type { PublishedHeroSkill } from '../../types/heroSkill'
import './PublishedHeroSkills.css'
import './PublishedHeroSkillsMilestone3.css'

interface PublishedHeroSkillsProps {
  heroSlug: string
  heroName: string
}

function formatLabel(value: string | null) {
  if (!value) return 'Not specified'
  return value.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase())
}

function progressionLabel(skill: PublishedHeroSkill, index: number) {
  if (skill.category === 'exclusive_gear') return 'Upgrade after core battle skills'
  if (skill.category === 'talent') return 'Invest when the talent becomes available'
  if (index === 0) return 'First upgrade priority'
  if (index === 1) return 'Second upgrade priority'
  return `Priority ${index + 1}`
}

export default function PublishedHeroSkills({ heroSlug, heroName }: PublishedHeroSkillsProps) {
  const [skills, setSkills] = useState<PublishedHeroSkill[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function loadSkills() {
      setLoading(true)
      setError('')
      try {
        const publishedSkills = await getPublishedHeroSkills(heroSlug)
        if (!cancelled) setSkills(publishedSkills)
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Unable to load published Hero Skills.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void loadSkills()
    return () => { cancelled = true }
  }, [heroSlug])

  if (loading) return <div className="hero-companion-skills-state" aria-live="polite"><strong>Loading published skills…</strong><p>Retrieving the latest published Hero Skills projection.</p></div>
  if (error) return <div className="hero-companion-skills-state" role="alert"><strong>Skills are temporarily unavailable</strong><p>{error}</p></div>
  if (skills.length === 0) return <div className="hero-companion-skills-state"><strong>No skills published yet</strong><p>Reviewed skill content for {heroName} will appear here after publication.</p></div>

  return (
    <div className="hero-companion-skills" aria-label={`${heroName} skills`}>
      <div className="hero-companion-skill-priority" role="note">
        <strong>Suggested progression</strong>
        <p>Follow the published display order unless your formation needs a specific conquest, expedition or exclusive-gear effect first.</p>
      </div>
      {skills.map((skill, index) => (
        <article key={skill.editorial_key} className="hero-companion-skill-card">
          <div className="hero-companion-skill-card__icon">
            {skill.icon_url ? <img src={skill.icon_url} alt={`${skill.name} icon`} /> : <span aria-hidden="true">✦</span>}
          </div>
          <div className="hero-companion-skill-card__content">
            <div className="hero-companion-skill-card__meta"><span>{formatLabel(skill.category)}</span><span>Slot {skill.slot_index}</span><span>Max level {skill.max_level}</span></div>
            <h3>{skill.name}</h3>
            {skill.skill_type && <p className="hero-companion-skill-card__type">{formatLabel(skill.skill_type)}</p>}
            <p>{skill.description || 'A verified description has not yet been published.'}</p>
            <div className="hero-companion-skill-progression">
              <div><span>Upgrade path</span><strong>{progressionLabel(skill, index)}</strong></div>
              <ol aria-label={`${skill.name} level progression`}>
                {Array.from({ length: skill.max_level }, (_, level) => <li key={level + 1}><span>{level + 1}</span></li>)}
              </ol>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}
