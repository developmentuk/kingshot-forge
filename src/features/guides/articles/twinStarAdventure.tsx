import { Link } from 'react-router-dom'
import type { GuideArticleDefinition } from '../guideTypes'

const milestoneRows = [
  ['30', '100 Twinstar Coins'], ['60', '1 Crystal Die'], ['120', '500 Twinstar Coins'], ['180', '2 Crystal Dice'], ['300', '1,000 Twinstar Coins'], ['600', '3 Crystal Dice'], ['900', '3,000 Twinstar Coins'], ['1,200', '6 Crystal Dice'], ['1,500', '5,000 Twinstar Coins'], ['2,000', '10 Crystal Dice'],
] as const

const bossRows = [
  ['200', '20', 'Mythic Shards / Truegold / Speedups'], ['500', '40', 'Gems + Enhancement XP'], ['1,200', '60', 'Truegold / Speedups + Forgehammers'], ['2,000', '80', 'Gems + Lucky Hero Gear Chest'], ['3,500', '100', 'Truegold / Speedups + Enhancement XP'], ['5,500', '120', 'Gems + Forgehammers'], ['8,000', '160', 'Truegold / Speedups + Lucky Hero Gear Chest'],
] as const

export const twinStarAdventureGuide: GuideArticleDefinition = {
  slug: 'kingshot-twin-star-adventure-guide',
  title: 'Kingshot Twin Star Adventure: Dice, Team & Polar Shop Guide',
  shortTitle: 'Twin Star Adventure',
  eyebrow: 'Event Guide · Twin Star Adventure',
  summary: 'Twin Star Adventure rewards coordinated three-player teams, patient Crystal Dice use and late-event precision landings on upgraded tiles.',
  intro: 'Twin Star Adventure is a three-player board event that mixes random Twin Star Dice, precision Crystal Dice, team-wide coin triggers and Ice Megalodon damage. The supplied strategy is built around restraint: use ordinary dice to loop and level the board, save Crystal Dice for exact high-value landings, and choose teammates whose activity level matches your own goals because their Backup and Bomb tiles feed your progress too.',
  theme: 'polar',
  tags: ['Twin Star Adventure', 'team', 'dice', 'Twinstar Coins', 'Ice Megalodon', 'F2P', 'board', 'Polar Shop'],
  sourceNote: 'This article follows the supplied Twin Star Adventure guide. The source contains conflicting free-dice totals — one section says the Polar Handbook provides up to 14 dice over seven days, while a later task table describes three dice per day (21 total) before additional King of the Arctic and Frosty Symphony rewards. Forge flags that discrepancy and tells players to use the live mission screen for the real count.',
  alert: <><strong>Choose the team before you spend.</strong> The supplied guide says the three-player team becomes fixed after matchmaking lock. Because teammate tile triggers award coins and Depth Bombs to the group, inactive partners directly reduce everyone’s ceiling.</>,
  connections: [
    { kind: 'item', label: 'Truegold', description: 'Search Forge Companion for a recurring Twin Star milestone and Polar Shop progression reward.', to: '/companion?q=Truegold' },
    { kind: 'item', label: 'Forgehammers', description: 'Review a source-prioritised gear material before spending Twinstar Coins.', to: '/companion?q=Forgehammers' },
    { kind: 'item', label: 'Universal Mythic Shards', description: 'Open Companion item search for the F2P Polar Shop priority named in the supplied guide.', to: '/companion?q=Mythic%20Shard' },
    { kind: 'guide', label: 'Fishing Tournament', description: 'Compare another Kingshot mini-game where persistent precision items and seasonal planning matter.', to: '/guides/kingshot-fishing-tournament-guide' },
    { kind: 'guide', label: 'Kingdom of Power (KvK)', description: 'Decide whether converted Training Speedups should be held for the next KvK troop day.', to: '/guides/kingshot-kingdom-of-power-kvk-guide' },
    { kind: 'hero', label: 'Hero Companion', description: 'Review hero progression before choosing Mythic Shards or Hero Badges from the Polar Shop.', to: '/companion/heroes' },
  ],
  sections: [
    {
      id: 'mechanics',
      eyebrow: 'Board basics',
      title: 'Three players, two dice types and one shared boss',
      content: <>
        <div className="guide-article__grid guide-article__grid--four">
          <article className="guide-article__card"><strong>3 players</strong><h3>Fixed team</h3><p>The source says the group locks once matchmaking starts and cannot be changed mid-event.</p></article>
          <article className="guide-article__card"><strong>1–6</strong><h3>Twin Star Die</h3><p>Moves a random number of board spaces.</p></article>
          <article className="guide-article__card"><strong>Choose 1–6</strong><h3>Crystal Die</h3><p>Lets you select the exact move distance and should be reserved for high-value landings.</p></article>
          <article className="guide-article__card"><strong>Team damage</strong><h3>Ice Megalodon</h3><p>Starting-tile hits, Bomb Tiles and Depth Bombs contribute to shared boss milestones.</p></article>
        </div>
      </>,
    },
    {
      id: 'tiles',
      eyebrow: 'Board control',
      title: 'The tiles worth targeting',
      content: <>
        <div className="guide-article__grid guide-article__grid--two">
          <article className="guide-article__card"><strong>Tile 1</strong><h3>Starting Tile</h3><p>Passing it upgrades two Item Tiles by +1 XP in the source. Landing exactly upgrades three Item Tiles and deals 100 damage to the Ice Megalodon.</p></article>
          <article className="guide-article__card"><strong>Tiles 8 & 20</strong><h3>Backup Tiles</h3><p>The source gives 200 Twinstar Coins to you and 100 Coins to each teammate.</p></article>
          <article className="guide-article__card"><strong>Tiles 14 & 22</strong><h3>Bomb Tiles</h3><p>Deal 200 boss damage, give you 100 Coins and provide Depth Bombs to teammates in the uploaded guide.</p></article>
          <article className="guide-article__card"><strong>2 · 9 · 15 · 21</strong><h3>Event Tiles</h3><p>Direct bonus Twinstar Coin spaces.</p></article>
        </div>
        <p className="guide-article__callout"><strong>Crystal Dice priority:</strong> exact Starting Tile first when in range, then Backup/Bomb tiles, then heavily upgraded Item Tiles that have accumulated meaningful XP.</p>
      </>,
    },
    {
      id: 'crystal',
      eyebrow: 'Precision resource',
      title: 'Do not waste Crystal Dice on random movement',
      content: <>
        <div className="guide-article__steps">
          <article className="guide-article__step"><span>1</span><div><h3>Land exactly on Start</h3><p>Use a Crystal Die when one to six spaces away so you gain the source-described three Tile XP upgrades and 100 boss damage instead of merely passing.</p></div></article>
          <article className="guide-article__step"><span>2</span><div><h3>Hit Backup or Bomb Tiles</h3><p>These provide team-wide value, not just personal board movement.</p></div></article>
          <article className="guide-article__step"><span>3</span><div><h3>Snipe upgraded Item Tiles late</h3><p>Ordinary dice should build board XP first. Once valuable Item Tiles have levelled, precision landings generate more reward per Crystal Die.</p></div></article>
        </div>
      </>,
    },
    {
      id: 'milestones',
      eyebrow: 'Personal board track',
      title: 'Source milestone rewards',
      content: <>
        <div className="guide-article__table-wrap"><table className="guide-article__table"><thead><tr><th>Points</th><th>Reward in supplied guide</th></tr></thead><tbody>{milestoneRows.map((row) => <tr key={row[0]}><td><strong>{row[0]}</strong></td><td>{row[1]}</td></tr>)}</tbody></table></div>
        <p>The milestone path feeds more Crystal Dice back into the event at 60, 180, 600, 1,200 and 2,000 points in the supplied table, making early efficient movement compound into later precision rolls.</p>
      </>,
    },
    {
      id: 'boss',
      eyebrow: 'Shared team objective',
      title: 'Ice Megalodon damage milestones',
      content: <>
        <div className="guide-article__table-wrap"><table className="guide-article__table"><thead><tr><th>Team damage</th><th>Skin Tokens</th><th>Additional source rewards</th></tr></thead><tbody>{bossRows.map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>)}</tbody></table></div>
        <p>Because Bomb Tiles provide Depth Bombs to teammates, an active three-player group creates a feedback loop: one player’s precise landing gives the others more tools to damage the boss and unlock shared thresholds.</p>
      </>,
    },
    {
      id: 'f2p',
      eyebrow: 'Daily routine',
      title: 'F2P route through the event',
      content: <>
        <ul>
          <li>Complete every Polar Handbook task the live event marks as awarding free dice.</li>
          <li>Align ordinary account progression with the active King of the Arctic scoring theme.</li>
          <li>Complete free Frosty Symphony grid rows/columns for additional dice/chests where available.</li>
          <li>Save 1,000 minutes of Speedups when the source-described daily task requires that amount instead of spending them randomly beforehand.</li>
          <li>Use stamina efficiently for required Beast and Intel tasks.</li>
          <li>Spend Crystal Dice only on deliberate landings, not to move faster around the board.</li>
        </ul>
        <p className="guide-article__callout guide-article__callout--warning"><strong>Free-dice discrepancy:</strong> the source first estimates 35–45 total F2P dice and mentions up to 14 from Polar Handbook, but later lists three Handbook dice per day (21) plus up to 14 King of the Arctic dice and 8–10 from Frosty Symphony. Use your live task list to calculate the actual free total.</p>
      </>,
    },
    {
      id: 'f2p-targets',
      eyebrow: 'Expectation setting',
      title: 'What the source considers reachable for F2P',
      content: <>
        <p>The uploaded guide estimates roughly 300–600 personal board points and 1,200–2,000 team boss damage for a fully active free team, with around 3,500–6,000 Twinstar Coins available for shop purchases.</p>
        <p className="guide-article__callout"><strong>These are not guarantees.</strong> Dice totals, board RNG, teammate activity and event missions change the outcome. Treat the source ranges as planning bands rather than minimum rewards.</p>
      </>,
    },
    {
      id: 'shop',
      eyebrow: 'Polar Shop',
      title: 'Spend Twinstar Coins by account need',
      content: <>
        <div className="guide-article__split">
          <article className="guide-article__card"><h3>F2P / low spender</h3><ol><li>Universal Mythic Hero Shards / Hero Badges.</li><li>Truegold and useful Speedups.</li><li>Forgehammers / Hero Gear components.</li></ol></article>
          <article className="guide-article__card"><h3>Heavy spender</h3><ol><li>Permanent event cosmetics / city skins when chasing permanent stats.</li><li>Mythic Gear chests / advanced enhancement materials.</li><li>Truegold and Forgehammers.</li><li>Remaining Universal Mythic Shards.</li></ol></article>
        </div>
        <p>Connect those choices to Forge before buying: <Link className="guide-article__link" to="/companion?q=Mythic%20Shard">Mythic Shards</Link>, <Link className="guide-article__link" to="/companion?q=Truegold">Truegold</Link> and <Link className="guide-article__link" to="/companion?q=Forgehammers">Forgehammers</Link>.</p>
      </>,
    },
    {
      id: 'whales',
      eyebrow: 'Paid team strategy',
      title: 'Why spenders should team with similar activity',
      content: <>
        <p>The source recommends “whale trios” for players deliberately chasing the highest boss and cosmetic tiers. When all three members are buying/rolling heavily, Backup and Bomb triggers repeatedly send Coins and Depth Bombs across the group.</p>
        <h3>Pack timing</h3>
        <p>The uploaded guide says lower daily-reset pack tiers often give better dice-per-dollar than jumping straight to the largest packs, and suggests combining purchases with recharge/scoring events where the same spend unlocks secondary rewards.</p>
        <h3>Late Crystal snipe</h3>
        <p>Even spenders are advised to use random dice first so Tile XP can grow. Crystal Dice become more valuable later when they can target highly upgraded Item Tiles instead of fresh low-value spaces.</p>
      </>,
    },
    {
      id: 'costs',
      eyebrow: 'Source spending estimates',
      title: 'Permanent skin cost estimates are not fixed prices',
      content: <>
        <p>The supplied guide estimates roughly $250–$400+ to reach around 45,000 Twinstar Coins for permanent city cosmetics, depending on teammate activity, pack efficiency and RNG. It also estimates that a coordinated heavy-spender trio can reduce the personal cost through team-wide tile rewards.</p>
        <p className="guide-article__callout guide-article__callout--warning"><strong>Forge does not present that as a purchase quote.</strong> Pack contents, regional prices, daily limits and event reward rates can change. Use the live store and your actual team progress before spending.</p>
      </>,
    },
    {
      id: 'conversion',
      eyebrow: 'Event close',
      title: 'Unused currency conversion',
      content: <>
        <p>The uploaded guide gives the following automatic post-event conversions:</p>
        <div className="guide-article__table-wrap"><table className="guide-article__table"><thead><tr><th>Unused event item</th><th>Source conversion</th></tr></thead><tbody>
          <tr><td>1 Twin Star Die</td><td>1-hour Training Speedup</td></tr>
          <tr><td>1 Crystal Die</td><td>5 × 1-hour Training Speedups</td></tr>
          <tr><td>1 Twinstar Coin</td><td>1-minute Training Speedup</td></tr>
        </tbody></table></div>
        <p>If you deliberately allow excess currency to convert, consider the <Link className="guide-article__link" to="/guides/kingshot-kingdom-of-power-kvk-guide">KvK guide</Link> when deciding whether those Training Speedups are part of your next troop-day reserve.</p>
      </>,
    },
    {
      id: 'checklist',
      eyebrow: 'Daily execution',
      title: 'Twin Star checklist',
      content: <>
        <ul>
          <li>Choose two teammates with matching activity/spend expectations before lock.</li>
          <li>Complete every live mission that awards free dice.</li>
          <li>Use random dice to loop and level Item Tiles.</li>
          <li>Save Crystal Dice for Start, Backup, Bomb or upgraded Item Tiles.</li>
          <li>Share team progress so nobody wastes a precision roll on a low-impact landing.</li>
          <li>Check boss damage before the final day and coordinate Depth Bomb use.</li>
          <li>Spend Polar Shop currency on the bottleneck your account actually needs.</li>
          <li>Before event close, decide deliberately whether to spend or allow the source-described Training Speedup conversion.</li>
        </ul>
      </>,
    },
    {
      id: 'faq',
      eyebrow: 'Quick answers',
      title: 'Twin Star Adventure FAQ',
      content: <>
        <details><summary>What should I use Crystal Dice for?</summary><p>The source prioritises exact Start Tile landings first, then Backup/Bomb tiles and highly upgraded Item Tiles.</p></details>
        <details><summary>Can I change teammates?</summary><p>The supplied guide says no after the team/matchmaking lock.</p></details>
        <details><summary>How many free dice can F2P get?</summary><p>The source is internally inconsistent. Its broad estimate is around 35–45, but its detailed mission breakdown can sum differently. Use the live mission screen.</p></details>
        <details><summary>What should F2P buy first?</summary><p>The source places Universal Mythic Shards/Hero Badges first, then Truegold/Speedups and Forgehammers/Gear components.</p></details>
        <details><summary>What happens to unused Coins?</summary><p>The uploaded guide says each Twinstar Coin converts into one minute of Training Speedup after the event.</p></details>
      </>,
    },
  ],
}
