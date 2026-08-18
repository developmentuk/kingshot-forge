import { Link } from 'react-router-dom'
import type { GuideArticleDefinition } from '../guideTypes'

const toolRows = [
  ['Ocean Prospector Map', 'Uses Treasure Charts/Prospector mode and temporarily maxes fishing gear to Level 10 in the supplied guide, with better rare-fish and chest spawns.'],
  ['Horn of the Tide', 'Summons a chosen rare fish and pairs with the Ocean Scanner to locate it.'],
  ['Ocean Scanner', 'Shows direction and distance guidance for rare targets during the cast.'],
  ['Lantern', 'Provides visibility in deep water below roughly 300m in the source.'],
  ['Reel / Stabilizer', 'Absorbs pullbacks or bumps and protects the descent.'],
  ['Fishing Voucher', 'Applies the source-described 1.5× multiplier to Fishing Points and Tokens for a cast.'],
] as const

export const fishingTournamentGuide: GuideArticleDefinition = {
  slug: 'kingshot-fishing-tournament-guide',
  title: 'Kingshot Fishing Tournament: Complete F2P & Leaderboard Guide',
  shortTitle: 'Fishing Tournament',
  eyebrow: 'Event Guide · Fishing Tournament',
  summary: 'Fishing Tournament rewards mechanical consistency, smart seasonal gear upgrades and disciplined use of persistent special items more than random casting.',
  intro: 'The Fishing Tournament combines a seasonal fishing mini-game with gear progression, collection goals, event currencies and leaderboards. The supplied strategy centres on three ideas: spend temporary Fishing Tokens quickly on the right upgrades, preserve persistent special items until they create a meaningful advantage, and treat every high-value cast as a controlled attempt rather than a throwaway roll.',
  theme: 'ocean',
  tags: ['Fishing Tournament', 'fishing', 'F2P', 'leaderboard', 'seasonal', 'gear', 'minigame', 'rewards'],
  sourceNote: 'This article is grounded in the supplied Fishing Tournament guide. Its leaderboard hoard thresholds, spender budgets and Top-3 expectations are estimates from that source, not guarantees. Event duration wording in the source mixes a four-week recurring cycle with a four-week seasonal rotation, so Forge avoids asserting a universal event window beyond the supplied seasonal model.',
  alert: <><strong>Fishing Tokens and special items behave differently in the supplied guide.</strong> Tokens are described as expiring into low-value resources at season end, while Prospector Maps, Vouchers and other special items are described as persistent if left unused. Do not confuse the two inventories.</>,
  connections: [
    { kind: 'item', label: 'Universal Mythic Shards', description: 'Search the Companion catalogue for Mythic shard identities before choosing Sunken Treasure or reward priorities.', to: '/companion?q=Mythic%20Shard' },
    { kind: 'item', label: 'Forgehammers', description: 'Open Forge item information for a recurring Fishing reward and progression bottleneck.', to: '/companion?q=Forgehammers' },
    { kind: 'item', label: 'Truegold', description: 'Review Truegold in Companion when comparing milestone and Polar-style progression rewards.', to: '/companion?q=Truegold' },
    { kind: 'guide', label: 'Mystic Divination', description: 'Compare another event where persistent currency hoarding can be more valuable than spending every cycle.', to: '/guides/kingshot-mystic-divination-event-guide' },
    { kind: 'guide', label: 'Twin Star Adventure', description: 'Open Forge’s other mini-game strategy guide for dice, board progression and shop optimisation.', to: '/guides/kingshot-twin-star-adventure-guide' },
    { kind: 'guide', label: 'Kingdom of Power (KvK)', description: 'Check whether Fishing-derived speedups and materials are better held for the next KvK Prep cycle.', to: '/guides/kingshot-kingdom-of-power-kvk-guide' },
  ],
  sections: [
    {
      id: 'mechanics',
      eyebrow: 'Core loop',
      title: 'Baits, charts, Tokens and Points',
      content: <>
        <div className="guide-article__grid guide-article__grid--four">
          <article className="guide-article__card"><strong>5 starting Baits</strong><h3>Regular fishing</h3><p>The source says Baits regenerate one every three hours and cap at ten.</p></article>
          <article className="guide-article__card"><strong>Treasure Charts</strong><h3>Ocean Prospector</h3><p>A separate high-value mode with temporarily maxed gear and improved rare-target spawns in the supplied guide.</p></article>
          <article className="guide-article__card"><strong>Fishing Tokens</strong><h3>Temporary progression</h3><p>Spend on fishing gear and Sunken Treasure. The source says unused Tokens convert into basic resources after the event/season.</p></article>
          <article className="guide-article__card"><strong>Fishing Points</strong><h3>Leaderboard score</h3><p>Used for personal and guild/alliance ranking rather than gear upgrades.</p></article>
        </div>
        <p className="guide-article__callout"><strong>Never sit at the Bait cap:</strong> the supplied guide recommends keeping natural Baits below 10 so the three-hour regeneration timer keeps producing free attempts.</p>
      </>,
    },
    {
      id: 'gear',
      eyebrow: 'Seasonal upgrades',
      title: 'Upgrade Line first, then Hook, then Sinker',
      content: <>
        <div className="guide-article__steps">
          <article className="guide-article__step"><span>1</span><div><h3>Line</h3><p>The source’s first priority because it increases maximum depth, up to a cited 550m, opening access to rarer and higher-scoring catches.</p></div></article>
          <article className="guide-article__step"><span>2</span><div><h3>Hook</h3><p>Increases maximum catch capacity per cast, letting a successful ascent convert more targets into score.</p></div></article>
          <article className="guide-article__step"><span>3</span><div><h3>Sinker</h3><p>Lowers the initial drop point and improves descent efficiency once depth and catch capacity are already funded.</p></div></article>
        </div>
        <p>The source says these upgrades reset with the seasonal Winter → Spring → Summer → Fall rotation. That is why it recommends spending Fishing Tokens promptly instead of hoarding a currency that will be force-converted later.</p>
      </>,
    },
    {
      id: 'controls',
      eyebrow: 'Mechanical execution',
      title: 'Descent, ascent and target priority',
      content: <>
        <h3>On the way down</h3>
        <p>Guide the lure around obstacles and use the screen edges to reduce unnecessary corrections. The supplied notes say repeated bumps can force an early ascent, wasting access to the deepest targets.</p>
        <h3>On the way up</h3>
        <p>The source says the hook needs to contact the fish’s head area; touching only the tail may not register. Plan an ascent route through the highest-value targets rather than chasing every fish.</p>
        <ol>
          <li><strong>Sparkling / high-star fish</strong> for the highest base points.</li>
          <li><strong>Wrapped mermaids</strong> for the source-described score multiplier; healthy/unwrapped mermaids are not given the same bonus in the supplied strategy.</li>
          <li><strong>Ocean chests</strong> for high points and bonus consumables.</li>
        </ol>
        <p className="guide-article__callout"><strong>Deep-water visibility:</strong> the source treats the Lantern as essential below roughly 300m. If you are targeting high-star deep species, equip the tool before committing a high-value cast.</p>
      </>,
    },
    {
      id: 'tools',
      eyebrow: 'Special items',
      title: 'Know what every consumable is for',
      content: <>
        <div className="guide-article__table-wrap"><table className="guide-article__table"><thead><tr><th>Item</th><th>Source-described role</th></tr></thead><tbody>{toolRows.map((row) => <tr key={row[0]}><td><strong>{row[0]}</strong></td><td>{row[1]}</td></tr>)}</tbody></table></div>
        <h3>Power Cast</h3>
        <p>The supplied guide says Power Cast unlocks after maxing the Fishing Kit and recording 50 species in the seasonal index, allowing 2×, 3× or 5× consumption of Baits/Charts to multiply output. Because that mechanic materially changes resource burn, verify the unlock conditions in the current event before planning an all-in push.</p>
      </>,
    },
    {
      id: 'first-cast',
      eyebrow: 'Opening advantage',
      title: 'Use the first strong cast to accelerate gear',
      content: <>
        <p>The supplied strategy recommends pairing an early Ocean Prospector Map with a Fishing Voucher so the first high-quality cast produces a large Token injection. Those Tokens then fund Line and Hook before natural Baits are spent.</p>
        <div className="guide-article__split">
          <article className="guide-article__card"><h3>Why it works</h3><p>Better gear improves later ordinary casts, so early Tokens have compounding value across the rest of the season.</p></article>
          <article className="guide-article__card"><h3>When not to do it</h3><p>If you are intentionally hoarding persistent Maps and Vouchers for a future leaderboard push, keep the stockpile intact and accept slower progression this cycle.</p></article>
        </div>
      </>,
    },
    {
      id: 'f2p',
      eyebrow: 'Long-term leaderboard plan',
      title: 'F2P hoarding strategy',
      content: <>
        <p>The source argues that natural Bait regeneration alone cannot reliably beat active spenders. Its alternative is to save persistent premium items across several cycles and make one concentrated push.</p>
        <div className="guide-article__table-wrap"><table className="guide-article__table"><thead><tr><th>Source target</th><th>Suggested hoard</th><th>Purpose</th></tr></thead><tbody>
          <tr><td>Ocean Prospector Maps</td><td>25–30</td><td>High-quality max-gear attempts.</td></tr>
          <tr><td>Fishing Vouchers</td><td>20–25</td><td>1.5× Points and Token multipliers in the source.</td></tr>
          <tr><td>Horns of the Tide</td><td>12–15</td><td>Target selected rare species.</td></tr>
          <tr><td>Reel Stabilizers</td><td>30+</td><td>Protect high-value casts from poor descent execution.</td></tr>
          <tr><td>Scanners & Lanterns</td><td>15+ each</td><td>Tracking and deep-water visibility.</td></tr>
        </tbody></table></div>
        <p className="guide-article__callout guide-article__callout--warning"><strong>These are source estimates, not a Top-3 guarantee.</strong> Leaderboard strength is entirely dependent on your kingdom, season, player activity, paid multipliers and event version.</p>
      </>,
    },
    {
      id: 'push',
      eyebrow: 'All-in cycle',
      title: 'How the supplied Top-rank push is executed',
      content: <>
        <div className="guide-article__steps">
          <article className="guide-article__step"><span>Cast 1</span><div><h3>Generate an early Token spike</h3><p>Use a strong Prospector attempt with the intended multiplier, then push Line and Hook quickly.</p></div></article>
          <article className="guide-article__step"><span>Max</span><div><h3>Unlock Power Cast</h3><p>Complete the seasonal collection and kit requirements described by the live event, then use multi-attempt casts only when the return justifies the burn rate.</p></div></article>
          <article className="guide-article__step"><span>Audit</span><div><h3>Check the kingdom before committing</h3><p>The source recommends abandoning the push if several players are already far beyond your realistic hoard capacity early in the event.</p></div></article>
          <article className="guide-article__step"><span>Late</span><div><h3>Keep reserve for the end</h3><p>The supplied strategy suggests holding back some Maps/Vouchers until the final hours so you are not advertising your full ceiling to competitors.</p></div></article>
        </div>
      </>,
    },
    {
      id: 'reset',
      eyebrow: 'Source-described retry mechanic',
      title: 'Pause → Retreat → Play Again',
      content: <>
        <p>The supplied guide describes a P-R-P retry sequence that it says can preserve certain special consumables after a poor cast: pause, choose Retreat, then Play Again. Because retry/refund behaviour can be changed by client updates, Forge presents this only as a source-described mechanic.</p>
        <p className="guide-article__callout guide-article__callout--warning"><strong>Verify before using valuable stock:</strong> test the behaviour with a low-value attempt in the current client rather than assuming an old reset interaction still preserves Maps, Horns, Scanners or Vouchers.</p>
      </>,
    },
    {
      id: 'whales',
      eyebrow: 'Spender landscape',
      title: 'What paid advantages change',
      content: <>
        <p>The source identifies three main spender advantages: passive paid point multipliers, much larger special-item inventories and earlier access to repeated Power Casts. It groups competitors into Dolphin, heavy-whale and Kraken-style tiers, but the dollar bands are only source estimates.</p>
        <h3>What F2P can still exploit</h3>
        <ul>
          <li>Better execution on every cast.</li>
          <li>Choosing a quieter seasonal rotation rather than pushing into an obviously unwinnable leaderboard.</li>
          <li>Persistent-item hoarding across multiple cycles.</li>
          <li>Late deployment of saved attempts rather than exposing the full score ceiling on Day 1.</li>
        </ul>
      </>,
    },
    {
      id: 'seasonal',
      eyebrow: 'Collection management',
      title: 'Seasonal fish and Horn targeting',
      content: <>
        <p>The source recommends prioritising species that are available in the current and previous season before fish that will also appear next season. The reason is simple: missing a Spring/Summer fish while currently in Summer may force a much longer wait than missing a Summer/Autumn species.</p>
        <h3>Mermaid depth interaction</h3>
        <p>The supplied guide claims that summoning a fish at one depth can affect where random mermaids appear, and recommends shallow Horn summons when targeting deeper rare mermaids. Treat that as source strategy rather than a verified spawn formula.</p>
      </>,
    },
    {
      id: 'treasure',
      eyebrow: 'End-of-season spend',
      title: 'Do not let Fishing Tokens convert into filler',
      content: <>
        <p>Once Line, Hook and Sinker are maxed, the source recommends spending every remaining temporary Fishing Token on Sunken Treasure pulls rather than allowing the tokens to convert into basic resources.</p>
        <p>Prioritise high-value tiles such as Mythic Shards and Governor Gear materials over low-tier consumables. Use the <Link className="guide-article__link" to="/companion?q=Mythic%20Shard">Companion Mythic Shard search</Link> and <Link className="guide-article__link" to="/companion?q=Governor%20Gear">Governor Gear search</Link> to connect those rewards to Forge’s published item knowledge.</p>
      </>,
    },
    {
      id: 'faq',
      eyebrow: 'Quick answers',
      title: 'Fishing Tournament FAQ',
      content: <>
        <details><summary>What should I upgrade first?</summary><p>Line first, then Hook, then Sinker according to the supplied strategy.</p></details>
        <details><summary>Do Fishing Tokens carry over?</summary><p>The supplied guide says no: unused Tokens convert into basic resources. Special items such as Maps and Vouchers are described separately as persistent.</p></details>
        <details><summary>Should I use every Prospector Map immediately?</summary><p>Not necessarily. For routine progression, an early Map can accelerate gear. For a deliberate leaderboard push, the source recommends saving Maps across multiple cycles.</p></details>
        <details><summary>Can F2P guarantee Top 3?</summary><p>No. The uploaded source provides hoard estimates, but Forge does not treat a leaderboard result as guaranteed because competition varies by kingdom and event cycle.</p></details>
        <details><summary>What is the best deep-water tool?</summary><p>The supplied notes treat the Lantern as essential once visibility drops below roughly 300m.</p></details>
      </>,
    },
  ],
}
