import { Link } from 'react-router-dom'
import type { GuideArticleDefinition } from '../guideTypes'

const masterRows = [
  ['Pan', 'Palace Administrator', 'Economy', '1', 'Best early all-round value for F2P and low spenders.', '92'],
  ['Valora', 'Bear Hunter', 'Bear Hunt', '2', 'High F2P value from Forgehammer and Enhancement XP rewards.', '92'],
  ['Roman', 'Arena Champion', 'Arena', '3', 'Useful after Pan and Valora; strongest for regular Arena players.', '92'],
  ['Cassia', 'Battle Commander', 'Battles', '4', 'Late-game combat investment after economy and core event Masters.', '92'],
  ['Guinevere', 'Queen of Holy Sword', 'Swordland', '5', 'Niche priority for players and alliances that contest Swordland.', '85'],
  ['Wilson', 'Royal Herald', 'Alliance Events', '6', 'Niche alliance-event reward multiplier; unlock after broader-value Masters.', '85'],
] as const

const affinityRows = [
  ['Valora', 'Squad Attack', 'Confirmed', '92'],
  ['Pan', 'Squad Defense', 'Confirmed', '92'],
  ['Roman', 'Squad Attack & Defense', 'Confirmed', '92'],
  ['Cassia', 'Squad Lethality & Health', 'Confirmed', '92'],
  ['Guinevere', 'Swordland Attack & Defense', 'Likely', '80'],
  ['Wilson', 'Squad Attack & Defense', 'Likely', '80'],
] as const

export const mastersGuide: GuideArticleDefinition = {
  slug: 'kingshot-masters-master-academy-guide',
  title: 'Kingshot Masters: Master Academy, Affinity & Upgrade Priority Guide',
  shortTitle: 'Masters',
  eyebrow: 'System Guide · Master Academy',
  summary: 'Understand the current six-Master roster, F2P priority, Affinity, Manuscripts, event specialisation and where Pan, Valora, Roman, Cassia, Guinevere and Wilson create the most value.',
  intro: 'Masters are long-term account specialists whose value comes from Affinity bonuses, expertise effects and upgradeable skills tied to specific systems such as Bear Hunt, economy, Arena, field combat, Swordland and alliance events. Forge’s verified workbook tracks the current six-Master roster and separates high-confidence legacy data from newer Guinevere and Wilson rows that still carry a lower confidence score.',
  theme: 'royal',
  tags: ['Masters', 'Master Academy', 'Affinity', 'Manuscripts', 'F2P', 'Pan', 'Valora', 'Roman', 'Cassia', 'Guinevere', 'Wilson', 'Bear Hunt', 'Swordland', 'Alliance events'],
  sourceNote: 'This guide is based on the Kingshot Forge Masters workbook verified on 21 July 2026. The workbook explicitly corrects an older four-Master data state, separates incremental skill XP from cumulative XP, and assigns lower confidence to newer Guinevere and Wilson detail rows. Forge preserves those distinctions rather than treating every value as equally settled.',
  alert: <><strong>Do not use the old four-Master JSON as the current public roster.</strong> The verified workbook records six Masters: Valora, Pan, Roman, Cassia, Guinevere and Wilson. Older total-power and Manuscript figures also came from conflicting source definitions, so totals should not be used as universal live-client constants without the workbook’s verification context.</>,
  connections: [
    { kind: 'guide', label: 'Swordland Showdown & Summit League', description: 'Guinevere is explicitly built around Swordland, including event combat, healing, coins and rally capacity.', to: '/guides/kingshot-swordland-showdown-summit-league-guide' },
    { kind: 'guide', label: 'Viking Vengeance', description: 'Wilson directly improves Viking Vengeance output, making his value much easier to judge if your alliance prioritises this event.', to: '/guides/kingshot-viking-vengeance-event-guide' },
    { kind: 'guide', label: 'Alliance Brawl', description: 'Wilson also boosts Alliance Brawl points and reward progression, linking Master investment to staged event planning.', to: '/guides/kingshot-alliance-brawl-event-guide' },
    { kind: 'guide', label: 'Kingdom of Power (KvK)', description: 'Cassia’s broad combat and rally-capacity focus is most relevant when account stats are being converted into large-scale battle value.', to: '/guides/kingshot-kingdom-of-power-kvk-guide' },
    { kind: 'item', label: 'Forgehammer', description: 'Valora’s Bear Hunt value includes additional Forgehammer rewards; open the Companion catalogue search for the item.', to: '/companion?q=Forgehammer' },
    { kind: 'item', label: 'Truegold', description: 'Pan’s Reserve Chest economy can include Truegold, while wider Forge progression guides also use it as a major bottleneck resource.', to: '/companion?q=Truegold' },
    { kind: 'hero', label: 'Hero Companion', description: 'Compare the heroes that actually lead or join the combat modes your Masters specialise in.', to: '/companion/heroes' },
  ],
  sections: [
    {
      id: 'roster', eyebrow: 'Current system', title: 'The current six-Master roster',
      content: <>
        <p>The verified workbook expands the older four-Master picture to a current six-Master roster. Each Master is built around a different account or event loop rather than being a straight power upgrade over the previous one.</p>
        <div className="guide-article__table-wrap"><table className="guide-article__table"><thead><tr><th>Master</th><th>Role</th><th>Primary focus</th><th>Workbook F2P priority</th><th>Priority note</th><th>Overview confidence</th></tr></thead><tbody>{masterRows.map((row) => <tr key={row[0]}>{row.map((cell, index) => <td key={`${row[0]}-${index}`}>{cell}</td>)}</tr>)}</tbody></table></div>
        <p className="guide-article__callout"><strong>Important distinction:</strong> unlock sequence and investment priority are not the same thing. The workbook lists Valora first in unlock order, but gives Pan the #1 F2P investment priority because his economy value compounds across everyday play.</p>
      </>,
    },
    {
      id: 'unlock', eyebrow: 'Affinity & settlement', title: 'How Masters unlock',
      content: <>
        <p>The workbook describes Realm Journeys and Lostlands as the main discovery/targeting path. Adventure Supplies are used to target a discovered Master until that Master reaches the required Affinity to settle.</p>
        <ul>
          <li><strong>Pan, Roman, Cassia, Guinevere and Wilson:</strong> discover them through Realm Journeys, then target them in Lostlands with Adventure Supplies until they reach 1,000 Affinity and settle.</li>
          <li><strong>Valora:</strong> the workbook records a special rule — she unlocks automatically once your first Master reaches 1,000 Affinity, so it explicitly says not to spend Adventure Supplies targeting her.</li>
        </ul>
        <p className="guide-article__callout guide-article__callout--warning"><strong>Source tension preserved:</strong> Valora is marked unlock order 1 while also being described as an automatic unlock after your first 1,000-Affinity settlement. Forge presents both workbook fields instead of silently rewriting the sequence.</p>
      </>,
    },
    {
      id: 'priority', eyebrow: 'F2P planning', title: 'Where to spend first',
      content: <>
        <ol>
          <li><strong>Pan first for broad account value.</strong> His economy kit covers gathering, Reserve Chests, Intel activity, construction and resource efficiency.</li>
          <li><strong>Valora next for repeatable Bear Hunt rewards.</strong> Her value is not only damage: the workbook highlights Forgehammer and Enhancement XP Part rewards as persistent event income.</li>
          <li><strong>Roman third if you use Arena every day.</strong> His system repays consistent Arena activity through battle stats, Arena currencies and Star Chests.</li>
          <li><strong>Cassia after the economy/event foundation.</strong> Her kit is built for broad combat stats and rally capacity rather than passive daily income.</li>
          <li><strong>Guinevere and Wilson are specialist investments.</strong> Move them up only when Swordland or alliance-event output is a major part of your account plan.</li>
        </ol>
        <p>This is the workbook’s F2P priority model, not a rule that every account must follow. A Swordland-focused alliance can reasonably value Guinevere earlier, while an alliance heavily invested in Mobilization, Championship, Viking Vengeance and Brawl can extract more from Wilson.</p>
      </>,
    },
    {
      id: 'profiles', eyebrow: 'Role-by-role value', title: 'What each Master actually does',
      content: <>
        <div className="guide-article__grid guide-article__grid--two">
          <article className="guide-article__card"><strong>Pan · Economy</strong><h3>The daily compounding pick</h3><p>Efficient Reserves turns gathering activity into Reserve Chests with a chance at rewards including Truegold. Falconer increases the value of daily Intel activity, while the rest of his kit supports construction and general account growth.</p><p><Link className="guide-article__link" to="/companion?q=Truegold">Open Truegold in Companion →</Link></p></article>
          <article className="guide-article__card"><strong>Valora · Bear Hunt</strong><h3>The repeatable material specialist</h3><p>Valora is the Bear Hunt Master. The workbook specifically highlights Weapon Obsession for Forgehammer rewards and Leader by Example for Enhancement XP Parts, giving her value even when a player is not competing for the highest damage tier.</p><p><Link className="guide-article__link" to="/companion?q=Forgehammer">Open Forgehammer in Companion →</Link></p></article>
          <article className="guide-article__card"><strong>Roman · Arena</strong><h3>The Arena payback Master</h3><p>Roman’s Star Belligerent expertise can produce Arena Star Chests containing items such as Mythic Shards, Forgehammers and speedups. His skills also support Arena battle stats, token income and shop efficiency.</p></article>
          <article className="guide-article__card"><strong>Cassia · Battles</strong><h3>The broad combat investment</h3><p>Horn of Valor raises Squad size, while Cassia’s deeper skill set covers Squad Attack, Defense, Lethality, Health and Rally Squad Capacity. The workbook notes that her skills extend to Level 20, making her a heavier late-game investment.</p><p><Link className="guide-article__link" to="/guides/kingshot-kingdom-of-power-kvk-guide">Use those stats in the KvK guide →</Link></p></article>
          <article className="guide-article__card"><strong>Guinevere · Swordland</strong><h3>The event specialist</h3><p>Holy Sword Domain, Merciful Heart, Royal Guidance and Call of Round Table are explicitly scoped around Swordland combat, healing, coins, Lethality, Health and rally capacity. She is powerful when Swordland matters and deliberately niche outside that role.</p><p><Link className="guide-article__link" to="/guides/kingshot-swordland-showdown-summit-league-guide">Open the Swordland guide →</Link></p></article>
          <article className="guide-article__card"><strong>Wilson · Alliance Events</strong><h3>The reward multiplier</h3><p>Wilson is unusual because the workbook says his skills grant no combat stats. Instead, they multiply Alliance Mobilization points, Championship Badges, Viking Vengeance points and Alliance Brawl points, with extra reward tiers or shop benefits layered on top.</p><p><Link className="guide-article__link" to="/guides/kingshot-alliance-brawl-event-guide">Open the Alliance Brawl guide →</Link></p></article>
        </div>
      </>,
    },
    {
      id: 'affinity', eyebrow: 'Permanent progression', title: 'Affinity bonuses and confidence levels',
      content: <>
        <p>Affinity is not just an unlock gate. The workbook tracks permanent stat growth as relationship levels rise, plus milestone Emblem costs. The bonus type differs by Master:</p>
        <div className="guide-article__table-wrap"><table className="guide-article__table"><thead><tr><th>Master</th><th>Affinity bonus family</th><th>Workbook status</th><th>Detail confidence</th></tr></thead><tbody>{affinityRows.map((row) => <tr key={row[0]}>{row.map((cell, index) => <td key={`${row[0]}-${index}`}>{cell}</td>)}</tr>)}</tbody></table></div>
        <p>Valora, Pan, Roman and Cassia carry the stronger detailed confidence score in the current workbook. Guinevere and Wilson are included in the verified six-Master roster, but their detailed Affinity and skill rows are intentionally marked lower-confidence because fewer independent full-table sources were available.</p>
      </>,
    },
    {
      id: 'skills', eyebrow: 'Upgrade economy', title: 'Skills, XP and Manuscripts: read the costs correctly',
      content: <>
        <p>The workbook’s validation notes record a significant correction: an earlier data state stored running/cumulative Skill XP under the label “XP Cost”. The verified workbook now separates <strong>incremental XP cost</strong> from <strong>cumulative XP</strong>.</p>
        <ul>
          <li>Use <strong>xp_cost</strong> when asking what the next skill level costs.</li>
          <li>Use <strong>cumulative_xp</strong> when planning the full investment to a target level.</li>
          <li>The same planning logic applies to Manuscript cost versus cumulative Manuscripts.</li>
          <li>Cassia and parts of Guinevere’s kit extend to Level 20, so their total investment curve is materially deeper than the earlier Level-10 patterns.</li>
        </ul>
        <p className="guide-article__callout"><strong>Planning rule:</strong> do not spread Manuscripts evenly because two Masters happen to be unlocked. Finish the skill that affects the event or system you actually use, then move to the next specialist.</p>
      </>,
    },
    {
      id: 'synergies', eyebrow: 'Connected Forge knowledge', title: 'Match Master investment to the event you play',
      content: <>
        <div className="guide-article__table-wrap"><table className="guide-article__table"><thead><tr><th>If this is your priority…</th><th>Master to study</th><th>Forge connection</th></tr></thead><tbody>
          <tr><td>Daily growth, gathering, Intel, construction</td><td>Pan</td><td><Link className="guide-article__link" to="/buildings">Buildings Companion</Link></td></tr>
          <tr><td>Bear Hunt rewards and materials</td><td>Valora</td><td><Link className="guide-article__link" to="/companion/heroes">Hero Companion</Link></td></tr>
          <tr><td>Arena progression</td><td>Roman</td><td><Link className="guide-article__link" to="/companion?q=Forgehammer">Forgehammer item search</Link></td></tr>
          <tr><td>Cross-kingdom combat and rally capacity</td><td>Cassia</td><td><Link className="guide-article__link" to="/guides/kingshot-kingdom-of-power-kvk-guide">Kingdom of Power</Link></td></tr>
          <tr><td>Swordland Showdown / Summit League</td><td>Guinevere</td><td><Link className="guide-article__link" to="/guides/kingshot-swordland-showdown-summit-league-guide">Swordland guide</Link></td></tr>
          <tr><td>Mobilization, Championship, Viking, Brawl</td><td>Wilson</td><td><Link className="guide-article__link" to="/guides/kingshot-viking-vengeance-event-guide">Viking</Link> · <Link className="guide-article__link" to="/guides/kingshot-alliance-brawl-event-guide">Brawl</Link></td></tr>
        </tbody></table></div>
      </>,
    },
    {
      id: 'validation', eyebrow: 'Data quality', title: 'What the verified workbook corrected',
      content: <>
        <ul>
          <li><strong>Roster:</strong> older public/source states showed only three or four Masters; the workbook updates this to six.</li>
          <li><strong>Skill XP:</strong> incremental and cumulative XP are now separated.</li>
          <li><strong>Affinity milestones:</strong> several earlier Valora, Pan, Roman and Cassia values were replaced with current cross-referenced figures.</li>
          <li><strong>Pan Reserve Chests:</strong> grouped approximate percentages were replaced with eight specific rewards and published probabilities totalling 100%.</li>
          <li><strong>Newer Masters:</strong> Guinevere and Wilson remain deliberately lower-confidence in detailed tables.</li>
          <li><strong>Identifiers:</strong> stable master_id, skill_id and expertise_id keys were added rather than relying on names as joins.</li>
        </ul>
        <p>This is why Forge should treat the July verified workbook as the editorial basis for the public guide rather than copying the older four-Master JSON forward.</p>
      </>,
    },
    {
      id: 'checklist', eyebrow: 'Practical plan', title: 'Master Academy checklist',
      content: <>
        <ul>
          <li>Choose one broad-value Master and one event specialist instead of upgrading everything at once.</li>
          <li>For F2P efficiency, use Pan’s workbook priority as the default starting point.</li>
          <li>Take Valora seriously even if you are not a Bear Hunt damage leader because her reward skills create repeatable material value.</li>
          <li>Only push Roman hard if Arena is part of your daily routine.</li>
          <li>Delay Cassia until you can justify the deeper combat investment.</li>
          <li>Move Guinevere up when Swordland is strategically important to your alliance.</li>
          <li>Move Wilson up when alliance-event rewards matter more than direct combat stats.</li>
          <li>Check whether a displayed number is incremental, cumulative, confirmed or merely likely before turning it into a spending target.</li>
        </ul>
      </>,
    },
    {
      id: 'faq', eyebrow: 'Quick answers', title: 'Masters FAQ',
      content: <>
        <h3>How many Masters are in the verified Forge workbook?</h3><p>Six: Valora, Pan, Roman, Cassia, Guinevere and Wilson.</p>
        <h3>Which Master is the workbook’s best F2P priority?</h3><p>Pan is ranked #1 for broad early all-round value, with Valora #2.</p>
        <h3>Why can Valora be “unlock order 1” but F2P priority 2?</h3><p>The workbook separates settlement/unlock sequence from where you should actively spend. It says Valora unlocks automatically once the first Master reaches 1,000 Affinity, while Pan is the highest active F2P investment priority.</p>
        <h3>Which Master is for Swordland?</h3><p>Guinevere. Her expertise and skills are explicitly scoped to Swordland Showdown and Summit League.</p>
        <h3>Which Master helps Viking Vengeance and Alliance Brawl?</h3><p>Wilson. His alliance-event kit increases event output rather than giving direct combat stats.</p>
        <h3>Are all detailed values equally verified?</h3><p>No. The workbook keeps higher confidence on the first four Masters and lower confidence on newer Guinevere and Wilson detailed rows.</p>
      </>,
    },
  ],
}
