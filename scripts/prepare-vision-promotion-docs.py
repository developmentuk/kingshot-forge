from pathlib import Path
import re

roadmap = Path("src/pages/RoadmapPage.tsx")
roadmap_text = roadmap.read_text()
roadmap_pattern = re.compile(
    r'  \{\n    version: "Future",\n    name: "Forge Screenshot Intelligence Engine",.*?\n  \},',
    re.DOTALL,
)
roadmap_replacement = '''  {
    version: "Vision",
    name: "Forge Vision Platform and Account Linking",
    status: "development",
    progress: 100,
    priority: "Promotion candidate accepted 26 July 2026",
    description:
      "Forge Vision is complete as a governed platform service and screenshot-assisted account-linking capability. Authenticated preview acceptance has passed; controlled merge and production smoke testing remain.",
    features: [
      "Provider-neutral Vision platform and immutable mapping governance",
      "Bundled Tesseract.js screenshot extraction",
      "Player ID and Kingdom automatic suggestions",
      "Editable review-only display name and alliance tag",
      "Manual Town Centre confirmation from 1 to 30",
      "Private evidence storage, forced RLS and append-only audit history",
      "Server-authoritative Player API conflict handling",
    ],
  },'''
roadmap_text, count = roadmap_pattern.subn(roadmap_replacement, roadmap_text, count=1)
if count != 1:
    raise SystemExit(f"Roadmap Vision block replacements: {count}")
roadmap.write_text(roadmap_text)

notes = Path("src/pages/ReleaseNotesPage.tsx")
notes_text = notes.read_text()
needle = "<h2>Release 0.8.0 — Forge Operations Centre</h2>"
needle_index = notes_text.find(needle)
if needle_index < 0:
    raise SystemExit("Release Notes Operations entry not found")
article_start = notes_text.rfind('      <article className="release-entry release-entry--latest">', 0, needle_index)
if article_start < 0:
    raise SystemExit("Release Notes article boundary not found")
entry = '''      <article className="release-entry release-entry--latest">
        <div className="release-entry__heading">
          <div>
            <span className="release-entry__badge">Promotion candidate</span>
            <h2>VISION-REL-001 — Forge Vision Platform and Account Linking</h2>
            <p>Authenticated preview accepted 26 July 2026 · production promotion pending</p>
          </div>
          <Link className="button button--secondary" to="/my-forge">Open My Forge</Link>
        </div>
        <div className="release-entry__sections">
          <section><h3>Screenshot-assisted account linking</h3><ul><li>Bundled Tesseract.js OCR proposes Player ID and Kingdom from a Kingshot profile screenshot.</li><li>Display name and alliance tag remain editable, supporting and review-only.</li><li>Town Centre remains blank until the player manually confirms a whole number from 1 through 30.</li></ul></section>
          <section><h3>Trust and evidence</h3><ul><li>Successful Kingshot Player API values remain authoritative and conflicts stay visible.</li><li>OCR never verifies ownership, membership, rank or authority.</li><li>Private evidence storage, forced RLS, exact-evidence deletion and append-only audit controls are preserved.</li></ul></section>
          <section><h3>Release readiness</h3><ul><li>Authenticated desktop and mobile preview acceptance completed by the Product Owner.</li><li>All canonical Forge, Vision, rendering, Art Studio, lint and production-build gates pass.</li><li>Controlled merge, production deployment and production smoke testing remain required.</li></ul></section>
        </div>
      </article>

'''
notes.write_text(notes_text[:article_start] + entry + notes_text[article_start:])

record = Path("docs/releases/VISION-REL-001-MERGE-READINESS.md")
record_text = record.read_text()
old_status = "Status: **Automated integration accepted — owner preview acceptance required**"
if old_status not in record_text:
    raise SystemExit("Release record status not found")
record_text = record_text.replace(
    old_status,
    "Status: **Owner accepted — ready for controlled promotion**",
    1,
)
remaining_start = record_text.find("## Remaining gates")
if remaining_start < 0:
    raise SystemExit("Release record remaining gates heading not found")
record_tail = '''## Owner acceptance

Clark completed authenticated protected-preview acceptance on 26 July 2026 and explicitly approved PR #24 for promotion preparation.

The accepted preview covered desktop and mobile layouts, a genuine owner screenshot, Player ID and Kingdom extraction, editable review-only display name and alliance tag, blank-until-confirmed Town Centre handling, Player API authority, explicit unverified fallback behaviour, permission boundaries, evidence controls and Art Studio smoke testing.

## Remaining promotion gates

- Merge PR #24 to `main` using the approved repository merge method and exact reviewed head.
- Confirm the production deployment is built from the resulting `main` merge commit.
- Run the production smoke test required by the release process.
- Record the production result and create the appropriate semantic version tag when the release is confirmed.

## Recommendation

**GO for controlled merge of PR #24.**

The candidate is technically ready, manually accepted and documented. Production is not confirmed until merge, deployment and post-deployment smoke testing succeed.
'''
record.write_text(record_text[:remaining_start] + record_tail)
