import { Link } from 'react-router-dom'
import type { GuideArticleDefinition } from '../guideTypes'

export const mysticTrialGuide: GuideArticleDefinition = {
  slug: 'kingshot-mystic-trial-guide',
  title: 'Kingshot Mystic Trial: Zones, Raid, Trial Crystals & Formation Guide',
  shortTitle: 'Mystic Trial',
  eyebrow: 'System Guide · Weekly PvE',
  summary: 'Use the six Mystic Trial zones as a weekly account check, unlock Raid, spend Trial Crystals carefully and tune formations without confusing community starting ratios with official rules.',
  intro: 'Mystic Trial is a recurring PvE progression system built around six zones that test different parts of your account. Century Games now documents the important rules directly: unlock timing, Raid requirements, one-time rewards, Trial Shop behaviour, excluded bonuses and Radiant Spire building-stat limits. Forge uses those official rules as the factual layer, then adds clearly labelled community formation guidance for the parts the Help Center does not prescribe.',
  theme: 'mystic',
  tags: ['Mystic Trial', 'Trial Crystal', 'Raid', 'Coliseum', 'Forest of Life', 'Crystal Cave', 'Knowledge Nexus', 'Molten Fort', 'Radiant Spire', 'Hero Gear', 'Governor Charms', 'Governor Gear', 'War Academy', 'F2P'],
  sourceNote: 'Fresh verification completed 20 August 2026. Century Games / Kingshot Help Center confirms Mystic Trial unlocks on Monday of the fourth week after server opening and requires Town Center Lv.19 plus Command Center Lv.1; the Trial Shop refreshes weekly; clearing Stages 1–10 for every zone unlocks Raid for the next session; First-clear and Milestone Rewards are one-time; Raid rewards increase with stage progress; several external bonus sources do not apply; only Command Center Deployment Capacity counts as a building stat in Radiant Spire; Trial Crystals are exchanged in the shop; and Trial availability can depend on Town Center level and server age. The current six-zone schedule, system focus and starter troop ratios were cross-checked against July–August 2026 community references and are labelled here as current strategy guidance rather than immutable official rules.',
  alert: <><strong>Official timing correction:</strong> current Century Games guidance says Mystic Trial unlocks on <strong>Monday of the fourth week after the server opens</strong>, with Town Center Lv.19 and Command Center Lv.1 required. Older community pages that say “about two weeks” should not override the live Help Center.</>,
  connections: [
    { kind: 'item', label: 'Trial Crystal', description: 'Open the governed Companion record for the currency earned from trials and exchanged in the Trial Shop.', to: '/companion/items/trial-crystal' },
    { kind: 'hero', label: 'Hero Companion', description: 'Use your hero roster and gear context when Coliseum exposes a hero-side progression gap.', to: '/companion/heroes' },
    { kind: 'guide', label: 'Governor Charms', description: 'Crystal Cave is commonly used as a Governor Charm progression check.', to: '/guides/kingshot-governor-charms-upgrade-cost-guide' },
    { kind: 'guide', label: 'Governor Gear', description: 'Molten Fort is commonly used as a Governor Gear progression check.', to: '/guides/kingshot-governor-gear-upgrade-cost-guide' },
    { kind: 'guide', label: 'War Academy', description: 'Knowledge Nexus community references consistently tie performance to Academy and War Academy research.', to: '/guides/kingshot-war-academy-research-truegold-dust-guide' },
    { kind: 'item', label: 'Truegold Dust', description: 'Check the governed item record before treating later Trial Shop stock as a universal early-kingdom option.', to: '/companion/items/truegold-dust' },
  ],
  sections: [
    {
      id: 'unlock', eyebrow: 'Official access rule', title: 'Unlock the system first — then trust the live availability screen',
      content: <>
        <p>Century Games currently states that Mystic Trial unlocks on <strong>Monday of the fourth week after server opening</strong>. Your account also needs <strong>Town Center Lv.19</strong> and <strong>Command Center Lv.1</strong>.</p>
        <ul>
          <li>Individual Trial stages can still depend on Town Center level and the number of days since server launch.</li>
          <li>If a zone is unavailable, use the live Mystic Trial screen rather than assuming the account is bugged.</li>
          <li>Do not rely on older “two-week” community unlock claims where they conflict with the current official FAQ.</li>
        </ul>
      </>,
    },
    {
      id: 'zones', eyebrow: 'Current weekly pattern', title: 'Six zones test different parts of the account',
      content: <>
        <p>Current July–August 2026 community references consistently describe the following weekly pattern. Century Games confirms that Trial availability varies with account/server progress, so treat the live game as final authority if a day or unlock differs.</p>
        <div className="guide-article__grid guide-article__grid--two">
          <article className="guide-article__card"><strong>Mon–Tue</strong><h3>Coliseum</h3><p>Community references describe this as the Hero, Hero Gear and Exclusive Widget check. Starter ratio: about <strong>50 / 10 / 40</strong> Infantry / Cavalry / Archer.</p></article>
          <article className="guide-article__card"><strong>Wed–Thu</strong><h3>Forest of Life</h3><p>Commonly tied to Pets and Pet Skills. Starter ratio: about <strong>50 / 15 / 35</strong>.</p></article>
          <article className="guide-article__card"><strong>Wed–Thu</strong><h3>Crystal Cave</h3><p>Commonly tied to Governor Charms, with current references placing its unlock at TC25. Starter ratio: about <strong>60 / 20 / 20</strong>.</p></article>
          <article className="guide-article__card"><strong>Fri–Sat</strong><h3>Knowledge Nexus</h3><p>Commonly tied to Academy and War Academy research. Starter ratio: about <strong>50 / 20 / 30</strong>.</p></article>
          <article className="guide-article__card"><strong>Fri–Sat</strong><h3>Molten Fort</h3><p>Commonly tied to Governor Gear, with current references placing its unlock at TC22. Starter ratio: about <strong>60 / 15 / 25</strong>.</p></article>
          <article className="guide-article__card"><strong>Sunday</strong><h3>Radiant Spire</h3><p>The broad account check. Community references use about <strong>50 / 15 / 35</strong> as a starting formation, but this is the zone where account differences matter most.</p></article>
        </div>
        <p className="guide-article__callout"><strong>Ratios are not official presets.</strong> They are repeated community starting points. Published guides themselves acknowledge disagreement, so use them to begin testing rather than as a fixed answer.</p>
      </>,
    },
    {
      id: 'raid', eyebrow: 'Official Raid rule', title: 'Stage 10 across every zone is the important Raid checkpoint',
      content: <>
        <p>The current Help Center says you must clear <strong>Stages 1–10 for every zone</strong> to unlock Raid for the next session. That wording matters: Forge does not reduce the requirement to “Stage 10 in one zone”.</p>
        <ul>
          <li>First-clear Rewards are one-time rewards for clearing a Mystic Trial Stage for the first time.</li>
          <li>Milestone Rewards are also one-time.</li>
          <li>Raid rewards vary between players because higher cleared-stage progress produces better rewards in the next Raid.</li>
          <li>Use Stage Progress to judge Raid improvement rather than copying somebody else’s reward expectation.</li>
        </ul>
      </>,
    },
    {
      id: 'bonuses', eyebrow: 'Official bonus boundaries', title: 'A high account Power number does not mean every bonus is active here',
      content: <>
        <p>Century Games explicitly says the following do <strong>not</strong> take effect in Mystic Trial: Bonus Items, King/High King Perks, Position Perks, Kingdom Skills, Alliance Bonuses and Outpost Bonuses.</p>
        <p>Radiant Spire has another official boundary: as a <strong>building stat</strong>, only Deployment Capacity provided by the Command Center is effective. This is narrower than some community summaries that simply say “everything counts”.</p>
        <p className="guide-article__callout"><strong>Use the event as a diagnostic:</strong> if one specialist zone is consistently behind the others, inspect the system that zone is testing before spending randomly across the account.</p>
      </>,
    },
    {
      id: 'formations', eyebrow: 'Community strategy', title: 'Change one formation variable at a time when you hit a wall',
      content: <>
        <p>Current community guides converge on roughly the same opening ratios, but they also agree that no one formation solves every stage. Enemy composition and your own developed systems can shift the best split.</p>
        <ul>
          <li>If the frontline disappears too quickly, test a little more Infantry.</li>
          <li>If Infantry survives but damage is short, test more Archer weight.</li>
          <li>Change one variable at a time so the battle result actually tells you something.</li>
          <li>If several sensible ratios lose by a wide margin, stop treating formation tuning as a substitute for progression.</li>
        </ul>
        <p>Use the <Link className="guide-article__link" to="/companion/heroes">Hero Companion</Link>, <Link className="guide-article__link" to="/guides/kingshot-governor-charms-upgrade-cost-guide">Governor Charms guide</Link>, <Link className="guide-article__link" to="/guides/kingshot-governor-gear-upgrade-cost-guide">Governor Gear guide</Link> and <Link className="guide-article__link" to="/guides/kingshot-war-academy-research-truegold-dust-guide">War Academy guide</Link> to diagnose the system the current room is exposing.</p>
      </>,
    },
    {
      id: 'shop', eyebrow: 'Trial Shop', title: 'Trial Crystals are a progression currency, not a spend-it-now timer',
      content: <>
        <p>Century Games confirms that <strong>Trial Crystals obtained from trials can be exchanged for rare items in the store</strong>. The Trial Shop refreshes weekly; item types are fixed, while some availability depends on server progress.</p>
        <p>That server-progress rule is why Forge does not publish one permanent shop table for every Kingdom. Current community guides repeatedly prioritise later-game materials such as Truegold Dust and Mithril when available, but that is strategy guidance, not an official universal purchase order.</p>
        <ul>
          <li>Check what your Kingdom has actually unlocked before planning around a shop item.</li>
          <li>Buy for the progression system you are deliberately advancing, not because the weekly reset is approaching.</li>
          <li>Keep <Link className="guide-article__link" to="/companion/items/truegold-dust">Truegold Dust</Link> and other Companion records separate from unverified shop-quantity claims.</li>
        </ul>
      </>,
    },
    {
      id: 'challenge-points', eyebrow: 'Official scoring', title: 'Challenge Points and leaderboards are separate from Raid progress',
      content: <>
        <p>The Help Center defines Challenge Points as points accumulated by completing stages in any Trial, used for milestone rewards. It also gives separate leaderboard refresh timings: <strong>Your Kingdom every 5 minutes</strong>, while <strong>Neighboring Kingdoms and All Kingdoms refresh daily</strong>.</p>
        <p>Do not use a temporarily stale cross-kingdom leaderboard as evidence that your latest clear was ignored; the refresh windows are different.</p>
      </>,
    },
    {
      id: 'checklist', eyebrow: 'Weekly routine', title: 'A simple Mystic Trial routine beats endless micromanagement',
      content: <>
        <ul>
          <li>Check which zones are live and whether any account/server-age unlock is still pending.</li>
          <li>Push new stages until formation testing stops producing meaningful improvement.</li>
          <li>Aim for the official Raid checkpoint: Stages 1–10 across every zone.</li>
          <li>Use a community starter ratio only as the first test, then adjust from the battle result.</li>
          <li>When one room lags, upgrade the linked account system rather than spending everywhere.</li>
          <li>Raid when available and compare rewards against your own previous Stage Progress.</li>
          <li>Check the weekly Trial Shop and spend Trial Crystals against an actual progression goal.</li>
          <li>Re-check the live event UI after game updates; zone schedules, available stock and balance can change.</li>
        </ul>
      </>,
    },
  ],
}
