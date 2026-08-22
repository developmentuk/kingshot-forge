import { Link } from 'react-router-dom'
import type { GuideArticleDefinition } from '../guideTypes'

const materialRows = [
  ['Pet Food', 'Pet upgrade'],
  ['Common Taming Mark', 'Pet refinement'],
  ['Advanced Taming Mark', 'Pet advanced refinement'],
  ['Growth Manual', 'Pet Potential advancement'],
  ['Nutrient Potion', 'Extra item for Pet Potential advancement'],
  ['Promotion Medallion', 'Extra item for Pet Potential advancement'],
] as const

const observedUnlockRows = [
  ['Around Day 55', 'Gray Wolf, Lynx, Bison'],
  ['Around Day 72', 'Cheetah, Moose'],
  ['Around Day 113', 'Lion, Grizzly Bear'],
  ['Around Day 197', 'Giant Rhino, Mighty Bison'],
] as const

export const petSystemGuide: GuideArticleDefinition = {
  slug: 'kingshot-pet-system-refinement-guide',
  title: 'Kingshot Pets: Unlocks, Refinement, Taming Marks & F2P Guide',
  shortTitle: 'Pet System',
  eyebrow: 'System Guide · Pets',
  summary: 'Understand the current official Pet unlock, capture, feeding, material and refinement rules, then use community unlock observations only as a planning layer.',
  intro: 'Pets are a long-term account-progression system with separate upgrade, refinement and Potential-advancement materials. The current Century Games Help Center documents several core rules clearly: the feature requires Town Center Lv.18 plus a server-age gate, different Pet Skills can work at the same time, daily tame/feed attempts are limited, and refinement has irreversible choices. Forge keeps those official rules separate from community-observed unlock days and priority advice.',
  theme: 'royal',
  tags: ['Pets', 'Pet System', 'Pet Food', 'Taming Marks', 'Common Taming Mark', 'Advanced Taming Mark', 'Growth Manual', 'Nutrient Potion', 'Promotion Medallion', 'refinement', 'F2P', 'KvK', 'resource management'],
  sourceNote: 'Fresh official verification completed 20 August 2026 against the current Century Games / Kingshot Help Center Pet System section. Official material confirms the Town Center Lv.18 plus server-age access gate; a current capture count of 3 Pets following the latest update; 2 tame/feed attempts per Pet daily; simultaneous Pet Skills; the six current Pet-item functions; and refinement safeguards including irreversible replacement choices and Total-Power-based warning behaviour. Century Games does not publish one fixed server-day unlock table. Approximate Day 55/72/113/197 rollout ranges and F2P priority commentary come from current July 2026 community guides and are therefore presented only as observational planning guidance.',
  alert: <><strong>Do not treat community unlock days as official timers.</strong> Century Games only says the Pet feature and later Pet availability depend on server age. Also treat refinement carefully: consumed items are not returned, and the official Help Center says refinement is irreversible once replacement is confirmed.</>,
  connections: [
    { kind: 'tool', label: 'Pet Companion & Upgrade Planner', description: 'Browse all 14 governed Pets and calculate exact current-to-target Pet Food and advancement-material requirements.', to: '/companion/pets' },
    { kind: 'guide', label: 'KvK Prep Scoring', description: 'Forge’s governed KvK scoring source includes Pet advancement and Taming Mark opportunities on Prep Days 3 and 5.', to: '/guides/kingshot-kvk-preparation-scoring-guide' },
    { kind: 'guide', label: 'Hero Progression', description: 'Balance Pet investment against Hero XP and shard progression instead of treating every account system in isolation.', to: '/guides/kingshot-hero-xp-shard-progression-guide' },
    { kind: 'guide', label: 'Governor Charms', description: 'Compare another long-term account-stat system before deciding where scarce progression materials should go.', to: '/guides/kingshot-governor-charms-upgrade-cost-guide' },
    { kind: 'guide', label: 'Alliance Brawl', description: 'Use the Brawl resource-management framework when deciding whether to spend Pet materials immediately or save them for overlapping scoring windows.', to: '/guides/kingshot-alliance-brawl-event-guide' },
  ],
  sections: [
    {
      id: 'unlock', eyebrow: 'Official access rule', title: 'Town Center Lv.18 is required — but server age is also part of the gate',
      content: <>
        <p>Century Games says the Pet feature becomes available only after the server has been open for a certain number of days <strong>and</strong> your Town Center has reached Lv.18.</p>
        <div className="guide-article__grid guide-article__grid--three">
          <article className="guide-article__card"><strong>18</strong><h3>Town Center</h3><p>TC18 is the published player-side requirement.</p></article>
          <article className="guide-article__card"><strong>Server age</strong><h3>Second gate</h3><p>The Help Center confirms an age requirement but does not publish one universal exact day.</p></article>
          <article className="guide-article__card"><strong>Live UI</strong><h3>Final authority</h3><p>If a community timeline disagrees with your Beast Cage or event screen, follow the game.</p></article>
        </div>
      </>,
    },
    {
      id: 'capture-attempts', eyebrow: 'Daily limits', title: 'Current support wording: 3 Pets can be captured, with 2 tame/feed attempts per Pet daily',
      content: <>
        <p>The current Help Center says that following the latest update you can capture <strong>3 Pets</strong>, while noting that this may increase in future updates. Forge preserves that wording rather than turning it into a permanent roster-size rule.</p>
        <p>Century Games also says each Pet can only be <strong>tamed and fed 2 times daily</strong>. That makes missed daily attempts a real progression cost, even if you are saving premium materials for a later event window.</p>
      </>,
    },
    {
      id: 'materials', eyebrow: 'Official material map', title: 'Six Pet materials serve three different progression jobs',
      content: <>
        <p>Do not treat every Pet item as interchangeable. The current Help Center assigns each material to a specific progression layer.</p>
        <div className="guide-article__table-wrap"><table className="guide-article__table"><thead><tr><th>Material</th><th>Official function</th></tr></thead><tbody>{materialRows.map(([material, use]) => <tr key={material}><td>{material}</td><td>{use}</td></tr>)}</tbody></table></div>
        <p className="guide-article__callout"><strong>Planning implication:</strong> Pet Food, Taming Marks and Potential materials solve different problems. Saving one category does not automatically prepare the others.</p>
        <p>Use the <Link to="/companion/pets">Pet Companion & Upgrade Planner</Link> to open any governed Pet and calculate the exact Pet Food, Growth Manual, Nutrient Potion and Promotion Medallion requirements between two published levels.</p>
      </>,
    },
    {
      id: 'refinement', eyebrow: 'Refinement safety', title: 'Replacement is a choice — and confirmed refinement is irreversible',
      content: <>
        <p>Century Games says refinement changes Pet stats when you choose to replace the result. If the new result causes a substantial stat drop, the system can show a second prompt; however, another Help Center article clarifies that this warning is triggered by a drop in <strong>Total Power</strong>, not every individual affix decrease.</p>
        <ul>
          <li>If you skip the current refinement result, the refinement items have still been consumed.</li>
          <li>Stats are only replaced when you confirm the new result.</li>
          <li>Once the replacement is confirmed, refinement is irreversible.</li>
          <li>After a secondary-stat quality tier has increased, a later decrease in bonus does not reduce that quality tier.</li>
        </ul>
        <p className="guide-article__callout"><strong>Do not rely on the warning popup alone.</strong> Compare the actual stat changes before confirming, especially when protecting a high-value secondary-stat profile.</p>
      </>,
    },
    {
      id: 'skills', eyebrow: 'Pet Skills', title: 'Different Pet Skills can take effect at the same time',
      content: <>
        <p>The official Pet FAQ answers this directly: different Pet Skills can take effect simultaneously. That means the system is not framed as a single active-pet slot where one skill automatically disables every other Pet Skill.</p>
        <p>Forge does not extend that one-line official rule into unverified claims about exact stacking formulas, cooldown interactions or specific combat multipliers. Check each Pet’s live skill text for those details.</p>
      </>,
    },
    {
      id: 'community-rollout', eyebrow: 'Community observation · not official', title: 'Current guides commonly observe four major server-age unlock waves',
      content: <>
        <p>Century Games does not publish a fixed Pet release calendar, but current July 2026 community guides broadly agree on the following observed rollout pattern. Treat it as planning context, not a guaranteed timer.</p>
        <div className="guide-article__table-wrap"><table className="guide-article__table"><thead><tr><th>Observed server age</th><th>Commonly reported unlocks</th></tr></thead><tbody>{observedUnlockRows.map(([day, pets]) => <tr key={day}><td>{day}</td><td>{pets}</td></tr>)}</tbody></table></div>
        <p>Community guides consistently rank the <strong>Lion</strong> as a major F2P turning point because of its economy utility, but Forge treats that as strategy advice rather than an official Century Games priority list.</p>
      </>,
    },
    {
      id: 'event-timing', eyebrow: 'Spend with purpose', title: 'Pet progression can overlap with KvK scoring windows',
      content: <>
        <p>Forge’s separately governed KvK Preparation scoring dataset includes Pet advancement and Taming Mark actions on Prep Days 3 and 5. That does not make every Pet upgrade a KvK-only resource, but it creates a reason to check the event calendar before spending a saved stack.</p>
        <ol>
          <li><strong>Do the free daily progression first.</strong> Avoid wasting tame/feed attempts simply because you are saving event-scoring materials.</li>
          <li><strong>Separate Pet Food from Taming Marks and Potential materials.</strong> They are different progression buckets.</li>
          <li><strong>Check KvK/Brawl overlap before a large spend.</strong> A well-timed upgrade can serve account progression and event scoring together.</li>
          <li><strong>Keep one future unlock in mind.</strong> Community strategy generally favours avoiding equal investment across every early Pet when a stronger utility Pet is approaching.</li>
        </ol>
        <p>Use the <Link to="/guides/kingshot-kvk-preparation-scoring-guide">KvK Prep Scoring reference</Link> for the governed event-side numbers rather than importing generic Pet-guide estimates into KvK.</p>
      </>,
    },
  ],
}
