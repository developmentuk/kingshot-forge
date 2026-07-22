# ART-002H Exact-Source Ingestion — ART-002M Candidate Note

ART-002H remains the ingestion boundary for exact UTF-8 file bytes and decoded text. ART-002L/M builds on it without rewriting existing submissions:

- file bytes, decoded text, line endings, BOM and browser evidence remain separately recorded;
- CRLF file input and LF paste input are reported honestly as transport representations;
- the canonical fixture retains 276 code points, 258 visible graphemes, 27 ideographic spaces, 2 emoji and 40 full-width characters;
- the preservation migration keeps raw source immutable, leaves RLS/FORCE RLS enabled, and adds no public grants;
- the read-only audit checked 14 existing submissions and found no remediation findings.

The candidate was validated with `npm run check`, which completed successfully in 122.7 seconds. Existing lint and bundle-size warnings remain documented; no production promotion was performed.

## ART-002M preview evidence

- Deployment: `dpl_BaaAqjGBkUfkefYFURRD3heNgBD3`
- URL: https://kingshot-forge-cj5rungq8-clarksim-7474s-projects.vercel.app
- Status: READY, preview target
- Commit: `895b4a3e9c40e1cdf257ee15dc728ed806fcb329`
- Supabase binding: `kingshot-forge` project `prj_qoxc7FGYaVFAwtREvHpB5viQguO7`
- Protection: SSO for all non-custom-domain deployments; Git fork protection enabled.
