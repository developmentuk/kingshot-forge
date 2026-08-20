import { Link } from 'react-router-dom'
import type { GuideArticleDefinition } from '../guideTypes'

export const bearHuntGuide: GuideArticleDefinition = {
  slug: 'kingshot-bear-hunt-alliance-rally-guide',
  title: 'Kingshot Bear Hunt: Rally, Joiner & Alliance Strategy Guide',
  shortTitle: 'Bear Hunt',
  eyebrow: 'Event Guide · Alliance PvE',
  summary: 'Run a cleaner Bear Hunt with official cooldown and alliance rules separated from community rally, joiner and formation strategy.',
  intro: 'Bear Hunt is one of Kingshot’s most important alliance PvE activities, but the useful advice around it mixes hard game rules with community-tested rally strategy. Forge separates those layers. Official Century Games Help Center material governs cooldowns, alliance-transfer behaviour, trap rebuilding and the importance of the rally captain’s heroes. Formation ratios, joiner hero priorities and staggered rally timing remain community strategy and are labelled as such.',
  theme: 'ember',
  tags: ['Bear Hunt', 'Bear Trap', 'Raging Bear', 'alliance', 'rallies', 'joiners', 'heroes', 'Forgehammer', 'Valora', 'F2P', 'staggered rallies'],
  sourceNote: 'Fresh verification completed 20 August 2026. Official Century Games / Kingshot Help Center pages support the 48-hour Bear Hunt cooldown, the 46-hour minimum interval between sessions after changing alliances, ranking-point loss after leaving an alliance, Hunting Arrow reset after removing/rebuilding an Alliance Trap, continued contribution after the trap reaches max level, and the importance of the rally captain’s heroes and skill-trigger chances. Community strategy was compared across KingshotGuide.org’s May 2026 staggered-rally guide, its March 2026 Bear guide, its Bear Trap mechanics guide, and the Kingshot.net Bear Hunt wiki updated February 2026. Community sources disagree on a single universal troop ratio, so Forge does not present one as an official optimum.',
  alert: <><strong>Do not use the old Forge cadence source for Bear timing.</strong> The supplied `kingshot-events` file says “Multiple daily / 8h”, but the current official Kingshot Help Center says Bear Hunt has a <strong>48-hour cooldown</strong>. This guide follows the official rule and treats the older local cadence row as stale/conflicted.</>,
  connections: [
    { kind: 'guide', label: 'Heroes Gen 1–6', description: 'Compare the supplied Bear and Joiner editorial tiers without confusing them with official combat rules.', to: '/guides/kingshot-heroes-gen1-gen6-role-tier-reference' },
    { kind: 'guide', label: 'Masters', description: 'Use the Master Academy guide for Valora, the Bear Hunter Master and her governed Bear-focused progression.', to: '/guides/kingshot-masters-master-academy-guide' },
    { kind: 'hero', label: 'Hero Companion', description: 'Open the Hero Companion when checking your own hero stars, skills and available roster.', to: '/companion/heroes' },
    { kind: 'guide', label: 'Hero Progression', description: 'Price Hero XP and shard investment before changing heroes purely for Bear performance.', to: '/guides/kingshot-hero-xp-shard-progression-guide' },
    { kind: 'item', label: 'Forgehammer', description: 'Search Companion for the Hero Gear material commonly associated with Bear Hunt rewards.', to: '/companion?q=Forgehammer' },
  ],
  sections: [
    {
      id: 'official-rules', eyebrow: 'Official rules', title: 'What Century Games currently confirms',
      content: <>
        <div className="guide-article__grid guide-article__grid--two">
          <article className="guide-article__card"><strong>48h</strong><h3>Bear Hunt cooldown</h3><p>The official Help Center says you may participate again after the 48-hour cooldown.</p></article>
          <article className="guide-article__card"><strong>46h</strong><h3>Alliance-switch minimum</h3><p>If you participated with one alliance and move to another, at least 46 hours must pass from the previous session’s tally.</p></article>
          <article className="guide-article__card"><strong>Reset</strong><h3>Trap rebuild</h3><p>An Alliance Trap cannot be moved. Removing and rebuilding it resets its level, so Hunting Arrows must be contributed again.</p></article>
          <article className="guide-article__card"><strong>Captain</strong><h3>Heroes matter</h3><p>The Help Center says rally damage depends heavily on the captain’s heroes and the chances of their skills triggering.</p></article>
        </div>
        <p className="guide-article__callout"><strong>Alliance continuity matters:</strong> official support also says Bear ranking points are cleared after you leave your alliance, even if you later rejoin the same alliance within the season.</p>
      </>,
    },
    {
      id: 'trap', eyebrow: 'Alliance preparation', title: 'Hunting Arrows and trap management',
      content: <>
        <p>Official support confirms that members may keep contributing after the trap reaches its maximum level, although the level itself will not increase further. If the structure is removed, however, rebuilding starts its upgrade level again from scratch.</p>
        <p>The Help Center wording says alliance members “above R4” can start Bear Hunt. Community guides commonly describe scheduling as an R4/R5 leadership responsibility. Forge preserves that wording difference rather than silently rewriting the permission rule; check the live alliance interface if your rank is relevant.</p>
      </>,
    },
    {
      id: 'captain-vs-joiner', eyebrow: 'Rally roles', title: 'Captain strength and joiner discipline are different jobs',
      content: <>
        <p>The strongest official statement retrieved for damage mechanics is that the <strong>rally captain’s heroes and skill-trigger chances</strong> are major damage factors. Community guides then add a more detailed model: the captain supplies the rally foundation, while joiners should avoid sending first-slot heroes whose lead skill does not help damage.</p>
        <div className="guide-article__grid guide-article__grid--two">
          <article className="guide-article__card"><h3>Rally captain</h3><p>Use your strongest Bear-appropriate hero package and offensive account setup. Do not assume a visually higher power number guarantees more damage if the hero mechanics are worse.</p></article>
          <article className="guide-article__card"><h3>Rally joiner</h3><p>Community consensus strongly prioritises the first hero choice. Amadeus, Chenko and Yeonwoo are repeatedly cited as useful joiner leads; treat that as strategy guidance, not an official tier list.</p></article>
        </div>
      </>,
    },
    {
      id: 'formations', eyebrow: 'Community strategy', title: 'There is no single source-consistent “perfect” troop ratio',
      content: <>
        <p>Recent community guides agree that Bear formations should become increasingly Archer-heavy because the target does not behave like a normal PvP defender. They do <strong>not</strong> agree on one universal ratio.</p>
        <ul>
          <li>KingshotGuide’s March 2026 guide recommends progression from 10/30/60 in Gen 1 toward 1/10/89 in Gen 4–5.</li>
          <li>Its May 2026 staggered guide uses 10/10/80 as an example of a high-Archer preset.</li>
          <li>Kingshot.net’s February 2026 Bear reference recommends combinations such as 5/25/70 or 5/30/65 depending on the host heroes.</li>
        </ul>
        <p className="guide-article__callout"><strong>Forge recommendation:</strong> treat troop ratio as a testable account-specific setting. Compare repeat rallies under the same buffs and hero package, then keep the ratio that improves your own damage rather than copying a single percentage as universal law.</p>
      </>,
    },
    {
      id: 'staggered', eyebrow: 'Advanced alliance method', title: 'Staggered rallies can increase participation and recycling',
      content: <>
        <p>A May 2026 KingshotGuide strategy proposes three launch waves around <strong>0:00, 0:45 and 1:15</strong>, with players joining the topmost open rally and using partial troop marches. Its goal is to let returning troops recycle into later rallies instead of filling every rally immediately.</p>
        <p>The same community strategy suggests setting a joiner troop cap at roughly <strong>1/14 of average rally capacity</strong>, often around 80k–100k for established alliances. Those figures are operational recommendations, not official Kingshot limits.</p>
        <p>Use staggered rallies only when your alliance can follow the system consistently. A simple full-march model can outperform a poorly coordinated staggered system if players ignore wave timing, join the wrong rallies or exceed agreed caps.</p>
      </>,
    },
    {
      id: 'layout', eyebrow: 'Execution', title: 'Reduce wasted travel and keep rally seats usable',
      content: <>
        <ul>
          <li>Move reliable rally leaders close to the trap before activation when your alliance layout allows it.</li>
          <li>Recall important gathering marches before Bear so your usable marches are available.</li>
          <li>Save Bear-specific presets instead of rebuilding troop ratios and hero order during the event.</li>
          <li>If your alliance uses staggered waves, publish the launch order and troop cap before the event starts.</li>
          <li>Use one consistent join-order rule so members do not all chase the same strongest rally and leave other hosts empty.</li>
        </ul>
      </>,
    },
    {
      id: 'rewards', eyebrow: 'Rewards and progression', title: 'Use Bear rewards to strengthen the next Bear',
      content: <>
        <p>Community references consistently identify Bear Hunt as an important source of Hero Gear progression materials, particularly Forgehammers, alongside other upgrade resources. Reward tables and milestone thresholds can change, so Forge does not hard-code a “maximum reward damage” target from community pages as an official permanent rule.</p>
        <p>Use the <Link className="guide-article__link" to="/companion?q=Forgehammer">Forgehammer Companion search</Link> and <Link className="guide-article__link" to="/guides/kingshot-hero-xp-shard-progression-guide">Hero Progression guide</Link> to decide whether Bear-earned resources should be spent immediately or saved for a larger upgrade breakpoint.</p>
      </>,
    },
    {
      id: 'checklist', eyebrow: 'Before activation', title: 'Bear Hunt alliance checklist',
      content: <>
        <ul>
          <li>Confirm the official 48-hour cooldown has cleared.</li>
          <li>Check the live trap level and avoid removing the trap unless the alliance accepts that Hunting Arrow progress will reset.</li>
          <li>Confirm who is hosting rallies and which joiner-first heroes your alliance expects.</li>
          <li>Choose either a simple or staggered rally system and communicate it before the Bear appears.</li>
          <li>Set troop presets and recall marches in advance.</li>
          <li>Do not leave the alliance casually during an active ranking period if retaining Bear ranking points matters to you.</li>
          <li>Re-test formations after major hero, Master, research or gear upgrades instead of assuming an old ratio remains optimal.</li>
        </ul>
      </>,
    },
  ],
}
