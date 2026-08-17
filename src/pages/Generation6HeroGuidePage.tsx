import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import './Generation6HeroGuidePage.css'

const heroLinks = {
  yang: '/companion/heroes/yang',
  sophia: '/companion/heroes/sophia',
  triton: '/companion/heroes/triton',
} as const

function HeroLink({ hero, children }: { hero: keyof typeof heroLinks; children: React.ReactNode }) {
  return <Link className="gen6-guide__hero-link" to={heroLinks[hero]}>{children}</Link>
}

export default function Generation6HeroGuidePage() {
  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Kingshot Generation 6 Heroes: Yang, Sophia & Triton Guide | Kingshot Forge'
    return () => { document.title = previousTitle }
  }, [])

  return (
    <main className="gen6-guide">
      <nav className="gen6-guide__breadcrumbs" aria-label="Breadcrumb">
        <Link to="/companion">Companion</Link><span aria-hidden="true">›</span><Link to="/companion/heroes">Heroes</Link><span aria-hidden="true">›</span><span>Generation 6 guide</span>
      </nav>

      <article>
        <header className="gen6-guide__hero">
          <p className="eyebrow">Hero Guides · Generation 6</p>
          <h1>Kingshot Generation 6 Heroes: The Complete Yang, Sophia & Triton Guide</h1>
          <p className="gen6-guide__lead">Generation 6 brings three sharply defined heroes: Yang for damage and rally leadership, Sophia for control and defensive utility, and Triton for frontline durability. The best first investment depends less on a universal tier list and more on what your account actually needs.</p>
          <div className="gen6-guide__tags" aria-label="Guide topics">
            <span>Generation 6</span><span>Yang · Archer</span><span>Sophia · Cavalry</span><span>Triton · Infantry</span><span>F2P planning</span>
          </div>
        </header>

        <nav className="gen6-guide__jump" aria-label="Article sections">
          <a href="#overview">Overview</a><a href="#yang">Yang</a><a href="#sophia">Sophia</a><a href="#triton">Triton</a><a href="#build-order">Build order</a><a href="#rally-mechanic">Rally mechanic</a><a href="#mistakes">Mistakes</a><a href="#faq">FAQ</a>
        </nav>

        <section className="gen6-guide__panel" id="overview">
          <p className="eyebrow">At a glance</p><h2>What Generation 6 changes</h2>
          <p>Yang, Sophia and Triton each occupy a distinct troop role and arrive with a substantial base-stat step up over the previous generation. Their expedition kits matter across rallies, garrison defence, Arena, state warfare and Bear Hunt, but they do not all create value in the same way.</p>
          <p className="gen6-guide__callout"><strong>Unlock timing:</strong> Generation 6 first released to the oldest kingdoms on 16 February 2026 and rolls out progressively as kingdoms age, typically around day 350–365.</p>
          <div className="gen6-guide__table-wrap">
            <table className="gen6-guide__stats">
              <thead><tr><th>Hero</th><th>Troop</th><th>Attack</th><th>Defense</th><th>Health</th><th>Main acquisition</th></tr></thead>
              <tbody>
                <tr><td><HeroLink hero="yang"><strong>Yang</strong></HeroLink></td><td>Archer</td><td>7,200</td><td>5,926</td><td>44,454</td><td>Daily Deals, Hero Rally, Strongest Governor, Kingdom of Power</td></tr>
                <tr><td><HeroLink hero="sophia"><strong>Sophia</strong></HeroLink></td><td>Cavalry</td><td>5,926</td><td>5,926</td><td>59,274</td><td>Hero Roulette, Swordland Showdown Shop</td></tr>
                <tr><td><HeroLink hero="triton"><strong>Triton</strong></HeroLink></td><td>Infantry</td><td>4,546</td><td>5,926</td><td>99,910</td><td>Hall of Heroes, Swordland Showdown Shop</td></tr>
              </tbody>
            </table>
          </div>
          <p><strong>The stat picture is clear:</strong> Yang is the glass-cannon damage option, Triton is the frontline tank, and Sophia sits between them as a control and utility hero.</p>
          <div className="gen6-guide__grid">
            <article className="gen6-guide__card"><h3>Yang</h3><p>Best for players who lead rallies and want the most visible offensive power spike.</p><HeroLink hero="yang">Open Yang in Hero Companion →</HeroLink></article>
            <article className="gen6-guide__card"><h3>Sophia</h3><p>Best for efficient acquisition, control effects and defensive support.</p><HeroLink hero="sophia">Open Sophia in Hero Companion →</HeroLink></article>
            <article className="gen6-guide__card"><h3>Triton</h3><p>Best for garrison defence and accounts that need a dependable frontline anchor.</p><HeroLink hero="triton">Open Triton in Hero Companion →</HeroLink></article>
          </div>
        </section>

        <section className="gen6-guide__panel" id="yang">
          <p className="eyebrow">Archer · Offensive specialist</p><h2>Yang — the damage engine</h2>
          <p>Yang's kit is built around direct damage, critical hits and repeatable bonus-damage chances. He is the Generation 6 hero whose value is easiest to feel immediately when he is used in the role he was designed for: leading attacks.</p>
          <h3>Conquest skills</h3>
          <div className="gen6-guide__skill"><strong>Kin Throw</strong><span>Line-based area attack that damages enemies on the outward and returning path, scaling as the skill is upgraded.</span></div>
          <div className="gen6-guide__skill"><strong>Combo</strong><span>Provides a chance to fire a follow-up shot for additional damage.</span></div>
          <div className="gen6-guide__skill"><strong>Deadshot</strong><span>Raises Crit Rate, increasing both Yang's damage ceiling and the frequency of high-impact hits.</span></div>
          <h3>Expedition skills</h3>
          <div className="gen6-guide__skill"><strong>Avalanche</strong><span>Every four turns, all squads gain an additional strike for bonus damage.</span></div>
          <div className="gen6-guide__skill"><strong>Ice Zone</strong><span>Gives Yang's Archers a chance to deal bonus damage on each attack.</span></div>
          <div className="gen6-guide__skill"><strong>Ambush</strong><span>Gives all squads a scaling chance to deal increased damage on a turn.</span></div>
          <h3>Widget and best use</h3>
          <p>Yang's standout widget effect, <strong>Offensive Defense</strong>, increases Rally Squad Lethality. That makes him particularly valuable when <em>you</em> are the rally leader. His best homes are offensive PvP rallies, Arena burst line-ups, event damage pushes and Bear Hunt rallies that he leads himself.</p>
          <p><strong>F2P outlook:</strong> Yang has grindable acquisition routes through recurring events and activities. Reaching strong star and widget levels still takes time, but his path is considerably friendlier than a shop-locked hero.</p>
          <HeroLink hero="yang">See Yang's live Forge ratings and published skills →</HeroLink>
        </section>

        <section className="gen6-guide__panel" id="sophia">
          <p className="eyebrow">Cavalry · Control specialist</p><h2>Sophia — control, disruption and defence</h2>
          <p>Sophia is not a conventional Cavalry damage carry. Her value comes from making the enemy worse: confusion, vulnerability and damage-reduction effects can create openings for the rest of your formation.</p>
          <h3>Conquest skills</h3>
          <div className="gen6-guide__skill"><strong>Puppet Master</strong><span>AoE damage plus Confusion, which can cause affected enemies to attack nearby units regardless of side.</span></div>
          <div className="gen6-guide__skill"><strong>Scalding Mark</strong><span>Deals damage and marks the target so it takes more damage from other sources.</span></div>
          <div className="gen6-guide__skill"><strong>Scalding Mark — Lash</strong><span>Turns stacked marks into additional Attack and bonus damage against marked targets.</span></div>
          <h3>Expedition skills</h3>
          <div className="gen6-guide__skill"><strong>Arcane Pact</strong><span>Chance each turn to significantly reduce incoming squad damage.</span></div>
          <div className="gen6-guide__skill"><strong>Terror — Deathblow</strong><span>Applies Terror, increasing the Cavalry damage suffered by affected enemies on the following turn.</span></div>
          <div className="gen6-guide__skill"><strong>Terror — Annihilation</strong><span>Raises squad damage against targets already suffering from Terror.</span></div>
          <h3>Widget and best use</h3>
          <p><strong>Queen of Night</strong> increases Defender Squad Lethality, reinforcing Sophia's defensive and garrison identity. She is strongest in PvP defence, coordinated garrison support and short Arena fights where a well-timed control effect can swing the outcome.</p>
          <p className="gen6-guide__callout"><strong>Do not treat Sophia as a like-for-like replacement for an established offensive Cavalry rally leader.</strong> Her kit solves a different problem.</p>
          <p><strong>F2P outlook:</strong> Hero Roulette makes Sophia especially attractive to players already saving and spending gems efficiently. Her acquisition route is a major reason some players reasonably choose her first even when they rate Yang higher in pure battlefield impact.</p>
          <HeroLink hero="sophia">See Sophia's live Forge ratings and published skills →</HeroLink>
        </section>

        <section className="gen6-guide__panel" id="triton">
          <p className="eyebrow">Infantry · Frontline specialist</p><h2>Triton — the garrison anchor</h2>
          <p>Triton is designed to make the frontline difficult to remove. His value is less flashy than Yang's damage spikes, but his health pool and largely predictable defensive effects make him exceptionally dependable in long fights.</p>
          <h3>Conquest skills</h3>
          <div className="gen6-guide__skill"><strong>Tidewill</strong><span>Brief invulnerability followed by an AoE hit, allowing Triton to absorb pressure and counterattack.</span></div>
          <div className="gen6-guide__skill"><strong>Regal Wrath</strong><span>Temporarily raises Triton's own Attack and Defense.</span></div>
          <div className="gen6-guide__skill"><strong>Striking Hit</strong><span>Adds bonus damage to normal attacks against a random enemy.</span></div>
          <h3>Expedition skills</h3>
          <div className="gen6-guide__skill"><strong>Command of Power</strong><span>Raises total squad Defense.</span></div>
          <div className="gen6-guide__skill"><strong>Warfare of Power</strong><span>Raises total squad skill damage.</span></div>
          <div className="gen6-guide__skill"><strong>Oath of Power</strong><span>Raises Infantry Health while also providing smaller Health gains to Cavalry and Archers.</span></div>
          <h3>Widget and best use</h3>
          <p><strong>Whale Call</strong> increases Defender Squad Defense and confirms Triton as a garrison-first hero. Use him to absorb burst damage, anchor Infantry-heavy formations, reinforce structures and survive attrition fights where durability matters more than a short damage window.</p>
          <p><strong>F2P outlook:</strong> Triton's Hall of Heroes and Swordland Showdown Shop acquisition is slower and more resource-intensive than the other two Generation 6 routes. He is therefore usually the last Gen 6 priority for strict F2P accounts unless frontline defence is an urgent roster weakness.</p>
          <HeroLink hero="triton">See Triton's live Forge ratings and published skills →</HeroLink>
        </section>

        <section className="gen6-guide__panel" id="build-order">
          <p className="eyebrow">Investment planning</p><h2>Which Generation 6 hero should you build first?</h2>
          <p>There is no single honest answer because different build orders optimise different things.</p>
          <div className="gen6-guide__choice">
            <article className="gen6-guide__card"><h3>Acquisition-first</h3><p><strong>Sophia → Yang → Triton</strong></p><p>Take the Roulette hero efficiently, then direct broader shard investment into Yang. Leave Triton's more restrictive acquisition for later.</p></article>
            <article className="gen6-guide__card"><h3>Impact-first</h3><p><strong>Yang → Triton → Sophia</strong></p><p>Ignore acquisition cost and prioritise the clearest battlefield impact: offensive damage first, dependable frontline second, specialist control third.</p></article>
          </div>
          <h3>Practical recommendation</h3>
          <ul>
            <li><strong>Strict F2P:</strong> build Sophia through Roulette efficiency, then save broad-purpose investment for Yang.</li>
            <li><strong>You lead rallies or chase Arena/event damage:</strong> prioritise Yang.</li>
            <li><strong>Your garrison/frontline is the weak link:</strong> moving Triton ahead is entirely reasonable.</li>
          </ul>
          <p className="gen6-guide__callout gen6-guide__callout--warning"><strong>Avoid splitting scarce shards across all three at once.</strong> Three partly developed heroes can leave you weaker than one properly established Generation 6 hero in the role that matters most to your account.</p>
        </section>

        <section className="gen6-guide__panel" id="rally-mechanic">
          <p className="eyebrow">Important mechanic</p><h2>Leading vs joining: why Gen 6 can disappoint in Bear Hunt</h2>
          <p>When joining another player's rally as support, only the joining hero's <strong>first expedition skill</strong> contributes in that context. Later expedition skills and widget bonuses are not giving you the same value they provide when that hero leads.</p>
          <ul>
            <li><strong>Yang:</strong> Avalanche provides flat bonus damage, but his defining Rally Lethality widget does not turn him into a premium joiner.</li>
            <li><strong>Sophia:</strong> Arcane Pact is defensive damage reduction, which contributes little to a Bear Hunt damage score.</li>
            <li><strong>Triton:</strong> Command of Power is Defense-focused and is similarly poorly aligned with a boss-damage joiner role.</li>
          </ul>
          <p className="gen6-guide__callout"><strong>The practical result:</strong> none of the three Generation 6 heroes is designed as an elite Bear Hunt joiner. Earlier-generation heroes with strong first expedition damage skills can remain better joining choices. Gen 6 gains much more of its value when you are leading.</p>
        </section>

        <section className="gen6-guide__panel" id="mistakes">
          <p className="eyebrow">Avoid these traps</p><h2>Common Generation 6 mistakes</h2>
          <ol>
            <li><strong>Splitting shards across all three.</strong> It delays meaningful star breakpoints across your entire Gen 6 roster.</li>
            <li><strong>Ignoring widgets.</strong> Yang's Rally Lethality and Sophia/Triton's defender-oriented widget effects are part of their role identity, not decorative extras.</li>
            <li><strong>Using the right hero in the wrong job.</strong> Triton is not your damage carry, and Yang is not a defensive garrison anchor.</li>
            <li><strong>Building for a Gen 6 Bear Hunt joiner.</strong> Their first expedition skills make that a poor reason to invest.</li>
            <li><strong>Benching a maxed hero just because a newer generation appears.</strong> A fully developed hero with strong widgets can outperform a newer hero that has barely been built.</li>
          </ol>
        </section>

        <section className="gen6-guide__panel gen6-guide__faq" id="faq">
          <p className="eyebrow">FAQ</p><h2>Generation 6 questions</h2>
          <details open><summary>When does Generation 6 unlock?</summary><p>Generation 6 began rolling out to the oldest kingdoms on 16 February 2026. For later kingdoms, the unlock generally arrives as the kingdom approaches roughly 350–365 days old.</p></details>
          <details><summary>Who should a F2P player upgrade first?</summary><p>If you are optimising acquisition efficiency, Sophia's Roulette route is attractive. If you are optimising offensive impact and lead your own rallies, Yang is the stronger priority. Your current roster gap should decide the tie.</p></details>
          <details><summary>Does Sophia replace my Cavalry rally leader?</summary><p>Not automatically. Sophia is a control and defensive specialist; she is not simply a newer copy of a conventional offensive Cavalry lead.</p></details>
          <details><summary>Is Triton worth it for F2P?</summary><p>He can be, especially if garrison defence is the account's weakest role, but his acquisition route makes him a slower and usually lower-priority build for strict F2P players.</p></details>
          <details><summary>Are Gen 6 heroes still worth investing in after a newer generation arrives?</summary><p>Yes. Development level, stars, skills and widgets matter. A mature Gen 6 hero can remain stronger in its intended role than a lightly developed newer-generation replacement.</p></details>
        </section>

        <section className="gen6-guide__panel gen6-guide__verdict">
          <p className="eyebrow">Forge verdict</p><h2>Build the role, not just the generation</h2>
          <p><strong>Yang</strong> is the damage engine and clearest choice for rally leaders. <strong>Sophia</strong> is the acquisition-efficient control specialist who strengthens defensive play. <strong>Triton</strong> is the expensive but dependable tank that stabilises a weak frontline. Gen 6 rewards focused investment: choose the hero that fixes your most important roster gap, build them properly, and only then spread resources wider.</p>
          <div className="gen6-guide__tags"><Link to={heroLinks.yang}>Yang</Link><Link to={heroLinks.sophia}>Sophia</Link><Link to={heroLinks.triton}>Triton</Link><Link to="/companion/heroes">All heroes</Link></div>
        </section>
      </article>
    </main>
  )
}
