import { Link } from 'react-router-dom'
import type { GuideArticleDefinition } from '../guideTypes'

const stages = [
  ['I', 'Rise of the City', '24h', '1', 'Construction / Research speedups, buildings, resources, Truegold'],
  ['II', 'Hero Development', '24h', '2', 'Hero shards, ascension, EXP, skills, Hero Gear, Widgets'],
  ['III', 'Pet Training', '24h', '2', 'Pet advancement, refining, skills and stamina'],
  ['IV', 'Gear Enhancement', '24h', '2', 'Governor Gear, Charms, Mithril and troop training'],
  ['V', 'Trade Baron', '24h', '2', 'Convoys, beasts, Terror rallies and speedups'],
  ['VI', 'Full-Scale Push', '36h', '4', 'All categories combined'],
] as const

const allocation = [
  ['Construction / Research / Training Speedups', 'Minimal: personal milestones and cheap swings', 'Save roughly 70–80% for KvK in the source strategy'],
  ['Truegold', 'Usually hold unless Stage VI / a key power breakpoint justifies it', 'Primary Prep dump'],
  ['Hero Shards / Widgets', 'Use lower-tier or double-dip stock', 'Save high-tier Mythic / generation-specific resources'],
  ['Stamina', 'Moderate use on Pet / Beast / Terror stages', 'Keep a meaningful reserve for KvK hunting and battle week'],
  ['Intel Missions', 'High-value zero-cost Brawl scoring when bankable', 'Also useful around KvK reset; do not waste live availability'],
] as const

export const allianceBrawlGuide: GuideArticleDefinition = {
  slug: 'kingshot-alliance-brawl-event-guide',
  title: 'Kingshot Alliance Brawl: Complete 13-Horn Strategy Guide',
  shortTitle: 'Alliance Brawl',
  eyebrow: 'Event Guide · Alliance Brawl',
  summary: 'Alliance Brawl is won by deciding when not to spend: protect the high-value four-Horn finale, double-dip overlapping events and preserve the inventory your kingdom needs for KvK.',
  intro: 'Alliance Brawl is a multi-day cross-kingdom alliance contest where each daily stage awards Horns and the first alliance to secure a majority wins the overall matchup. The supplied strategy treats the week as an allocation problem rather than six independent leaderboards: the first three stages offer only five Horns, while Stages IV–VI carry eight, so resource discipline and late-stage timing can outweigh an early lead.',
  theme: 'ember',
  tags: ['Alliance Brawl', 'alliance', 'Horns', 'resource management', 'F2P', 'whales', 'KvK', 'event stacking'],
  sourceNote: 'This article follows the supplied Alliance Brawl guide. Stage tasks, point values, matchmaking lock times and event overlaps can vary by event version. Numeric scoring examples are preserved as source context and should be checked against the live stage task list before spending scarce materials.',
  alert: <><strong>KvK has macro priority in the supplied strategy.</strong> Do not empty your speedups, Truegold, Mythic shards or healing reserve to win a low-value Brawl stage if Kingdom of Power is approaching. Brawl should accelerate normal growth, not sabotage the next kingdom fight.</>,
  connections: [
    { kind: 'guide', label: 'Kingdom of Power (KvK)', description: 'Use the complete KvK guide before deciding how much of your strategic hoard can safely go into Brawl.', to: '/guides/kingshot-kingdom-of-power-kvk-guide' },
    { kind: 'item', label: 'Mithril', description: 'Open the Companion item search for one of the source’s highest-value Stage IV/VI point materials.', to: '/companion?q=Mithril' },
    { kind: 'item', label: 'Truegold', description: 'Review Truegold in Companion before consuming it for Brawl rather than KvK Prep.', to: '/companion?q=Truegold' },
    { kind: 'item', label: 'Forgehammers', description: 'Check a recurring Hero Gear resource that scores in Brawl’s development stages.', to: '/companion?q=Forgehammers' },
    { kind: 'guide', label: 'Champagne Fair', description: 'Avoid converting shards or gear-related stock into Vouchers when the same inventory could score a Brawl stage.', to: '/guides/kingshot-champagne-fair-guide' },
    { kind: 'community', label: 'Alliance Directory', description: 'Open Forge alliance tools while organising rosters and activity expectations.', to: '/alliance-directory' },
  ],
  sections: [
    {
      id: 'structure',
      eyebrow: '6.5-day contest',
      title: 'How the 13 Horns are distributed',
      content: <>
        <div className="guide-article__table-wrap"><table className="guide-article__table"><thead><tr><th>Stage</th><th>Theme</th><th>Duration</th><th>Horns</th><th>Source focus</th></tr></thead><tbody>{stages.map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>)}</tbody></table></div>
        <p className="guide-article__callout"><strong>Majority target: 7 Horns.</strong> The source’s key strategic observation is that Stages I–III contain five Horns in total while Stages IV–VI contain eight. You can lose early stages and still control the matchup if the alliance preserves enough resources for the back half.</p>
      </>,
    },
    {
      id: 'matchmaking',
      eyebrow: 'Eligibility',
      title: 'Matchmaking and roster lock',
      content: <>
        <p>The supplied guide describes Brawl as targeting highly ranked alliances and gives a Sunday 23:00 UTC matchmaking lock. It says members need to be inside the alliance at the exact lock to contribute to that matchup.</p>
        <h3>Leaving and rejoining</h3>
        <p>A later source section says an eligible member can briefly leave and rejoin without losing eligibility, but points only count while they are inside the matched alliance. Because eligibility rules are easy for live events to change, Forge recommends treating the current Brawl event screen as authoritative before moving any scoring account.</p>
      </>,
    },
    {
      id: 'back-end',
      eyebrow: 'Primary winning model',
      title: 'Heavy back-end resource allocation',
      content: <>
        <div className="guide-article__steps">
          <article className="guide-article__step"><span>I</span><div><h3>Do not overpay for one Horn</h3><p>Clear efficient personal milestones on City day and make the opponent spend first unless the stage is naturally close.</p></div></article>
          <article className="guide-article__step"><span>II–III</span><div><h3>Use targeted stock</h3><p>Spend only resources that align with actual hero/pet progression or an overlapping event.</p></div></article>
          <article className="guide-article__step"><span>IV–V</span><div><h3>Increase pressure</h3><p>Gear, troop, convoy and rally tasks offer stronger free/efficient scoring and set up the final swing.</p></div></article>
          <article className="guide-article__step"><span>VI</span><div><h3>Four-Horn finale</h3><p>The 36-hour final stage counts broad categories and is where the source recommends releasing the remaining planned Brawl budget.</p></div></article>
        </div>
      </>,
    },
    {
      id: 'scoring',
      eyebrow: 'High-value actions',
      title: 'Know which tasks create real point spikes',
      content: <>
        <p>The uploaded guide gives several example values: convoys around 10,000 points, Terror rallies around 15,000, Forgehammers around 1,875, Widgets around 3,750 and Mithril around 18,750 per unit, plus tier-scaled troop and beast points.</p>
        <p className="guide-article__callout guide-article__callout--warning"><strong>Verify the live task table.</strong> Those point values are source examples. Do not burn Mithril, Widgets or training speedups based on an old scoring number when your current stage screen shows a different conversion.</p>
        <p>Before using a bottleneck, open it in Forge: <Link className="guide-article__link" to="/companion?q=Mithril">Mithril</Link>, <Link className="guide-article__link" to="/companion?q=Forgehammers">Forgehammers</Link> and <Link className="guide-article__link" to="/companion?q=Truegold">Truegold</Link>.</p>
      </>,
    },
    {
      id: 'f2p',
      eyebrow: 'Efficiency over spend',
      title: 'F2P stage-by-stage execution',
      content: <>
        <div className="guide-article__table-wrap"><table className="guide-article__table"><thead><tr><th>Stage</th><th>F2P plan</th></tr></thead><tbody>
          <tr><td>I · City</td><td>Minimum / milestone approach. Preserve the large speedup reserve.</td></tr>
          <tr><td>II · Heroes</td><td>Use naturally saved shards, EXP and source-described banked Intel where the current task list rewards them.</td></tr>
          <tr><td>III · Pets</td><td>Use planned Pet progression and stamina rather than spending for rank alone.</td></tr>
          <tr><td>IV · Gear</td><td>Spend saved Forgehammers/Mithril only if the upgrade is useful or the Horn is realistically contestable.</td></tr>
          <tr><td>V · Trade Baron</td><td>Max daily convoy/raid opportunities and source-rewarded Beast/Terror actions for high zero/low-cost score.</td></tr>
          <tr><td>VI · Full Push</td><td>Release the remaining Brawl allocation across all scoring categories after checking the overall Horn score.</td></tr>
        </tbody></table></div>
        <p className="guide-article__callout"><strong>Personal target:</strong> the source recommends milestone chests, not individual Top-10. Once your personal efficient rewards are cleared, the next spend should be justified by alliance Horn strategy.</p>
      </>,
    },
    {
      id: 'double-dip',
      eyebrow: 'One spend, multiple rewards',
      title: 'Synchronise overlapping events',
      content: <>
        <p>Alliance Brawl becomes much more efficient when its tasks overlap Merchant Empire, Armament Competition, Alliance Mobilization, hero growth or other reward tracks. Take the matching task first, then perform the shared action once.</p>
        <div className="guide-article__split">
          <article className="guide-article__card"><h3>Good double-dip</h3><p>Use 68 Mythic shards only when the same ascension scores Brawl and a second active task you already intend to complete.</p></article>
          <article className="guide-article__card"><h3>Bad double-dip</h3><p>Invent an upgrade you do not need just because two events are scoring it. Two mediocre returns do not automatically justify consuming a rare bottleneck.</p></article>
        </div>
      </>,
    },
    {
      id: 'snipe',
      eyebrow: 'Score visibility',
      title: 'Last-minute sniping and the fold threshold',
      content: <>
        <p>The supplied strategy advises holding instant-use scoring items — shards, Widgets, gear upgrades and completed troop batches — until the last part of the stage so the opponent cannot see your full scoring ceiling early.</p>
        <h3>Do not snipe a mathematically lost stage</h3>
        <p>If the opponent opens a huge gap on a one- or two-Horn stage, leadership should set a “fold and hold” threshold. Stop spending, let them over-invest, and redirect the saved inventory into Stage VI or the next KvK.</p>
        <p className="guide-article__callout"><strong>Tempo is the resource:</strong> a Brawl win is not measured by how many points you could have scored. It is measured by whether you secured at least seven Horns while wasting less future progression than the opponent.</p>
      </>,
    },
    {
      id: 'rallies',
      eyebrow: 'Stage V & VI activity',
      title: 'Rally trains, beasts and convoys',
      content: <>
        <ul>
          <li>Coordinate continuous eligible Terror/Beast rallies when those actions score the active stage.</li>
          <li>The source describes one-troop joiner cycling during quiet periods so marches return quickly and more players can participate without tying up full armies.</li>
          <li>Protect high-tier convoy escorts with stronger alliance members when escorting/raiding is part of the stage.</li>
          <li>Whales can act as the stamina engine by continuously launching the highest-value eligible rallies while F2P members fill.</li>
        </ul>
      </>,
    },
    {
      id: 'whales',
      eyebrow: 'Control the weekly tempo',
      title: 'Whale and spender strategy',
      content: <>
        <p>The source says whale value comes from point velocity and the ability to choose exactly when to reveal it.</p>
        <ul>
          <li>Use expensive progression packs on stages where their contents score highly and advance the account anyway.</li>
          <li>Do not flex an enormous lead at the start of a stage; it gives opposing spenders a clear purchase target.</li>
          <li>Coordinate with officers so spending stops as soon as the opponent has effectively conceded a stage.</li>
          <li>Reserve the largest planned Brawl budget for the four-Horn Stage VI unless the overall Horn map demands a different play.</li>
        </ul>
        <p>The uploaded guide claims Top-up Points themselves can score in some stage versions. Verify that live before assuming a purchase creates both item points and direct top-up points.</p>
      </>,
    },
    {
      id: 'kvk',
      eyebrow: 'Macro resource plan',
      title: 'Alliance Brawl vs Kingdom of Power',
      content: <>
        <p>The source gives a clear priority rule: <strong>KvK takes macro priority; Brawl takes micro priority.</strong> Brawl is recurring alliance growth. KvK affects the entire kingdom’s Prep result and Battle readiness.</p>
        <div className="guide-article__table-wrap"><table className="guide-article__table"><thead><tr><th>Resource</th><th>Brawl allocation</th><th>KvK allocation</th></tr></thead><tbody>{allocation.map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>)}</tbody></table></div>
        <p>The source recommends maintaining a hard floor of roughly 60–70% of major speedups and Truegold specifically for the next KvK when events are close together. Read the <Link className="guide-article__link" to="/guides/kingshot-kingdom-of-power-kvk-guide">Kingdom of Power guide</Link> before changing that reserve.</p>
      </>,
    },
    {
      id: 'intel',
      eyebrow: 'Zero-cost scoring',
      title: 'Intel banking and free actions',
      content: <>
        <p>The supplied guide describes completed Intel claims as a strong no-material scoring source in certain Brawl stages, alongside daily convoys, routine beast hunting and naturally regenerating stamina.</p>
        <p className="guide-article__callout guide-article__callout--warning"><strong>Banking behaviour may change.</strong> If your current client does not allow completed Intel to persist safely across reset/stages, do not risk losing the mission just to follow an older source tactic.</p>
      </>,
    },
    {
      id: 'leadership',
      eyebrow: 'R4 / R5 control',
      title: 'Alliance officer checklist',
      content: <>
        <ul>
          <li>Confirm roster eligibility before the source-described Sunday lock.</li>
          <li>Publish the current Horn score and the minimum number of remaining stages needed to win.</li>
          <li>Set a spending ceiling and fold threshold for each stage.</li>
          <li>Announce overlapping events/tasks before members spend resources.</li>
          <li>Call last-minute scoring windows clearly rather than encouraging random early dumps.</li>
          <li>Protect KvK reserve stock when Kingdom of Power is approaching.</li>
          <li>Continue baseline alliance milestone activity even after the overall Brawl is secure if it improves the source-described Star Rating / final rewards.</li>
        </ul>
      </>,
    },
    {
      id: 'faq',
      eyebrow: 'Quick answers',
      title: 'Alliance Brawl FAQ',
      content: <>
        <details><summary>How many Horns win the Brawl?</summary><p>The supplied guide gives 13 total Horns and a seven-Horn majority.</p></details>
        <details><summary>Which stage matters most?</summary><p>Stage VI: the source gives it four Horns and 36 hours, with all major scoring categories available.</p></details>
        <details><summary>Should F2P chase individual rank?</summary><p>The uploaded strategy says no: clear efficient personal milestones, then support the alliance Horn plan.</p></details>
        <details><summary>Should I spend Truegold in Brawl?</summary><p>Usually only when the stage is strategically important and the upgrade is useful. The source prioritises keeping most Truegold for KvK Prep.</p></details>
        <details><summary>Can I leave the alliance after matchmaking?</summary><p>The source claims eligible players may briefly leave/rejoin, but because this is a live eligibility rule Forge recommends checking the current Brawl event text before doing so.</p></details>
      </>,
    },
  ],
}
