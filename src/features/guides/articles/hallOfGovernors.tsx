import { Link } from 'react-router-dom'
import type { GuideArticleDefinition } from '../guideTypes'

const troopScores = [
  ['T1', '90'], ['T2', '120'], ['T3', '180'], ['T4', '265'], ['T5', '385'],
  ['T6', '595'], ['T7', '830'], ['T8', '1,130'], ['T9', '1,485'], ['T10', '1,960'],
]

export const hallOfGovernorsGuide: GuideArticleDefinition = {
  slug: 'kingshot-hall-of-governors-hog-guide',
  title: 'Kingshot Hall of Governors (HoG): Stages, Scoring & Stockpile Guide',
  shortTitle: 'Hall of Governors',
  eyebrow: 'Event Guide · Growth Leaderboard',
  summary: 'Plan Hall of Governors stages, troop and hero scoring, Amadeus/Hilde cycles and resource stockpiles with live-ops caveats kept explicit.',
  intro: 'Hall of Governors is an early-kingdom growth competition built around stage-specific scoring. The strongest way to play it is not to spend every resource as soon as you earn it, but to line up construction, research, troop training, hero shards, Hero Roulette, Hero Gear, Governor Gear and Charms with the stage that actually scores them. Forge cross-checked current community databases for the HoG 1–5 structure and treats the live in-game event screen as the final authority because no HoG-specific Century Games Help Center article surfaced during this verification pass.',
  theme: 'royal',
  tags: ['Hall of Governors', 'HoG', 'Amadeus', 'Hilde', 'Hero Roulette', 'troops', 'Governor Gear', 'Governor Charms', 'Forgehammer', 'Widgets', 'speedups', 'F2P', 'leaderboard', 'resource management'],
  sourceNote: 'Fresh verification completed 20 August 2026. Detailed HoG 1–5 schedules and point values were cross-checked across Kingshot Database, Kingshot Wiki, Kingshot WebApps and other current community references. Multiple current sources agree on the early Amadeus cycles, later Hilde cycles, the T1–T10 troop score ladder and the main Hero/Gear scoring values. During this verification pass, no HoG-specific Century Games Help Center article surfaced, so live in-game event rules remain the final authority. Stage order, reward brackets and live-operations values can change by server/version.',
  alert: <><strong>Do not use Forge’s older troop calculator defaults as HoG scoring truth.</strong> The supplied troop dataset labels its HoG values as adjustable calculator defaults and marks all available T1–T5 rows `EST`; those defaults are 1/2/5/10/25 points. Current HoG references instead consistently show <strong>90/120/180/265/385</strong> for T1–T5. This guide uses the current HoG-specific references and keeps the older defaults separate.</>,
  connections: [
    { kind: 'guide', label: 'Heroes Gen 1–6', description: 'Check Amadeus and Hilde in the broader Gen 1–6 role reference without treating editorial tiers as HoG scoring rules.', to: '/guides/kingshot-heroes-gen1-gen6-role-tier-reference' },
    { kind: 'guide', label: 'Hero Progression', description: 'Plan Hero XP and shard spending before a Hero Development stage.', to: '/guides/kingshot-hero-xp-shard-progression-guide' },
    { kind: 'guide', label: 'Troop Training', description: 'Use Forge’s cost/time guide for T1–T5 training economics; use this HoG guide for HoG score values.', to: '/guides/kingshot-troop-training-t1-t5-cost-time-guide' },
    { kind: 'guide', label: 'Governor Gear', description: 'Price Satin, Gilded Threads and Artisan’s Vision before a Governor Gear stage.', to: '/guides/kingshot-governor-gear-upgrade-cost-guide' },
    { kind: 'guide', label: 'Governor Charms', description: 'Plan Charm Guides and Charm Designs for later HoG Charm stages.', to: '/guides/kingshot-governor-charms-upgrade-cost-guide' },
    { kind: 'guide', label: 'KvK Prep Scoring', description: 'Avoid draining the same stockpiles if your kingdom also needs them for KvK Preparation.', to: '/guides/kingshot-kvk-preparation-scoring-guide' },
  ],
  sections: [
    {
      id: 'cycles', eyebrow: 'Event structure', title: 'HoG changes as the kingdom matures',
      content: <>
        <div className="guide-article__grid guide-article__grid--two">
          <article className="guide-article__card"><strong>HoG 1</strong><h3>Amadeus · 5 stages</h3><p>Current community references place the first HoG around day 6 of a new kingdom, with Construction, Hero Development, Troops, Beast Slay and Power Boost.</p></article>
          <article className="guide-article__card"><strong>HoG 2</strong><h3>Amadeus · 6 stages</h3><p>Usually about two weeks later. It adds broader gathering/power tasks and a Governor Gear Upgrade stage.</p></article>
          <article className="guide-article__card"><strong>HoG 3</strong><h3>Amadeus · 7 stages</h3><p>Usually around the Generation 2 transition. A seventh Hero Development stage adds shard use and speedup scoring.</p></article>
          <article className="guide-article__card"><strong>HoG 4–5</strong><h3>Hilde · 7 stages</h3><p>Current references show the same seven-stage structure for both, with a dedicated Governor Charm stage joining the rotation.</p></article>
        </div>
        <p className="guide-article__callout"><strong>Live-ops warning:</strong> “usually”, “around” and “current references show” are deliberate wording. Always inspect the live event before committing a stockpile.</p>
      </>,
    },
    {
      id: 'core-scores', eyebrow: 'Scoring reference', title: 'High-value actions that repeat across HoG',
      content: <>
        <div className="guide-article__grid guide-article__grid--two">
          <article className="guide-article__card"><strong>90,000</strong><h3>Hero Roulette</h3><p>Current HoG references consistently score one Hero Roulette play at 90,000 points.</p></article>
          <article className="guide-article__card"><strong>35,000</strong><h3>Mythic shard</h3><p>Using one Mythic Hero Shard to ascend a hero is listed at 35,000 points; Epic is 14,000 and Rare 4,000.</p></article>
          <article className="guide-article__card"><strong>50,000</strong><h3>Forgehammer</h3><p>Later Power Boost stages list one Hero Gear Forgehammer at 50,000 points.</p></article>
          <article className="guide-article__card"><strong>100,000</strong><h3>Exclusive-gear Widget</h3><p>Using one Widget for Hero Exclusive Gear is listed at 100,000 points in later Power Boost stages.</p></article>
        </div>
        <ul>
          <li>Construction/Research stages commonly score each point of gained Power directly, with values varying by stage.</li>
          <li>Later Hero Development stages list construction, research and troop-training/promotion speedups at 300 points per minute.</li>
          <li>Governor Gear stages score both the listed gear-score increase and, in some cycles, general Power growth.</li>
          <li>HoG 4–5 references add Governor Charm score progression plus gathering/research actions.</li>
        </ul>
      </>,
    },
    {
      id: 'troops', eyebrow: 'Train Troops', title: 'Current HoG troop score ladder: T1 to T10',
      content: <>
        <div className="guide-article__table-wrap">
          <table className="guide-article__table">
            <thead><tr><th>Troop tier</th><th>Points per troop</th></tr></thead>
            <tbody>{troopScores.map(([tier, points]) => <tr key={tier}><td>{tier}</td><td>{points}</td></tr>)}</tbody>
          </table>
        </div>
        <p>The score curve rises from <strong>90 points at T1</strong> to <strong>1,960 at T10</strong>. That makes troop tier a major planning variable, but Forge does not claim that “highest tier is always best per speedup minute” without a verified promotion/training efficiency model for your exact account.</p>
        <p>Use the <Link className="guide-article__link" to="/guides/kingshot-troop-training-t1-t5-cost-time-guide">Troop Training guide</Link> for the separate T1–T5 cost/time estimates. Its embedded HoG point defaults are not used here because that source itself labels them adjustable and estimated.</p>
      </>,
    },
    {
      id: 'stockpile', eyebrow: 'Preparation', title: 'Build a stage-specific stockpile, not one generic hoard',
      content: <>
        <ul>
          <li><strong>Construction/Research:</strong> leave valuable completions and speedups available for the stage that scores them, while still respecting prerequisite and kingdom-growth needs.</li>
          <li><strong>Hero Development:</strong> save Roulette currency and ascension shards when delaying them does not block a critical hero breakpoint.</li>
          <li><strong>Troops:</strong> enter the troop stage with queues, speedups and promotion options ready rather than discovering your bottleneck after the stage begins.</li>
          <li><strong>Hero Gear:</strong> keep Forgehammers, Hero Gear XP and exclusive-gear Widgets for a Power Boost stage if the live event scores them.</li>
          <li><strong>Governor Gear/Charms:</strong> use the connected Forge cost guides to calculate the next meaningful breakpoint before spending Satin, Threads, Vision, Charm Guides or Designs.</li>
        </ul>
        <p className="guide-article__callout"><strong>Double-dipping beats blind saving:</strong> if HoG overlaps another event that rewards the same action, one upgrade can contribute to more than one objective. Verify both live event screens first.</p>
      </>,
    },
    {
      id: 'heroes', eyebrow: 'Season heroes', title: 'Amadeus first, Hilde later — but ranking is the expensive part',
      content: <>
        <p>Current HoG references consistently associate the first three cycles with <strong>Amadeus</strong> and HoG 4–5 with <strong>Hilde</strong>. They also consistently describe the hero shards as ranking-driven rather than something every participant simply receives for completing milestones.</p>
        <p>Community references commonly describe Amadeus as tied to a top-10 total ranking in the early cycles and Hilde shards as extending to a broader top-100 bracket in later cycles. Treat those brackets as current community observations, not permanent official guarantees; check the reward tab in your live HoG before deciding whether a leaderboard push is rational.</p>
        <p>For most accounts, milestone rewards plus planned permanent progression can be a better target than burning multiple weeks of resources solely to chase a volatile ranking cutoff.</p>
      </>,
    },
    {
      id: 'conflicts', eyebrow: 'Source governance', title: 'What Forge deliberately does not merge together',
      content: <>
        <ul>
          <li>The older `kingshot-events` file contains only a generic Hall of Governors cadence row and does not support the detailed stage tables published here.</li>
          <li>The supplied troop file contains adjustable HoG calculator defaults that conflict with current HoG-specific references; Forge keeps those defaults in the troop-cost context only.</li>
          <li>HoG scoring values are not reused as KvK values. The dedicated KvK reference remains its own governed source.</li>
          <li>Community claims about the “best” spending tier, pack ROI or exact leaderboard cutoffs are strategy opinions unless the live game confirms them.</li>
        </ul>
      </>,
    },
    {
      id: 'checklist', eyebrow: 'Before each cycle', title: 'Hall of Governors checklist',
      content: <>
        <ul>
          <li>Open the live HoG and record the actual stage order, scoring values and reward brackets for your server.</li>
          <li>Choose a target: milestones, a modest rank, or a prepared leaderboard push.</li>
          <li>Map saved construction, research, shards, Roulette, troops, Forgehammer/Widgets, Governor Gear and Charms to the days that score them.</li>
          <li>Check KvK and Alliance Brawl before spending shared resources.</li>
          <li>Stop spending when the next rank/reward step costs more than the permanent progression is worth to your account.</li>
        </ul>
      </>,
    },
  ],
}
