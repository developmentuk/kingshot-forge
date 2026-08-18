import { Link } from 'react-router-dom'
import type { GuideArticleDefinition } from '../guideTypes'

const prepDays = [
  ['Monday', 'Construction', 'Construction / Universal Speedups, building completions, Truegold', 'Use the source-recommended Chief Minister construction buff before major completions.'],
  ['Tuesday', 'Research', 'Research / Universal Speedups, Academy technology', 'Finish pre-loaded research and prioritise high-value Military / combat technology.'],
  ['Wednesday', 'Pets & Charms', 'Taming Marks, Pet advancement, Governor Charms, Forgehammers', 'Spend saved system materials only to the milestone or kingdom target you actually need.'],
  ['Thursday', 'Troops', 'Training Speedups, troop promotion / training', 'Use the Noble Advisor training buff and consider promoting lower tiers for point efficiency.'],
  ['Friday', 'Sprint', 'Gathering, Hero Roulette, shards, Intel, final reserve', 'Review the kingdom score before releasing the last hoard; stop if the State Bonus is secure.'],
] as const

export const kingdomOfPowerGuide: GuideArticleDefinition = {
  slug: 'kingshot-kingdom-of-power-kvk-guide',
  title: 'Kingshot Kingdom of Power (KvK): Complete Prep & Battle Guide',
  shortTitle: 'Kingdom of Power (KvK)',
  eyebrow: 'Event Guide · Kingdom of Power / KvK',
  summary: 'KvK is a kingdom-scale resource and combat test: win Prep efficiently, protect non-combatants, coordinate Castle/Turret rallies and recover troops intelligently after the fight.',
  intro: 'Kingdom of Power is the supplied guide’s premier server-wide event: two kingdoms are matched, compete through a five-day Preparation phase, then fight across a cross-kingdom invasion and Castle battle before entering troop recovery. The best result starts weeks before Saturday — with resource hoarding, kingdom diplomacy, minister-title scheduling, shield discipline and clear battlefield roles.',
  theme: 'war',
  tags: ['KvK', 'cross-server', 'prep', 'Castle Battle', 'F2P', 'whales', 'Truegold', 'healing'],
  sourceNote: 'This article is based on the supplied Kingdom of Power guide. Timings, matchmaking inputs, daily Prep scoring categories, recovery percentages, role limits and battle rules can be changed by live event revisions. Forge preserves the source’s structure while labelling operational numbers as source-described rather than permanent constants.',
  alert: <><strong>Battle-day shield discipline is the safest default.</strong> The supplied guide recommends a 24-hour Peace Shield before the 10:00 UTC invasion opening for anyone who will be offline or is not assigned to active combat. Do not leave an offline city as easy enemy score.</>,
  connections: [
    { kind: 'tool', label: 'KvK Tracker', description: 'Open Forge’s existing KvK tracking area alongside this strategy guide.', to: '/kvk-tracker' },
    { kind: 'community', label: 'Kingdom Community', description: 'Use the Forge kingdom area for broader state coordination and community context.', to: '/kingdom-community' },
    { kind: 'item', label: 'Truegold', description: 'Search the Companion catalogue for a major KvK Prep progression resource.', to: '/companion?q=Truegold' },
    { kind: 'hero', label: 'Howard', description: 'Review a source-named defensive hero in the published Hero Companion.', to: '/companion/heroes/howard' },
    { kind: 'hero', label: 'Saul', description: 'Check Saul’s current construction and combat guidance rather than relying on event notes alone.', to: '/companion/heroes/saul' },
    { kind: 'guide', label: 'Alliance Brawl', description: 'Use Brawl’s resource-allocation guide to avoid draining the hoard you need for KvK Prep.', to: '/guides/kingshot-alliance-brawl-event-guide' },
    { kind: 'tool', label: 'Building Planner', description: 'Plan major building upgrades and resource requirements before Construction day.', to: '/calculators/buildings' },
  ],
  sections: [
    {
      id: 'timeline',
      eyebrow: 'Full-week structure',
      title: 'KvK phases and timing',
      content: <>
        <div className="guide-article__grid guide-article__grid--four">
          <article className="guide-article__card"><strong>2 days</strong><h3>Matchmaking</h3><p>The source places pairing and reconnaissance across Saturday–Sunday before Prep.</p></article>
          <article className="guide-article__card"><strong>5 days</strong><h3>Preparation</h3><p>Monday–Friday resource scoring determines the kingdom Prep result and source-described State Bonus.</p></article>
          <article className="guide-article__card"><strong>Saturday</strong><h3>Battle Phase</h3><p>The uploaded guide gives 10:00 UTC cross-kingdom access and a 12:00 UTC Castle battle start.</p></article>
          <article className="guide-article__card"><strong>Post-battle</strong><h3>Field Triage</h3><p>Recovery systems return a large proportion of source-described battle losses.</p></article>
        </div>
        <p className="guide-article__callout"><strong>Source timing:</strong> invasion opens at 10:00 UTC, the Castle battle is described as 12:00–17:00 UTC, and the broader invasion window closes at 22:00 UTC. Confirm your live event timer before building kingdom operations around those hours.</p>
      </>,
    },
    {
      id: 'matchmaking',
      eyebrow: 'Before Prep',
      title: 'Matchmaking and reconnaissance',
      content: <>
        <p>The source says KvK matchmaking uses historical peak power of recently active players together with Truegold tier and Hero Generation. It explicitly warns that removing gear, dismissing troops or resetting heroes does not lower the bracket because peak history is retained.</p>
        <h3>Reconnaissance</h3>
        <p>The supplied strategy recommends inspecting the opposing kingdom’s visible top players, alliances, Arena/Mystic-style rankings and hero progression as soon as the opponent is revealed. The objective is not perfect intelligence; it is to identify likely rally leaders, garrison anchors and the depth of the opposing active roster.</p>
        <p className="guide-article__callout"><strong>Governance starts here:</strong> publish the enemy whale/rally-lead list, likely Castle alliances, non-combatant shield policy and minister-title queue before Monday reset.</p>
      </>,
    },
    {
      id: 'prep',
      eyebrow: 'Days 3–7',
      title: 'Five-day Preparation plan',
      content: <>
        <div className="guide-article__table-wrap"><table className="guide-article__table"><thead><tr><th>Day</th><th>Focus</th><th>Resources</th><th>Execution</th></tr></thead><tbody>{prepDays.map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>)}</tbody></table></div>
        <p>The uploaded guide describes the Prep winner receiving a State Bonus of +15% Healing Speed and +200% Enlistment Capacity for Battle Phase. Treat those values as source-specific and verify the current event description.</p>
        <h3>Pre-load before the scoring day</h3>
        <p>Start long builds and research in advance so only the final completion happens after the relevant daily reset. For buildings, use the <Link className="guide-article__link" to="/calculators/buildings">Forge Building Planner</Link> to understand the real resource/time commitment before you schedule a major upgrade.</p>
      </>,
    },
    {
      id: 'hoarding',
      eyebrow: 'Three-week discipline',
      title: 'What F2P should save between KvKs',
      content: <>
        <p>The source’s central F2P rule is simple: resist spending major progression resources as soon as they appear. Save the things that convert into high-value Prep points, then spend them when they unlock both account growth and event milestones.</p>
        <ul>
          <li>Construction, Research, Training and Universal Speedups.</li>
          <li>Truegold and related building progression.</li>
          <li>Common/Advanced Taming Marks and Pet materials.</li>
          <li>Hero shards, especially Mythic or generation-specific stock.</li>
          <li>Forgehammers, Governor Charms and other gear materials.</li>
        </ul>
        <p className="guide-article__callout"><strong>Aim for milestones before leaderboards:</strong> the source recommends F2P players clear the reliable daily milestone chests and then stop unless there is a realistic kingdom need. Competing with top spenders for individual rank can empty the next month’s progression inventory.</p>
      </>,
    },
    {
      id: 'double-dip',
      eyebrow: 'Resource efficiency',
      title: 'Double-dip overlapping events',
      content: <>
        <p>Before spending a shard, speedup or gear material, check whether another live event rewards the same action. Alliance Mobilization, Alliance Brawl, Hero growth and other task systems can turn one expenditure into two or three reward tracks.</p>
        <p>The <Link className="guide-article__link" to="/guides/kingshot-alliance-brawl-event-guide">Alliance Brawl guide</Link> includes a dedicated resource allocation plan for protecting 60–80% of strategic hoardables for KvK while still collecting Brawl milestones.</p>
      </>,
    },
    {
      id: 'f2p',
      eyebrow: 'Low-spend battle role',
      title: 'F2P Battle Phase strategy',
      content: <>
        <div className="guide-article__steps">
          <article className="guide-article__step"><span>Shield</span><div><h3>Protect your own city</h3><p>If you are not an active city-fight target or cannot watch the whole window, use the source-recommended long Peace Shield before cross-kingdom teleports open.</p></div></article>
          <article className="guide-article__step"><span>Trap</span><div><h3>Reinforce a designated unshielded defender</h3><p>The source says a shielded player can still reinforce an unshielded ally and earn defensive/kill contribution when raiders attack that city.</p></div></article>
          <article className="guide-article__step"><span>Turret</span><div><h3>Use secondary structure rallies</h3><p>If you do not belong in the primary Castle rally, help with Turrets where your march can contribute without displacing stronger Castle joiners.</p></div></article>
          <article className="guide-article__step"><span>Heal</span><div><h3>Batch heal during active combat</h3><p>The uploaded strategy recommends 20–30 minute healing batches so Alliance Helps clear them quickly without consuming the whole speedup reserve.</p></div></article>
        </div>
        <p>The source also restricts city-attack scoring to targets within roughly ±3 Town Center levels. Verify the live target icon/rule before attacking; do not assume every enemy city produces points.</p>
      </>,
    },
    {
      id: 'castle',
      eyebrow: '12:00–17:00 source window',
      title: 'Castle and Turret priorities',
      content: <>
        <h3>Turrets are not side content</h3>
        <p>The supplied guide says Turret ownership affects pressure on the central Castle and provides Lethality advantages when controlled by the same kingdom. Assign dedicated secondary rally leaders instead of putting every whale into the centre.</p>
        <h3>Multi-rallies beat isolated heroics</h3>
        <p>Against a strong enemy Castle garrison, the source recommends two or three rallies timed within one or two seconds: the first drains the defence, the second attempts the capture, and a follow-up defensive formation secures the position.</p>
        <h3>A/B alliance rotation</h3>
        <p>Because the source says an alliance cannot rally a Castle it already controls, it proposes splitting top rally leads across two coordinated alliances. One can counter-rally when the other loses control, preserving pressure across the five-hour window.</p>
      </>,
    },
    {
      id: 'whales',
      eyebrow: 'Kingdom carry role',
      title: 'Whale and rally-lead responsibilities',
      content: <>
        <ul>
          <li><strong>Win the Prep gap:</strong> hold major high-value upgrades until kingdom officers know where a large point push is actually needed.</li>
          <li><strong>Lead, do not merely fill:</strong> the supplied guide says rally joiners inherit key combat stats from the Rally Leader, making leader quality more important than a smaller player’s raw march capacity.</li>
          <li><strong>Coordinate landing times:</strong> rally leaders should position close together and use voice comms to land multi-rallies inside a one-to-two-second window.</li>
          <li><strong>Hand off garrison leadership:</strong> once an offensive rally takes the Castle, swap to a defensive lead so offensive whales can immediately re-arm.</li>
          <li><strong>Keep the hospital moving:</strong> whales absorb the largest wound volume and cannot let full Infirmaries destroy their ability to keep fighting.</li>
        </ul>
        <p>For current hero information, use the <Link className="guide-article__link" to="/companion/heroes">Hero Companion</Link>. The uploaded event notes mention Howard, Gordon and Saul as defensive examples, but Forge does not extend that into an unpublished current-generation KvK tier list.</p>
      </>,
    },
    {
      id: 'healing',
      eyebrow: 'Troop preservation',
      title: 'Infirmary, Enlistment and Field Triage',
      content: <>
        <p>The source distinguishes different wound/recovery paths and repeatedly warns against letting the standard Infirmary fill during city/open-field combat.</p>
        <div className="guide-article__split">
          <article className="guide-article__card"><h3>Active battle healing</h3><p>Use small help-cleared batches rather than one huge hospital queue. Keeping troops cycling matters more than a tidy queue during Castle combat.</p></article>
          <article className="guide-article__card"><h3>Post-battle recovery</h3><p>The uploaded guide describes Field Triage as recovering up to 90% of eligible battle losses and gives a lower recovery path for some Enlistment Office overflow. Verify the current recovery interface before spending Gems.</p></article>
        </div>
        <h3>Rescue Orders first</h3>
        <p>The source recommends sending all available alliance Rescue Orders and requesting the maximum incoming assistance before buying Medical Satchels to close the remaining gap.</p>
      </>,
    },
    {
      id: 'titles',
      eyebrow: 'Kingdom operations',
      title: 'Minister titles, King skills and reset timing',
      content: <>
        <ul>
          <li>Queue Chief Minister or equivalent development roles before major Construction/Research completions.</li>
          <li>Use the Noble Advisor-style training role before large troop batches.</li>
          <li>The source recommends rotating titles around reset so more players can start long tasks under buffs.</li>
          <li>Schedule kingdom-wide King skills before 00:00 UTC where the live system supports advance scheduling.</li>
        </ul>
        <p className="guide-article__callout"><strong>Operational value:</strong> a kingdom title queue can produce more total Prep points without anyone spending an extra speedup. This is one of the clearest places where organisation beats wallet size.</p>
      </>,
    },
    {
      id: 'micro',
      eyebrow: 'Battle micro',
      title: 'High-level coordination details',
      content: <>
        <div className="guide-article__grid guide-article__grid--two">
          <article className="guide-article__card"><h3>Inter-rally reinforcement squeeze</h3><p>The source describes speed-reinforcing a Castle in the fraction of time between two enemy rally impacts so the second rally hits a refilled garrison.</p></article>
          <article className="guide-article__card"><h3>Counter Recon</h3><p>Use source-recommended war buffs / Counter Recon at the invasion opening so enemies cannot easily optimise against your visible city or garrison composition.</p></article>
          <article className="guide-article__card"><h3>Voice command channel</h3><p>Use a shared kingdom voice room for rally leaders and garrison commanders; text chat is too slow for one-second landing calls.</p></article>
          <article className="guide-article__card"><h3>Protect inactive cities</h3><p>Before the invasion window, identify offline unshielded cities and either get them shielded or coordinate a deliberate defensive plan so they do not become effortless enemy score.</p></article>
        </div>
      </>,
    },
    {
      id: 'checklist',
      eyebrow: 'Friday night → Saturday',
      title: 'Battle readiness checklist',
      content: <>
        <ul>
          <li>Confirm Prep score and stop unnecessary spending if the kingdom result is secure.</li>
          <li>Empty hospitals as far as possible before the invasion opens.</li>
          <li>Publish Castle/Turret rally leads, garrison leads and A/B alliance assignments.</li>
          <li>Apply Peace Shields for offline/non-combat players before the source-described 10:00 UTC opening.</li>
          <li>Prepare Attack, Defense and Counter Recon buffs where required by your kingdom strategy.</li>
          <li>Open the kingdom voice channel before Castle battle start.</li>
          <li>Keep Healing/Universal Speedups and Gems in reserve for actual battle needs.</li>
          <li>After battle, use Rescue Orders before buying recovery items.</li>
        </ul>
      </>,
    },
    {
      id: 'faq',
      eyebrow: 'Quick answers',
      title: 'Kingdom of Power FAQ',
      content: <>
        <details><summary>How far ahead should F2P save?</summary><p>The supplied guide recommends roughly three weeks of disciplined hoarding between KvK cycles.</p></details>
        <details><summary>Should I push individual Prep rank?</summary><p>F2P players are advised to clear milestone chests first and only chase rank if the kingdom needs the extra score and the cost is justified.</p></details>
        <details><summary>What time does the battle start?</summary><p>The source gives 10:00 UTC for cross-kingdom teleports and 12:00 UTC for the Castle battle, with the Castle window described through 17:00 UTC. Check the live event timer.</p></details>
        <details><summary>What should lower-power players do in battle?</summary><p>Stay shielded when appropriate, reinforce designated defenders, help on Turrets, join strong rallies and batch-heal rather than solo-attacking whales.</p></details>
        <details><summary>Should I spend Alliance Brawl resources before KvK?</summary><p>Only selectively. The supplied Brawl/KvK allocation model gives KvK macro priority and recommends keeping most major speedups, Truegold and high-tier shards for Prep.</p></details>
      </>,
    },
  ],
}
