import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import './VikingVengeanceGuidePage.css'

const wavePlan = [
  { waves: '1–6', target: 'Member cities', action: 'Send full marches to your assigned partners and keep your own city empty where practical.' },
  { waves: '7', target: 'Online cities only', action: 'Move reinforcements into active online players so no march is wasted on a city that will not be attacked.' },
  { waves: '8–9', target: 'Member cities', action: 'Resume your normal reciprocal reinforcement pattern and prepare the Wave 10 HQ preset.' },
  { waves: '10', target: 'Alliance HQ', action: 'Recall after Wave 9 completes, regroup, then send your strongest permitted Infantry-heavy HQ march.' },
  { waves: '11–13', target: 'Member cities', action: 'Redeploy immediately from HQ back into your squad partner cities.' },
  { waves: '14', target: 'Online cities only', action: 'Use alliance chat or the event member list to rotate troops into active online cities.' },
  { waves: '15–16', target: 'Member cities', action: 'Keep reinforcing surviving cities and watch anyone who has already failed once.' },
  { waves: '17', target: 'Online cities only', action: 'Final online-only wave. Make sure every useful march is inside an eligible target before impact.' },
  { waves: '18–19', target: 'Surviving cities', action: 'Prioritise high-tier Infantry and city survival. This is the point where defensive recalls may beat extra reinforcement kills.' },
  { waves: '20', target: 'Alliance HQ', action: 'Recall, regroup and send the final HQ defence march under leadership troop-cap and tier rules.' },
] as const

const heroGenerations = [
  { generation: 'Early / F2P', heroes: 'Howard · Saul · Gordon · Fahd', note: 'The supplied notes position Howard as the key accessible garrison lead, with Saul as a strong Total Squads support option.' },
  { generation: 'Generation 1', heroes: 'Amadeus · Helga · Jabel', note: 'Amadeus is highlighted for broad offensive and defensive squad buffs; Helga and Jabel are useful supporting options.' },
  { generation: 'Generation 2', heroes: 'Zoe · Hilde', note: 'The source highlights Zoe as a premium defensive anchor and Hilde as a defensive support hero.' },
  { generation: 'Generation 3', heroes: 'Eric · Jaeger · Petra', note: 'Eric is presented as a major defensive pillar, with Jaeger and Petra adding mitigation or damage pressure.' },
  { generation: 'Generation 4', heroes: 'Alcar · Rosa · Margot', note: 'Alcar is the source’s standout mid-to-late-game Infantry garrison tank, supported by Rosa or Margot.' },
  { generation: 'Generation 5+', heroes: 'Long Fei · Thrud · Triton · Yang', note: 'The supplied material names these as later-generation defensive or force-multiplying options as late waves become harder.' },
] as const

export default function VikingVengeanceGuidePage() {
  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Kingshot Viking Vengeance: Complete Event Guide | Kingshot Forge'
    return () => { document.title = previousTitle }
  }, [])

  return (
    <main className="viking-guide">
      <nav className="viking-guide__breadcrumbs" aria-label="Breadcrumb">
        <Link to="/companion">Companion</Link><span aria-hidden="true">›</span><span>Event guides</span><span aria-hidden="true">›</span><span>Viking Vengeance</span>
      </nav>

      <article>
        <header className="viking-guide__hero">
          <p className="eyebrow">Event Guide · Viking Vengeance</p>
          <h1>Kingshot Viking Vengeance: The Complete Alliance Guide</h1>
          <p className="viking-guide__lead">Viking Vengeance is a 20-wave alliance defence event where positioning, reinforcement discipline and timing can matter more than spending. This guide turns the supplied event notes into a practical playbook for F2P players, late-game accounts, whales and R4/R5 leadership.</p>
          <div className="viking-guide__tags" aria-label="Guide topics">
            <span>20 waves</span><span>F2P scoring</span><span>HQ waves 10 & 20</span><span>Online waves 7 · 14 · 17</span><span>Guard Station</span><span>Alliance leadership</span>
          </div>
        </header>

        <div className="viking-guide__alert" role="note">
          <strong>The rule that changes everything:</strong> your city is eliminated after its second failed defensive wave. The early-event goal is therefore to maximise reinforcement scoring without sacrificing the survival points you still need later.
        </div>

        <nav className="viking-guide__jump" aria-label="Article sections">
          <a href="#mechanics">Mechanics</a><a href="#golden-rules">Golden rules</a><a href="#waves">Wave plan</a><a href="#hq">HQ transitions</a><a href="#squads">Squads</a><a href="#late-game">Late game</a><a href="#heroes">Heroes</a><a href="#leadership">Leadership</a><a href="#advanced">Advanced tips</a><a href="#checklist">Checklist</a><a href="#faq">FAQ</a>
        </nav>

        <section className="viking-guide__panel" id="mechanics">
          <p className="eyebrow">Understand the score</p><h2>How Viking Vengeance works</h2>
          <div className="viking-guide__grid viking-guide__grid--four">
            <article className="viking-guide__card"><strong>20</strong><h3>Attack waves</h3><p>Vikings attack alliance member cities across twenty escalating waves.</p></article>
            <article className="viking-guide__card"><strong>2 defeats</strong><h3>City elimination</h3><p>After a city fails two defensive waves it is eliminated from the remaining city attacks.</p></article>
            <article className="viking-guide__card"><strong>7 · 14 · 17</strong><h3>Online-only waves</h3><p>These waves target online alliance members, so reinforcements must be moved into players who are actually eligible.</p></article>
            <article className="viking-guide__card"><strong>10 · 20</strong><h3>Alliance HQ waves</h3><p>These waves target the Alliance HQ rather than individual cities and need a coordinated recall-and-deploy transition.</p></article>
          </div>

          <h3>Two different ways to score</h3>
          <div className="viking-guide__split">
            <article className="viking-guide__card"><h3>Home defence points</h3><p>Your city earns fixed defence points when it survives. The supplied notes say that this home score is capped regardless of whether your own troops or allied reinforcements make the kills.</p></article>
            <article className="viking-guide__card"><h3>Reinforcement points</h3><p>Your marched troops earn personal points from kills they make while defending an ally’s city or the Alliance HQ. This is why keeping useful troops deployed matters so much.</p></article>
          </div>
          <p className="viking-guide__callout"><strong>Core scoring idea:</strong> an empty city can still receive its fixed city-defence score while the allies inside it take the reinforcement kill credit. That lets a coordinated squad create value for both the host and the reinforcers.</p>
        </section>

        <section className="viking-guide__panel" id="golden-rules">
          <p className="eyebrow">F2P foundation</p><h2>The three golden rules</h2>
          <div className="viking-guide__steps">
            <article><span>1</span><div><h3>Empty your city before Wave 1</h3><p>Deploy as much of your army as your march queues allow into assigned allies or approved stash locations. If your own troops remain home, they can take kills that would otherwise score for the allies reinforcing you.</p></div></article>
            <article><span>2</span><div><h3>Do not heal during normal waves</h3><p>Healing sends troops back into your city and can undo the empty-city setup. The source gives two practical exceptions: immediately after Wave 9 or Wave 19 if the healed troops are then sent straight out for the upcoming HQ wave.</p></div></article>
            <article><span>3</span><div><h3>Set your Guard Station first</h3><p>Put your three strongest defensive heroes into the Guard Station before the event. Their defensive stats and applicable skills strengthen the allied troops garrisoned inside your city even when your own army is deployed elsewhere.</p></div></article>
          </div>
          <p className="viking-guide__callout viking-guide__callout--warning"><strong>Late-game exception:</strong> “empty your city” is the ideal scoring setup, not a rule to follow blindly. Once your troop count exceeds your available march capacity — or Waves 18–19 threaten your second defeat — survival can be worth more than squeezing out a few extra reinforcement kills.</p>
        </section>

        <section className="viking-guide__panel" id="waves">
          <p className="eyebrow">20-wave playbook</p><h2>What to do on every wave</h2>
          <div className="viking-guide__table-wrap">
            <table className="viking-guide__table">
              <thead><tr><th>Wave</th><th>Target</th><th>Recommended action from the supplied strategy</th></tr></thead>
              <tbody>{wavePlan.map((row) => <tr key={row.waves}><td><strong>{row.waves}</strong></td><td>{row.target}</td><td>{row.action}</td></tr>)}</tbody>
            </table>
          </div>
          <div className="viking-guide__do-dont">
            <article><h3>Do</h3><ul><li>Keep marches inside active targets.</li><li>Prioritise Infantry-heavy outgoing reinforcements.</li><li>Watch first-defeat cities closely.</li><li>Recall only after the current wave has actually resolved.</li><li>Keep a saved HQ preset ready.</li></ul></article>
            <article><h3>Avoid</h3><ul><li>Healing between ordinary city waves.</li><li>Wasting reinforcements on offline players during online-only waves.</li><li>Panic recalls while Vikings are still marching.</li><li>Filling HQ capacity with low-value troops before others can participate.</li><li>Leaving useful marches idle.</li></ul></article>
          </div>
        </section>

        <section className="viking-guide__panel" id="hq">
          <p className="eyebrow">Highest-pressure transitions</p><h2>Wave 9 → 10 and Wave 19 → 20</h2>
          <p>Waves 10 and 20 hit the Alliance HQ. Any march still inside a member city or stuck returning home when the Viking HQ raid lands earns nothing for that HQ wave, so the transition needs to be rehearsed rather than improvised.</p>
          <div className="viking-guide__transition">
            <span>Wave 9/19 resolves</span><strong>→</strong><span>Recall marches</span><strong>→</strong><span>Speed home if needed</span><strong>→</strong><span>Deploy saved HQ preset</span><strong>→</strong><span>Speed to HQ</span>
          </div>
          <ol>
            <li><strong>Wait for the battle result.</strong> Do not recall while the previous wave is still travelling or fighting.</li>
            <li><strong>Recall immediately after victory.</strong> Use the March Queue panel rather than hunting for each reinforced city on the map.</li>
            <li><strong>Accelerate the return if required.</strong> The source suggests keeping march speedups available for this specific transition.</li>
            <li><strong>Send a pre-built Infantry-heavy HQ preset.</strong> Follow leadership’s tier and troop-cap rules rather than sending whatever happens to be available.</li>
            <li><strong>Arrive before the raid and before capacity fills.</strong> A late march can bounce or miss the battle entirely.</li>
          </ol>
          <p className="viking-guide__callout"><strong>Source timing example:</strong> the supplied notes describe a roughly 30–45 second Wave 9-to-10 transition and recommend arriving 5–10 seconds before the HQ raid. Treat those figures as planning guidance, not a universal timer; actual march distance and event timing determine your real window.</p>
        </section>

        <section className="viking-guide__panel" id="squads">
          <p className="eyebrow">Alliance structure</p><h2>Use squads instead of random reinforcements</h2>
          <p>The supplied strategy recommends small groups of roughly 3–6 nearby players. The aim is predictable march travel, balanced scoring and a known fallback when one member takes a defeat.</p>
          <div className="viking-guide__grid">
            <article className="viking-guide__card"><h3>Cluster geographically</h3><p>Move squad cities together before the event so reinforcement swaps are measured in seconds rather than long map marches.</p></article>
            <article className="viking-guide__card"><h3>Balance account strength</h3><p>Group broadly similar troop tiers and hero power where possible so one account does not consume most of the kill pool every wave.</p></article>
            <article className="viking-guide__card"><h3>Use circular reinforcement</h3><p>A reinforces B, B reinforces C, C reinforces A. Each city is defended while each player’s useful troops are deployed away from home.</p></article>
          </div>

          <h3>Attendance categories</h3>
          <ul>
            <li><strong>Active / online:</strong> prioritise these players for reinforcements because Waves 7, 14 and 17 can target them.</li>
            <li><strong>Offline / passive:</strong> have them send troops out into active allies before logging off.</li>
            <li><strong>Non-participating:</strong> avoid tying up alliance marches in accounts expected to fail early.</li>
          </ul>

          <h3>The 2–3 reinforcement sweet spot</h3>
          <p>The source warns against stacking five or six marches into one city. Because the city’s kills are a finite pool, too many reinforcers dilute everyone’s share. Its recommended operating range is usually two to three solid reinforcement marches per active city, adjusted for your alliance’s troop strength and difficulty.</p>
        </section>

        <section className="viking-guide__panel" id="late-game">
          <p className="eyebrow">Waves 15–20</p><h2>When the empty-city strategy stops fitting</h2>
          <p>Late-game accounts often own far more troops than they can hide in five or six deployment queues. The source treats that as a different optimisation problem: protect the best outgoing Infantry, avoid unnecessary kill stealing, and pivot toward city survival before the second defeat.</p>
          <div className="viking-guide__grid viking-guide__grid--two">
            <article className="viking-guide__card"><h3>1. Reciprocal tanking</h3><p>If everyone in the squad has overflow troops, accept that some troops will remain home. Continue exchanging full marches while using the home garrison as extra protection against the hardest waves.</p></article>
            <article className="viking-guide__card"><h3>2. Stash overflow</h3><p>The supplied notes suggest parking non-priority troops in safe alliance structures or distant gathering nodes before the event, then recalling them before an HQ wave if they are needed.</p></article>
            <article className="viking-guide__card"><h3>3. Filter by troop value</h3><p>Put your best Infantry into outgoing reinforcement marches first. If troops must stay home, leave lower tiers or secondary troop types so allied high-tier Infantry has the best chance of taking the early kills.</p></article>
            <article className="viking-guide__card"><h3>4. Use a strong city as a hub</h3><p>A top account with excellent Guard Station stats can host several lower-power reinforcers. The host supplies the defensive aura while the visiting players collect reinforcement kills.</p></article>
          </div>

          <h3>The defensive recall switch</h3>
          <p>The supplied strategy recommends reassessing around Wave 17 or 18. If your city is at risk of its second defeat, recall one or two high-tier reinforcement marches and defend home. Preserving the remaining city-completion points can be worth more than chasing a small number of extra kills elsewhere.</p>

          <h3>Late-wave thresholds are difficulty dependent</h3>
          <p>The source gives example late-game planning numbers — including Viking forces in the hundreds of thousands, a roughly 200,000 T9/T10 garrison target for some Wave 18–19 situations, and very large Wave 20 HQ garrisons. Those figures are explicitly tied to kingdom/event difficulty and should <strong>not</strong> be treated as fixed game constants.</p>
          <div className="viking-guide__table-wrap">
            <table className="viking-guide__table">
              <thead><tr><th>Troop tier</th><th>Source assessment for Waves 18–20</th><th>Practical use</th></tr></thead>
              <tbody>
                <tr><td>T1–T7</td><td>Very vulnerable in the hardest waves</td><td>Filler or overflow rather than the core defensive line.</td></tr>
                <tr><td>T8</td><td>Conditional</td><td>Can contribute with stronger T9/T10 Infantry and good Guard Station support.</td></tr>
                <tr><td>T9</td><td>Strong late-wave baseline</td><td>Useful core defence for Wave 18–19 in the source strategy.</td></tr>
                <tr><td>T10</td><td>Highest-priority tank</td><td>Prioritised for the hardest city and HQ defence.</td></tr>
              </tbody>
            </table>
          </div>
          <p className="viking-guide__callout"><strong>Composition guidance from the supplied notes:</strong> an Infantry-heavy defence around 65–70% Shields is suggested for the hardest waves, with the remainder in Cavalry/Marksmen. Adapt this to your actual roster, hero buffs and event difficulty.</p>
        </section>

        <section className="viking-guide__panel" id="heroes">
          <p className="eyebrow">Guard Station & reinforcements</p><h2>Hero strategy by generation</h2>
          <p>The source separates heroes into two jobs: <strong>Guard Station / garrison leadership</strong>, where Total Squads-style defensive effects help everyone inside the city or HQ, and <strong>outgoing reinforcement marches</strong>, where your own squad needs strong Infantry and damage output.</p>
          <div className="viking-guide__table-wrap">
            <table className="viking-guide__table">
              <thead><tr><th>Era</th><th>Heroes named in the supplied strategy</th><th>Role</th></tr></thead>
              <tbody>{heroGenerations.map((row) => <tr key={row.generation}><td><strong>{row.generation}</strong></td><td>{row.heroes}</td><td>{row.note}</td></tr>)}</tbody>
            </table>
          </div>

          <h3>Suggested Guard Station shape</h3>
          <div className="viking-guide__table-wrap">
            <table className="viking-guide__table">
              <thead><tr><th>Slot</th><th>Source options</th><th>Objective</th></tr></thead>
              <tbody>
                <tr><td>Lead</td><td>Alcar / Eric / Zoe / Howard</td><td>Frontline Infantry defence and applicable garrison effects.</td></tr>
                <tr><td>2nd</td><td>Saul / Amadeus / Long Fei</td><td>Total Squads-style Defence, Health or Attack support.</td></tr>
                <tr><td>3rd</td><td>Hilde / Jaeger / Gordon</td><td>Damage reduction and secondary troop support.</td></tr>
              </tbody>
            </table>
          </div>
          <p className="viking-guide__callout"><strong>Generation 6:</strong> the supplied Viking notes name Triton and Yang as later-generation garrison options but do not provide enough event-specific detail to build a new Viking meta around them. For their published Forge profiles and broader roles, use the <Link className="viking-guide__link" to="/guides/kingshot-generation-6-heroes-yang-sophia-triton-guide">Generation 6 hero guide</Link>.</p>
        </section>

        <section className="viking-guide__panel" id="leadership">
          <p className="eyebrow">R4 / R5 operations</p><h2>How leadership keeps the alliance scoring</h2>
          <div className="viking-guide__steps">
            <article><span>24h</span><div><h3>Run an attendance poll</h3><p>Separate active, offline/passive and non-participating accounts so officers know who should receive reinforcements during the online-only waves.</p></div></article>
            <article><span>HQ</span><div><h3>Publish Waves 10 & 20 rules</h3><p>Set a per-player troop cap and a minimum troop tier/composition before the event. The source gives example caps of 25,000–50,000 per member so more players can access HQ points, but leadership should tune that number to actual HQ capacity.</p></div></article>
            <article><span>Lead</span><div><h3>Appoint the garrison leader</h3><p>Use the strongest available defensive lead so the HQ garrison benefits from the best applicable hero and gear effects.</p></div></article>
            <article><span>Live</span><div><h3>Track failures in real time</h3><p>Call out first-defeat cities that need help. When a member takes the second defeat, tell reinforcers to recall immediately and redeploy to a surviving target.</p></div></article>
          </div>

          <h3>Whale responsibilities</h3>
          <ul>
            <li>Spread high-tier reinforcement marches across several low/mid-power active cities instead of overlapping another whale in the same target.</li>
            <li>Use the whale city’s Guard Station as a high-stat reinforcement host for lower-power members when practical.</li>
            <li>Lead or anchor HQ defence when that account has the best defensive garrison setup.</li>
            <li>Use secondary accounts as one-way reinforcement support where alliance rules permit it.</li>
          </ul>
          <p className="viking-guide__callout"><strong>Source whale march example:</strong> roughly 75% high-tier Infantry and 25% Lancer/Cavalry is suggested for a primary reinforcement march, with high-damage heroes on outgoing marches. Treat this as the supplied strategy’s starting point rather than a universal optimal ratio.</p>
        </section>

        <section className="viking-guide__panel" id="advanced">
          <p className="eyebrow">Execution edge</p><h2>Advanced tricks that prevent wasted marches</h2>
          <div className="viking-guide__grid">
            <article className="viking-guide__card"><h3>Use the event member list</h3><p>Before Waves 7, 14 and 17, use the Viking event interface to identify online members and redirect marches away from ineligible offline targets.</p></article>
            <article className="viking-guide__card"><h3>Pre-save speedups for HQ</h3><p>Player marches do not automatically match the increasing Viking raid speed. Keep march speedups available for the 9→10 and 19→20 transitions rather than spending them randomly.</p></article>
            <article className="viking-guide__card"><h3>Keep the hive tight</h3><p>The source recommends positioning the Alliance HQ centrally within the active member cluster and keeping squad cities close enough that reinforcement travel stays short.</p></article>
            <article className="viking-guide__card"><h3>Use alts as point buffers</h3><p>During ordinary city waves, an empty secondary account can host a reinforcement march and provide another kill-scoring opportunity before late waves demand concentration on stronger main accounts.</p></article>
            <article className="viking-guide__card"><h3>Do not extinguish event fires</h3><p>The supplied notes describe the burning visual as cosmetic during Viking Vengeance. Save Gems rather than extinguishing a city mid-event.</p></article>
            <article className="viking-guide__card"><h3>Do not rely on Peace Shields</h3><p>The source says Peace Shields do not stop Viking raids. Keep them for content where they actually protect you from PvP attacks.</p></article>
          </div>
          <p className="viking-guide__callout"><strong>Troop safety note from the supplied material:</strong> Viking Vengeance wounds troops rather than causing the normal permanent troop/resource losses described for PvP. That is why the strategy focuses on hospital management and points rather than protecting resources.</p>
        </section>

        <section className="viking-guide__panel" id="checklist">
          <p className="eyebrow">10 minutes to Wave 1</p><h2>Pre-event checklist</h2>
          <div className="viking-guide__steps viking-guide__steps--compact">
            <article><span>10m</span><div><h3>Position your city</h3><p>Move into the assigned squad cluster or close to the Alliance HQ so your swap and recall travel times stay short.</p></div></article>
            <article><span>8m</span><div><h3>Set Guard Station heroes</h3><p>Install your strongest defensive trio and make sure the intended lead has the relevant defensive equipment or Widget available.</p></div></article>
            <article><span>6m</span><div><h3>Review combat buffs</h3><p>The source suggests using Attack/Defense buffs and defensive Governor talents where available.</p></div></article>
            <article><span>4m</span><div><h3>Build Infantry-heavy presets</h3><p>Put your strongest Infantry into outgoing marches, and save a separate HQ preset for Waves 10 and 20.</p></div></article>
            <article><span>2m</span><div><h3>Deploy your army</h3><p>Send available march queues into assigned squadmates and confirm your own city is as empty as your account allows.</p></div></article>
            <article><span>1m</span><div><h3>Confirm attendance in chat</h3><p>Say you are online, verify incoming reinforcements and make sure officers know your squad is ready.</p></div></article>
          </div>
        </section>

        <section className="viking-guide__panel viking-guide__faq" id="faq">
          <p className="eyebrow">Quick answers</p><h2>Viking Vengeance FAQ</h2>
          <details><summary>Should I leave troops in my own city?</summary><p>Early and mid-event, the supplied strategy says to empty your city as far as march capacity allows so allied reinforcers take the kill credit. In late waves, switch back toward home defence if overflow troops are unavoidable or your second defeat is at risk.</p></details>
          <details><summary>Should I heal during the event?</summary><p>Normally no. Healing returns troops to your city and can steal reinforcement kills. The source allows an exception after Wave 9 or 19 if you immediately send those troops back out for the HQ wave.</p></details>
          <details><summary>Which waves only attack online players?</summary><p>Waves 7, 14 and 17 according to the supplied event notes.</p></details>
          <details><summary>Which waves attack the Alliance HQ?</summary><p>Waves 10 and 20. Leadership should publish troop caps and tier/composition rules before the event begins.</p></details>
          <details><summary>Do Peace Shields stop Viking raids?</summary><p>No according to the supplied material. Do not spend a shield expecting it to block the event attacks.</p></details>
          <details><summary>Should I extinguish my city if it burns?</summary><p>The supplied notes say the fire is cosmetic during Viking Vengeance, so spending Gems to extinguish it during the event does not improve your event outcome.</p></details>
          <details><summary>What is the best troop type?</summary><p>The supplied strategy heavily prioritises Shield Infantry because of the described battle order and their late-wave defensive value. It recommends Infantry-heavy outgoing and late-wave defensive formations rather than an all-purpose fixed ratio for every account.</p></details>
        </section>

        <section className="viking-guide__panel viking-guide__verdict">
          <p className="eyebrow">Forge verdict</p><h2>Viking Vengeance is an organisation check</h2>
          <p>The strongest alliance is not simply the one with the biggest accounts. A well-run Viking Vengeance has squad assignments before Wave 1, empty or deliberately managed home cities, clear online-wave rotations, strict HQ capacity rules, a rehearsed Wave 9/19 recall sequence and officers watching first and second defeats in real time.</p>
          <p>For F2P players, the opportunity is simple: keep your marches working, let your Guard Station strengthen incoming allies, do not sabotage the scoring loop by unnecessary healing, and know when to abandon maximum kill efficiency in favour of keeping your city alive.</p>
        </section>
      </article>
    </main>
  )
}
