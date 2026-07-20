# DATA-002A Buildings publication checkpoint

## Correction checkpoint — 20 July 2026

The owner returned the first checkpoint for corrections. No Buildings import run
or staged records existed at that point, and no publication occurred.

Deployment `dpl_GMV4tBog8kVhUAt598qiQfa9YDsq` resolves to
`https://kingshot-forge-95pez7k5k-clarksim-7474s-projects.vercel.app`. The
previously tested hostname was a different deployment URL and was not valid
evidence for this deployment.

The correction adds authenticated import-run detail loading,
`review_required` as the initial state, preserved source records, prerequisite
warning presentation, record-level preview, publication summary and an
explicit publication-disabled review surface. No direct publication SQL or
public Buildings write is introduced.

Current gate: source fingerprint `840d70bc9173ef12d454fe72fbe517fe49124B250562c8fbef1b68c0f2dd1980`, 10 catalog records, 587 progression records, 0 blocking errors, 710 resolved mappings and 8 unresolved warnings. Authenticated staging remains pending; publication is prohibited until a later explicit owner approval.

## DATA-002A owner checkpoint — 20 July 2026

Supabase project `hrvdhjscwitqpwjhnjkm` now contains import run
`cc925b58-ac6e-4776-875a-1021067118c4`, owned by the authenticated `admin`
actor. It uses `forge-buildings-preflight-v2`, contract v1, and remains
`review_required`. The staged projection contains 10 catalog records and 587
progression records (597 total), 710 resolved prerequisite mappings, 8
unresolved warnings, 0 rejected records and 0 published Buildings rows.

The warnings are Sawmill (row 4, `town-center:2`, level 1), House 1 (row 5,
`town-center:3`, level 2), Quarry (row 6, `town-center:4`, level 3), Hero Hall
and House 3 (row 7, `town-center:5`, levels 1 and 3), Iron Mine (row 8,
`town-center:6`, level 5), Mill (row 9, `town-center:7`, level 6), and
Watchtower (row 143, `barracks:1`, level 1). Each remains unmapped because no
canonical catalog key exists; no silent mapping or fictitious building was
created.

The protected preview routes are `/admin/content-studio`, `/admin/imports`,
`/admin/data/buildings`, `/buildings`, and `/buildings/:buildingKey`.
Publication controls remain unavailable. The previous blank evidence was
caused by testing a hostname that did not resolve to the supplied deployment
ID, not by an HTTP 200 application-health guarantee.

Corrected preview artifact: deployment
`dpl_Bo5KoB4FR5DMi68GyVEFXrtsDd1j`, URL
`https://kingshot-forge-qhbttrt5d-clarksim-7474s-projects.vercel.app`, exact
deployed commit `4f60adef84c9ab7e28063658a4e6ec1b8a0186bf`, status `READY`.
The authenticated browser check stopped at Vercel login; owner visual
acceptance and role/capability checks therefore remain pending owner sign-in.

## REL-002 acceptance gate — 20 July 2026

The REL-001 warning-identity migration is applied. The existing run remains
`review_required` with 10 catalogue, 587 progression and 8 immutable warning
identities; published Buildings remain empty. REL-002 could not proceed to
owner review or publication because approved authenticated role sessions and
the exact `Approve Buildings Publication` decision were unavailable.
