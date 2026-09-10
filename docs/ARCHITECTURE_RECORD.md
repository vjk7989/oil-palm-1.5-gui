# Architecture Record

## Current baseline

**Status:** Operational pages complete and verified
**Recorded:** 2026-08-09
**Scope:** AP-only Buckleson-style PalmWatch demonstration UI

The application is a dependency-free static HTML, CSS, and JavaScript dashboard. It adopts the supplied Buckleson portal's compact operational composition and pink/rose OKLCH visual system while replacing its identity, geography, access rules, and records with the PalmWatch Andhra Pradesh demonstration model.

The primary experience is a synchronized geographic explorer:

`Andhra Pradesh -> District -> Mandal -> Village -> Farm -> Tree`

Map markers, Table view, the right-side child rail, breadcrumbs, Back, and Reset operate on the same in-memory explorer state. Farm Detail uses an 8x8 tree grid; occupied cells open Tree Detail and black cells represent disabled no-tree positions with no Tree ID.

## Architecture and data flow

- `index.html` contains the visual tokens, AP demonstration records, RBAC scope definitions, explorer state, renderers, and event handlers.
- The authorized geography is derived by intersecting the signed-in role's district, mandal, or farm assignment with the AP dataset before any explorer metrics or children are rendered.
- Role-scoped metrics are calculated from the authorized farm records. Public industry context is displayed separately and is never used as an operational total.
- The New Farm route uses a preview-before-save workflow. Preview remains in memory; an explicit Save farm action atomically adds the validated farm and its exact tree layouts to versioned browser-local demo state. It does not invent cases, treatments, survey readings, diagnoses, imagery, audit entries, or notifications.
- Alerts and all subsequent operational pages reuse the same authorized AP farm set. Shared demonstration interaction state is loaded from and saved to one versioned browser-local document (`palmwatch.ap.v1.demoState`); malformed, missing, or outdated state falls back to deterministic defaults.

## Decision: realistic geographic map

The Overview uses Leaflet 1.9.4 with OpenStreetMap tiles. The map is constrained to Andhra Pradesh bounds, supports pan, zoom, keyboard interaction, and renders role-authorized district, mandal, village, or farm markers from latitude/longitude coordinates. Selecting a marker advances the same explorer state used by cards and Table view.

Leaflet assets and OpenStreetMap tiles are loaded from public CDNs. If the map library or tiles cannot load, the map area presents an explicit unavailable state and the accessible region rail and Table view remain available with the same role-scoped records. The map is therefore an enhancement rather than the only way to access operational data.

OpenStreetMap attribution remains visible on the rendered map. Coordinates are geographically plausible deterministic demonstration coordinates; they are not asserted to be surveyed farm boundaries or ownership evidence.

## Decision: role and geography scope

The active portfolio contains Andhra Pradesh only. Direct navigation and all derived metrics fail closed to the authorized subset.

| Role | Authorized AP scope | Functional access |
| --- | --- | --- |
| System Administrator | All six districts and all descendant records | Overview, New Farm preview, Alerts, Reports, Cases & Treatments, Administration, Settings |
| CEO / General Manager | All six districts and all descendant records | Overview, New Farm preview, Alerts, Reports, Cases & Treatments, Administration, Settings |
| Plantation Head | Eluru and East Godavari and their descendants | Overview, Alerts, Reports, Cases & Treatments, Settings |
| Area Manager | Pedavegi mandal in Eluru and its descendants | Overview, Alerts, Reports, Cases & Treatments, Settings |
| Field Staff | `FRM-AP-ELR-0004` and its tree/task context only | Overview, Alerts, Cases & Treatments, Settings |

The scope model is data-first: district filters are applied before mandal filters, and farm assignments are then applied before empty parents are removed. Reset returns to the selected role's full assignment and never widens access.

Disease Analytics is not a standalone destination. Relevant health context remains available in Overview, Farm, Tree, Alerts, Reports, and Cases & Treatments without creating a separately authorized analytics surface.

## Decision: shared demo state and AP-scoped alerts

The first operational-pages increment establishes the shared browser-local state contract and replaces the Alerts placeholder with a functional Buckleson-style infection watchlist.

- Alert records reference existing Farm IDs; `scopedAlerts()` first derives the authorized AP farm map and excludes every alert whose farm is outside it.
- Alerts are ordered by severity, then farm risk and observation date. Role-scoped metric cards, unread badges, read/severity filters, and empty states all use that same collection.
- Every protected role may mark an authorized alert or all alerts in its current assignment as read. Read IDs are stored per demo account so one role's action does not alter another role's unread state.
- A View Farm action resolves through the scoped farm guard. Unknown and unauthorized Farm IDs produce the same non-identifying unavailable response.
- Severity is conveyed with labels and symbols in addition to green, amber, red, or grey colour.
- If browser storage is unavailable, alert changes remain valid for the current session and an explicit live status message explains that they were not persisted.

The shared state document reserves collections for treatments, administration changes, report history, and preferences so later operational-page increments can use one migration boundary. It stores demonstration UI state only and does not modify the deterministic farm portfolio.

## Decision: realistic deterministic demonstration data

Operational records are deterministic demonstration data designed to be internally coherent and geographically plausible for AP oil-palm operations. They are explicitly labelled as demo data in the interface.

The expanded verified portfolio reconciles to:

- 5 protected roles.
- 6 districts.
- 12 mandals.
- 13 villages.
- 19 farms.
- 153 planted acres.
- 8,280 planted palms.
- 7,286 surveyed palms.
- 682 suspected palms.
- 396 infected palms.
- 228 pending-work items.

Farm acreage, palm counts, health states, survey coverage, suspected palms, pending work, coordinates, and tree evidence are simulated. Totals shown to a restricted role are recalculated only from records visible to that role.

Official Godrej Agrovet and Andhra Pradesh Horticulture figures are retained in this architecture record as source context only and are not rendered by the application. They must not be presented as PalmWatch operational totals, farm ownership evidence, or validation of the simulated farm records. No unsourced business-critical farm, farmer, ownership, inspection, disease, or GPS value should be presented as factual.

## Decision: realistic AP portfolio expansion and public-source boundary

The realistic-data expansion adds Kakinada and NTR to the deterministic Andhra Pradesh explorer while preserving the existing protected-role assignments. The hierarchy is now six districts, twelve mandals, thirteen villages, and nineteen farms. Kakinada contains Peddapuram / Kandrakota and Jaggampeta / Gurrappalem; NTR contains Mylavaram / Velvadam and Tiruvuru / Mustikuntla. District, mandal, village, and farm markers use explicit geographically plausible coordinates near their named public places. They remain simulated operational points rather than surveyed boundaries or ownership evidence.

The eight accepted expansion farms are fixed fixtures rather than runtime-generated data:

| Farm ID | Hierarchy | Acres / density / palms | Surveyed / suspected / infected / pending | Risk / last survey |
| --- | --- | --- | --- | --- |
| `FRM-AP-KAK-0401` | Kakinada / Peddapuram / Kandrakota | 7 / 52 / 364 | 331 / 24 / 11 / 8 | 2.9% / 2026-08-01 |
| `FRM-AP-KAK-0402` | Kakinada / Peddapuram / Kandrakota | 9 / 53 / 477 | 419 / 46 / 29 / 15 | 6.1% / 2026-07-29 |
| `FRM-AP-KAK-0413` | Kakinada / Jaggampeta / Gurrappalem | 8 / 54 / 432 | 395 / 20 / 8 / 7 | 1.8% / 2026-08-05 |
| `FRM-AP-KAK-0421` | Kakinada / Jaggampeta / Gurrappalem | 10 / 55 / 550 | 468 / 62 / 41 / 20 | 7.4% / 2026-07-31 |
| `FRM-AP-NTR-0501` | NTR / Mylavaram / Velvadam | 6 / 56 / 336 | 302 / 21 / 9 / 8 | 2.7% / 2026-08-02 |
| `FRM-AP-NTR-0510` | NTR / Mylavaram / Velvadam | 8 / 57 / 456 | 414 / 38 / 22 / 12 | 4.9% / 2026-08-06 |
| `FRM-AP-NTR-0522` | NTR / Tiruvuru / Mustikuntla | 9 / 52 / 468 | 381 / 58 / 39 / 22 | 8.3% / 2026-07-27 |
| `FRM-AP-NTR-0530` | NTR / Tiruvuru / Mustikuntla | 7 / 54 / 378 | 352 / 16 / 6 / 5 | 1.6% / 2026-08-07 |

The expansion changes only discoverable geography, farm metrics, map/table nodes, reports, and Administration assignment options. It deliberately creates no alerts, cases, treatments, assessments, or diagnostic evidence for the eight farms. Existing operational workflow records remain linked only to their accepted pre-expansion Farm IDs.

The public-source basis is retained in documentation and remains separate from every role-scoped metric and export:

- The [Godrej Agrovet Oil Palm Business public page](https://www.godrejagrovet.com/businesses/oil-palm-business) states approximately 65,000 farmers and more than 75,000 hectares across six states.
- The [Andhra Pradesh Horticulture Department Oil Palm page](https://horticulture.ap.nic.in/OIL%20PALM.html) reports 226,528 hectares covered against 476,913 hectares of potential across 24 districts.

These figures describe public industry and programme context. They are not PalmWatch demo totals, restricted-role totals, mapped-farm ownership, proof that a location is company-owned, or validation of any simulated health reading. The runtime Overview no longer displays these figures or source links.

System Administrator and CEO / General Manager now receive all nineteen farms. Plantation Head remains restricted to seven farms in Eluru and East Godavari; Area Manager remains restricted to three Pedavegi farms; Field Staff remains restricted to `FRM-AP-ELR-0004`. The exact verified scope counts are therefore `19 / 19 / 7 / 3 / 1`.

Administration adds the `kakinada-ntr` Plantation Head assignment and the `peddapuram`, `jaggampeta`, `mylavaram`, and `tiruvuru` Area Manager assignments. `scopeFarmIds()` resolves the combined district assignment to exactly the eight expansion farms and each mandal assignment to exactly its two farms; unknown values return an empty scope. During the gated increment, the first independent run exposed that the new options were displayed before all corresponding scope mappings existed. Mandatory failure analysis classified this as a valid production scope defect, not a test defect. The mapping was repaired, affected and regression gates were rerun, and no failure was waived or weakened.

## Decision: concise Overview composition

The Overview removes both explanatory boxes that previously appeared between the metric strip and the operational explorer: **Operational data basis** and **Public context**. The obsolete `publicFacts` runtime model, public figure interpolation, and Overview source links were removed with them. The official source facts remain documented above for provenance, but are not loaded, displayed, or mixed into the application runtime.

The page heading now uses one exact concise subtitle: **AP-only deterministic demo data; public place names do not imply farm ownership.** This preserves the two disclosures necessary for the operational view without recreating the removed notices.

Role-scoped metric calculation, the six-district hierarchy, Map/Table node equivalence, Explorer state, Leaflet behavior, Farm/Tree drill-down, report rows, and all RBAC boundaries are unchanged. The metric strip keeps a 22 px bottom margin, so the selected Map or Table surface begins directly after the metrics with a consistent 22 px gap and no empty notice region.

## Decision: New Farm v2 exact-layout persistence

The New Farm v2 increment changes the earlier preview-only builder into a guarded preview-and-save workflow for System Administrator and CEO / General Manager. Plantation Head, Area Manager, and Field Staff do not receive New Farm navigation and cannot invoke the save contract. The form accepts only approved Andhra Pradesh district, mandal, and village combinations, coordinates within the configured AP bounds, one to 24 acres, and active Plantation Head, Area Manager, and Field Staff assignments.

The browser-local state document remains under `palmwatch.ap.v1.demoState`, but its schema version is now `2`. `defaultDemoState()` adds `localFarms: []`; `migrateDemoState()` preserves valid v1 alert reads, case and treatment overrides, Administration state, report history, and preferences while adding an empty local-farm collection when absent and stamping the migrated document with version 2. Reset replaces the complete document with deterministic v2 defaults and removes every browser-local farm without modifying the immutable base AP records.

Each farm draft owns an ordered collection of acre layouts. Every acre contains exactly 64 unique coordinates in an 8x8 grid and an independent target from 50 through 57 occupied palms. Final preview and save validation require every acre's occupied count to equal its target and the farm total to equal the sum of those per-acre targets. Empty cells retain acre, row, and column only; they receive no Tree ID and are disabled in preview and Farm Detail.

Preview freezes the exact selected positions and displays a collision-safe AP Farm ID. On explicit save, the draft is revalidated, the Farm ID is checked against the complete administrator-visible base-plus-local portfolio, and occupied cells receive deterministic IDs in acre, row, and column form: `<Farm ID>-A<acre>-R<row>-C<column>`. Duplicate Tree IDs fail closed. Save copies the accepted layouts without regenerating the default pattern and writes one complete farm object, assignments, and all tree cells in a single local-storage update. If serialization or storage fails, the previous in-memory state remains authoritative and no partial farm or tree record is exposed.

`mergedDistricts()` clones the deterministic hierarchy, admits only browser-local farms whose exact head, manager, or staff assignment matches the requested role, merges them at district, mandal, village, and farm level, and then prunes empty ancestors. `scopedDistricts()` applies RBAC after this merge. Overview metrics and explorer cards, Reports, Farm lookup, and Farm Detail therefore consume the same authorized base-plus-local collection rather than parallel data paths.

Saved farms open directly in Farm Detail with Pending / no evidence status and no fabricated health history. Multi-acre farms expose Previous, Next, and acre-selection controls; each selected acre renders its persisted 8x8 layout. Occupied cells retain their generated Tree IDs, while black no-tree cells remain disabled and disclose no identifier. The deterministic base portfolio remains unchanged and reappears by itself after Reset demo changes.

## Decision: AP-scoped reports and exports

The second operational-pages increment replaces the Reports placeholder with a six-item catalogue derived exclusively from the signed-in role's authorized AP farms:

1. Printable executive report.
2. Survey coverage by plantation area.
3. Suspected palms by quarter.
4. Open inspections by assignee.
5. Infected case status.
6. Treatment progress.

`scopedReportRows()` obtains the role-filtered farm collection first, builds an authorized Farm ID set from it, and passes only those farms and IDs to report row builders. Farm summary and survey reports contain one row per scoped farm, suspected-palm reporting contains three deterministic quarterly rows per scoped farm, and inspection, case, and treatment rows are admitted only when their Farm ID belongs to that same set. Report cards display the exact row count produced by this path; unavailable or empty scoped reports cannot be exported.

The printable executive report uses the same scoped rows and reconciled operational metrics as the catalogue, identifies the active AP assignment, and provides an A4 print stylesheet with an explicit Print / save PDF action. The other five reports generate RFC-style escaped, UTF-8 CSV files in the browser, including quoted commas, doubled quotation marks, embedded newlines, and CRLF row separators. Temporary download object URLs are revoked after use.

Successful CSV and print actions add a maximum of 30 entries to the versioned browser-local `reportHistory` collection. The visible history is filtered to the active demo role and shows its report, AP scope, generation time, exact row count, and format. It is demonstration history only and does not constitute a durable audit trail.

Reports and exports are available to System Administrator, CEO / General Manager, Plantation Head, and Area Manager. Field Staff has no Reports navigation destination and the renderer independently denies direct access. Public Godrej context figures are excluded from report rows, counts, printable metrics, and download history.

During this increment the shared geographic scope guard was repaired so roles with an explicit farm assignment and no district list are handled as a valid narrow assignment rather than attempting an invalid district lookup. Unknown roles and incomplete assignments return an empty scope. After pruning empty ancestors, the verified farm counts are System Administrator 11, CEO / General Manager 11, Plantation Head 7, Area Manager 3, and Field Staff 1 (`FRM-AP-ELR-0004`). The corresponding six report row counts are:

| Role | Executive | Survey coverage | Suspected quarters | Open inspections | Cases | Treatments |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| System Administrator | 11 | 11 | 33 | 11 | 8 | 6 |
| CEO / General Manager | 11 | 11 | 33 | 11 | 8 | 6 |
| Plantation Head | 7 | 7 | 21 | 7 | 5 | 3 |
| Area Manager | 3 | 3 | 9 | 3 | 2 | 2 |
| Field Staff (scope contract only; export denied) | 1 | 1 | 3 | 1 | 1 | 1 |

## Decision: AP-scoped Cases & Treatments

The third operational-pages increment replaces the Cases & Treatments placeholder with a dedicated, accessible two-tab workflow. Eight deterministic case records and six deterministic treatment records use AP-prefixed IDs and reference farms in the active portfolio. Every treatment also references a case on the same farm. Case dates, owners, observations, recommendations, progress, and outcomes are demonstration data and do not assert a diagnosis or completed real-world intervention.

`scopedCases()` derives the signed-in role's authorized farm collection first, constructs an authorized Farm ID set, and only then admits linked cases. `scopedTreatments()` applies the same Farm ID boundary and additionally requires its linked case to be present in `scopedCases()`. Search, status filters, KPIs, attention ordering, and selected-record details operate only after this authoritative scoping step. Exact case, treatment, Farm, and Tree lookups use scoped selectors; unknown and unauthorized IDs return the same non-identifying unavailable result.

The verified role record counts are:

| Role | Farms | Cases | Treatments |
| --- | ---: | ---: | ---: |
| System Administrator | 11 | 8 | 6 |
| CEO / General Manager | 11 | 8 | 6 |
| Plantation Head | 7 | 5 | 3 |
| Area Manager | 3 | 2 | 2 |
| Field Staff | 1 | 1 | 1 |

Case actions use an explicit fail-closed role/action matrix and legal transition graph:

| Role | Permitted case action |
| --- | --- |
| System Administrator | Field assessment, area-manager action, reopen |
| CEO / General Manager | Reopen |
| Plantation Head | Reopen |
| Area Manager | Area-manager action |
| Field Staff | Field assessment |

| Action | Required current status | Resulting status |
| --- | --- | --- |
| Record field assessment | Under assessment | Confirmed |
| Take area-manager action | Confirmed | Treatment active |
| Reopen case | Closed | Monitoring |

Treatment progress follows one forward-only sequence: `Recommended -> Planned -> In progress -> Completed`. Only System Administrator and Area Manager may advance a treatment; CEO / General Manager, Plantation Head, and Field Staff receive read-only treatment access within their assigned geography. Completion requires a trimmed outcome of at least ten characters. Unsupported actions, incorrect starting states, completed treatments, and records outside the active scope fail closed.

Accepted changes are stored as isolated entries in the versioned browser-local `cases` and `treatments` override collections. Rendering overlays a valid local status, timestamp, actor role, and treatment outcome onto the immutable deterministic record. The farm portfolio, base case/treatment arrays, and role assignments are not rewritten. If storage is unavailable, the accepted change remains in memory for the current session and the live status message states that it was not persisted. Reset restores the deterministic case and treatment defaults.

## Decision: `caseActions` v2 field-assessment timeline

The final Cases & Treatments increment extends the version 2 browser-local state contract with an append-only `caseActions` collection. Each `CaseActionEntry` stores `caseId`, `farmId`, `treeId`, action, normalized observation, assessment status, stable owner ID and display name, signed-in demo actor and role, and an ISO timestamp. Migration preserves structurally valid existing entries and replaces malformed history with an empty collection. Reset clears the timeline together with case and treatment overrides while leaving the deterministic AP records unchanged.

`scopedCaseActions()` first resolves the case through the existing AP and role guard, then returns only entries whose case, farm, and tree linkage matches that authorized record. Timeline entries are ordered deterministically and cannot reveal an unknown or out-of-scope case. `activeStaffForCase()` offers only active Field Staff accounts explicitly assigned to the selected case's farm; browser-local Administration scope changes are respected, and visible owner text is never trusted as authorization.

The assessment form is available only to System Administrator and Field Staff for a case in `Under assessment`. It requires an allowlisted assessment status of `Pending`, `In progress`, or `Completed`, an active assigned Field Staff owner, and a whitespace-normalized observation containing 10-500 characters and at least three letters. Invalid submission focuses the first invalid control and announces the error through the page's live status region.

Pending and In progress assessments append a timeline entry without changing the case status. A Completed assessment appends the same evidence-bearing entry and applies the existing legal `Under assessment -> Confirmed` transition. The richer form does not widen the accepted matrix: System Administrator retains field assessment, area-manager action, and reopen; Field Staff retains field assessment only; Area Manager retains area-manager action only; CEO / General Manager and Plantation Head retain reopen only. Treatment permissions and the forward-only treatment transition sequence are unchanged.

Submission stages the timeline append and any Completed case override in memory, then performs one versioned state write. A failed write restores both the previous `caseActions` array and previous case override, reports that no case changes were made, and leaves no partial timeline or transition visible. This rollback is an atomic-write safeguard, not a user-facing workflow reversal.

## Decision: Administration, Settings, profile, and sign out

The fourth operational-pages increment replaces the Administration and Settings placeholders and completes the account-level demo controls. Seven deterministic AP demo accounts reference one of the five built-in roles and an explicit AP-wide, district-group, mandal, or Farm assignment. System Administrator and CEO / General Manager have Administration navigation and independently guarded renderer access; Plantation Head, Area Manager, and Field Staff have Settings only. Unauthorized Administration navigation returns to Overview without exposing directory data.

`scopedManagedUsers()` first requires an Administration-authorized role, derives the signed-in role's authorized AP Farm IDs, and retains only accounts whose configured assignment intersects that set. Exact account lookup uses this already-scoped collection, so unknown and unauthorized identifiers return the same unavailable result. The verified System Administrator and CEO / General Manager directories each contain all seven AP demo accounts; the other three roles receive zero managed accounts because Administration is denied.

Administration uses these mutation boundaries:

- Account activation, deactivation, assignment changes, and password-reset demonstrations update only `demoState.administration`; the immutable account and farm records remain unchanged.
- The protected System Administrator account cannot be activated, deactivated, reassigned, or issued a demo reset link. The currently signed-in account cannot deactivate itself.
- Assignment changes accept only the enumerated AP scopes valid for the target account's role. Invalid, unknown, and out-of-scope account or assignment values fail closed.
- Password-reset actions create a browser-local security event only. They do not generate credentials, tokens, links, or email.
- The built-in five-role access matrix is read-only. Custom-role input is validated into a transient preview and is never stored or added to authorization rules.
- System Administrator may view merged deterministic and browser-local security activity. CEO / General Manager may manage eligible demo accounts but receives no security activity records.

Settings is available to every protected role. It renders the current deterministic account, built-in role, and AP assignment, then stores notification and display-density preferences per demo role within the shared versioned state document. Notifications default to enabled and density defaults to comfortable. Compact density is applied as a body-level presentation class and does not alter record scope or data.

Reset requires explicit confirmation and replaces the full shared demo-state document with deterministic defaults. It clears per-account alert reads, case and treatment overrides, Administration users and events, report history, and preferences while preserving the AP farm, tree, case, treatment, user, and role definitions. If browser storage is unavailable or throws, valid changes remain in memory for the active tab and the interface states that persistence was unavailable.

The profile control exposes the current account, role, and AP assignment with keyboard-operable Settings and Sign out actions. Signing out is session-UI state only: it hides navigation and operational selectors and renders a non-operational signed-out view. It does not mutate records or shared browser-local demo data. Returning to the demo restores Overview for the selected role; this is not production authentication or session revocation.

## Decision: sample-tree survey provenance and Ganoderma indicators

An earlier increment linked an audited capture bundle and a separate Ganoderma-indicator record to the explicitly designated demonstration palm `FRM-AP-ELR-0004-T001`. The capture derivatives and manifest remain repository provenance, but active Tree Detail routes no longer render an image gallery. Indicator readings remain exact-tree data and are never inherited by a farm or neighbouring palm such as `FRM-AP-ELR-0004-T002`.

The retained bundle contains six browser-ready WebP derivatives from capture `DJI_20260620095527_0011`, dated 2026-06-20 and classified `demo`. The source captures remain outside the web bundle. The external manifest preserves each source filename, SHA-256, dimensions, derivative path and dimensions, and processing disclosure:

| View | Source provenance | Browser derivative | Processing |
| --- | --- | --- | --- |
| RGB | `DJI_20260620095527_0011_D.JPG`; `275b01f5773d9eef51c9b37153434664be0ad84c459a07632596b85f4fb72cc7`; 5280x3956 | `rgb.webp`; `e5e21f66667909c8906f5320366425bf2f70b78809a33ae8e75cbae8a54af9f0`; 1400x948 | Top 380 px identifying timestamp/GPS/operator overlay removed; resized; WebP quality 88 |
| Camera false-colour | `DJI_20260620095527_0011_F.JPG`; `6d80f617f16a5203f4c53723d6ee17c1814f158352d3e47e01e9197b30a14457`; 2592x1944 | `false-colour.webp`; `4291db1792ed7be8182cde897cb9f691177f91649592d78bfd847c7539157f70`; 1400x953 | Top 180 px identifying timestamp/GPS/operator overlay removed; resized; WebP quality 88 |
| Green | `DJI_20260620095527_0011_MS_G.TIF`; `90cd39919875c3898ef695f81db633840f72b2ae9fa7cfab227f52aacde6a0d6`; 2592x1944 | `green.webp`; `550be64f6ee344ff82f2e14408bec42f5b268cd601c8b61952b0f4175d573b9d`; 1400x1050 | Independent per-band linear 2nd-to-98th percentile display stretch (5008-54720); resized; WebP quality 88 |
| Red | `DJI_20260620095527_0011_MS_R.TIF`; `78fc7e924cdd916350e28e7889fd86395e54d78379ffefb18c869f581b737780`; 2592x1944 | `red.webp`; `ff2aa7e1e12ede701fb4d262ed340ee0bdc09235e2771e411d4264836f44aa8f`; 1400x1050 | Independent per-band linear 2nd-to-98th percentile display stretch (4336-36160); resized; WebP quality 88 |
| Red-edge | `DJI_20260620095527_0011_MS_RE.TIF`; `661c0fcb990c69d2b5f8d2e64b3d2dfb7654507524db57fc14a7828edbaf8c08`; 2592x1944 | `red-edge.webp`; `b1cb7f5f51be44edabd1756ae52c34ef9c1c0f9a54ac8d44f664b75a350c6ebf`; 1400x1050 | Independent per-band linear 2nd-to-98th percentile display stretch (5872-64608); resized; WebP quality 88 |
| Near-infrared | `DJI_20260620095527_0011_MS_NIR.TIF`; `081fc10745a928be391ca4e1dbe1c3d0f2826750dd4189d44928259e9180059c`; 2592x1944 | `near-infrared.webp`; `6c15fea5023776fc7f6cf3b427816135217ebd94dc1d0164be605b00a263250e`; 1400x1050 | Independent per-band linear 2nd-to-98th percentile display stretch (6704-41808); resized; WebP quality 88 |

The retired gallery used a named tablist, roving keyboard focus, meaningful demonstration-context alt text, a full-size tabpanel, and visible loading and failure states. Its removal from active Tree Detail routes does not change the provenance boundary: the captures are not evidence for the simulated palm, proof of farm ownership, or a source for any displayed reading.

The indicator widget reads from a separate deterministic observation object and does not process the supplied images. It uses value markers, colour-plus-text status badges, visible ranges, accessible scale descriptions, and keyboard-focusable information controls. The accepted sample values and interpretation bands are:

| Indicator | Sample value and status | Displayed demo interpretation bands |
| --- | --- | --- |
| NDVI | 0.43 - Danger | Danger `< 0.45`; Suspected `0.45-0.65`; Okay `> 0.65` |
| NDRE | 0.32 - Suspected | Danger `< 0.25`; Suspected `0.25-0.40`; Okay `> 0.40` |
| Ganoderma confidence | 18% - Okay | Okay `< 35%`; Suspected `35-65%`; Danger `> 65%` |
| Canopy temperature | 30.8 C - Okay | Okay `<= 32 C`; Suspected `> 32-35 C`; Danger `> 35 C` |
| Recent risk trend | +0.03 - Okay | Okay `<= +0.05`; Suspected `> +0.05-0.15`; Danger `> +0.15` |

These values, status bands, trend, and confidence are simulated workflow demonstrations, not validated diagnostic cut-offs. NDVI, NDRE, diagnosis, Ganoderma confidence, canopy temperature, and recent trend are explicitly not derived from the supplied uncalibrated captures. The browser application contains no NDVI/NDRE band calculation or automatic diagnosis.

## Decision: Mapped POC DJI survey snapshot

The Mapped POC company now uses the repository-owned [`data/mapped-poc-data.js`](../data/mapped-poc-data.js) snapshot instead of the four generated `MPOC_0001...MPOC_0004` farms and their synthetic `coordinateFor()` output. The other three companies and the four-company selector retain their existing behavior.

[`scripts/build_mapped_poc_snapshot.py`](../scripts/build_mapped_poc_snapshot.py) is the deterministic ingestion and derivation boundary. It selects one `MS_G` record per acquisition, globally deduplicates by `capture_uuid` while retaining the original mission copy, includes the two genuine mission-004 captures omitted by the earlier workbook generator, and orders source records by mission index then capture number. `TREE-0001...TREE-0112` supplies the workbook rows in that same order; Area 001 replaces its source-record classifications with deterministic infected scores from 66 through 95, while Areas 003-005 retain the workbook model values. Area 002 is superseded by its dedicated source integration below. The generator creates one size-bounded natural-colour WebP derivative for each of the 47 source-backed infected or suspected records. Source checksums, evidence checksums, mission names, status provenance, geofence kind, and record origin make regeneration inspectable.

The snapshot reserves 149 records across five stable areas. Runtime activation is dynamic only for Area 001:

- `MPOC-SURVEY-001` always activates 27 immutable source-backed **Infected** records from `DJI_202606200943_001_DJI-SmartFarm-Web` and may activate zero through 37 saved added records from the reserved `TREE-0113...TREE-0149` range. It therefore contains 27 through 64 active trees. The fixed source records remain red/Infected with deterministic 66-95 scores. Each added record persists the user's **Infected**, **Suspected**, or **Healthy** choice and receives a deterministic score in the corresponding 66-95, 35-65, or 10-34 band. The 27 source records retain capture metadata, while added records receive their exact operational coordinates from browser-local marker placement. Infected and Suspected Area 001 details resolve one image under the allowlist rule documented below; Healthy details intentionally omit evidence imagery.
- The other four areas retain their 85 source-backed observations. Their 20 severe/high workbook model scores are displayed as **Suspected**, not infected or diagnosed. The remaining source-backed records display as Healthy.
- Before the Area 002 replacement documented below, the active portfolio ranged from 112 through 149 trees. With the 35-tree Area 002 integration it ranges from 134 through 171: 27 fixed infected, 20 fixed suspected, and 87 fixed healthy records, plus the zero through 37 added Area 001 records distributed by their saved statuses.

The snapshot is the immutable Mapped POC data and capacity source; the versioned browser-local state supplies only the saved Area 001 geofence and optional marker positions. The snapshot contains stable identifiers, nullable capture metadata, camera exposure coordinates, modelled values, display status and its source, area geofences, evidence-relative paths, and provenance. It contains no absolute `C:` or `G:` path and the browser performs no runtime reads from either drive. The workbook and DJI mission inventory remain external, read-only generator inputs. The 47 optimized evidence derivatives are stored under [`assets/mapped-poc/evidence`](../assets/mapped-poc/evidence); original captures are neither copied nor served.

Each survey area stores a deterministic convex hull of its source camera exposure coordinates. Areas 002-005 continue to render that hull through Leaflet as a **camera-footprint geofence**. Area 001 retains the hull as source provenance, but its effective survey-area geofence is the editable Google Maps rectangle documented below. Neither representation is a legal farm boundary, surveyed palm perimeter, acreage, or ownership evidence. Overview and survey-area maps render infected and suspected record pins. Mapped POC Tree Detail no longer renders a per-tree camera-position map; every active Area 001 tree renders exactly one repository-allowlisted image under the exact-or-nearest rule below. Source-backed labels continue to say **camera observation** and **modelled Ganoderma risk**, because exposure coordinates are not palm-base surveys and model outputs are not field or laboratory diagnoses. A record has only one model score, so no simulated recent-risk trend is shown.

The existing visual language and 8x8 survey layout remain unchanged. Area 001 fills the first 27 through 64 cells from its synchronized active tree collection; unused capacity remains black and disabled. The other areas retain capture-sequence order and black unused cells. Long capture UUIDs, mission names, metadata values, legend rows, and responsive detail columns use shrinkable grid tracks and explicit wrapping so they cannot force content across the page boundary.

The implementation gate in [`tests/static-check.mjs`](../tests/static-check.mjs) verifies the immutable 27-tree source set, 37-record Area 001 capacity, dynamic 27-64 activation, 85 unchanged records in Areas 002-005, deterministic scores, identifier and coordinate integrity, mission corrections, geofences, 47 source-image derivatives, no runtime drive dependency, and preservation of the other companies and selector.

Earlier fixed-count acceptance was superseded by the dynamic Area 001 workflow below.

## Decision: Survey Area 001 Google Satellite geofence editor

Survey Areas 001 and 002 use the Google Maps JavaScript API. Area 001 retains the editable workflow documented here; Area 002 uses the separate read-only Satellite renderer documented below. The Area 001 integration loads lazily, renders the 27 immutable source positions plus any saved additions, and remains non-blocking so its 8x8 tree grid and record navigation survive map failure. Areas 003-005 retain their Leaflet maps and deterministic camera-footprint hulls.

The deterministic Area 001 rectangle is bounded by southwest `16.912209794, 81.169804433` and northeast `16.912805551, 81.169912437`. It is labelled as a user-defined operational display geofence rather than a surveyed or legal property boundary. Every demo role can select **Edit geofence** and then move or resize the rectangle; editing is not enabled implicitly. **Save** validates and persists the candidate, **Cancel** restores the last effective bounds, and **Reset default** restores the deterministic rectangle. Live north, south, east, and west values make the current candidate inspectable.

The editor uses the native `google.maps.Rectangle` and does not load or depend on the discontinued Google Maps Drawing Library. Manual QA found that a clickable locked rectangle intercepted the map clicks used to add trees. The locked rectangle is therefore `clickable: false`; explicit geofence edit mode toggles `clickable`, `editable`, and `draggable` on together, then disables all three when editing ends. This preserves rectangle movement and resize handles while allowing marker-placement clicks through its visible fill. The shared browser-local document is version `6` and retains `geofenceOverrides`, keyed by `AREA_ONE_ID`, plus the optional Area 001 marker mapping with latitude, longitude, and display status. Migration preserves valid version-5 marker positions and deterministically assigns missing statuses to **Infected**. Only a finite, non-zero rectangle with `south < north`, `west < east`, and coordinates inside the configured Andhra Pradesh limits is accepted. Invalid or unavailable storage leaves the deterministic or last valid in-memory boundary authoritative.

The temporary test key lives only in ignored `config/maps.local.js` and must never be copied into tracked source, documentation, generated data, logs, or messages. Tracked `config/maps.example.js` defines only the placeholder configuration shape. Runtime loading distinguishes a missing key from authorization/referrer rejection, a disabled API or billing problem, network failure, and timeout, and presents actionable fallback copy without blocking the tree grid.

Hosted configuration uses the GitHub Pages workflow in [`.github/workflows/deploy-pages.yml`](../.github/workflows/deploy-pages.yml). The repository secret `GOOGLE_MAPS_API_KEY` is required and is injected only into the staged `_site/config/maps.local.js` deployment artifact; the local source file remains ignored and no key enters tracked content. The workflow fails closed before deployment when the secret is absent. GitHub Pages build type is **GitHub Actions workflow**, replacing the legacy Pages build path so this controlled staging step is authoritative. On 2026-09-11, the deployed Survey Area 001 page was verified to reach the **Google Satellite map ready** state.

Area 001 adds one native select control containing every active tree, including saved red, yellow, and green markers. Selection state is deliberately transient and stores the exact Tree ID only; it is not added to browser-local persistence or the data snapshot. Selecting a tree pans and zooms the Google map to its exact coordinate. The corresponding marker becomes enlarged, outlined, and check-marked, while adjacent text identifies its Tree ID and saved status so selection is not conveyed by colour or marker shape alone. **Open selected tree** and direct marker clicks both resolve through that same identity and open the matching tree record. Areas 002-005 receive no selector or selection-state changes. The intentionally small scope adds no search, grouping, bulk selection, or new persistence contract.

## Decision: Survey Area 001 v6 three-colour marker-to-tree workflow

**Add marker** is available only after the user explicitly saves a valid Area 001 geofence. A three-choice toolbar selects red/Infected, yellow/Suspected, or green/Healthy before placement. Marker editing starts from the saved optional subset and allows zero through 37 added positions. A map click assigns the lowest available ID from `TREE-0113...TREE-0149` with the selected status; an added marker can be removed by exact ID, and undo restores the complete marker, including its status. Cancel discards the complete draft. Save validates and atomically persists the complete resulting subset in the version-6 browser-local document; a failed write restores the previous state rather than exposing a partial update.

Every saved optional marker must have one of the three canonical statuses and a finite coordinate inside the effective geofence, unique within the optional set, and different from all 27 immutable source coordinates. Unknown statuses, invalid coordinates, duplicates, out-of-bounds points, or more than 37 additions are rejected. A later geofence save or reset is rejected when the proposed bounds would exclude a saved position. After save, one synchronized active collection drives marker colour, grid colour, selector copy, Tree Detail status and score, and survey/portfolio totals, so a Tree ID, coordinate, and status cannot diverge across surfaces. Areas 002-005 do not read or mutate this state. The concise implementation and invariants are pinned in [`index.html`](../index.html) and [`tests/static-check.mjs`](../tests/static-check.mjs); no arbitrary tree IDs or backend contract is introduced.

## Decision: simplified active Tree Detail surfaces

Active Tree Detail routes omit multi-image galleries. Mapped POC Tree Detail shows exactly one allowlisted image for Area 001 Infected/red and Suspected/yellow records. Healthy/green Area 001 details omit the complete image/evidence section and do not bind image-loading handlers. Mapped POC details do not render a per-tree camera-position map, and the stale Leaflet tree-detail initialization path was removed with that surface. Every active added tree still displays its exact saved latitude and longitude with its deterministic Ganoderma indicator, record metadata, history, recommendation, and status interpretation. This presentation does not alter survey-area maps, geofences, marker editing, selection, or exact-tree navigation.

## Decision: allowlisted image resolution for flagged Area 001 trees

The read-only `D:\hio01` inventory establishes the repository allowlist of 19 eligible Area 001 natural-colour captures, `TREE-0001...TREE-0019`. No inventory file is copied and the browser has no runtime dependency on that path; the UI reuses only their matching repository-owned WebP derivatives. `TREE-0001...TREE-0019` retain exact one-to-one images. Source-backed `TREE-0020...TREE-0027` and active added Infected or Suspected trees select exactly one allowlisted image by shortest geographic distance from their coordinate, with ascending Tree ID as the deterministic tie-break. Any non-exact match is labelled as a nearby context image that does not depict the exact tree. Healthy added trees do not invoke this resolver. Areas 002-005 are unchanged.

Manual acceptance on 2026-09-11 verified that source-backed `TREE-0020` selected nearby `TREE-0012` at approximately 6 m with the non-exact-tree disclosure, while `TREE-0001` retained its exact one-to-one image. The earlier added-tree check also remained valid: `TREE-0113` at `16.912656512, 81.169811228` selected nearby `TREE-0015` at approximately 5 m, and the test marker was removed to restore the clean 27-tree state.

Three-colour manual acceptance verified toolbar status selection, placement, click-to-remove, undo, and atomic save. Saving one Healthy addition produced a synchronized 28-tree Area 001 map and grid, updated status totals, and a Healthy Tree Detail showing the exact saved coordinate with no image/evidence section. Infected and Suspected image behavior remained unchanged.

Final independent `npm test`, `npm run build`, and `git diff --check` gates were green, and manual browser verification passed. Automated coverage includes version-6 state and version-5 migration, the three canonical status/score bands, marker editing and validation, synchronized map/grid/selector/detail/totals, flagged-tree allowlisted-image selection, Healthy evidence omission and no image binding, no per-tree map, unchanged Areas 002-005, and continued tree-grid access when Google Maps is unavailable.

## Decision: Survey Area 002 `frm02` source integration

This decision supersedes the earlier Area 002 snapshot count while leaving Areas 001, 003, 004, and 005 unchanged. The deterministic build-time inventory reads `D:\frm02` as a read-only source and selects 35 unique natural-colour captures numbered `0002...0036`. XMP supplies each camera exposure coordinate, and each record keeps an exact one-to-one optimized WebP derived from its matching `D.JPG`. No source file is copied, and the browser has no runtime dependency on `D:\frm02`.

The stable records use the existing `TREE-0028...TREE-0040` IDs plus `TREE-0150...TREE-0171`, avoiding any renumbering of the other survey areas. All 35 are **Healthy** with deterministic modelled Ganoderma scores from 10 through 34 because no diagnosis was supplied. Their source mission is `DJI_202606201109_004_DJI-SmartFarm-Web`. [`scripts/build_survey_two_farm_snapshot.py`](../scripts/build_survey_two_farm_snapshot.py) produces the inspectable [`data/survey-002-farm-data.js`](../data/survey-002-farm-data.js) snapshot consumed by the existing UI. Area 002 now has 35 records and the active five-area portfolio ranges from 134 through 171 trees as Area 001 changes from 27 through 64.

The `D:\frm02` inventory contains 35 complete DJI acquisitions; their 35 `D.JPG` observations are already represented by the repository snapshot and optimized assets, so the browser performs no runtime source-directory read. Area 002 now uses a read-only Google Satellite map. A native `google.maps.Polygon` renders its camera-footprint hull, the map fits that hull and all camera positions, and 35 numbered green/Healthy markers open their exact Tree Detail records. The renderer reports specific Google configuration, authorization, API/billing, network, and timeout failures while preserving the 35/64 grid. Area 001's editor is unchanged, and Areas 003-005 remain on Leaflet.

Manual browser acceptance verified Satellite loading, the polygon, all 35 markers, fitted bounds, exact marker-to-tree navigation including `TREE-0029`, and the matching image. Independent `npm test`, `npm run build`, and `git diff --check` gates were green.

## Verification record

The current increment passed the following gates on 2026-08-09:

- Static contract tests: green, including all 5 roles, AP-only scope, Leaflet/OpenStreetMap integration, exact hierarchy counts, reconciled 89-acre and 4,819-palm totals, map fallback, and New Farm preview-only behavior.
- Production build contract: green.
- JavaScript syntax validation: green.
- `git diff --check`: green.

The shared-state, final-navigation, and Alerts increment passed independent verification on 2026-08-10:

- Static contract suite: green, 84 assertions, including exact navigation for all five roles, no Disease Analytics destination, AP-scoped alert selection, severity ordering, per-role unread state, bulk and individual read behavior, guarded Farm navigation, and storage fallback contracts.
- Production build contract: green.
- Inline JavaScript syntax validation: green.
- `git diff --check`: green.

The Reports and shared-scope-guard increment passed independent verification on 2026-08-10:

- Static contract suite: green, 139 source assertions, including the exact six-report catalogue, one printable and five CSV formats, four authorized export roles, Field Staff denial, AP-first Farm ID scoping, exact displayed/exported row counts, CSV escaping and browser download lifecycle, role-owned local history, A4 printable output, and exclusion of public context figures.
- Verified role scope: green at 11 / 11 / 7 / 3 / 1 farms for System Administrator, CEO / General Manager, Plantation Head, Area Manager, and Field Staff respectively.
- Production build contract: green.
- Inline JavaScript syntax validation: green.
- `git diff --check`: green; only line-ending conversion warnings were reported for existing modified HTML/test files.

The Cases & Treatments increment passed independent verification on 2026-08-10:

- Static contract suite: green, including AP-linked record integrity, unique IDs, matching treatment/case Farm IDs, scope-before-filter behavior, exact guarded record lookup, all five role action permissions, legal case and treatment transitions, completion-outcome validation, browser-local overrides, reset behavior, accessible tabs, search/filter/detail states, guarded Farm/Tree links, and live status announcements.
- Runtime role counts: green at 11 farms / 8 cases / 6 treatments for System Administrator and CEO / General Manager; 7 / 5 / 3 for Plantation Head; 3 / 2 / 2 for Area Manager; and 1 / 1 / 1 for Field Staff.
- Production build contract: green.
- Inline JavaScript syntax validation: green for both script blocks, with 13 Cases & Treatments functions independently syntax-checked.
- `git diff --check`: green; only LF/CRLF conversion warnings were reported for existing modified HTML/test files.

The Administration, Settings, profile, and sign-out increment passed independent verification on 2026-08-10:

- Static contract suite and production build contract: green, both with exit code 0.
- Runtime RBAC and scope checks: green. System Administrator and CEO / General Manager each have Administration and Settings navigation and seven AP-scoped managed users; Plantation Head, Area Manager, and Field Staff have Settings only and receive zero managed users from the guarded Administration selector.
- Administration mutation checks: green for protected-administrator denial, CEO self-deactivation denial, eligible CEO deactivation by System Administrator, valid Plantation Head scope reassignment, invalid-scope denial, and password-reset demonstration without credential generation.
- Activity checks: green at seven merged events for System Administrator and zero for CEO / General Manager.
- Settings and state checks: green for enabled/comfortable defaults across all five roles, role-isolated compact density, complete confirmed reset of overrides and history, and exception-safe browser-storage fallback with tab-only status copy.
- Profile and route checks: green for unauthorized Administration guarding and sign out hiding navigation and operational selectors without modifying data.
- Inline JavaScript syntax validation: green for the single inline application script.
- `git diff --check`: green; only LF/CRLF conversion warnings were reported for existing modified HTML/test files.

The final combined operational-pages regression passed on 2026-08-10:

- Static contract suite: green, 322 assertions across the AP explorer, New Farm preview, Alerts, Reports, Cases & Treatments, Administration, Settings, profile, sign out, role guards, local state, data reconciliation, map fallback, and accessibility contracts.
- Production build, direct Node contract execution, independent inline JavaScript parsing, and `git diff --check`: green. Twelve dedicated page/detail render functions were present and syntax-valid.
- Geography and navigation exclusion checks: green with zero `Disease Analytics` and zero `Telangana` occurrences. Navigation remained exact: System Administrator and CEO / General Manager receive Overview, New Farm, Alerts, Reports, Cases & Treatments, Administration, and Settings; Plantation Head and Area Manager receive Overview, Alerts, Reports, Cases & Treatments, and Settings; Field Staff receives Overview, Alerts, Cases & Treatments, and Settings.
- Shared state contract: green for the single `palmwatch.ap.v1.demoState` browser-local key at version 1, deterministic fallback, role-owned alert/preferences/history behavior, complete reset, and storage-exception fallback.
- Browser visual regression: green at desktop 1536x1024, tablet 1024x768, and Field Staff mobile 390x844. The tested operational pages had no horizontal overflow and no browser console errors.
- Browser interactions: green for AP map/table exploration, guarded record links, New Farm preview-only behavior, profile menu keyboard/open-close behavior, Settings navigation, sign out, and return to the demo.
- Review screenshots were captured under `.tmp/final-operational-pages` and remain local test artifacts rather than application assets.

The sample-tree evidence and Ganoderma-indicator increment passed independent verification on 2026-08-10:

- `npm test`: passed; the single static contract script reported `Static UI contract passed`.
- `npm run build`: passed.
- `node --check tests/static-check.mjs`: passed with exit code 0; the inline application JavaScript also parsed successfully at 1/1 script blocks.
- Manifest and asset audit: passed at 6/6 source hashes and dimensions, 6/6 WebP decodes, and 6/6 derivative dimensions.
- Desktop browser check at 1536x1024: passed for the complete `State -> Eluru -> Pedavegi -> Munduru -> FRM-AP-ELR-0004 -> T001` flow, all 6/6 evidence tabs, five indicator values/help controls/scales, and the no-image-derived-reading disclosure.
- Negative-scope browser check: `T002` correctly displayed no linked imagery and no indicator readings.
- Mobile browser check at 390x844: passed with six tabs, five help controls, and no horizontal overflow (`scrollWidth = clientWidth = 375`).
- Browser console: zero warnings and zero errors.
- `git diff --check`: passed with exit code 0; only LF-to-CRLF conversion warnings were reported for existing modified HTML/test files.
- The temporary browser server at `127.0.0.1:4173` (owned PID 20824) was stopped and the port was confirmed closed. Its empty output/error logs remain under `.tmp/evidence-smoke-server.out.log` and `.tmp/evidence-smoke-server.err.log`.

The New Farm v2 exact-layout persistence increment passed independent verification on 2026-08-10:

- `npm test`: green; the static contract covered the v1-to-v2 state migration, preserved operational state, `localFarms` default, AP hierarchy validation, per-acre 8x8 coordinates, independent 50-57 targets, exact occupied-count reconciliation, deterministic acre/row/column Tree IDs, duplicate prevention, collision-safe Farm IDs, exact-position persistence, storage rollback, reset, merged base-plus-local scoping, and multi-acre Farm Detail.
- `npm run build`: green.
- JavaScript syntax validation: green for `tests/static-check.mjs` and the inline application script.
- Browser acceptance: green, 41/41 checks. A two-acre Eluru farm was plotted at 50/50 and 57/57, previewed at 107 palms, and saved as `FRM-AP-ELR-440C56DA`. Farm Detail retained both acre layouts; preview and read-only black cells were disabled and exposed no Tree ID.
- Browser scope and reconciliation: green. The saved farm changed authorized farm counts by exactly +1 for CEO / General Manager (11 to 12), Plantation Head (7 to 8), Area Manager (3 to 4), and assigned Field Staff (1 to 2); Overview reconciled to 12 farms, 91 acres, and 4,926 palms. The farm was discoverable through its authorized district, mandal, and village, persisted across refresh, appeared in scoped Reports and the printable report, and Reset restored the deterministic counts.
- Responsive browser checks: green at desktop 1536x1024, tablet 1024x768, and mobile 390x844, with no horizontal overflow and zero console or page errors. Screenshots and the structured 41-check result remain under `.tmp/increment2-browser`.
- `git diff --check`: green; only line-ending conversion warnings were reported for existing modified files.
- The increment's temporary browser servers were stopped after verification and their ports were confirmed closed. Local server logs remain under `.tmp` as test artifacts.

The `caseActions` v2 field-assessment and final feature-area regression passed independent verification on 2026-08-10:

- `npm test`, `npm run build`, direct Node syntax checks, inline application-script parsing, and `git diff --check` were green. Line-ending messages were warnings only and did not indicate a failed gate.
- Increment 3 browser acceptance was green at 40 assertions. It covered Field Staff and System Administrator assessment form access, scoped active-owner selection, Pending / In progress timeline-only updates, Completed-to-Confirmed transition, normalized and bounded observations, append-only timeline rendering after refresh, invalid-control focus, live announcements, storage-failure rollback, reset, exact case RBAC, and preserved treatment permissions and terminal behavior.
- The New Farm regression was green at 41/41 assertions after a temporary browser-harness locator was repaired. Failure analysis classified the issue as test-only: application behavior and production code did not require a repair.
- Browser checks reported zero console errors, page errors, or warnings. Desktop 1536x1024, tablet 1024x768, and mobile 390x844 had no horizontal overflow.
- Increment-owned browser servers on ports 4187 and 4189 were stopped and confirmed closed. The pre-existing review server on port 4179 was not owned by this increment and was left untouched.
- Verification artifacts remain under `.tmp/increment3-http.out.log`, `.tmp/increment3-http.err.log`, `.tmp/case-assessment-syntax.js`, `.tmp/inline-parse.js`, and `.tmp/increment2-browser` (including the 41-check result and responsive screenshots). They are local test artifacts and are not application assets.

The realistic Kakinada/NTR AP expansion passed independent verification on 2026-08-10:

- `npm test`, `npm run build`, direct Node contract execution, expansion inline-script parsing, and `git diff --check` were green. The static contracts verified the exact hierarchy, all eight fixed farm fixtures, reconciled portfolio and health/work totals, public-source separation, Map/Table equivalence, role scope, Administration mappings, and the invariant that no alert, case, or treatment was invented for an expansion farm.
- The expansion browser suite passed 46/46 assertions. It covered the `19 / 19 / 7 / 3 / 1` role scopes, six-district Overview metrics, Kakinada and NTR Map/Table drill-down through Farm and Tree, official source links and separation copy, zero linked workflow records for expansion farms, all new Administration assignments including refresh persistence and fail-closed unknown scope, Reports at nineteen farms, assessment/evidence regression, Reset, and responsive behavior.
- The unchanged New Farm regression passed 41/41 assertions after the expansion. Combined browser verification was therefore 87/87.
- Desktop 1536x1024, tablet 1024x768, and mobile 390x844 checks had no horizontal overflow. Browser capture reported zero console errors, console warnings, or page errors.
- Browser artifacts are stored under `.tmp/expansion-browser` (`results.json`, `desktop.png`, `tablet.png`, and `mobile.png`) and `.tmp/increment2-browser`; the extracted syntax artifact is `.tmp/expansion-inline-parse.js`. The local harnesses remain under `.tmp/pw-runner`.
- Increment-owned listeners on ports 4191 and 4189 were stopped and confirmed closed after the two browser suites.

The concise Overview notice-removal increment passed independent verification on 2026-08-10:

- `npm test`, `npm run build`, direct Node parsing, extracted inline application-script parsing, and `git diff --check` were green.
- The expanded Overview browser suite passed 85/85 assertions across all five roles. Each role retained its exact farm, acreage, and palm metrics; the Overview rendered zero notice boxes, zero removed source links or public figures, the exact concise demo/non-ownership subtitle, and equivalent scoped nodes in Map and Table view.
- Map and Table each began directly after the metric strip with the accepted 22 px gap. Six-district navigation, Kakinada/NTR Farm-to-Tree drill-down, Administration assignments, Reports, Field Staff assessment, evidence gallery, and Reset regressions remained green.
- The unchanged New Farm regression passed 41/41 assertions. Combined browser verification was 126/126.
- Desktop 1536x1024, tablet 1024x768, and mobile 390x844 reported no horizontal overflow. Browser capture reported zero console errors, console warnings, or page errors.
- Updated Overview artifacts are stored under `.tmp/expansion-browser` (`results.json`, `desktop.png`, `tablet.png`, and `mobile.png`); New Farm regression artifacts remain under `.tmp/increment2-browser`; the extracted syntax artifact is `.tmp/overview-inline-parse.js`; harnesses remain under `.tmp/pw-runner`.
- Increment-owned listeners on ports 4191 and 4189 were stopped and confirmed closed after verification.

The Cases & Treatments Open-action repair passed verification on 2026-08-10:

- Row-level case `Open`, attention-queue case cards, row-level treatment `Open`, and treatment-detail `View case` now use shared scoped selectors that resolve the record through the signed-in AP scope, update the selected row, announce the selected record in the live status line, rerender, then scroll and focus the selected detail panel.
- The selected case and treatment detail panels now expose stable focus targets (`selectedCaseDetails` and `selectedTreatmentDetails`) with `tabindex="-1"`. Guarded `View farm` and `View supporting tree` behavior remains unchanged.
- Static contracts were extended to pin the shared selector helpers, focusable detail targets, selection updates, live announcements, and treatment-to-case handoff.
- `npm test`, `npm run build`, `node --check tests/static-check.mjs`, extracted inline application-script parsing, and `git diff --check -- index.html tests/static-check.mjs` passed. Git reported only expected LF-to-CRLF working-copy warnings.
- Browser smoke passed on a temporary local server: case `Open`, treatment `Open`, treatment `View case`, case `View farm`, case `View supporting tree`, and desktop/tablet/mobile no-overflow checks were green with zero console or page errors. The temporary server was stopped after verification.
- An initial browser-harness attempt used the full navigation accessible name after the tablet/mobile breakpoint hid sidebar text; rerun used the stable `data-nav` selector. This was a harness locator issue for the smoke test, not a production Open-action failure.

The final responsive hardening pass completed on 2026-08-10:

- The app shell, content column, mobile top bar, Leaflet fallback, and 8x8 farm grids were tightened so wide tables, compact navigation, detail side panels, and tree cells do not force horizontal overflow on desktop, tablet, mobile, or ultra-narrow screens.
- Static contracts now pin `min-width:0` on the main/content columns, wrapped mobile topbar controls, matching mobile map/fallback heights, and the ultra-narrow farm-grid breakpoint.
- `npm test`, `npm run build`, inline application-script parsing, and `git diff --check` passed. Git reported only expected LF-to-CRLF working-copy warnings.
- A browser responsive sweep passed 94 checks across 13 viewport sizes: 1920x1080, 1536x1024, 1366x768, 1280x720, 1024x768, 820x1180, 768x1024, 620x900, 480x900, 390x844, 360x740, 320x568, and 280x653.
- The sweep covered Overview, New Farm, Alerts, Reports, Cases & Treatments, Administration, and Settings, plus the fixed Case/Treatment Open actions. Browser capture reported zero console or page errors and no horizontal overflow. Screenshots and `results.json` remain under `.tmp/responsive-final`; the temporary server was stopped after verification.

## Current limitations and deferred work

- The application is static and has no authentication backend, API, database, or server-side durable persistence.
- Alert read state and the reserved operational interaction state are browser-local demonstration data. They are device/browser specific, may be cleared by the user, and are not suitable for multi-user synchronization or audit evidence.
- Report download history is also browser-local demonstration state. Generated CSV files and printed PDFs are point-in-time client-side artifacts and have no server signature, centralized retention, or audit guarantee.
- Case and treatment transitions are browser-local demonstration overrides. They have no server concurrency control, reviewer approval, immutable audit trail, notification delivery, or cross-device synchronization and must not be treated as clinical, agronomic, or regulatory evidence.
- The workflow implements only the accepted linear transitions. It does not support case merging, treatment cancellation, user-initiated workflow rollback, reassignment, attachments, escalation timers, or offline conflict resolution. The implemented storage-failure rollback only prevents a partial local write.
- Administration changes, password-reset events, and settings are browser-local demonstrations. They do not alter an identity provider, revoke sessions, deliver email, synchronize across devices, or provide an immutable security audit.
- Role and scope changes in Administration affect the displayed managed-user record only; they do not dynamically rewrite the signed-in explorer principal or constitute production provisioning.
- Sign out hides the local demo interface but does not clear browser-local state, invalidate credentials, or provide an authenticated security boundary.
- Leaflet and OpenStreetMap tiles require network access. The role-scoped rail and Table view are the supported offline fallback.
- AP portfolio coordinates, operational health readings, tree histories, and Ganoderma indicators remain simulated deterministic demo values. Mapped POC is the documented exception: source-backed coordinates are DJI camera exposure positions, Areas 003-005 retain workbook model scores, Area 002 uses its documented healthy 10-34 range, and Area 001 uses status-specific deterministic ranges; none is a surveyed palm-base position or diagnosis.
- Markers indicate plausible operational locations; surveyed polygons and authoritative cadastral boundaries are not included.
- Official Godrej Agrovet and Andhra Pradesh Horticulture figures are documentation-only source context. They are absent from the runtime Overview and do not establish mapped-farm ownership, validate demo totals, or make the deterministic records authoritative operational data.
- New Farm persistence is browser-local demonstration state only. It has no backend transaction, central identifier service, multi-user concurrency control, server authorization, durable audit, cross-device synchronization, backup, or recovery guarantee.
- Saved browser-local farms begin with Pending / no evidence state. The workflow deliberately does not create surveys, cases, treatments, diagnoses, imagery, notifications, or audit events for them.
- Farm ID collision checking is limited to the current browser's merged AP dataset. Production use requires a server-owned collision-safe identifier and atomic database transaction.
- Automatic palm detection, crown separation, image-derived NDVI/NDRE, and automatic Ganoderma diagnosis remain deferred.

## Next safe increment

The AP-only operational-pages feature area, including the realistic six-district expansion and `caseActions` v2 assessment workflow, is complete and ready for product review. Remaining product work is limited to separately approved production capabilities such as backend persistence/authentication and calibrated analytics or automatic palm/disease detection. Preserve the AP-only scope, deterministic-demo labels, exact role navigation, source/context separation, and fail-closed selectors. Before treating any interaction as operational, introduce real authentication, server-side authorization, durable storage, audit retention, concurrency controls, migrations, and authoritative geographic/farm data.
