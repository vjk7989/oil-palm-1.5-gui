# Project Handoff

## Current status

- Repository: `D:\drone-mapping\oil-palm-1.5-gui`; upstream: <https://github.com/vjk7989/oil-palm-1.5-gui>.
- The Survey Area 001 version-6 three-colour Marker-to-Tree Workflow is implemented; automated implementation gates and manual browser QA are green.
- Survey Area 002 now has a verified editable Google Satellite polygon and three-colour marker-to-tree workflow built on its deterministic 35-observation `frm02` snapshot. All 35 fixed/source-backed trees are user-designated Infected, Unhealthy, and Severe with deterministic 66–95% scores.
- Hosted baseline commit `0f6fdab` was pushed and its GitHub Pages workflow succeeded. The latest version-6 and Area 002 working-tree changes still require the release sequence below.
- Survey Area 001 Tree Details shows no image for Healthy/green trees. Infected/red and Suspected/yellow trees retain the existing repository-allowlisted image behavior: exact allowed imagery for matching `TREE-0001` through `TREE-0019` records and deterministic nearest imagery with an explicit non-exact-tree disclosure where applicable. The per-tree camera-position map remains removed; metadata, coordinates, indicators, provenance, and observation/history content remain.
- Area 001 retains its independent version-6 Google workflow. Area 002 has separate polygon and marker state; Areas 003–005 retain their previous Leaflet data and maps.
- Current branch: `main`. Before this handoff edit, the working tree had only `index.html` and `tests/static-check.mjs` modified. The latest implementation is not yet released; preserve unrelated user work before committing.
- The Area 002 implementation change set is `data/survey-002-farm-data.js`, `scripts/build_survey_two_farm_snapshot.py`, 35 derivatives under `assets/mapped-poc/evidence/`, `index.html`, and `tests/static-check.mjs`; context is maintained separately in this handoff and `docs/ARCHITECTURE_RECORD.md`.
- Implementation, independent automated verification, and manual Google Maps/browser QA are complete. After context documentation settles, rerun final gates and the credential scan, then commit, push `main`, and verify GitHub Pages live.

## Authoritative references

- Decisions, implementation boundaries, map-loading behavior, caveats, and verification record: `docs/ARCHITECTURE_RECORD.md`.
- Runtime integration and browser-local state: `index.html`.
- Deterministic Mapped POC records: `data/mapped-poc-data.js`.
- Snapshot generation boundary: `scripts/build_mapped_poc_snapshot.py`.
- Survey Area 002 snapshot and generator: `data/survey-002-farm-data.js` and `scripts/build_survey_two_farm_snapshot.py`; browser evidence: `assets/mapped-poc/evidence/`.
- Geofence, marker-placement, configuration, migration, isolation, and regression contracts: `tests/static-check.mjs`.
- GitHub Pages secret injection and deployment: `.github/workflows/deploy-pages.yml`.
- Persistent project workflow: `docs/architecture/0001-project-context-and-agent-workflow.md`.

Read those artifacts directly rather than duplicating their detailed contracts here.

## Continuation facts

- Area 001 opens with Google Satellite imagery and an editable, draggable rectangle. Its deterministic default is south `16.912209794`, west `81.169804433`, north `16.912805551`, east `81.169912437`.
- `Edit geofence`, `Save`, `Cancel`, and `Reset default` are available to every built-in demo role. The 27 immutable source pins remain infected; added pins may be Red/Infected, Yellow/Suspected, or Green/Healthy. The rectangle is an operational display geofence, not a surveyed or legal property boundary.
- Area 001 provides a native, keyboard-operable selector for every active positioned tree regardless of colour. Selection pans and zooms to the exact saved position, raises and outlines the matching marker, and identifies its Tree ID and status in text. **Open selected tree** and direct marker clicks resolve the same exact record.
- The snapshot reserves a complete 64-cell Area 001 capacity: 27 immutable source-backed infected trees and 37 optional layout-capacity records (`TREE-0113` through `TREE-0149`). Fresh browser state activates only the 27 source records and leaves the remaining grid cells black.
- Add Marker is available after Area 001 has a saved valid geofence. Editing starts from the current saved optional collection, supports adding or removing individual optional markers, Undo and Cancel, and an accessible dynamic total. Stable Tree IDs may contain gaps after removal.
- Add Marker exposes an accessible Red/Yellow/Green classification toolbar and defaults each editing session to Red/Infected. Each placed marker persists one canonical `displayStatus`; its map pin, grid cell, selector, counts, Tree Details, and deterministic status-appropriate score derive from that same value.
- Save accepts any valid collection from zero through 37 optional markers, rejects unknown IDs, statuses, non-finite/out-of-geofence/duplicate/source-overlapping positions, and atomically replaces `areaOneTreePositions` in version `6` browser-local state. Valid version-5 positions without a status migrate deterministically to Infected.
- Non-Healthy trees outside the exact-image subset never gain fabricated capture metadata or exact-tree image provenance; their nearest-image presentation remains derived deterministically from the 19-image allowlist. Healthy trees do not enter the image-selection path.
- The saved Area 001 rectangle remains under `geofenceOverrides[MPOC-SURVEY-001]`. Geofence changes cannot exclude saved tree positions, and Areas 002–005 receive no Add Marker state or controls.
- The Google rectangle is non-clickable during normal map use so it cannot intercept Add Marker clicks. It becomes clickable, editable, and draggable only while explicit geofence edit mode is active, then returns to the locked non-clickable state on Save, Cancel, or Reset.
- Area 002 starts with 35 immutable source observations and exact repository images from the `D.JPG` inventory under read-only `D:\frm02`. Their IDs, coordinates, source images and checksums are unchanged; only their user-designated health semantics and deterministic infected-range scores changed. Its polygon can be explicitly edited, saved, cancelled, or reset, while validation prevents invalid/self-intersecting shapes or exclusion of fixed and saved markers.
- Version `7` browser-local state stores the optional Area 002 polygon override and zero to 29 added positions (`TREE-0172` through `TREE-0200`) independently from Area 001. Add Marker supports Red/Infected, Yellow/Suspected, and Green/Healthy, plus remove, undo, cancel, atomic save, stable ID reuse, dynamic grid/counts, and reload persistence.
- Area 002 marker, selector, and 8×8 grid actions resolve the same exact Tree ID. Fixed source trees retain exact one-to-one images; added Red/Yellow trees use the nearest Area 002 source image with disclosure, while added Green trees show no image. Areas 001 and 003–005 cannot be mutated through this workflow.
- GitHub Actions receives `GOOGLE_MAPS_API_KEY` from a repository secret during Pages deployment. The local key remains only in ignored, untracked `config/maps.local.js`, while the tracked example contains an empty placeholder. Never copy either credential value into tracked code, tests, documentation, logs, generated data, or future handoffs.
- The application has no runtime dependency on `D:\hio01`; browser presentation uses only the repository-owned allowlist derived from those sources.
- Missing, rejected, disabled-API, billing, timeout, and network failures produce targeted guidance while leaving the Area 001 tree grid usable.
- Automated gates passed for the version-6 implementation, including migration, all three status/score ranges, add/remove/undo/save/reload behavior, shared marker/grid/selector/detail identity, status totals, Healthy image omission, retained non-Healthy image disclosure, geofence isolation, and Area 002 regression.
- Manual Google Satellite and Tree Details QA passed for Red, Yellow, and Green placement, persistence and selection; no image on a Healthy tree; retained image behavior for Infected and Suspected trees; the dynamic Area 001 workflow; and cleanup back to a clean 27-tree browser state.
- Survey Area 002 automated and manual verification is green for the 35 fixed user-designated infected records, polygon edit/save/cancel/reset, unchanged optional three-colour add/remove/undo/save/reload, stable marker/grid/selector/detail identity, dynamic counts, exact and nearest/no-image behavior, Google failure fallback, version-7 migration, and strict isolation from Area 001 and Areas 003–005. Independent `npm test`, `npm run build`, and `git diff --check` gates pass. See `docs/ARCHITECTURE_RECORD.md` and `tests/static-check.mjs` for detail.

## Continuation rules

- Follow `AGENTS.md`; prefer codebase-memory graph tools for code discovery.
- Apply YAGNI and deterministic processing. Keep generated artifacts, caches, temporary files, and test output under this repository on `D:` because `C:` has limited space.
- Treat source files on `C:` and `G:` as read-only and introduce no runtime dependency on those drives.
- Split requested changes into the smallest independently testable tasks.
- Use separate subagents for test authoring, independent test execution, and failure analysis. Do not continue past an affected-area gate until it is green. Keep architecture-record and handoff updates as separate context-management tasks.
- Preserve the Mapped POC distinction between user-designated infection, modelled suspected risk, healthy layout-only trees, camera exposure coordinates, and actual diagnoses or surveyed palm positions.

## Next session

1. Read `AGENTS.md`, this file, and the relevant Google geofence section of `docs/ARCHITECTURE_RECORD.md`.
2. Preserve repository-secret injection for hosted builds and keep the local Maps key ignored and untracked.
3. After documentation updates, rerun `npm test`, `npm run build`, and `git diff --check`, then scan tracked sources for exposed credentials and confirm the local Maps key remains ignored/untracked.
4. Commit the Area 002 fixed-tree infection update with the version-7 workflow, push `main`, and verify the resulting GitHub Pages build live before calling the increment released.
5. Receive the user's next goal normally and repeat the independent green gate after material changes.

## Suggested skills

- `understand-anything:understand-chat` for targeted questions against the codebase graph.
- `understand-anything:understand-explain` for Area 001/002 three-colour marker synchronization, polygon editing, or version-7 browser-state migration.
- `understand-anything:understand-diff` for regression-impact review after future changes.
- `impeccable` for future map-editor layout, responsiveness, or interaction polish.
- `computer-use:computer-use` for hosted GitHub Pages acceptance after push and any future Google Maps or tree-detail visual verification.
- `spreadsheets:Spreadsheets` only if a future task changes workbook-derived risk values; the current Area 002 values come from its deterministic repository snapshot.
