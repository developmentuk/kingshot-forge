import { useEffect, useState } from 'react'
import { getPublishedHeroSkills } from '../../repositories/heroSkillRepository'
import type { PublishedHeroSkill } from '../../types/heroSkill'
import './PublishedHeroSkills.css'

interface PublishedHeroSkillsProps {
  heroSlug: string
  heroName: string
}

function formatLabel(value: string | null) {
  if (!value) return 'Not specified'
  return value.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase())
}

export default function PublishedHeroSkills({
  heroSlug,
  heroName,
}: PublishedHeroSkillsProps) {
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
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load published Hero Skills.',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void loadSkills()
    return () => { cancelled = true }
  }, [heroSlug])

  if (loading) {
    return <p className="hero-companion-copy">Loading published skills…</p>
  }

  if (error) {
    return (
      <div className="hero-companion-skills-state" role="alert">
        <strong>Skills are temporarily unavailable</strong>
        <p>{error}</p>
      </div>
    )
  }

  if (skills.length === 0) {
    return (
      <div className="hero-companion-skills-state">
        <strong>No skills published yet</strong>
        <p>Reviewed skill content for {heroName} will appear here after publication.</p>
      </div>
    )
  }

  return (
    <div className="hero-companion-skills" aria-label={`${heroName} skills`}>
      {skills.map((skill) => (
        <article key={skill.editorial_key} className="hero-companion-skill-card">
          <div className="hero-companion-skill-card__icon" aria-hidden="true">
            {skill.icon_url ? <img src={skill.icon_url} alt="" /> : <span>✦</span>}
          </div>
          <div className="hero-companion-skill-card__content">
            <div className="hero-companion-skill-card__meta">
              <span>{formatLabel(skill.category)}</span>
              <span>Slot {skill.slot_index}</span>
              <span>Max level {skill.max_level}</span>
            </div>
            <h3>{skill.name}</h3>
            {skill.skill_type && <p className="hero-companion-skill-card__type">{formatLabel(skill.skill_type)}</p>}
            <p>{skill.description || 'A verified description has not yet been published.'}</p>
          </div>
        </article>
      ))}
    </div>
  )
}
