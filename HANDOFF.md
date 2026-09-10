# Project Handoff

## Current status

- Repository: `D:\drone-mapping\oil-palm-1.5-gui`; upstream: <https://github.com/vjk7989/oil-palm-1.5-gui>.
- The Survey Area 001 Google Satellite geofence editor, infected-tree selector, and Add Marker workflow are implemented and independently verified. `npm test`, `npm run build`, and `git diff --check` pass; line-ending messages are warnings only.
- Hosted fix commit `0f6fdab` was pushed. The GitHub Pages Actions workflow completed successfully, and the deployed Survey Area 001 now reports **Google Satellite map ready**.
- The feature is intentionally limited to `MPOC-SURVEY-001`. Areas 002–005 retain their existing Leaflet maps and camera-footprint geofences.
- The implementation is pushed; this handoff refresh may remain as a local documentation change. Inspect `git status --short` and preserve unrelated user work before any future commit.
- The Add Marker increment is complete. Tree-detail and image/pin presentation changes requested for a later increment remain deferred as recorded below.

## Authoritative references

- Decisions, implementation boundaries, map-loading behavior, caveats, and verification record: `docs/ARCHITECTURE_RECORD.md`.
- Runtime integration and browser-local state: `index.html`.
- Deterministic Mapped POC records: `data/mapped-poc-data.js`.
- Snapshot generation boundary: `scripts/build_mapped_poc_snapshot.py`.
- Geofence, marker-placement, configuration, migration, isolation, and regression contracts: `tests/static-check.mjs`.
- GitHub Pages secret injection and deployment: `.github/workflows/deploy-pages.yml`.
- Persistent project workflow: `docs/architecture/0001-project-context-and-agent-workflow.md`.

Read those artifacts directly rather than duplicating their detailed contracts here.

## Continuation facts

- Area 001 opens with Google Satellite imagery and an editable, draggable rectangle. Its deterministic default is south `16.912209794`, west `81.169804433`, north `16.912805551`, east `81.169912437`.
- `Edit geofence`, `Save`, `Cancel`, and `Reset default` are available to every built-in demo role. The map displays 27 infected camera-position markers. The rectangle is an operational display geofence, not a surveyed or legal property boundary.
- Area 001 provides a native, keyboard-operable selector containing infected trees only. Selecting a tree pans and zooms the Google map to its exact camera position; the matching red marker becomes larger, gains a stronger outline and check mark, and is identified in adjacent status text rather than by colour alone. **Open selected tree** opens that tree's evidence page. Direct marker clicks continue to open the exact corresponding tree record.
- Add Marker is available only after Area 001 has an explicitly saved valid geofence. It places exactly 25 draft positions inside that rectangle for `TREE-0113` through `TREE-0137` in sequence, exposes an accessible `x / 25` counter plus Undo and Cancel, and enables Save only when the complete batch is valid.
- Saving replaces the 25-position batch atomically in version `4` browser-local state, then reconciles Area 001 to 52 positioned infected markers: 27 source-backed plus 25 newly positioned layout records. The added trees receive deterministic modelled scores from 66% through 95%; the workflow does not infer source captures or image evidence for them.
- The saved Area 001 rectangle remains under `geofenceOverrides[MPOC-SURVEY-001]`. Geofence changes cannot exclude saved tree positions, and Areas 002–005 receive no Add Marker state or controls.
- GitHub Actions receives `GOOGLE_MAPS_API_KEY` from a repository secret during Pages deployment. The local key remains only in ignored, untracked `config/maps.local.js`, while the tracked example contains an empty placeholder. Never copy either credential value into tracked code, tests, documentation, logs, generated data, or future handoffs.
- Missing, rejected, disabled-API, billing, timeout, and network failures produce targeted guidance while leaving the Area 001 tree grid usable.
- Live acceptance confirmed Google Satellite loading, exact default coordinate display, 27 infected markers, editable handles, Cancel/Save/Reset status transitions, Reset restoring exact defaults, Field Staff access to edit controls, and Area 002 remaining on Leaflet. Reload persistence is covered by the static state contract; it was not manually exercised in this pass.
- Independent final verification passed `npm test`, `npm run build`, and `git diff --check`. Credential and runtime-drive scans were clean; `config/maps.local.js` remains ignored and untracked.

## Deferred request

- Deferred: tree-detail page changes, including the requested removal of the screenshot-highlighted detail sections and any image/pin presentation changes for the newly positioned `TREE-0113` through `TREE-0137`. Do not implement those changes in this workflow, and do not infer image assets for the added trees.

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
3. If the user resumes the deferred tree-detail request, confirm the screenshot-highlighted sections and evidence expectations before changing presentation; otherwise receive the next goal normally. Retain the Area 001-only boundary unless explicitly expanded.
4. Repeat the independent green gate and refresh the two context artifacts after material changes.

## Suggested skills

- `understand-anything:understand-chat` for targeted questions against the codebase graph.
- `understand-anything:understand-explain` for the Google Maps loader, geofence editor, Add Marker data flow, or browser-state migration path.
- `understand-anything:understand-diff` for regression-impact review after future changes.
- `impeccable` for future map-editor layout, responsiveness, or interaction polish.
- `computer-use:computer-use` for live browser acceptance of Google Maps, geofence editing, infected-tree selection/highlighting, and role-specific behavior.
