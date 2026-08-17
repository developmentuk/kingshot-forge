import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import './FlamedragonTyrantGuidePage.css'

const phases = [
  {
    phase: 'Phase 1',
    title: 'Alliance Sign-Up',
    duration: '48 hours',
    summary: 'R4 and R5 register eligible top-ranking alliances. You must be in the alliance when registration happens; switching later does not preserve eligibility.',
  },
  {
    phase: 'Phase 2',
    title: 'Combatant Dispatch',
    duration: '48 hours',
    summary: 'Alliance leadership selects up to 60 registered members as official battlefield combatants.',
  },
  {
    phase: 'Phase 3',
    title: 'Eve of Battle',
    duration: '59 hours',
    summary: 'Complete Blazing Trail missions, open Governor Chests, collect Dragon Essence and Scale Crystals, and use prediction tokens to earn Dragonclaw Marks.',
  },
  {
    phase: 'Phase 4',
    title: 'Battlefield Opens',
    duration: '8 hours in the supplied overview',
    summary: 'The source describes a 1-hour preparation window before the Central Palace shield drops, followed by the main Palace, Aerie, Pyrocrystal and Dragonborn Escort combat.',
  },
  {
    phase: 'Phase 5',
    title: 'Rearmament & Banquet',
    duration: 'About 54–55 hours',
    summary: 'Use the 500% Healing Speed and 30% Healing Cost reduction, clear wounded troops efficiently, and take part in the Tyrant’s Dragon Banquet.',
  },
] as const

const aerieBuffs = [
  { name: 'Life Aerie', effect: '+50% Troop Health', role: 'Durability and structure defence' },
  { name: 'Dragon Aerie', effect: '+50% Troop Lethality', role: 'High-value offensive and defensive damage pressure' },
  { name: 'Shield Aerie', effect: '+50% Troop Defense', role: 'Palace and Aerie holding power' },
  { name: 'Blade Aerie', effect: '+50% Troop Attack', role: 'Palace breach and offensive rally windows' },
] as const

const crystalSkills = [
  {
    name: 'Dragonroar Rally',
    effect: '+30% Alliance Rally Capacity for 30 minutes',
    use: 'Cast immediately before a major Palace or Aerie breach attempt.',
  },
  {
    name: 'Dragonscale Armor',
    effect: '+15% Attack and Defense for Palace/Aerie defenders for 30 minutes',
    use: 'Cast after taking a critical structure or roughly 30 seconds before an expected enemy rally lands.',
  },
  {
    name: 'Dragonblood Healing',
    effect: 'Heals 50% of severely injured troops during the active defensive window',
    use: 'Use after the first major impact wave so wounded troops exist to restore before follow-up rallies.',
  },
] as const

const tyrantTitles = [
  { name: 'Bloodwyrm Warlord', effect: '+20% Troop Health · +2,000 Deployment Capacity' },
  { name: 'Wyrmbreath Overlord', effect: '+20% Troop Lethality · +2,000 Deployment Capacity' },
  { name: 'Dragonscale Guard', effect: '+20% Troop Defense · +2,000 Deployment Capacity' },
  { name: 'Dragontooth General', effect: '+20% Troop Attack · +2,000 Deployment Capacity' },
] as const

export default function FlamedragonTyrantGuidePage() {
  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Kingshot Flamedragon Tyrant: Complete Event Guide | Kingshot Forge'
    return () => { document.title = previousTitle }
  }, [])

  return (
    <main className="flamedragon-guide">
      <nav className="flamedragon-guide__breadcrumbs" aria-label="Breadcrumb">
        <Link to="/companion">Companion</Link><span aria-hidden="true">›</span><span>Event guides</span><span aria-hidden="true">›</span><span>Flamedragon Tyrant</span>
      </nav>

      <article>
        <header className="flamedragon-guide__hero">
          <p className="eyebrow">Event Guide · Flamedragon Tyrant</p>
          <h1>Kingshot Flamedragon Tyrant: The Complete Event Guide</h1>
          <p className="flamedragon-guide__lead">Flamedragon Tyrant is a multi-phase alliance battlefield built around Palace occupation, rotating Aerie buffs, Pyrocrystal gathering, Dragonborn Escorts, prediction rewards and post-battle recovery. This guide turns the supplied event notes into a practical plan for F2P players, alliance officers, Dolphins and Palace-leading Whales.</p>
          <div className="flamedragon-guide__tags" aria-label="Guide topics">
            <span>5 event phases</span><span>F2P strategy</span><span>R4/R5 leadership</span><span>Palace & Aeries</span><span>Healing</span><span>Event shops</span>
          </div>
        </header>

        <div className="flamedragon-guide__danger" role="note">
          <strong>Critical safety rule:</strong> do not attack player cities on the Flamedragon battlefield. The supplied notes distinguish structure combat from city attacks: Palace and Aerie fighting uses the event infirmary, while city attacks use your normal hospital capacity and can cause permanent troop losses after it fills.
        </div>

        <nav className="flamedragon-guide__jump" aria-label="Article sections">
          <a href="#timeline">Timeline</a><a href="#map">Map & safety</a><a href="#f2p">F2P plan</a><a href="#predictions">Predictions</a><a href="#crystal-skills">Crystal Skills</a><a href="#healing">Healing</a><a href="#leadership">Leadership</a><a href="#palace">Palace defence</a><a href="#speedups">Rally speedups</a><a href="#buffs">Buff stacking</a><a href="#shops">Shops</a><a href="#faq">FAQ</a>
        </nav>

        <section className="flamedragon-guide__panel" id="timeline">
          <p className="eyebrow">Event flow</p><h2>Flamedragon Tyrant timeline</h2>
          <p>The event is split into five phases. Registration and combatant selection happen well before the battlefield opens, so alliance organisation matters as much as raw combat power.</p>
          <div className="flamedragon-guide__timeline">
            {phases.map((phase) => (
              <article key={phase.phase} className="flamedragon-guide__timeline-card">
                <span>{phase.phase}</span><h3>{phase.title}</h3><strong>{phase.duration}</strong><p>{phase.summary}</p>
              </article>
            ))}
          </div>
          <p className="flamedragon-guide__callout flamedragon-guide__callout--warning"><strong>Timing note from the supplied material:</strong> the overview describes Phase 4 as 8 hours total — 1 hour preparation plus 7 hours combat — while a later timing table describes 6 hours of active combat after the preparation hour. Use the live in-game countdown for your event instance rather than planning around the disputed hour.</p>
        </section>

        <section className="flamedragon-guide__panel" id="map">
          <p className="eyebrow">Battlefield survival</p><h2>Zone map, shields and the four Aeries</h2>
          <div className="flamedragon-guide__split">
            <article className="flamedragon-guide__card">
              <h3>Border Region</h3>
              <p>The safe outer perimeter where cities initially spawn. Peace Shields remain active here, making it the best idle position when you are not actively fighting or gathering.</p>
            </article>
            <article className="flamedragon-guide__card flamedragon-guide__card--hot">
              <h3>Magma Sanctum</h3>
              <p>The inner combat zone around the Palace. Teleporting inside drops your Peace Shield for the event, so move in only when you have a clear battlefield task.</p>
            </article>
          </div>
          <h3>Central Palace</h3>
          <p>The alliance with the strongest cumulative Palace occupation competes for the Tyrant throne, but the supplied notes emphasise one crucial individual rule: <strong>personal occupation time accrues to the Rally Captain</strong>. Your designated Palace contender should therefore lead central rallies rather than merely joining them.</p>
          <h3>Aerie rotation</h3>
          <p>The four Aeries alternate between roughly 30 minutes vulnerable and 30 minutes protected. Controlling one provides its alliance-wide buff for 30 minutes.</p>
          <div className="flamedragon-guide__grid flamedragon-guide__grid--four">
            {aerieBuffs.map((aerie) => <article key={aerie.name} className="flamedragon-guide__card"><h3>{aerie.name}</h3><strong>{aerie.effect}</strong><p>{aerie.role}</p></article>)}
          </div>
          <p className="flamedragon-guide__callout"><strong>Strong offensive sequence:</strong> the supplied strategy recommends securing Blade Aerie and Dragon Aerie before the main Palace breach, then stacking their Attack/Lethality advantages with Dragonroar Rally.</p>
        </section>

        <section className="flamedragon-guide__panel" id="f2p">
          <p className="eyebrow">Low-spend execution</p><h2>Step-by-step F2P strategy</h2>
          <div className="flamedragon-guide__steps">
            <article><span>1</span><div><h3>Max Phase 3 preparation</h3><p>Complete Blazing Trail missions for Dragon Essence and Scale Crystals, open Governor Chests for personal and alliance preparation progress, check the daily free pack, and use free prediction tokens rather than leaving them unused.</p></div></article>
            <article><span>2</span><div><h3>Gather Pyrocrystals efficiently</h3><p>Level 1 and Level 2 Pyrocrystal Mines refresh on the event cycle. Use small single-tier marches — the supplied notes suggest roughly 1,000–5,000 troops — so you can gather without committing a major combat march.</p></div></article>
            <article><span>3</span><div><h3>Hunt Dragonborn Escorts</h3><p>Escorts are solo NPC targets, cost zero Stamina according to the source, and provide personal points plus Alliance Pyrocrystals for R4/R5 Crystal Skills. The notes describe recurring 30-minute spawns after the battlefield opens.</p></div></article>
            <article><span>4</span><div><h3>Join strong alliance rallies</h3><p>For Palace and Aerie points, fill rallies led by your designated strongest Rally Captains rather than trying to solo high-stat structures. A contributing march can also register you for occupation-related rewards.</p></div></article>
            <article><span>5</span><div><h3>Tag the Occupation Ranking</h3><p>The source says Top 150 occupation rewards can include Mythril and Gems, and describes a fast low-troop Aerie occupation as a way for lower-power accounts to register occupation time when an Aerie opens.</p></div></article>
            <article><span>6</span><div><h3>Save your healing for Phase 5</h3><p>Avoid burning healing speedups during the battle unless absolutely necessary. Rearmament gives the supplied 500% Healing Speed boost and 30% Healing Cost reduction, which makes batch healing dramatically more efficient.</p></div></article>
          </div>
          <div className="flamedragon-guide__do-dont">
            <article><h3>Do</h3><ul><li>Join strong rallies.</li><li>Gather Pyrocrystals.</li><li>Solo Dragonborn Escorts.</li><li>Use prediction tokens.</li><li>Target personal milestones.</li></ul></article>
            <article><h3>Do not</h3><ul><li>Attack player cities.</li><li>Solo heavily defended structures.</li><li>Leave valuable troops idle inside Magma Sanctum.</li><li>Waste combat buffs during registration.</li><li>Split attention away from event milestones.</li></ul></article>
          </div>
        </section>

        <section className="flamedragon-guide__panel" id="predictions">
          <p className="eyebrow">Eve of Battle</p><h2>Prediction betting and Dragonclaw Marks</h2>
          <p>Predictions convert free event tokens into Dragonclaw Marks for the prediction shop. The supplied strategy recommends treating this as probability management rather than alliance loyalty.</p>
          <ol>
            <li><strong>Research the zone:</strong> inspect alliance rankings and the likely Rally Captains. Compare hero gear generation, Truegold, widgets and other visible combat investment.</li>
            <li><strong>Use a 70/30 allocation:</strong> place about 70% of tokens on high-confidence favourites and reserve roughly 30% for closer or higher-yield tactical bets.</li>
            <li><strong>Prioritise durable rewards:</strong> the source ranks Mythril / Fire Crystal-style progression materials first, followed by useful speedups, then exclusive skill or hero fragments.</li>
          </ol>
          <p className="flamedragon-guide__callout"><strong>Avoid emotional betting:</strong> backing your own alliance in a clearly unfavourable matchup can reduce the Dragonclaw Marks you bring into the shop.</p>
        </section>

        <section className="flamedragon-guide__panel" id="crystal-skills">
          <p className="eyebrow">R4 / R5 battlefield tools</p><h2>Alliance Crystal Skills</h2>
          <p>Alliance Pyrocrystals gathered from mines and Dragonborn Escorts feed temporary skills that officers can cast during Phase 4. Their value comes from timing, not simply using them as soon as they become available.</p>
          <div className="flamedragon-guide__table-wrap">
            <table className="flamedragon-guide__table">
              <thead><tr><th>Skill</th><th>Effect</th><th>Best use</th></tr></thead>
              <tbody>{crystalSkills.map((skill) => <tr key={skill.name}><td><strong>{skill.name}</strong></td><td>{skill.effect}</td><td>{skill.use}</td></tr>)}</tbody>
            </table>
          </div>
          <h3>Leadership execution</h3>
          <ul>
            <li>Assign smaller or lower-power accounts as dedicated Pyrocrystal gatherers.</li>
            <li>Stack <strong>Dragonroar Rally</strong> with <strong>Blade Aerie</strong> before a planned offensive breach.</li>
            <li>When defending, preserve Pyrocrystals for <strong>Dragonscale Armor</strong> and <strong>Dragonblood Healing</strong> instead of wasting an offensive skill while you already hold the Palace.</li>
          </ul>
        </section>

        <section className="flamedragon-guide__panel" id="healing">
          <p className="eyebrow">Rearmament efficiency</p><h2>Batch healing without burning speedups</h2>
          <p>The event notes recommend combining small healing batches with alliance Help clicks. Instead of starting one huge timer, tune the batch until alliance helps clear it immediately.</p>
          <div className="flamedragon-guide__healing-flow"><span>Large wounded pool</span><strong>→</strong><span>20–30 minute batch</span><strong>→</strong><span>Alliance Helps</span><strong>→</strong><span>Repeat</span></div>
          <ol>
            <li>Move the healing slider to a small batch with roughly a 20–30 minute timer.</li>
            <li>If alliance Helps instantly clear it, increase the batch slightly; if time remains, reduce it.</li>
            <li>Repeat the tuned batch until the infirmary is cleared.</li>
            <li>Do this in Phase 5 where the supplied notes give <strong>500% Healing Speed</strong> and <strong>30% lower Healing Cost</strong>.</li>
          </ol>
          <p className="flamedragon-guide__callout"><strong>Post-event safety:</strong> the source states that troops exceeding your normal hospital size when the event infirmary closes remain safely queued in the standard hospital rather than dying.</p>
        </section>

        <section className="flamedragon-guide__panel" id="leadership">
          <p className="eyebrow">High-power coordination</p><h2>Whale vs Dolphin responsibilities</h2>
          <div className="flamedragon-guide__table-wrap">
            <table className="flamedragon-guide__table">
              <thead><tr><th>Aspect</th><th>Whale · Palace Lead</th><th>Dolphin · Aerie / Rally Enforcer</th></tr></thead>
              <tbody>
                <tr><td>Primary objective</td><td>Tyrant throne and top personal occupation</td><td>Strong leaderboard finish and uninterrupted Aerie control</td></tr>
                <tr><td>Positioning</td><td>Inner Magma Sanctum</td><td>Sanctum border and flexible teleports</td></tr>
                <tr><td>Core job</td><td>Lead Palace rallies and maintain garrison captaincy</td><td>Secure Aeries, fill central rallies, defeat Escorts and feed Pyrocrystals</td></tr>
                <tr><td>Spending focus</td><td>Rally speedups, key event packs, march buffs</td><td>Efficient event bundles, Stamina where relevant elsewhere, and march buffs</td></tr>
              </tbody>
            </table>
          </div>
          <h3>The captain rule</h3>
          <p>The source repeatedly identifies Rally Captain ownership as the defining Tyrant mechanic: personal Palace occupation time belongs to the Captain. If your alliance wants one player to compete for the Tyrant title, that player should lead each central rally. The notes also describe an in-garrison Captain transfer that can hand occupation credit to another selected player without withdrawing the whole garrison.</p>
          <h3>First Occupancy</h3>
          <p>The Palace starts behind the initial shield with neutral Old Guard defenders. The supplied notes recommend pre-forming the opening rally so your alliance can hit immediately when the first-hour shield expires and compete for the kingdom-wide First Occupancy reward.</p>
        </section>

        <section className="flamedragon-guide__panel" id="palace">
          <p className="eyebrow">Holding the centre</p><h2>Palace garrison strategy</h2>
          <h3>Recommended defensive troop ratios from the supplied notes</h3>
          <div className="flamedragon-guide__choice">
            <article className="flamedragon-guide__card"><h3>60 / 40 / 0</h3><strong>60% Infantry · 40% Cavalry · 0% Archer</strong><p>Heavy defensive specialisation. The source frames this as the pure durability option for concentrating defensive stats into the frontline.</p></article>
            <article className="flamedragon-guide__card"><h3>50 / 20 / 30</h3><strong>50% Infantry · 20% Cavalry · 30% Archer</strong><p>A more balanced garrison where Infantry absorbs pressure while Archers retain backline damage.</p></article>
          </div>
          <p className="flamedragon-guide__callout"><strong>Reinforcement rule:</strong> the notes advise reinforcing players to match the Garrison Lead’s chosen ratio instead of sending random troop splits.</p>

          <h3>Hero combinations listed in the source</h3>
          <p>The supplied event material’s hero recommendations stop at Generation 5, so these are preserved as source-specific examples rather than presented as a complete current-meta list.</p>
          <ul>
            <li><strong>Gen 1–2:</strong> Zoe + Saul; Marlin is suggested for ranged support in a mixed formation.</li>
            <li><strong>Gen 3–4:</strong> Petra + Alcar or Margot.</li>
            <li><strong>Gen 5 heavy defence:</strong> Thrud + Petra or Saul.</li>
            <li><strong>Gen 5 balanced defence:</strong> Thrud + Vivian.</li>
          </ul>
          <p><Link className="flamedragon-guide__link" to="/guides/kingshot-generation-6-heroes-yang-sophia-triton-guide">For newer rosters, compare those source notes with Forge’s Generation 6 hero guide →</Link></p>

          <h3>Joiners and widgets</h3>
          <ul>
            <li>The notes state that only the joining player’s lead hero <strong>first Expedition Skill</strong> contributes when reinforcing.</li>
            <li><strong>Hilde</strong> is recommended as a lead joiner where available because the supplied material describes her first Expedition Skill as providing stackable Squad Attack and Defense.</li>
            <li>For exclusive weapons/widgets, the source recommends stopping on even levels — 2, 4, 6, 8 or 10 — where its described milestone breakthroughs occur.</li>
          </ul>

          <h3>Multi-rally defensive timing</h3>
          <div className="flamedragon-guide__steps flamedragon-guide__steps--compact">
            <article><span>T−2m</span><div><h3>Lock the garrison</h3><p>Establish the main Garrison Captain, fill the chosen troop ratio and queue reinforcements.</p></div></article>
            <article><span>T−30s</span><div><h3>Cast Dragonscale Armor</h3><p>Have the +15% Attack/Defense effect active before the first enemy rally damage resolves.</p></div></article>
            <article><span>T+1s</span><div><h3>Trigger Dragonblood Healing</h3><p>Use it immediately after Wave 1 so there are wounded troops to restore before Wave 2 or Wave 3 arrives.</p></div></article>
            <article><span>After</span><div><h3>Fast reinforce</h3><p>Refill missing capacity and, if needed, transfer Captain status to the secondary lead without voluntarily dropping occupation.</p></div></article>
          </div>
        </section>

        <section className="flamedragon-guide__panel" id="speedups">
          <p className="eyebrow">Offensive timing</p><h2>Rally speedups and the “zero-warning” push</h2>
          <p>The source separates a rally into the <strong>assembly phase</strong>, where joiners travel to the captain, and the <strong>march phase</strong>, where the combined rally moves to its target. Rally Speedup consumables apply to the combined march once it is travelling.</p>
          <ol>
            <li><strong>Teleport close:</strong> reduce the base travel distance by positioning the Rally Captain near the Palace or target Aerie.</li>
            <li><strong>Pre-fill quickly:</strong> key joiners use individual march speedups to reach the captain before launch.</li>
            <li><strong>Launch early:</strong> do not wait for the full rally timer once the necessary capacity and joiner heroes are in place.</li>
            <li><strong>Chain 50% Rally Speedups:</strong> the supplied example reduces a 40-second march to 20, 10, 5 and then about 2.5 seconds.</li>
          </ol>
          <p>The notes also propose decoy rallies against secondary Aeries to split defender attention and recommend keeping the Rally Captain’s UI clear so the active march panel can be opened immediately.</p>
        </section>

        <section className="flamedragon-guide__panel" id="buffs">
          <p className="eyebrow">Live combat stats</p><h2>What stacks — and when to activate it</h2>
          <div className="flamedragon-guide__grid">
            <article className="flamedragon-guide__card"><h3>Personal city buffs</h3><p>Attack, Defense, Troop Expansion and movement-related buffs can run together when they are different categories. Two buffs of the same category overwrite rather than stack.</p></article>
            <article className="flamedragon-guide__card"><h3>Aerie buffs</h3><p>Blade, Shield, Life and Dragon Aeries provide the large alliance-wide Attack, Defense, Health and Lethality bonuses listed above.</p></article>
            <article className="flamedragon-guide__card"><h3>Crystal Skills</h3><p>R4/R5 can layer Dragonroar, Dragonscale Armor or Dragonblood Healing over the battlefield state when the alliance Pyrocrystal pool allows.</p></article>
            <article className="flamedragon-guide__card"><h3>Account buffs</h3><p>The notes also list VIP perks, castle/march skins and active pet skills as additional live-combat layers.</p></article>
          </div>
          <h3>Tyrant titles</h3>
          <div className="flamedragon-guide__grid flamedragon-guide__grid--four">
            {tyrantTitles.map((title) => <article className="flamedragon-guide__card" key={title.name}><h3>{title.name}</h3><p>{title.effect}</p></article>)}
          </div>
          <p className="flamedragon-guide__callout flamedragon-guide__callout--warning"><strong>Do not pre-buff registration:</strong> the source explicitly says Phase 1 and Phase 2 do not snapshot personal combat buffs. Activate combat consumables, troop expansion and short pet skills for Phase 4 instead.</p>
        </section>

        <section className="flamedragon-guide__panel" id="shops">
          <p className="eyebrow">Reward optimisation</p><h2>Dragon’s Caravan and prediction-shop priorities</h2>
          <p>The supplied notes describe Dragon’s Caravan stock as non-resetting across the event, apart from the daily free sign-in pack. That makes total-event planning more valuable than impulse buying.</p>
          <div className="flamedragon-guide__table-wrap">
            <table className="flamedragon-guide__table">
              <thead><tr><th>Priority</th><th>Category</th><th>Source recommendation</th></tr></thead>
              <tbody>
                <tr><td><strong>Tier 1</strong></td><td>Mythril / Pure Gold</td><td>Buy permanent gear and building bottlenecks first.</td></tr>
                <tr><td><strong>Tier 1</strong></td><td>Hero Gear EXP / Widget materials</td><td>High-value permanent progression for primary combat heroes.</td></tr>
                <tr><td><strong>Tier 2</strong></td><td>Current-generation Hero Fragments</td><td>Prioritise heroes relevant to your kingdom’s current roster and milestones.</td></tr>
                <tr><td><strong>Tier 3</strong></td><td>Universal / Healing Speedups</td><td>Useful after the permanent progression purchases are covered.</td></tr>
                <tr><td><strong>Tier 4</strong></td><td>Basic resources</td><td>Generally poor use of rare event currency.</td></tr>
              </tbody>
            </table>
          </div>
          <h3>Dragon Essence execution</h3>
          <ul>
            <li>Clear permanent gear bottlenecks first.</li>
            <li>Only buy hero fragments when they advance a relevant current-generation hero or an important star breakpoint.</li>
            <li>Because stock does not reset daily in the supplied notes, consider holding currency until late in the event so you know your final milestone income before committing.</li>
          </ul>
          <h3>Pack planning for spenders</h3>
          <p>The notes say most event pack stock does not reset daily. Their suggested order is Rally Speedup packs for Palace-leading Whales, then Searing Path / Dragon Caravan progression packs, with 50% Troop Expansion and core Attack/Defense buffs active for decisive structure fights.</p>
        </section>

        <section className="flamedragon-guide__panel" id="banquet">
          <p className="eyebrow">After the throne is decided</p><h2>Tyrant skins and Dragon Banquet</h2>
          <ul>
            <li>The exclusive Tyrant City Skin and Dragon March Skin are described as auto-equipping on coronation, with their 30-day timers starting immediately.</li>
            <li>The Dragon Banquet lasts 1 hour in the supplied notes and requires Town Center Level 13+.</li>
            <li>Players can send up to 3 dining squads.</li>
            <li>The notes recommend sending 5 daily Likes to the crowned Tyrant during Phase 5 for free Gem chests and drops.</li>
          </ul>
        </section>

        <section className="flamedragon-guide__panel flamedragon-guide__faq" id="faq">
          <p className="eyebrow">FAQ</p><h2>Flamedragon Tyrant questions</h2>
          <details open><summary>Can I switch alliances after registration?</summary><p>The supplied rules say no. You must belong to the registering alliance at the moment of Alliance Sign-Up to remain eligible for that alliance’s event roster.</p></details>
          <details><summary>Should I activate combat buffs during sign-up or dispatch?</summary><p>No. The source says registration locks eligibility and roster membership, not a combat-stat snapshot. Save temporary buffs for Phase 4.</p></details>
          <details><summary>Do troops die in Palace and Aerie combat?</summary><p>The supplied notes describe an unlimited event infirmary for Palace/Aerie fighting with no permanent troop deaths there. City attacks are different and can cause real troop losses through your normal hospital.</p></details>
          <details><summary>Who earns personal Palace occupation time?</summary><p>The Rally Captain. This is why the alliance’s designated Tyrant contender must lead the central rallies rather than only joining them.</p></details>
          <details><summary>When should I heal?</summary><p>Unless battlefield circumstances force you to heal earlier, the source recommends waiting for Phase 5 and using small alliance-help batches under the 500% Healing Speed and 30% Healing Cost reduction bonuses.</p></details>
          <details><summary>Do Dragonborn Escorts cost Stamina?</summary><p>The supplied notes state that Escorts cost zero Stamina, use a march queue, are solo-only, and provide both personal points and Alliance Pyrocrystals.</p></details>
          <details><summary>Does Dragon’s Caravan stock reset daily?</summary><p>The source says the main stock does not reset daily during the event, while the free daily sign-in pack does. Plan purchases across the full event total.</p></details>
          <details><summary>What happens to excess wounded troops when the event infirmary closes?</summary><p>The supplied notes say excess wounded troops remain safely in the standard hospital waiting to be healed rather than dying.</p></details>
        </section>

        <section className="flamedragon-guide__panel flamedragon-guide__verdict">
          <p className="eyebrow">Forge battle plan</p><h2>Win the event by giving every account a job</h2>
          <p>Flamedragon Tyrant rewards coordination across the full alliance. F2P players can generate Pyrocrystals, Escort points, prediction rewards and rally participation without trying to out-stat Whales. Dolphins create the Aerie and reinforcement conditions that make central pushes work. Palace-leading Whales convert those advantages into occupation time. R4/R5 officers connect all three layers through Crystal Skill timing and battlefield assignments.</p>
          <p><strong>The simplest rule set:</strong> stay safe when idle, never city-hit for event points, feed the alliance Pyrocrystal pool, stack Aerie and Crystal buffs before key structure fights, protect the designated Palace Captain, and save large-scale healing for Rearmament.</p>
        </section>
      </article>
    </main>
  )
}
