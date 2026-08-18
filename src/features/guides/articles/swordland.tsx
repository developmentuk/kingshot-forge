import { Link } from 'react-router-dom'
import type { GuideArticleDefinition } from '../guideTypes'

const timeline = [
  ['00–03', 'Phase 1 rush', 'Enter immediately, claim outer structures, establish Bell Tower / Royal Stables positions, and let substitutes fill empty roster slots after the source’s three-minute threshold.'],
  ['03–12', 'Lock early control', 'Finish captures, defend mobility/capture-speed buildings and use the Attack team to disrupt enemy towns and recalls.'],
  ['12–15', 'Pre-position', 'Place markers and stage rally leaders around Hall of Reformation, Mercenary Camp and Swordshrine.'],
  ['15–30', 'Phase 2', 'Contest Hall of Reformation, use Mercenary Camp pressure and maintain side-building point income.'],
  ['30–45', 'Rotation', 'Gather Undercellars, refresh depleted players where needed and scout central garrisons.'],
  ['45–55', 'Swordshrine assault', 'Coordinate late double rallies and prepare to collect stored points if control flips.'],
  ['55–60', 'Lockdown', 'Hold key structures, sweep point drops and use spare marches on final Undercellars.'],
] as const

export const swordlandGuide: GuideArticleDefinition = {
  slug: 'kingshot-swordland-showdown-summit-league-guide',
  title: 'Kingshot Swordland: Showdown & Summit League Guide',
  shortTitle: 'Swordland',
  eyebrow: 'Event Guide · Swordland Showdown & Summit League',
  summary: 'Swordland rewards coordinated map control more than isolated fighting: secure the buildings that improve movement and capture speed, distribute battlefield roles, and preserve enough force for the late Swordshrine swing.',
  intro: 'Swordland is a one-hour cross-server alliance battlefield built around Relic Points, structure control, point drops and rapid role-based coordination. The supplied guide covers both standard Swordland Showdown and the seasonal Summit League, with the same central lesson: the team that controls movement, capture timing and the final high-value structures can beat a roster with more raw power.',
  theme: 'ice',
  tags: ['Swordland', 'cross-server', 'PvP', 'alliance', 'Relic Points', 'garrison', 'F2P', 'rallies'],
  sourceNote: 'This article follows the supplied Swordland guide. Exact matchmaking inputs, capture timers, shop stock, re-entry cooldowns and building values can change with event revisions; figures below are presented as source-described mechanics rather than silently promoted to permanent game constants.',
  alert: <><strong>Roster lock matters.</strong> The supplied guide warns that alliance changes or kingdom transfers around registration can disqualify participation. Treat the in-game registration screen as authoritative before anyone moves between alliances.</>,
  connections: [
    { kind: 'hero', label: 'Howard', description: 'Open Howard’s Hero Companion page for a published defensive hero profile referenced by the Swordland source.', to: '/companion/heroes/howard' },
    { kind: 'hero', label: 'Saul', description: 'Review Saul’s published role before using him in garrison or support formations.', to: '/companion/heroes/saul' },
    { kind: 'hero', label: 'Hilde', description: 'Check Hilde’s Hero Companion profile for defensive suitability in your current generation.', to: '/companion/heroes/hilde' },
    { kind: 'guide', label: 'Generation 6 Heroes', description: 'Use the Gen 6 guide when your Swordland roster includes Yang, Sophia or Triton.', to: '/guides/kingshot-generation-6-heroes-yang-sophia-triton-guide' },
    { kind: 'guide', label: 'Viking Vengeance', description: 'Compare Guard Station, garrison and reinforcement discipline with another alliance defence event.', to: '/guides/kingshot-viking-vengeance-event-guide' },
    { kind: 'guide', label: 'Kingdom of Power (KvK)', description: 'Move from one-hour alliance combat into the broader cross-kingdom Castle and Turret playbook.', to: '/guides/kingshot-kingdom-of-power-kvk-guide' },
    { kind: 'community', label: 'Alliance Directory', description: 'Open Forge’s Alliance Directory when organising active rosters and alliance operations.', to: '/alliance-directory' },
  ],
  sections: [
    {
      id: 'registration',
      eyebrow: 'Before the match',
      title: 'Registration, Legions and substitutes',
      content: <>
        <div className="guide-article__grid guide-article__grid--four">
          <article className="guide-article__card"><strong>2 Legions</strong><h3>Alliance capacity</h3><p>The source says an alliance can enter up to two Legions.</p></article>
          <article className="guide-article__card"><strong>30 active</strong><h3>Battlefield limit</h3><p>Thirty combatants can be inside each battlefield at once.</p></article>
          <article className="guide-article__card"><strong>20 substitutes</strong><h3>Reserve roster</h3><p>The supplied roster model supports up to twenty substitutes per Legion.</p></article>
          <article className="guide-article__card"><strong>3 minutes</strong><h3>Entry window</h3><p>The source says substitutes can take open slots if a main member has not entered in the opening three minutes.</p></article>
        </div>
        <h3>Matchmaking and league tiers</h3>
        <p>The supplied guide says matchmaking considers preferred timeslot, win/loss history and an average based on the top 20 applicants, and describes Royal, Master, Diamond, Platinum and Gold seasonal brackets. Treat those inputs as source-described because event matchmaking rules can be revised server-side.</p>
        <p className="guide-article__callout"><strong>Officer job:</strong> finalise the roster before lock, keep all substitutes reachable at match start, and publish roles before anyone enters. The first three minutes are too valuable to spend deciding who is supposed to defend what.</p>
      </>,
    },
    {
      id: 'buildings',
      eyebrow: 'Map priorities',
      title: 'Which buildings matter most?',
      content: <>
        <div className="guide-article__grid">
          <article className="guide-article__card"><strong>Bell Tower</strong><h3>Capture-speed priority</h3><p>The source says it halves other building capture time from three minutes to about 1.5 minutes, making it one of the most important opening targets.</p></article>
          <article className="guide-article__card"><strong>Royal Stables</strong><h3>Mobility priority</h3><p>Described as halving the free teleport cooldown from ten minutes to five.</p></article>
          <article className="guide-article__card"><strong>Sanctums & Abbeys</strong><h3>Steady income</h3><p>Side structures create the early and mid-game Relic Point base that keeps your alliance competitive while the centre is contested.</p></article>
          <article className="guide-article__card"><strong>Swordshrine</strong><h3>Highest-value centre</h3><p>Unlocks in Phase 2 and is described as the largest single point-generating structure.</p></article>
          <article className="guide-article__card"><strong>Hall of Reformation</strong><h3>Combat buff</h3><p>The supplied guide gives a +15% Damage Boost and Damage Reduction effect for the alliance on the battlefield.</p></article>
          <article className="guide-article__card"><strong>Mercenary Camp</strong><h3>Pressure tool</h3><p>Allows automated mercenary waves against enemy-held structures according to the source.</p></article>
        </div>
        <h3>Undercellars</h3>
        <p>Late-game Undercellars are described as safe gathering tiles that award personal and alliance points. The source’s examples put their contribution in the tens of thousands during close finishes, which is why spare F2P marches should not sit idle in the final quarter.</p>
      </>,
    },
    {
      id: 'scoring',
      eyebrow: 'Relic Points',
      title: 'Capture timers, stored points and point stealing',
      content: <>
        <p>Entering an unoccupied structure starts a capture countdown. The supplied guide says no occupation points are earned until that countdown finishes, which makes Bell Tower control valuable beyond its own score.</p>
        <h3>Stored points can turn a match</h3>
        <p>The source says roughly half of a held building’s generated points accumulate visibly on the structure. If an enemy captures it, those stored points spill into gatherable drops. Fast marches should be ready whenever a long-held structure is about to flip.</p>
        <div className="guide-article__split">
          <article className="guide-article__card"><h3>Do not overcommit to ownership alone</h3><p>A late capture can be worth the building plus the accumulated drops, so a structure that appears “lost” for twenty minutes may still be a planned end-game target.</p></article>
          <article className="guide-article__card"><h3>Assign a loot swarm</h3><p>The F2P strategy recommends fast low-cost marches to collect scattered points immediately while whales and rally leaders stay focused on the structure fight.</p></article>
        </div>
      </>,
    },
    {
      id: 'timeline',
      eyebrow: '60-minute plan',
      title: 'Swordland match timeline',
      content: <>
        <div className="guide-article__table-wrap"><table className="guide-article__table"><thead><tr><th>Minute</th><th>Phase</th><th>Operational focus</th></tr></thead><tbody>{timeline.map((row) => <tr key={row[0]}><td><strong>{row[0]}</strong></td><td>{row[1]}</td><td>{row[2]}</td></tr>)}</tbody></table></div>
        <p className="guide-article__callout"><strong>Late-game principle:</strong> the supplied strategy favours building a point base first, then using coordinated late rallies to take Swordshrine and harvest stored points near the end rather than draining the whole roster trying to hold centre for the entire match.</p>
      </>,
    },
    {
      id: 'roles',
      eyebrow: 'Roster design',
      title: 'Split the 30 players into jobs',
      content: <>
        <div className="guide-article__grid">
          <article className="guide-article__card"><strong>~10</strong><h3>Attack Team</h3><p>Mobile players who pressure enemy cities, disrupt rallies, force recalls and collect opportunities created by movement.</p></article>
          <article className="guide-article__card"><strong>~10</strong><h3>Support Team</h3><p>Primary rally leaders, whale carries and flexible reinforcers for Phase 2 objectives and the final Swordshrine sequence.</p></article>
          <article className="guide-article__card"><strong>~10</strong><h3>Defense Team</h3><p>Garrison specialists split across Bell Tower, Royal Stables, Sanctums and Abbeys to preserve the team’s passive advantages.</p></article>
        </div>
        <h3>Voice comms and shot-calling</h3>
        <p>The source strongly recommends one or two dedicated shot-callers. Standard members should keep voice clear and report only actionable information such as an empty objective, incoming rally or enemy city with all marches deployed.</p>
      </>,
    },
    {
      id: 'f2p',
      eyebrow: 'Utility wins matches',
      title: 'F2P and low-spender playbook',
      content: <>
        <div className="guide-article__steps">
          <article className="guide-article__step"><span>Loot</span><div><h3>Sweep point drops</h3><p>Use fast marches when buildings flip. The source presents this as one of the highest-value F2P tasks because it converts other players’ combat into direct team score.</p></div></article>
          <article className="guide-article__step"><span>Fill</span><div><h3>Join whale rallies and garrisons</h3><p>Do not compete with stronger accounts for leadership. Fill the best rally and defensive leaders with your highest-value troops and suitable joiner heroes.</p></div></article>
          <article className="guide-article__step"><span>Farm</span><div><h3>Gather Undercellars</h3><p>When high-power players are occupied at centre, use spare marches to collect safe late-game points.</p></div></article>
          <article className="guide-article__step"><span>Reset</span><div><h3>Use the source-described leave-and-re-enter heal</h3><p>The supplied guide says leaving through the scoreboard fully heals troops and imposes a 12-minute re-entry cooldown. Treat that as a current-client mechanic to verify before relying on it in a live match.</p></div></article>
        </div>
        <h3>Joiner heroes</h3>
        <p>The source names Jabel, Quinn, Chenko and Amane as offensive joiner examples and Howard or Gordon for defensive garrison filling. Check the <Link className="guide-article__link" to="/companion/heroes">Hero Companion</Link> rather than assuming every named hero is optimal for your generation.</p>
      </>,
    },
    {
      id: 'whales',
      eyebrow: 'Heavy artillery',
      title: 'Whale and rally-lead responsibilities',
      content: <>
        <ul>
          <li><strong>Lead the decisive rallies:</strong> major Phase 2 structures and Swordshrine should use the account with the strongest relevant rally stats.</li>
          <li><strong>Anchor key garrisons:</strong> the source recommends using whale defensive stats to make Bell Tower or other contested structures expensive to break.</li>
          <li><strong>Disrupt without wasting power:</strong> pressure exposed enemy cities, but leave Abbeys, point drops and routine gathering to lower-power members.</li>
          <li><strong>Save speedups for the final push:</strong> the supplied plan prioritises rapid healing and back-to-back centre rallies in the last ten minutes.</li>
        </ul>
        <h3>Double-rally timing</h3>
        <p>The source recommends two rallies landing roughly one to two seconds apart: the first drains the established garrison and the second attempts the capture before defenders can refill. Similar timing principles appear in the <Link className="guide-article__link" to="/guides/kingshot-kingdom-of-power-kvk-guide">KvK Castle guide</Link>.</p>
      </>,
    },
    {
      id: 'heroes',
      eyebrow: 'Garrison planning',
      title: 'Defensive heroes and troop ratios',
      content: <>
        <p>The supplied material names Howard, Gordon, Saul and Hilde alongside later-generation defensive heroes. It gives 60% Infantry / 40% Cavalry / 0% Archers and 50/30/20 as example garrison shapes, but the correct formation depends on the actual garrison lead and published hero effects.</p>
        <div className="guide-article__related-grid">
          <Link className="guide-article__related-card" to="/companion/heroes/howard"><span>Hero Companion</span><h3>Howard</h3><p>Review his current published garrison and joiner ratings.</p></Link>
          <Link className="guide-article__related-card" to="/companion/heroes/saul"><span>Hero Companion</span><h3>Saul</h3><p>Check his current skills and best-use guidance.</p></Link>
          <Link className="guide-article__related-card" to="/guides/kingshot-generation-6-heroes-yang-sophia-triton-guide"><span>Hero guide</span><h3>Generation 6</h3><p>Use governed Gen 6 information instead of extending older Swordland examples by guesswork.</p></Link>
        </div>
      </>,
    },
    {
      id: 'healing',
      eyebrow: 'Battlefield resets',
      title: 'Troops, healing and city burns',
      content: <>
        <p>The supplied guide states that Swordland does not cause permanent troop deaths and that hospital capacity limits are ignored inside the battlefield. It also says standard alliance Help healing is disabled, with event healing speedups and march boosts supplied over time.</p>
        <h3>City burn response</h3>
        <p>If a stronger enemy commits to your Town Center, the source recommends emptying the city into useful marches or teleporting away. If the Town Center reaches zero health, it describes a forced teleport back to alliance spawn without troop loss.</p>
        <p className="guide-article__callout guide-article__callout--warning"><strong>Timing caution:</strong> the source gives a 10–20 second burn-to-spawn example for Swordland. Treat this as observed/source guidance, not a guaranteed universal timer.</p>
      </>,
    },
    {
      id: 'advanced',
      eyebrow: 'High-bracket execution',
      title: 'Advanced Swordland tactics',
      content: <>
        <div className="guide-article__grid guide-article__grid--two">
          <article className="guide-article__card"><h3>Counter-rally after a flip</h3><p>Time your return rally to land just after the enemy takes a building, before they can rebuild a full defensive garrison.</p></article>
          <article className="guide-article__card"><h3>Instant recall via teleport</h3><p>The source says teleporting your city can immediately bring distant marches back, creating an emergency regroup tool.</p></article>
          <article className="guide-article__card"><h3>Kite a dominant whale</h3><p>Do not spend the whole match attacking one superior account. Occupy them on one side while the rest of the roster controls secondary structures.</p></article>
          <article className="guide-article__card"><h3>Keep safe-zone attackers mobile</h3><p>Operate near the edge of safety and use boosted marches to exploit weak buildings or point drops without presenting an easy city target.</p></article>
        </div>
      </>,
    },
    {
      id: 'shop',
      eyebrow: 'After the fight',
      title: 'Swordland rewards and shop priority',
      content: <>
        <p>The supplied F2P advice places high-tier progression materials such as Artisan’s Visions and Governor Charm / Gear upgrade materials above basic resources or replaceable hero shards.</p>
        <p>Before spending Swordland Coins, compare the item with the current Forge Companion catalogue. For example, open the <Link className="guide-article__link" to="/companion?q=Artisan">Artisan item search</Link> or <Link className="guide-article__link" to="/companion?q=Charm">Charm item search</Link> and use the published data available for your account stage.</p>
      </>,
    },
    {
      id: 'checklist',
      eyebrow: '10 minutes before entry',
      title: 'Pre-match checklist',
      content: <>
        <ul>
          <li>Confirm active roster, substitutes and the three role groups.</li>
          <li>Set map markers and objective names before the battlefield opens.</li>
          <li>Prepare a defensive/garrison preset, rally preset and fast capture presets.</li>
          <li>Apply the source-recommended combat buffs and Counter Recon if your alliance uses them.</li>
          <li>Confirm substitute availability for the first three minutes.</li>
          <li>Join the designated voice channel and keep non-essential comms clear.</li>
          <li>Know who leads Bell Tower, Stables, Hall and Swordshrine rallies.</li>
        </ul>
      </>,
    },
    {
      id: 'faq',
      eyebrow: 'Quick answers',
      title: 'Swordland FAQ',
      content: <>
        <details><summary>What should we take first?</summary><p>The supplied guide prioritises Bell Tower for capture speed and Royal Stables for teleport mobility, while Sanctums and Abbeys build early point income.</p></details>
        <details><summary>What should F2P players do?</summary><p>Collect point drops, fill the strongest rallies/garrisons and gather Undercellars rather than trying to lead fights against whales.</p></details>
        <details><summary>Can troops die permanently?</summary><p>The supplied source says no inside Swordland, but Forge recommends checking the current event rules screen after major updates.</p></details>
        <details><summary>When does Swordshrine matter most?</summary><p>It unlocks in Phase 2, but the supplied advanced plan often saves the decisive double-rally push for the final 10–15 minutes.</p></details>
        <details><summary>Why use Bell Tower?</summary><p>The source describes it as halving the capture countdown for other structures, accelerating every later flip while you control it.</p></details>
      </>,
    },
  ],
}
